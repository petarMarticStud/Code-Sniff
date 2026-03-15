import React from 'react';

export const MethodTable = ({methods}) => {
    if (!methods || methods.length === 0) return null;

    return (<div
            className="w-full bg-gray-800 rounded-3xl overflow-hidden border border-gray-700 shadow-2xl flex flex-col max-h-[500px]">
            <div className="bg-gray-700/50 px-8 py-4 border-b border-gray-700">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Critical Method Ranking
                </h3>
            </div>

            <div className="overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-700 sticky top-0 bg-gray-800">
                        <th className="px-8 py-4 font-bold">Method Name</th>
                        <th className="px-8 py-4 font-bold text-right">Complexity</th>
                    </tr>
                    </thead>
                    <tbody>
                    {methods.map((method, index) => (<tr
                            key={index}
                            className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all"
                    >
                        <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                    <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                      {index + 1}
                    </span>
                                    <span className="font-mono text-blue-400 text-sm">{method.name}</span>
                                </div>
                            </td>
                            <td className="px-8 py-4 text-right">
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