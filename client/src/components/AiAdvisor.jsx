import React from 'react';

export const AiAdvisor = ({ suggestions, loading }) => {
    // Wenn keine Daten da sind und nicht geladen wird, zeigen wir nichts an
    if (!suggestions && !loading) return null;

    return (
        <div className="w-full">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    <span className="text-2xl">✨</span>
                    {loading && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                    )}
                </div>
                <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest">
                    AI Refactoring Advisor
                </h3>
            </div>

            {loading ? (
                <div className="space-y-3">
                    <div className="h-4 bg-blue-500/10 rounded-full w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-blue-500/10 rounded-full w-1/2 animate-pulse"></div>
                    <div className="h-4 bg-blue-500/10 rounded-full w-2/3 animate-pulse"></div>
                </div>
            ) : (
                <div className="text-sm text-gray-300 leading-relaxed font-sans prose prose-invert">
                    {/* Wir nutzen whitespace-pre-wrap, damit Zeilenumbrüche der KI erhalten bleiben */}
                    <p className="whitespace-pre-wrap italic opacity-90">
                        "{suggestions}"
                    </p>
                </div>
            )}

        </div>
    );
};