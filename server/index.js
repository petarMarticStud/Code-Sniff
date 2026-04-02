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
            
            Antworte direkt, präzise und ohne lange Einleitung.`
                },
                {
                    role: "user",
                    content: `Analysiere diesen Java-Code:\n\n${sourceCode}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 600,
        });

        return chatCompletion.choices[0]?.message?.content || "Keine Vorschläge erhalten.";
    } catch (error) {
        console.error("Groq Fehler:", error.message);
        return "KI-Analyse aktuell nicht möglich.";
    }
}

app.post('/api/analyze', async (req, res) => {
    const { sourceCode } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'Kein Code' });

    try {
        const analysis = analyzeCode(sourceCode);
        const suggestions = await getRefactoringSuggestions(sourceCode, analysis);

        res.json({
            status: 'success',
            data: {
                ...analysis,
                aiSuggestions: suggestions
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));