/**
 * PM M3: Unabhängige JUnit-Auswertung in Docker
 *
 * Ablauf eines Laufs:
 *  1. Auswertungskopie anlegen: Produktionscode aus der Quelle (Original oder Arbeitskopie)
 *     + unveränderte Kopie der Referenztests aus dem geschützten Original.
 *     Das Original selbst wird nie in den Container eingebunden (PM NF1).
 *  2. Frischen Container starten: kein Netzwerk, kein root, Ressourcen-Limits,
 *     Maven offline mit vorbereitetem, nur lesend eingebundenem Repository (PM M3, PM NF3).
 *  3. Bei Zeitüberschreitung wird der Container beendet.
 *  4. Surefire-XML-Berichte auslesen und das Ergebnis einordnen:
 *     PASSED | TEST_FAILURES | COMPILATION_ERROR | TIMEOUT | ENVIRONMENT_ERROR | BUILD_FAILURE
 *
 * Testergebnisse werden nie an die KI zurückgegeben (PM M3) – dieses Modul spricht mit keiner KI.
 */
const { spawn } = require('child_process');
const fsp = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const projectStore = require('./projectStore');

// Alle Werte werden mit jedem Lauf gespeichert und sind für alle Bedingungen gleich (PM M3, PM NF2).
const RUNNER_CONFIG = Object.freeze({
    image: 'maven@sha256:99e61abcff91a9b1333463bd8451fb18495d6eba9250ac66a338b518f8278320',
    imageTag: 'maven:3.9-eclipse-temurin-21',
    m2Volume: 'codesniff-m2',
    memory: '1g',
    cpus: '2',
    pidsLimit: 256,
    // konfigurierbares Zeitlimit (PM M3), z.B. EVAL_TIMEOUT_MS=120000 in server/.env
    timeoutMs: Number(process.env.EVAL_TIMEOUT_MS) || 180_000
});

const MAX_LOG_CHARS = 200_000;

// ---------------------------------------------------------------------------
// 1. Auswertungskopie
// ---------------------------------------------------------------------------

/**
 * Erstellt eine Auswertungskopie: alles aus sourceDir außer src/test,
 * dazu src/test aus dem geschützten Original (KI-geänderte Working-Tests werden ausgeschlossen).
 */
async function createEvaluationCopy(projectId, sourceDir, evalId) {
    const manifest = await projectStore.loadManifest(projectId);
    if (manifest.mavenRoot === null || manifest.mavenRoot === undefined) {
        throw new Error('Project has no pom.xml – Maven evaluation not possible.');
    }

    const originalRoot = path.join(projectStore.getOriginalDir(projectId), manifest.mavenRoot);
    const sourceRoot = path.join(sourceDir, manifest.mavenRoot);
    const evalDir = path.join(projectStore.getProjectDir(projectId), 'eval', evalId);

    await fsp.cp(sourceRoot, evalDir, {
        recursive: true,
        filter: (src) => {
            const rel = path.relative(sourceRoot, src).split(path.sep).join('/');
            return !(rel === 'src/test' || rel.startsWith('src/test/') || rel === 'target' || rel.startsWith('target/'));
        }
    });

    const originalTests = path.join(originalRoot, 'src', 'test');
    try {
        await fsp.cp(originalTests, path.join(evalDir, 'src', 'test'), { recursive: true });
    } catch (err) {
        if (err.code !== 'ENOENT') throw err; // Projekt ohne Tests → Lauf ist später "nicht geeignet"
    }

    // Kopien aus dem Original erben den Schreibschutz – Maven muss target/ anlegen können
    for (const file of await projectStore.listFilesRecursive(evalDir)) await fsp.chmod(file, 0o644);
    return evalDir;
}

// ---------------------------------------------------------------------------
// 2./3. Container starten, Timeout durchsetzen
// ---------------------------------------------------------------------------

function buildDockerArgs(containerName, evalDir) {
    return [
        'run', '--rm',
        '--name', containerName,
        '--network', 'none',                       // kein Netzwerk
        '--user', '1000:1000',                     // kein root
        '--cap-drop', 'ALL',                       // keine Linux-Sonderrechte
        '--security-opt', 'no-new-privileges',
        '--memory', RUNNER_CONFIG.memory,
        '--cpus', RUNNER_CONFIG.cpus,
        '--pids-limit', String(RUNNER_CONFIG.pidsLimit),
        '-e', 'HOME=/tmp',
        '-e', 'MAVEN_CONFIG=/tmp/.m2',
        '-v', `${evalDir}:/workspace`,             // nur die Wegwerf-Auswertungskopie
        '-v', `${RUNNER_CONFIG.m2Volume}:/m2:ro`,  // vorbereitete Abhängigkeiten, nur lesend
        '-w', '/workspace',
        '--entrypoint', 'mvn',
        RUNNER_CONFIG.image,
        '-B', '-o', '-Dstyle.color=never', '-Dmaven.repo.local=/m2', 'test'
    ];
}

