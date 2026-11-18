/**
 * Projektspeicher (Grundlage für PM M1–M4)
 *
 * PM NF1 (Datenintegrität): Das hochgeladene Originalprojekt wird einmalig gespeichert,
 *   schreibgeschützt abgelegt und mit SHA-256-Prüfsummen pro Datei versehen.
 *   KI-Änderungen werden ausschließlich in separate Arbeitskopien geschrieben.
 * PM NF3 (Isolation): Alle Dateipfade werden gegen das jeweilige Verzeichnis geprüft;
 *   Pfade außerhalb des Workspace werden abgelehnt.
 *
 * Ablage:
 *   uploads/projects/<projectId>/project.json      Manifest (Dateien, Rollen, Prüfsummen)
 *   uploads/projects/<projectId>/original/...      Originaldateien (schreibgeschützt)
 *   uploads/projects/<projectId>/working/<id>/...  Arbeitskopien
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');

const PROJECTS_DIR = path.join(__dirname, '..', 'uploads', 'projects');
const ID_PATTERN = /^[0-9a-f-]{36}$/;

const sha256 = (content) => crypto.createHash('sha256').update(content, 'utf8').digest('hex');

/**
 * Löst relPath innerhalb von baseDir auf und wirft, wenn das Ziel außerhalb liegt (PM NF3).
 */
function resolveInside(baseDir, relPath) {
    const target = path.resolve(baseDir, relPath);
    const rel = path.relative(baseDir, target);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
        throw new Error(`Path outside workspace: ${relPath}`);
    }
    return target;
}

function projectDir(projectId) {
    if (!ID_PATTERN.test(projectId)) throw new Error(`Invalid project id: ${projectId}`);
    return path.join(PROJECTS_DIR, projectId);
}

async function listFilesRecursive(dir, base = dir) {
    const result = [];
    for (const entry of await fsp.readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) result.push(...await listFilesRecursive(full, base));
        else result.push(full);
    }
    return result;
}

/**
 * Speichert das Originalprojekt schreibgeschützt und legt das Manifest an.
 * @param {{projectName: string, mavenRoot: string|null, files: Array<{path, role, content, hasSyntaxError}>}} project
 */
async function saveOriginalProject(project) {
    const projectId = crypto.randomUUID();
    const dir = projectDir(projectId);
    const originalDir = path.join(dir, 'original');

    for (const file of project.files) {
        const target = resolveInside(originalDir, file.path);
        await fsp.mkdir(path.dirname(target), { recursive: true });
        await fsp.writeFile(target, file.content, { encoding: 'utf8', flag: 'wx' });
        await fsp.chmod(target, 0o444); // schreibgeschützt (unter Windows: Read-only-Attribut)
    }

    const manifest = {
        projectId,
        projectName: project.projectName,
        mavenRoot: project.mavenRoot,
        createdAt: new Date().toISOString(),
        files: project.files.map(f => ({
            path: f.path,
            role: f.role,
            size: Buffer.byteLength(f.content, 'utf8'),
            sha256: sha256(f.content),
            hasSyntaxError: f.hasSyntaxError
        }))
    };
    await fsp.writeFile(path.join(dir, 'project.json'), JSON.stringify(manifest, null, 2), 'utf8');
    return manifest;
}

async function loadManifest(projectId) {
    const raw = await fsp.readFile(path.join(projectDir(projectId), 'project.json'), 'utf8');
    return JSON.parse(raw);
}

/**
 * PM NF1: Prüft, ob das Original noch exakt dem Upload entspricht
 * (gleiche Dateien, gleiche Prüfsummen, keine zusätzlichen Dateien).
 */
async function verifyOriginal(projectId) {
    const manifest = await loadManifest(projectId);
    const originalDir = path.join(projectDir(projectId), 'original');
    const problems = [];

    for (const file of manifest.files) {
        try {
            const content = await fsp.readFile(resolveInside(originalDir, file.path), 'utf8');
            if (sha256(content) !== file.sha256) problems.push({ path: file.path, problem: 'modified' });
        } catch {
            problems.push({ path: file.path, problem: 'missing' });
        }
    }

    const known = new Set(manifest.files.map(f => f.path));
    for (const full of await listFilesRecursive(originalDir)) {
        const rel = path.relative(originalDir, full).split(path.sep).join('/');
        if (!known.has(rel)) problems.push({ path: rel, problem: 'unexpected' });
    }

    return { ok: problems.length === 0, problems };
}

/**
 * Legt eine beschreibbare Arbeitskopie des Originals an (PM NF1).
 * @returns {{workingCopyId: string, dir: string}}
 */
async function createWorkingCopy(projectId) {
    const workingCopyId = crypto.randomUUID();
    const originalDir = path.join(projectDir(projectId), 'original');
    const dir = path.join(projectDir(projectId), 'working', workingCopyId);

    await fsp.cp(originalDir, dir, { recursive: true });
    // Kopien erben den Schreibschutz – in der Arbeitskopie wieder aufheben
    for (const file of await listFilesRecursive(dir)) await fsp.chmod(file, 0o644);

    return { workingCopyId, dir };
}

/**
 * Schreibt eine Datei in eine Arbeitskopie. Pfade außerhalb der Kopie werden abgelehnt (PM NF3).
 */
async function writeWorkingFile(workingDir, relPath, content) {
    const target = resolveInside(workingDir, relPath);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, content, 'utf8');
    return target;
}

module.exports = {
    saveOriginalProject,
    loadManifest,
    verifyOriginal,
    createWorkingCopy,
    writeWorkingFile,
    resolveInside
};
