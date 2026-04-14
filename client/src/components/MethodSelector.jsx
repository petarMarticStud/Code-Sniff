import React, { useEffect, useState } from 'react';

export function MethodSelector({ fileContent, onAnalyze, onClose }) {
	const [methods, setMethods] = useState([]);
	const [selectedMethods, setSelectedMethods] = useState([]);
	const [isEntireFileSelected, setIsEntireFileSelected] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!fileContent) return;
		setLoading(true);
		fetch('http://localhost:3000/api/getMethods', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sourceCode: fileContent })
		})
			.then(res => res.json())
			.then(json => {
				setMethods(json.data || []);
				setSelectedMethods([]);
				setIsEntireFileSelected(false);
				setError(null);
			})
			.catch(() => setError('Methoden konnten nicht geladen werden.'))
			.finally(() => setLoading(false));
	}, [fileContent]);

	const handleSelectMethod = (methodName) => {
		if (selectedMethods.includes(methodName)) {
			const newSel = selectedMethods.filter(m => m !== methodName);
			setSelectedMethods(newSel);
			setIsEntireFileSelected(false);
		} else {
			const newSel = [...selectedMethods, methodName];
			setSelectedMethods(newSel);
			if (newSel.length === methods.length) setIsEntireFileSelected(true);
		}
	};

	const handleSelectEntireFile = (checked) => {
		setIsEntireFileSelected(checked);
		if (checked) {
			setSelectedMethods(methods.map(m => m.name));
		} else {
			setSelectedMethods([]);
		}
	};

	const handleAnalyze = () => {
		if (isEntireFileSelected) {
			onAnalyze(fileContent);
		} else {
			// Concatenate the bodies of selected methods with an empty line between each
			const contentToAnalyze = methods
				.filter(m => selectedMethods.includes(m.name) && m.body)
				.map(m => m.body.trim())
				.join('\n\n');
            onAnalyze(contentToAnalyze);
		}
		onClose();
	};

	return (
		<div className="flex-1 bg-gray-900/80 border border-blue-500/30 rounded-3xl p-8 backdrop-blur-md animate-in zoom-in-95 duration-300">
			<h3 className="text-2xl font-bold mb-6 text-blue-400">Select Scope for Analysis</h3>
			<div className="overflow-hidden rounded-2xl border border-gray-800 bg-black/40">
				{loading ? (
					<div className="p-8 text-center text-blue-400">Lade Methoden...</div>
				) : error ? (
					<div className="p-8 text-center text-red-400">{error}</div>
				) : (
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-gray-800/50 text-[10px] uppercase tracking-widest text-gray-400">
								<th className="p-4 w-12">Select</th>
								<th className="p-4">Method Name / Scope</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-800">
							{/* Entire File Option */}
							<tr
								className={`transition-colors cursor-pointer ${isEntireFileSelected ? 'bg-blue-500/10' : 'hover:bg-gray-800/30'}`}
								onClick={() => handleSelectEntireFile(!isEntireFileSelected)}
							>
								<td className="p-4 text-center">
									<input
										type="checkbox"
										checked={isEntireFileSelected}
										onChange={e => { e.stopPropagation(); handleSelectEntireFile(!isEntireFileSelected); }}
										className="w-5 h-5 accent-blue-500 cursor-pointer"
									/>
								</td>
								<td className="p-4 font-bold text-blue-300 italic select-none">[ Entire File ]</td>
							</tr>
							{/* Individual Methods */}
							{methods.map((method, index) => (
								<tr
									key={index}
									className="hover:bg-gray-800/30 transition-colors cursor-pointer"
									onClick={() => handleSelectMethod(method.name)}
								>
									<td className="p-4 text-center">
										<input
											type="checkbox"
											checked={selectedMethods.includes(method.name)}
											onClick={e => e.stopPropagation()}
											onChange={() => handleSelectMethod(method.name)}
											className="w-4 h-4 accent-purple-500 cursor-pointer"
										/>
									</td>
									<td className="p-4 text-gray-300 font-mono text-sm select-none">{method.name}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
			<div className="mt-8 flex justify-end gap-4">
				<button
					onClick={onClose}
					className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-full font-bold transition-all shadow text-gray-300"
				>Abbrechen</button>
				<button
					onClick={handleAnalyze}
					disabled={selectedMethods.length === 0 && !isEntireFileSelected}
					className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed px-10 py-3 rounded-full font-black uppercase tracking-tighter transition-all shadow-lg active:scale-95"
				>
					Analysieren ({isEntireFileSelected ? 'All' : selectedMethods.length})
				</button>
			</div>
		</div>
	);
}
