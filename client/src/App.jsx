import React, { useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AstVisualizer } from './components/AstVisualizer';
import { MethodTable } from './components/MethodTable';
import { ComplexitySummary } from './components/ComplexitySummary';
import { AiAdvisor } from "./components/AiAdvisor.jsx";
import { CodeViewer } from './components/CodeViewer';
import { MethodSelector } from './components/MethodSelector';

function App() {
    const fileInputRef = useRef(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCodeViewer, setShowCodeViewer] = useState(false);
    const [sourceCode, setSourceCode] = useState(null);
    const [highlightedLine, setHighlightedLine] = useState(null);

    const [isSelectingMethods, setIsSelectingMethods] = useState(false);
    const [fileContentForAnalysis, setFileContentForAnalysis] = useState(null);


    const handleMethodClick = (lineNumber) => {
        // Switch to code viewer if not already showing
        if (!showCodeViewer) {
            setShowCodeViewer(true);
        }

        // Highlight the line
        setHighlightedLine(lineNumber);

        // Remove highlight after 1 second
        setTimeout(() => {
            setHighlightedLine(null);
        }, 1000);
    };

    const runAnalysis = async (fileContent) => {
        setLoading(true);
        setError(null); // Alten Fehler löschen
        setSourceCode(fileContent);
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
            setError("Server-Fehler bei der Analyse.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Ist die Datei leer?
        if (selectedFile.size === 0) {
            setError("Die Datei ist leer und kann nicht analysiert werden.");
            e.target.value = null; // Input zurücksetzen
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            setResult(null);
            setError(null);
            setIsSelectingMethods(true);
            setFileContentForAnalysis(content);
            fileInputRef.current.value = null;
        };
        reader.readAsText(selectedFile);
    };

    return (
        <div className="flex flex-col min-h-screen bg-black text-white p-8 font-sans">

            {error && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-red-500/50 p-8 rounded-3xl max-w-sm text-center shadow-2xl">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold mb-2">Fehler</h3>
                        <p className="text-gray-400 text-sm mb-6">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-full font-bold transition-all"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-12">
                <div className="w-40"></div>
                <header className="flex-1 text-center">
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                        CODE-SNIFF
                    </h1>
                </header>
                <div className="w-40 flex justify-end">
                    {result && (
                        <button
                            onClick={() => setShowCodeViewer(!showCodeViewer)}
                            className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-bold transition-all shadow-lg text-sm uppercase tracking-widest focus-visible:outline-none"
                        >
                            {showCodeViewer ? 'Syntax Tree' : 'Code View'}
                        </button>
                    )}
                </div>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".java" />

            {isSelectingMethods && (
                <MethodSelector
                    fileContent={fileContentForAnalysis}
                    onAnalyze={runAnalysis}
                    onClose={() => {
                        setIsSelectingMethods(false);
                        setFileContentForAnalysis(null);
                    }}
                />
            )}

            {!isSelectingMethods && (
                <div className="flex justify-center mb-12">
                    <button
                        onClick={() => fileInputRef.current.click()}
                        className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold transition-all shadow-lg text-sm uppercase tracking-widest focus-visible:outline-none"
                    >
                        {loading ? 'Analysiere...' : 'Datei wählen & analysieren'}
                    </button>
                </div>
            )}

            {result && (
                <div className="w-full flex flex-col xl:flex-row gap-6 items-stretch animate-in fade-in duration-500 flex-1 overflow-hidden">

                    <div className="w-full xl:w-[400px] flex-shrink-0 space-y-6 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl backdrop-blur">
                        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 text-center shadow-2xl">
                            <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Global Health Score</h2>
                            <div className={`text-7xl font-black ${result.healthScore > 80 ? 'text-green-400' : result.healthScore > 50 ? 'text-orange-400' : 'text-red-500'}`}>
                                {result.healthScore}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">Basis: Maintainability Index</p>
                        </div>
                        <ComplexitySummary value={result.totalComplexity} />
                        <MethodTable methods={result.methods} onMethodClick={handleMethodClick} />
                    </div>

                    {showCodeViewer ? (
                        <div className="flex-1 min-w-0">
                            <CodeViewer code={sourceCode} refactoredCode={result.refactoredCode} highlightedLine={highlightedLine} />
                        </div>
                    ) : (
                        <div className="flex-1 min-w-0 flex gap-6">
                            <div className="flex-1 min-w-0 bg-gray-900/60 border border-gray-800 rounded-3xl p-4 shadow-xl backdrop-blur">
                                <AstVisualizer ast={result.ast} />
                            </div>

                            <div className="flex-1 min-w-[300px] bg-gray-900/60 border border-gray-800 rounded-3xl p-6 shadow-xl backdrop-blur">
                                <AiAdvisor suggestions={result.aiSuggestions} loading={loading} />
                            </div>
                        </div>
                    )}
                </div>
            )}
            <Toaster />
        </div>
    );
}

export default App;