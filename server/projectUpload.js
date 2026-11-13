/**
 * SHRD M1: Projekt-Upload (.zip)
 * - Akzeptiert ein .zip-Archiv und extrahiert alle .java-Dateien.
 * - Limits: max. 20 MB, max. 200 .java-Dateien.
 * - Dateien mit Syntaxfehlern werden markiert, die übrigen trotzdem analysiert.
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

    const javaEntries = entries.filter(e => {
        if (e.isDirectory || !e.entryName.toLowerCase().endsWith('.java')) return false;
        // macOS-Metadaten (__MACOSX/._Foo.java) sind keine Java-Dateien
        return !e.entryName.replace(/\\/g, '/').split('/').includes('__MACOSX');
    });

    if (javaEntries.length === 0) {
        throw new ProjectUploadError('Archive contains no .java files.');
    }
    if (javaEntries.length > MAX_JAVA_FILES) {
        throw new ProjectUploadError(`Project contains more than ${MAX_JAVA_FILES} .java files.`);
    }

    const files = [];
    for (const entry of javaEntries) {
        const relPath = sanitizeEntryPath(entry.entryName);
        if (!relPath) continue;

        const content = entry.getData().toString('utf8');
        let syntax;
        try {
            syntax = checkSyntax(content);
        } catch (err) {
            // Ein Parserfehler betrifft nur diese Datei; die übrigen werden weiter analysiert.
            syntax = { hasSyntaxError: true, syntaxErrors: [{ line: 1, column: 1, message: err.message }] };
        }
        files.push({ path: relPath, content, ...syntax });
    }

    files.sort((a, b) => a.path.localeCompare(b.path));

    return {
        projectName: path.basename(originalName, path.extname(originalName)),
        files
    };
}

module.exports = { extractProject, ProjectUploadError, MAX_ZIP_BYTES };
