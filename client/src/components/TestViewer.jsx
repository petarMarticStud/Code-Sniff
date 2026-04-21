import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';

export function TestViewer({ refactoredCode, generatedTests, setGeneratedTests }) {
    const { t } = useTranslation();
    const [unitTests, setUnitTests] = useState(generatedTests);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasCalledApi, setHasCalledApi] = useState(generatedTests !== null);
    const [isCopying, setIsCopying] = useState(false);

    const generateUnitTests = async () => {
        if (hasCalledApi || generatedTests !== null) return; // Don't call again if already called or if tests exist

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3000/api/getUnitTests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceCode: refactoredCode }),
            });

            if (!response.ok) throw new Error('Failed to generate tests');
            
            const data = await response.json();
            setUnitTests(data.data);
            setGeneratedTests(data.data);
            setHasCalledApi(true);
        } catch (err) {
            console.error('Error generating tests:', err);
            setError(err.message || 'Failed to generate tests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateUnitTests();
    }, []);

    const handleCopyTests = async () => {
        if (!unitTests) return;
        
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(unitTests);
            toast.success(t('copyTestsToast'), {
                duration: 3000,
                position: 'top-right',
                style: {
                    background: '#1f2937',
                    color: '#f3f4f6',
                    border: '1px solid #28a745',
                    borderRadius: '8px',
                },
            });
        } catch (error) {
            toast.error(t('copyTestsToastError'), {
                duration: 3000,
                position: 'top-right',
                style: {
                    background: '#1f2937',
                    color: '#f3f4f6',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                },
            });
        } finally {
            setIsCopying(false);
        }
    };

    const handleDownloadTests = () => {
        if (!unitTests) return;

        const element = document.createElement('a');
        const file = new Blob([unitTests], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'GeneratedTests.java';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        toast.success(t('downloadTestsToast'), {
            duration: 3000,
            position: 'top-right',
            style: {
                background: '#1f2937',
                color: '#f3f4f6',
                border: '1px solid #28a745',
                borderRadius: '8px',
            },
        });
    };

    return (
        <div className="w-full h-full min-w-0 overflow-hidden">
            <div className="h-full rounded-3xl overflow-hidden border border-gray-800 bg-gray-900/60 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">{t('generatedUnitTests')}</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyTests}
                            disabled={!unitTests || loading}
                            className="p-2 transition-colors rounded border text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border-blue-500 hover:border-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            title={t('copyTestsFloat')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            </svg>
                        </button>
                        <button
                            onClick={handleDownloadTests}
                            disabled={!unitTests || loading}
                            className="p-2 transition-colors rounded border text-white bg-green-600 hover:bg-green-500 active:bg-green-700 border-green-500 hover:border-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            title={t('downloadTestsFloat')}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="px-6 py-4">
                    {loading && (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-gray-400 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border border-blue-500 border-t-transparent mx-auto mb-2"></div>
                                {t('generatingTests')}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg text-red-400 text-sm">
                            {t('error')}: {error}
                        </div>
                    )}

                    {unitTests && (
                        <SyntaxHighlighter 
                            language="java" 
                            style={oneDark}
                            showLineNumbers={true}
                            wrapLines={true}
                            customStyle={{
                                background: 'transparent',
                                fontSize: '0.875rem',
                                lineHeight: '1.6',
                                margin: 0,
                                padding: 0,
                            }}
                            codeTagProps={{
                                style: {
                                    background: 'transparent',
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                },
                            }}
                        >
                            {unitTests}
                        </SyntaxHighlighter>
                    )}
                </div>
            </div>
        </div>
    );
}
