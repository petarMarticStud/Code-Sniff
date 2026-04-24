import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const MethodTable = ({methods, onMethodClick}) => {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState('');
    const [sortAscending, setSortAscending] = useState(false);

    if (!methods || methods.length === 0) return null;

    const filteredAndSortedMethods = useMemo(() => {
        let filtered = methods.filter(method =>
            method.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            if (sortAscending) {
                return a.complexity - b.complexity;
            } else {
                return b.complexity - a.complexity;
            }
        });
    }, [methods, searchTerm, sortAscending]);

    return (<div
        className="w-full bg-gray-800 rounded-3xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col max-h-[500px]">
        <div className="bg-gray-700/50 px-8 py-4 border-b border-gray-700">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {t('criticalMethodRanking')}
            </h3>
        </div>

        <div className="bg-gray-750/30 px-8 py-4 border-b border-gray-700 flex items-center gap-4">
            <input
                type="text"
                placeholder={t('filterByMethodName')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-gray-700/60 text-gray-200 text-sm px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
            />
            <button
                onClick={() => setSortAscending(!sortAscending)}
                className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 p-2 rounded border border-gray-600 hover:border-gray-500 transition-colors text-gray-300"
                title={sortAscending ? t('sortLowToHigh') : t('sortHighToLow')}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {sortAscending ? (
                        <path d="M12 5v14M19 12l-7-7-7 7"></path>
                    ) : (
                        <path d="M12 19V5M5 12l7 7 7-7"></path>
                    )}
                </svg>
            </button>
        </div>

        <div className="overflow-y-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-700 sticky top-0 bg-gray-800">
                    <th className="px-4 py-4 font-bold">{t('methodName')}</th>
                    <th className="px-4 py-4 font-bold">{t('line')}</th>
                    <th className="px-4 py-4 font-bold text-right">{t('complexity')}</th>
                </tr>
                </thead>
                <tbody>
                {filteredAndSortedMethods.map((method, index) => (<tr
                    key={index}
                    onClick={() => onMethodClick?.(method.line)}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all cursor-pointer"
                >
                    <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                                <span
                                    className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                                  {index + 1}
                                </span>
                            <span className="font-mono text-blue-400 text-sm">{method.name}</span>
                        </div>
                    </td>
                    <td className="px-4 py-4 text-gray-500 font-mono text-xs">
                        {t('L')}{method.line}
                    </td>
                    <td className="px-4 py-4 text-right">
                          <span
                              className={`font-bold px-3 py-1 rounded-full text-xs ${method.complexity > 10 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                            {method.complexity}
                          </span>
                    </td>
                </tr>))}
                </tbody>
            </table>
        </div>
    </div>);
};