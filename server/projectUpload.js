/**
 * SHRD M1: Projekt-Upload (.zip)
 * - Akzeptiert ein .zip-Archiv und extrahiert alle .java-Dateien.
 * - Limits: max. 20 MB, max. 200 .java-Dateien.
 * - Dateien mit Syntaxfehlern werden markiert, die übrigen trotzdem analysiert.
 *
 * Erweiterung für PM M1–M3:
 * - pom.xml wird zusätzlich übernommen (Maven-Build, PM M3).
 * - Jede Datei erhält eine Rolle: "production", "test" oder "build",
 *   damit Produktions- und Testcode getrennt behandelt werden können (PM M1, PM M2).
 */
const path = require('path');
const AdmZip = require('adm-zip');
const { checkSyntax } = require('./parser');

const MAX_ZIP_BYTES = 20 * 1024 * 1024;
const MAX_JAVA_FILES = 200;

class ProjectUploadError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

/**
 * Normalisiert einen Archivpfad und verwirft unsichere Pfade (Zip-Slip:
 * absolute Pfade, Laufwerksbuchstaben, "../").
 */
function sanitizeEntryPath(entryName) {
    const unixPath = entryName.replace(/\\/g, '/');
    if (unixPath.startsWith('/') || /^[a-zA-Z]:/.test(unixPath)) return null;
    const normalized = path.posix.normalize(unixPath);
    if (normalized === '..' || normalized.startsWith('../')) return null;
    return normalized;
}

/**
 * Rolle einer Datei nach Maven-Konvention:
 * src/test/... → test, pom.xml → build, alle anderen .java-Dateien → production.
 */
function classifyFile(relPath) {
    if (path.posix.basename(relPath) === 'pom.xml') return 'build';
    if (!relPath.toLowerCase().endsWith('.java')) return null;
    return /(^|\/)src\/test\//.test(relPath) ? 'test' : 'production';
}

function extractProject(zipBuffer, originalName = 'project.zip') {
    if (zipBuffer.length > MAX_ZIP_BYTES) {
        throw new ProjectUploadError('Archive exceeds 20 MB.', 413);
    }

    let entries;
    try {
        entries = new AdmZip(zipBuffer).getEntries();
    } catch {
        throw new ProjectUploadError('File is not a valid .zip archive.');
    }

    const relevantEntries = entries.filter(e => {
        if (e.isDirectory || !classifyFile(e.entryName.replace(/\\/g, '/'))) return false;
        // macOS-Metadaten (__MACOSX/._Foo.java) sind keine Projektdateien
        return !e.entryName.replace(/\\/g, '/').split('/').includes('__MACOSX');
    });

    const javaCount = relevantEntries.filter(e => e.entryName.toLowerCase().endsWith('.java')).length;
    if (javaCount === 0) {
        throw new ProjectUploadError('Archive contains no .java files.');
    }
    if (javaCount > MAX_JAVA_FILES) {
        throw new ProjectUploadError(`Project contains more than ${MAX_JAVA_FILES} .java files.`);
    }

    const files = [];
    for (const entry of relevantEntries) {
        const relPath = sanitizeEntryPath(entry.entryName);
        if (!relPath) continue;

        const role = classifyFile(relPath);
        const content = entry.getData().toString('utf8');

        if (role === 'build') {
            files.push({ path: relPath, role, content, hasSyntaxError: false, syntaxErrors: [] });
            continue;
        }

        let syntax;
        try {
            syntax = checkSyntax(content);
        } catch (err) {
            // Ein Parserfehler betrifft nur diese Datei; die übrigen werden weiter analysiert.
            syntax = { hasSyntaxError: true, syntaxErrors: [{ line: 1, column: 1, message: err.message }] };
        }
        files.push({ path: relPath, role, content, ...syntax });
    }

    files.sort((a, b) => a.path.localeCompare(b.path));

    // Maven-Wurzel = Ordner der obersten pom.xml (nur Single-Module-Projekte werden unterstützt)
    const poms = files.filter(f => f.role === 'build').map(f => f.path);
    poms.sort((a, b) => a.split('/').length - b.split('/').length);
    const mavenRoot = poms.length ? path.posix.dirname(poms[0]) : null;

    return {
        projectName: path.basename(originalName, path.extname(originalName)),
        mavenRoot: mavenRoot === '.' ? '' : mavenRoot,
        files
    };
}

module.exports = { extractProject, sanitizeEntryPath, ProjectUploadError, MAX_ZIP_BYTES };
