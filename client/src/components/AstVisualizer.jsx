import React, { useState } from 'react';

const TreeNode = ({ node }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    // Highlights für wichtige Knoten
    const isImportant = ['method_declaration', 'if_statement', 'class_declaration'].includes(node.type);

    return (
        <div className="ml-4 border-l border-gray-700 pl-3 my-1">
            <div
                className={`cursor-pointer transition-colors ${isImportant ? 'text-blue-400 font-bold' : 'text-gray-300'} hover:text-white`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {hasChildren && (isOpen ? '− ' : '+ ')}
                <span className="text-xs uppercase tracking-tighter opacity-70 mr-2">[{node.type}]</span>
            </div>

            {isOpen && hasChildren && (
                <div className="mt-1">
                    {node.children.map((child, i) => (
                        <TreeNode key={i} node={child} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const AstVisualizer = ({ ast }) => {
    if (!ast) return null;

    return (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-inner h-full flex flex-col">
            <h3 className="text-gray-500 uppercase text-xs font-black mb-4">
                Abstract Syntax Tree
            </h3>

            {/* 👇 EINZIGER Scroll-Container */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="font-mono text-sm">
                    <TreeNode node={ast} />
                </div>
            </div>
        </div>
    );
};