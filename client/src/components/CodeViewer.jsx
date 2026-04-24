import React, { useMemo, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTranslation } from 'react-i18next';

function normalizeCode(value) {
    return (value || '').replace(/\r\n/g, '\n');
}

function renderLine(content) {
    return (
        <SyntaxHighlighter
            language="java"
            style={oneDark}
            PreTag="div"
            customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                overflow: 'visible',
            }}
            codeTagProps={{
                style: {
                    background: 'transparent',
                    fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                },
            }}
            wrapLongLines={true}
        >
            {content || ' '}
        </SyntaxHighlighter>
    );
}

export function CodeViewer({
    code,
    refactoredCode,
    language = 'java',
    highlightedLine = null,
    handleDirectInput,
    methods = []
}) {
    const { t } = useTranslation();
    const [isCopying, setIsCopying] = useState(false);
    const [showDiffHighlight, setShowDiffHighlight] = useState(true);
    const diffViewerRef = useRef(null);
    
    const oldValue = useMemo(() => normalizeCode(code), [code]);
    const newValue = useMemo(
        () => normalizeCode(refactoredCode),
        [refactoredCode]
    );

    // Handle highlighting and scrolling when a line is highlighted
    useEffect(() => {
        if (!diffViewerRef.current) return;

        // Clear all previous highlights
        const allCells = diffViewerRef.current.querySelectorAll('td');
        allCells.forEach(cell => {
            cell.style.backgroundColor = '';
        });

        if (highlightedLine) {
            // Add a small delay to ensure DOM is fully rendered when switching views
            const timer = setTimeout(() => {
                // Find the line number in the left side (original code) gutters
                const gutters = diffViewerRef.current.querySelectorAll('[class*="line-number"], [class*="gutter"]');
                let found = false;

                for (let gutter of gutters) {
                    if (found) break;
                    
                    const text = gutter.textContent.trim();
                    if (text === String(highlightedLine)) {
                        const row = gutter.closest('tr');
                        if (row) {
                            // Get all cells in the row
                            const cells = Array.from(row.querySelectorAll('td'));
                            const gutterCell = gutter.closest('td');
                            const gutterCellIndex = cells.indexOf(gutterCell);
                            
                            // Left side is first half of cells
                            if (gutterCellIndex < cells.length / 2) {
                                // Highlight only the left side cells
                                for (let i = 0; i < cells.length / 2; i++) {
                                    cells[i].style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
                                    cells[i].style.transition = 'background-color 0.2s';
                                }
                                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                found = true;
                            }
                        }
                    }
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [highlightedLine]);

    const getComplexityColor = (complexity) => {
        if (complexity < 5) return '#22c55e'; // green
        if (complexity < 10) return '#eab308'; // yellow
        return '#ef4444'; // red
    };

    useEffect(() => {
        if (!diffViewerRef.current || !methods || methods.length === 0) return;

        const timer = setTimeout(() => {
            const rows = diffViewerRef.current.querySelectorAll('tr');
            let lastMethodColor = '#d1d5db'; // grey for before first method
            
            rows.forEach(row => {
                // Get the first gutter (original code line number only)
                const gutters = row.querySelectorAll('td[class*="gutter"]');
                if (gutters.length === 0) return;
                
                const firstGutter = gutters[0];
                const lineNumText = firstGutter.textContent.trim();
                const lineNum = parseInt(lineNumText, 10);
                
                // If this is a numbered line, check if we're in a new method
                if (!isNaN(lineNum)) {
                    let matchedMethod = null;
                    
                    // Find the method with the highest line number that's <= current lineNum
                    for (const method of methods) {
                        if (lineNum >= method.line) {
                            if (!matchedMethod || method.line > matchedMethod.line) {
                                matchedMethod = method;
                            }
                        }
                    }
                    
                    if (matchedMethod) {
                        lastMethodColor = getComplexityColor(matchedMethod.complexity);
                    }
                }
                
                firstGutter.style.borderLeft = `6px solid ${lastMethodColor}`;
            });
        }, 50);

        return () => clearTimeout(timer);
    }, [methods, showDiffHighlight, oldValue, newValue]);

    const toggleDiffHighlight = () => {
        setShowDiffHighlight(!showDiffHighlight);
    };

    const diffColorPalette = showDiffHighlight
        ? {
            addedBackground: 'rgba(34, 197, 94, 0.14)',
            removedBackground: 'rgba(239, 68, 68, 0.14)',
            wordAddedBackground: 'rgba(34, 197, 94, 0.28)',
            wordRemovedBackground: 'rgba(239, 68, 68, 0.28)',
            addedGutterBackground: 'rgba(34, 197, 94, 0.18)',
            removedGutterBackground: 'rgba(239, 68, 68, 0.18)',
            gutterColor: '#9ca3af',
            addedGutterColor: '#bbf7d0',
            removedGutterColor: '#fecaca',
        }
        : {
            addedBackground: 'rgba(17, 24, 39, 0.6)',
            removedBackground: 'rgba(17, 24, 39, 0.6)',
            wordAddedBackground: 'rgba(17, 24, 39, 0.6)',
            wordRemovedBackground: 'rgba(17, 24, 39, 0.6)',
            addedGutterBackground: 'rgba(31, 41, 55, 0.65)',
            removedGutterBackground: 'rgba(31, 41, 55, 0.65)',
            gutterColor: '#9ca3af',
            addedGutterColor: '#9ca3af',
            removedGutterColor: '#9ca3af',
        };

    const handleCopyRefactoredCode = async () => {
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(refactoredCode);
            toast.success(t('copyToast'), {
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
            toast.error(t('copyToastError'), {
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

    const handleDownloadRefactoredCode = () => {
        if (!refactoredCode) return;

        const element = document.createElement('a');
        const file = new Blob([refactoredCode], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'RefactoredCode.java';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        
        toast.success(t('downloadCodeToast'), {
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
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">
                        {t('codeComparison')}
                    </h3>
                    <div className="flex items-center gap-2">
                        {showDiffHighlight && (
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <span className="text-red-300">{t('removed')}</span>
                                <span className="text-green-300">{t('added')}</span>
                            </div>
                        )}
                        <button
                            onClick={toggleDiffHighlight}
                            className={`p-2 transition-colors rounded border flex items-center justify-center ${
                                showDiffHighlight
                                    ? 'text-white bg-gray-700 hover:bg-gray-600 active:bg-gray-500 border-gray-600 hover:border-gray-500'
                                    : 'text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border-blue-500 hover:border-blue-400'
                            }`}
                            title={showDiffHighlight ? t('hideDiffrences') : t('showDiffrences')}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button
                            onClick={handleCopyRefactoredCode}
                            disabled={isCopying}
                            className="p-2 text-white bg-gray-700 hover:bg-gray-600 active:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded border border-gray-600 hover:border-gray-500 flex items-center justify-center"
                            title={t('copyFloat')}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                            </svg>
                        </button>
                        <button
                            onClick={handleDownloadRefactoredCode}
                            className="p-2 text-white bg-green-600 hover:bg-green-500 active:bg-green-700 transition-colors rounded border border-green-500 hover:border-green-400 flex items-center justify-center"
                            title={t('downloadCodeFloat')}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                        <button
                            onClick={() => handleDirectInput && handleDirectInput(refactoredCode)}
                            className="p-2 text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 transition-colors rounded border border-purple-500 hover:border-purple-400 text-sm font-medium"
                            title={t('reAnalyzeCodeFloat')}
                        >
                            {t('reAnalyzeCode')}
                        </button>
                    </div>
                </div>

                <div className="h-[calc(100%-65px)] overflow-x-visible overflow-y-visible" ref={diffViewerRef}>
                    <ReactDiffViewer
                        oldValue={oldValue}
                        newValue={newValue}
                        splitView={true}
                        compareMethod={showDiffHighlight ? "diffWordsWithSpace" : null}
                        disableWordDiff={!showDiffHighlight}
                        showDiffOnly={false}
                        hideLineNumbers={false}
                        renderContent={renderLine}
                        leftTitle={t('originalCode')}
                        rightTitle={t('refactoredCode')}
                        useDarkTheme={true}
                        styles={{
                            variables: {
                                dark: {
                                    diffViewerBackground: 'rgba(17, 24, 39, 0.6)',
                                    diffViewerColor: '#f3f4f6',
                                    addedBackground: diffColorPalette.addedBackground,
                                    addedColor: '#f3f4f6',
                                    removedBackground: diffColorPalette.removedBackground,
                                    removedColor: '#f3f4f6',
                                    wordAddedBackground: diffColorPalette.wordAddedBackground,
                                    wordRemovedBackground: diffColorPalette.wordRemovedBackground,
                                    addedGutterBackground: diffColorPalette.addedGutterBackground,
                                    removedGutterBackground: diffColorPalette.removedGutterBackground,
                                    gutterBackground: 'rgba(31, 41, 55, 0.65)',
                                    gutterBackgroundDark: 'rgba(31, 41, 55, 0.65)',
                                    highlightBackground: 'rgba(59, 130, 246, 0.15)',
                                    highlightGutterBackground: 'rgba(59, 130, 246, 0.18)',
                                    codeFoldGutterBackground: 'rgba(31, 41, 55, 0.65)',
                                    codeFoldBackground: 'rgba(17, 24, 39, 0.45)',
                                    emptyLineBackground: 'rgba(17, 24, 39, 0.35)',
                                    gutterColor: diffColorPalette.gutterColor,
                                    addedGutterColor: diffColorPalette.addedGutterColor,
                                    removedGutterColor: diffColorPalette.removedGutterColor,
                                    codeFoldContentColor: '#93c5fd',
                                    diffViewerTitleBackground: 'rgba(31, 41, 55, 0.5)',
                                    diffViewerTitleColor: '#d1d5db',
                                    diffViewerTitleBorderColor: 'rgba(55, 65, 81, 1)',
                                },
                            },
                            diffContainer: {
                                border: 'none',
                                borderRadius: 0,
                                overflow: 'hidden',
                            },
                            titleBlock: {
                                borderBottom: '1px solid rgba(55, 65, 81, 1)',
                                padding: '16px 18px',
                                fontSize: '12px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                lineHeight: '1.4',
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: '56px',
                                boxSizing: 'border-box',
                            },
                            contentText: {
                                fontSize: '14px',
                                lineHeight: '1.6',
                            },
                            lineNumber: {
                                minWidth: '3rem',
                                padding: '0 12px',
                                fontSize: '12px',
                            },
                            marker: {
                                paddingLeft: '10px',
                                paddingRight: '10px',
                            },
                            gutter: {
                                minWidth: '56px',
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