function runContainer(evalDir) {
    const containerName = `codesniff-eval-${crypto.randomUUID()}`;
    const args = buildDockerArgs(containerName, evalDir);
    const started = Date.now();

    return new Promise((resolve) => {
        let output = '';
        let timedOut = false;
        const append = (chunk) => {
            output += chunk.toString();
            if (output.length > MAX_LOG_CHARS) output = output.slice(-MAX_LOG_CHARS);
        };

        const child = spawn('docker', args, { windowsHide: true });
        child.stdout.on('data', append);
        child.stderr.on('data', append);

        const timer = setTimeout(() => {
            timedOut = true;
            spawn('docker', ['kill', containerName], { windowsHide: true });
        }, RUNNER_CONFIG.timeoutMs);

        child.on('error', (err) => {
            clearTimeout(timer);
            resolve({ exitCode: null, timedOut: false, spawnError: err.message, output, durationMs: Date.now() - started });
        });
        child.on('close', (exitCode) => {
            clearTimeout(timer);
            resolve({ exitCode, timedOut, spawnError: null, output, durationMs: Date.now() - started });
        });
    });
}

// ---------------------------------------------------------------------------
// 4. Surefire-Berichte auslesen und Ergebnis einordnen
// ---------------------------------------------------------------------------

const decodeXml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const attr = (tag, name) => {
    const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
    return m ? decodeXml(m[1]) : null;
};

/**
 * Liest target/surefire-reports/TEST-*.xml und liefert ein Ergebnis pro Testmethode.
 */
async function parseSurefireReports(evalDir) {
    const reportDir = path.join(evalDir, 'target', 'surefire-reports');
    let files;
    try {
        files = (await fsp.readdir(reportDir)).filter(f => /^TEST-.*\.xml$/.test(f));
    } catch {
        return [];
    }

    const tests = [];
    for (const file of files) {
        const xml = await fsp.readFile(path.join(reportDir, file), 'utf8');
        const caseRegex = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
        let m;
        while ((m = caseRegex.exec(xml)) !== null) {
            const [, attrs, body = ''] = m;
            const problem = body.match(/<(failure|error)\b([^>]*)/);
            tests.push({
                className: attr(attrs, 'classname'),
                name: attr(attrs, 'name'),
                timeSeconds: Number(attr(attrs, 'time')) || 0,
                status: problem ? (problem[1] === 'failure' ? 'FAILED' : 'ERROR')
                    : /<skipped\b/.test(body) ? 'SKIPPED' : 'PASSED',
                message: problem ? attr(problem[2], 'message') : null
            });
        }
    }
    return tests;
}

const ENVIRONMENT_PATTERNS = [
    /Cannot connect to the Docker daemon/i,
    /error during connect/i,
    /docker: .*not found/i,
    /Unable to find image/i,
    /has not been downloaded from it before/i,       // Abhängigkeit fehlt im Offline-Repository
    /Cannot access .* in offline mode/i,
    /Could not resolve dependencies/i,
    /Plugin .* or one of its dependencies could not be resolved/i
];

function classify(run, tests) {
    if (run.timedOut) return 'TIMEOUT';
    if (run.spawnError || run.exitCode === 125 || ENVIRONMENT_PATTERNS.some(p => p.test(run.output))) {
        return 'ENVIRONMENT_ERROR';
    }
    if (/COMPILATION ERROR|Compilation failure/.test(run.output)) return 'COMPILATION_ERROR';
    if (tests.some(t => t.status === 'FAILED' || t.status === 'ERROR')) return 'TEST_FAILURES';
    if (run.exitCode === 0) return 'PASSED';
    return 'BUILD_FAILURE';
}

function summarize(tests) {
    const count = (s) => tests.filter(t => t.status === s).length;
    return { total: tests.length, passed: count('PASSED'), failed: count('FAILED'), errors: count('ERROR'), skipped: count('SKIPPED') };
}

// ---------------------------------------------------------------------------
// Öffentliche Funktionen
// ---------------------------------------------------------------------------

/**
 * Führt die Referenztests gegen den Produktionscode aus sourceDir aus.
 * @param {string} projectId
 * @param {string} sourceDir  Original (Baseline) oder Arbeitskopie (generierter Code)
 */
async function runReferenceTests(projectId, sourceDir) {
    const evalId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const evalDir = await createEvaluationCopy(projectId, sourceDir, evalId);

    const run = await runContainer(evalDir);
    const tests = await parseSurefireReports(evalDir);
    const outcome = classify(run, tests);
    const summary = summarize(tests);

    return {
        evalId,
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: run.durationMs,
        outcome,
        exitCode: run.exitCode,
        summary,
        tests,
        runner: { ...RUNNER_CONFIG },
        log: run.spawnError ? `${run.spawnError}\n${run.output}` : run.output
    };
}

/**
 * PM M3 Baseline: Originalprojekt mit seinen Referenztests ausführen.
 * Geeignet nur, wenn es kompiliert, mindestens ein Test ausgeführt wird und alle bestehen.
 * Das Ergebnis wird als baseline.json beim Projekt gespeichert (PM NF2).
 */
async function runBaseline(projectId) {
    const result = await runReferenceTests(projectId, projectStore.getOriginalDir(projectId));
    const executed = result.summary.total - result.summary.skipped;
    const eligible = result.outcome === 'PASSED' && executed >= 1 && result.summary.passed === executed;

    const integrity = await projectStore.verifyOriginal(projectId);
    const baseline = { projectId, type: 'baseline', eligible, originalIntegrity: integrity, ...result };

    await fsp.writeFile(
        path.join(projectStore.getProjectDir(projectId), 'baseline.json'),
        JSON.stringify(baseline, null, 2),
        'utf8'
    );
    return baseline;
}

module.exports = { runBaseline, runReferenceTests, parseSurefireReports, classify, RUNNER_CONFIG };
