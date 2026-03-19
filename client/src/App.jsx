import React, { useRef, useState } from 'react';
import { AstVisualizer } from './components/AstVisualizer';
import { MethodTable } from './components/MethodTable';
import { ComplexitySummary } from './components/ComplexitySummary';

function App() {
    const fileInputRef = useRef(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const runAnalysis = async (fileContent) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceCode: fileContent })
            });
            const json = await response.json();
            setResult(json.data);
        } catch (err) {
            console.error("Analyse fehlgeschlagen:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (event) => runAnalysis(event.target.result);
        reader.readAsText(selectedFile);
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-black text-white p-8 font-sans">
            <header className="mb-12 text-center">
                <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                    CODE-SNIFF
                </h1>
            </header>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".java" />

            <button
                onClick={() => fileInputRef.current.click()}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold transition-all shadow-lg text-sm uppercase tracking-widest mb-12"
            >
                {loading ? 'Analysiere...' : 'Datei wählen & analysieren'}
            </button>

            {result && (
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">

                        {/* NEU: Global Health Score Anzeige */}
                        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 text-center shadow-2xl">
                            <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Global Health Score</h2>
                            <div className={`text-7xl font-black ${
                                result.healthScore > 80 ? 'text-green-400' :
                                    result.healthScore > 50 ? 'text-orange-400' : 'text-red-500'
                            }`}>
                                {result.healthScore}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">Basis: Maintainability Index</p>
                        </div>

                        <ComplexitySummary value={result.totalComplexity} />
                        <MethodTable methods={result.methods} />
                    </div>

                    <div className="lg:col-span-2">
                        <AstVisualizer ast={result.ast} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;