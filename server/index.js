const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { analyzeCode } = require('./parser');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GROQ_API_KEY) {
    console.log("Error: GROQ_API_KEY wurde nicht gefunden.");
} else {
    console.log("API-Key geladen");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function getRefactoringSuggestions(sourceCode, metrics) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Du bist ein hochpräziser Java-Code-Analysator. Gehe bei deiner Analyse in zwei Schritten vor. 1. PRÜFUNG: Ist der Code syntaktisch korrekt? Falls nein, nenne exakt die Zeile und den Fehler (z.B. 'Code gebrochen in Zeile 12: Fehlende Klammer'). 2. REFACTORING: Gib kurze fachliche Tipps für Clean Code.
            
                    Antworte direkt, präzise und ohne lange Einleitung.
                    
                    gib das alles unter der überschrift "SUGGESTIONS:" aus, damit ich es später leicht parsen kann.
                    
                    Danach gib unter der Überschrift "REFACTORED_CODE:" den komplett refaktorierten Code zurück mit deine Änderungsvorschläge implementiert, falls du Änderungen vorschlägst. Behalte die gleiche Codestruktur, Formatierung und alle Kommentare bei.`
                },
                {
                    role: "user",
                    content: `Analysiere und refaktoriere diesen Java-Code:\n\n${sourceCode}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 1200,
        });

        const response = chatCompletion.choices[0]?.message?.content || "";
        
        // Parse suggestions and refactored code from response
        const suggestionsMatch = response.match(/SUGGESTIONS:\s*([\s\S]*?)(?=# REFACTORED_CODE:|$)/);
        const refactoredMatch = response.match(/REFACTORED_CODE:\s*```java\s*([\s\S]*?)```/);
        
        const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : "Keine Vorschläge erhalten.";
        const refactoredCode = refactoredMatch ? refactoredMatch[1].trim() : sourceCode;

        console.log(response);
        
        return {
            suggestions,
            refactoredCode
        };
    } catch (error) {
        console.error("Groq Fehler:", error.message);
        return {
            suggestions: "KI-Analyse aktuell nicht möglich.",
            refactoredCode: sourceCode
        };
    }
}

app.post('/api/analyze', async (req, res) => {
    const { sourceCode } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'Kein Code' });

    try {
        const analysis = analyzeCode(sourceCode);
        const aiAnalysis = await getRefactoringSuggestions(sourceCode, analysis);

        res.json({
            status: 'success',
            data: {
                ...analysis,
                aiSuggestions: aiAnalysis.suggestions,
                refactoredCode: aiAnalysis.refactoredCode
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/getMethods', (req, res) => {
    const { sourceCode } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'Kein Code' });

    try {
        const analysis = analyzeCode(sourceCode);
        res.json({
            status: 'success',
            data: analysis.methods
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));