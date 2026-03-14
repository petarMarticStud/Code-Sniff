const Parser = require('tree-sitter');
const Java = require('tree-sitter-java');

const parser = new Parser();
parser.setLanguage(Java);

function calculateComplexity(node) {
    let complexity = 1;

    //Defdinieren von Knoten, die den Fluss verzweigen
    const decisionNodes = [
        'if_statement', 'while_statement', 'for_statement',
        'do_statement', 'catch_clause', 'ternary_expression'
    ];

    if (decisionNodes.includes(node.type)) {
        complexity++;
    }

    // Rekursion: durch alle child-components gehen
    for (let i = 0; i < node.childCount; i++) {
        complexity += calculateComplexity(node.child(i));
    }

    return complexity;
}

//Export für Nutzung in anderen Klassen
module.exports = {
    analyzeCode: (sourceCode) => {
        const tree = parser.parse(sourceCode);
        const complexity = calculateComplexity(tree.rootNode);
        return {
            ast: tree.rootNode.toString(),
            complexity: complexity
        };
    }
};