import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

// SHRD M1: Baut aus den relativen Dateipfaden eine Ordnerstruktur.
function buildTree(files) {
	const root = { name: '', children: {}, files: [] };
	for (const file of files) {
		const parts = file.path.split('/');
		let node = root;
		for (const dir of parts.slice(0, -1)) {
			node.children[dir] ??= { name: dir, children: {}, files: [] };
			node = node.children[dir];
		}
		node.files.push({ ...file, name: parts[parts.length - 1] });
	}
	return root;
}

function Folder({ node, depth, onSelectFile }) {
	const [open, setOpen] = useState(true);
	const folders = Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name));

	return (
		<li>
			<button
				onClick={() => setOpen(!open)}
				className="flex items-center gap-2 w-full text-left py-1 hover:text-blue-300"
				style={{ paddingLeft: depth * 16 }}
			>
				<span className="text-gray-500 w-3">{open ? '▾' : '▸'}</span>
				<span className="text-yellow-400">📁</span>
				<span className="text-gray-300">{node.name}</span>
			</button>
			{open && <TreeChildren node={node} depth={depth + 1} folders={folders} onSelectFile={onSelectFile} />}
		</li>
	);
}

function TreeChildren({ node, depth, folders, onSelectFile }) {
	const { t } = useTranslation();
	return (
		<ul>
			{folders.map(f => <Folder key={f.name} node={f} depth={depth} onSelectFile={onSelectFile} />)}
			{node.files.map(file => (
				<li key={file.path}>
					<button
						onClick={() => onSelectFile(file)}
						className="flex items-center gap-2 w-full text-left py-1 hover:bg-gray-800/50 rounded"
						style={{ paddingLeft: depth * 16 + 20 }}
						title={file.hasSyntaxError
							? `${t('syntaxErrorsIn')}: ${file.syntaxErrors.map(e => `${t('line')} ${e.line}`).join(', ')}`
							: file.path}
					>
						<span className="text-orange-400">☕</span>
						<span className={`font-mono text-sm ${file.hasSyntaxError ? 'text-red-400' : 'text-gray-200'}`}>{file.name}</span>
						{file.hasSyntaxError && (
							<span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-400 px-2 rounded-full">
								⚠ {t('syntaxError')}
							</span>
						)}
					</button>
				</li>
			))}
		</ul>
	);
}

export function ProjectTree({ project, onSelectFile, onClose }) {
	const { t } = useTranslation();
	const tree = useMemo(() => buildTree(project.files), [project]);
	const rootFolders = Object.values(tree.children).sort((a, b) => a.name.localeCompare(b.name));
	const errorCount = project.files.filter(f => f.hasSyntaxError).length;

	return (
		<div className="w-full max-w-3xl mx-auto mb-12 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl backdrop-blur">
			<div className="flex justify-between items-start mb-4">
				<div>
					<h3 className="text-xl font-bold text-blue-400">{project.projectName}</h3>
					<p className="text-xs text-gray-400 mt-1">
						{project.files.length} {t('javaFiles')}
						{errorCount > 0 && <span className="text-red-400"> · {errorCount} {t('withSyntaxErrors')}</span>}
					</p>
					<p className="text-[10px] text-gray-500 mt-1">{t('selectFileHint')}</p>
				</div>
				<button onClick={onClose} className="text-gray-500 hover:text-white text-sm px-2" title={t('closeProject')}>✕</button>
			</div>
			<div className="max-h-[50vh] overflow-auto bg-black/40 rounded-2xl border border-gray-800 p-3">
				<TreeChildren node={tree} depth={0} folders={rootFolders} onSelectFile={onSelectFile} />
			</div>
		</div>
	);
}
