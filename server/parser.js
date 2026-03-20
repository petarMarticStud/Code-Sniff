const Parser = require('tree-sitter');
const Java = require('tree-sitter-java');
const {OpenAI} = require("openai");
const parser = new Parser();
parser.setLanguage(Java);

const openapi= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})


/**
 AI Refactoring & Reasoning
 */
async function getRefactoringSuggestions(sourceCode, metrics) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Du bist ein Experte für Clean Code und Refactoring von Java-Code. Analysiere den Code und gib einen kurzen, prägnanten Verbesserungsvorschlag."
                },
                {
                    role: "user",
                    content: `Hier ist mein Java-Code mit einer Gesamkomplexität von ${metrics.totalComplexity}. 
                    Folgende Methoden sind kritisch: ${metrics.methods.filter(m => m.complexity > 10).map(m => m.name).join(', ')}.
                    
                    Code:
                    ${sourceCode}`
                }
            ],
            max_tokens: 500
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Error:", error);
        return "Vorschläge momentan nicht verfügbar.";
    }
}

//POST-Endpoint für AI
app.post('api/analyze', async (req,res) => {
    try {
        const {sourceCode} = req.body
        const analysis = analyzeCode(sourceCode);

        //KI-Vorschlag
        const suggestions = await getRefactoringSuggestions(sourceCode, analysis);

        res.json({
            data: {
                ...analysis,
                aiSuggestions: suggestions
            }
        });
    }
    catch (error) {
        res.status(500).json({error: "KI-Analyse fehlgeschlagen:" + error.message});
    }
})



/**
 * M2: Hilfsfunktion zur Vereinfachung des AST für die UI.
 * Entfernt unnötige Zeichen und bereitet die Struktur für Jamils Tree-View vor.
 */
function simplifyAST(node) {
    return {
        type: node.type,
        // Wir filtern technische Symbole wie ";" oder "{" raus, damit der Baum sauber bleibt
        children: node.children
            .map(child => simplifyAST(child))
            .filter(c => c.children.length > 0 || c.type.match(/^[a-z_]+$/))
    };
}

/**
 * M3: Kern-Logik für die Zyklomatische Komplexität.
 * Zählt nur Entscheidungspunkte (Verzweigungen).
 */
function calculateComplexity(node) {
    let count = 0;
    const decisionNodes = [
        'if_statement',
        'for_statement',
        'while_statement',
        'do_statement',
        'catch_clause',
        'ternary_expression',
        'switch_label'
    ];

    if (decisionNodes.includes(node.type)) {
        count = 1;
    }

    for (let i = 0; i < node.childCount; i++) {
        count += calculateComplexity(node.child(i));
    }
    return count;
}




/**
 * User Story: Komplexität pro Methode berechnen.
 * Sucht alle Methoden im Baum und berechnet deren spezifische Werte.
 */
function getMethodMetrics(node) {
    let methods = [];

    if (node.type === 'method_declaration') {
        // Extrahiert den Namen der Methode
        const nameNode = node.childForFieldName('name');
        const methodName = nameNode ? nameNode.text : 'Anonyme Methode';

        methods.push({
            name: methodName,
            complexity: calculateComplexity(node) + 1,
            line: node.startPosition.row + 1, // Tree-Sitter zählt ab 0, wir brauchen 1-basiert
            smells: detectSmells(node)
        });
    }

    // Rekursiv nach Methoden in der Datei suchen
    for (let i = 0; i < node.childCount; i++) {
        methods = methods.concat(getMethodMetrics(node.child(i)));
    }

    return methods;
}


/**
 * Code Smells (Fowler, 1999).
 * Prüft auf Long Method (>20 Zeilen) und Too Many Parameters (>3).
 */

function detectSmells(node) {
    let smells=0;
    const lineCount = node.endPosition.row - node.startPosition.row;
    if (lineCount > 20) smells++

    const params = node.childForFieldName('parameters');
    if (params && params.namedChildCount > 3) smells++;
    return smells;
}

module.exports = {
    analyzeCode: (sourceCode) => {
        const tree = parser.parse(sourceCode);
        const methodMetrics = getMethodMetrics(tree.rootNode);

        //M5: Sortiert nach complexity
        methodMetrics.sort((a, b) => b.complexity - a.complexity);

        const totalComp = methodMetrics.reduce((acc, m) => acc + m.complexity, 0);
        const totalSmells = methodMetrics.reduce((acc, m) => acc + m.smells, 0);


        /**
         * Global Health Score Berechnung
         * Basis: Maintainability Index (Oman & Hagemeister, 1992)
         * Formel: 100 - (Komplexität * 2) - (Smells * 5)
         */
        const healthScore = Math.max(0, 100 - (totalComp * 2) - (totalSmells * 5));
        return {
            ast: simplifyAST(tree.rootNode),
            methods: methodMetrics,
            totalComplexity: totalComp || 1,
            healthScore: healthScore
        };
    }
};