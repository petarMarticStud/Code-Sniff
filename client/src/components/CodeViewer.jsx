import React, { useMemo, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

function normalizeCode(value) {
    return (value || '').replace(/\r\n/g, '\n');
}

function renderHighlightedLine(language) {
    return function renderContent(content) {
        return (
            <SyntaxHighlighter
                language={language}
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
    };
}



export function CodeViewer({
    code,
    refactoredCode,
    language = 'java',
    highlightedLine = null,
}) {
    const [isCopying, setIsCopying] = useState(false);
    const diffViewerRef = useRef(null);
    
    const oldValue = useMemo(() => normalizeCode(code), [code]);
    const newValue = useMemo(
        () => normalizeCode(refactoredCode),
        [refactoredCode]
    );

    const renderContent = useMemo(
        () => renderHighlightedLine(language),
        [language]
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

    const handleCopyRefactoredCode = async () => {
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(refactoredCode);
            toast.success('Refactored code copied to clipboard!', {
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
            toast.error('Failed to copy code', {
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

    return (
        <div className="w-full h-full min-w-0 overflow-hidden">
            <div className="h-full rounded-3xl overflow-hidden border border-gray-800 bg-gray-900/60 shadow-xl backdrop-blur">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">
                        Code Comparison
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="text-red-300">Removed</span>
                            <span className="text-green-300">Added</span>
                        </div>
                        <button
                            onClick={handleCopyRefactoredCode}
                            disabled={isCopying}
                            className="ml-4 p-2 text-white bg-gray-700 hover:bg-gray-600 active:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded border border-gray-600 hover:border-gray-500 flex items-center justify-center"
                            title="Copy refactored code to clipboard"
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
                    </div>
                </div>

                <div className="h-[calc(100%-65px)] overflow-x-visible overflow-y-visible" ref={diffViewerRef}>
                    <ReactDiffViewer
                        oldValue={oldValue}
                        newValue={newValue}
                        splitView={true}
                        compareMethod="diffWordsWithSpace"
                        disableWordDiff={false}
                        showDiffOnly={false}
                        hideLineNumbers={false}
                        renderContent={renderContent}
                        leftTitle="Original Code"
                        rightTitle="Refactored Code"
                        useDarkTheme={true}
                        styles={{
                            variables: {
                                dark: {
                                    diffViewerBackground: 'rgba(17, 24, 39, 0.6)',
                                    diffViewerColor: '#f3f4f6',
                                    addedBackground: 'rgba(34, 197, 94, 0.14)',
                                    addedColor: '#f3f4f6',
                                    removedBackground: 'rgba(239, 68, 68, 0.14)',
                                    removedColor: '#f3f4f6',
                                    wordAddedBackground: 'rgba(34, 197, 94, 0.28)',
                                    wordRemovedBackground: 'rgba(239, 68, 68, 0.28)',
                                    addedGutterBackground: 'rgba(34, 197, 94, 0.18)',
                                    removedGutterBackground: 'rgba(239, 68, 68, 0.18)',
                                    gutterBackground: 'rgba(31, 41, 55, 0.65)',
                                    gutterBackgroundDark: 'rgba(31, 41, 55, 0.65)',
                                    highlightBackground: 'rgba(59, 130, 246, 0.15)',
                                    highlightGutterBackground: 'rgba(59, 130, 246, 0.18)',
                                    codeFoldGutterBackground: 'rgba(31, 41, 55, 0.65)',
                                    codeFoldBackground: 'rgba(17, 24, 39, 0.45)',
                                    emptyLineBackground: 'rgba(17, 24, 39, 0.35)',
                                    gutterColor: '#9ca3af',
                                    addedGutterColor: '#bbf7d0',
                                    removedGutterColor: '#fecaca',
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
