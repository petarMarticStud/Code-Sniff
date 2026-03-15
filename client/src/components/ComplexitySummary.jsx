import React from 'react';

export const ComplexitySummary = ({ value }) => {
    // Farblogik basierend auf Schwellenwerten
    const getComplexityColor = (val) => {
        if (val > 20) return 'text-red-500';
        if (val > 10) return 'text-orange-500';
        return 'text-green-500';
    };

    const getStatusText = (val) => {
        if (val > 20) return 'Kritisch';
        if (val > 10) return 'Warnung';
        return 'Alles Sauber';
    };

    return (
        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 text-center shadow-2xl">
            <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Total Complexity</h2>
            <div className={`text-7xl font-black transition-colors duration-500 ${getComplexityColor(value)}`}>
                {value}
            </div>
            <p className={`mt-4 text-xs uppercase tracking-widest font-bold ${getComplexityColor(value)}`}>
                {getStatusText(value)}
            </p>
        </div>
    );
};