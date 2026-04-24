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
                    content: `Du bist ein hochpräziser Java-Code-Analysator. Gehe bei deiner Analyse in zwei Schritten vor. 1. REVIEW: Ist der Code syntaktisch korrekt? Falls nein, nenne exakt die Zeile und den Fehler (z.B. 'Code gebrochen in Zeile 12: Fehlende Klammer'). 2. REFACTORING: Gib kurze fachliche Tipps für Clean Code.
            
                    Antworte direkt, präzise und ohne lange Einleitung.
                    
                    gib das alles unter der überschrift "SUGGESTIONS:" aus, damit ich es später leicht parsen kann. dieser teil soll klar, detaliert und strukturiert sein. und ich brauch den einmal auf Deutsch unter den überschrift "SUGGESTIONS_DE:" und einmal auf Englisch unter der überschrift "SUGGESTIONS_EN:".`
                },
                {
                    role: "user",
                    content: `Analysiere diesen Java-Code:\n\n${sourceCode}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 1200,
        });

        const response = chatCompletion.choices[0]?.message?.content || "";
        
        // Parse suggestions from response
        const suggestionsMatch_DE = response.match(/#\s*SUGGESTIONS_DE:\s*([\s\S]*?)(?=# SUGGESTIONS_EN:|$)/);
        const suggestionsMatch_EN = response.match(/#\s*SUGGESTIONS_EN:\s*([\s\S]*?)(?=$)/);
        
        const suggestionsDE = suggestionsMatch_DE ? suggestionsMatch_DE[1].trim() : "Keine Vorschläge erhalten.";
        const suggestionsEN = suggestionsMatch_EN ? suggestionsMatch_EN[1].trim() : "No suggestions received.";
        
        return {
            de: suggestionsDE,
            en: suggestionsEN
        };
    } catch (error) {
        console.error("Groq Fehler:", error.message);
        return {
            de: "KI-Analyse aktuell nicht möglich.",
            en: "AI analysis currently unavailable."
        };
    }
}

async function getRefactoredCode(sourceCode, suggestions, metrics) {
    try {
        const suggestionsText = `German: ${suggestions.de}\n\nEnglish: ${suggestions.en}`;
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Du bist ein hochpräziser Java-Code-Refaktorisierer. Refaktorisiere den gegebenen Code basierend auf den Vorschlägen. Behalte die gleiche Codestruktur, Formatierung und alle Kommentare bei.
                    
                    gib den komplett refaktorierten Code unter der Überschrift "REFACTORED_CODE:" zurück.`
                },
                {
                    role: "user",
                    content: `Refaktorisiere diesen Java-Code basierend auf folgenden Vorschlägen:\n\n${suggestionsText}\n\nCode:\n\n${sourceCode}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 3000,
        });

        const response = chatCompletion.choices[0]?.message?.content || "";

        console.log(response)
        
        // Parse refactored code from response
        const refactoredMatch = response.match(/REFACTORED_CODE:[\s\S]*?```java\s*([\s\S]*?)```/);
        
        const refactoredCode = refactoredMatch ? refactoredMatch[1].trim() : `// No refactored code available.\n\n${sourceCode}`;

        return refactoredCode;
    } catch (error) {
        console.error("Groq Fehler:", error.message);
        return sourceCode;
    }
}

app.post('/api/analyze', async (req, res) => {
    const { sourceCode } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'Kein Code' });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (type, message) => {
         res.write(`data: ${JSON.stringify({ type: type, message: message })}\n\n`);
    };

    try {
        const analysis = await analyzeCode(sourceCode, send);
        send("status", "analyzing");

        const waitingTimer = setTimeout(() => {
            send("status", "aiIsThinking");
        }, 10_000);

        const aiSuggestions = await getRefactoringSuggestions(sourceCode, analysis);
        const refactoredCode = await getRefactoredCode(sourceCode, aiSuggestions, analysis);
        clearTimeout(waitingTimer);

        send("status", "analysisComplete");
        send("result", {
            status: 'success',
            data: {
                ...analysis,
                aiSuggestions: aiSuggestions,
                refactoredCode: refactoredCode
            }
        });
        res.end();
    } catch (err) {
        send("error", err.message );
    }
});

app.post('/api/getMethods', async (req, res) => {
    const { sourceCode } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'Kein Code' });

    try {
        const analysis = await analyzeCode(sourceCode);
        res.json({
            status: 'success',
            data: analysis.methods
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/getUnitTests', async (req, res) => {
    const { sourceCode } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'Kein Code' });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Du bist ein hochpräziser Java-Unit-Test-Generator. Erstelle umfassende Unit-Tests für alle Methoden im gegebenen Java-Code.
                    
                    Verwende JUnit 5 oder 4. Behalte die gleiche Codestruktur und Formatierung bei.
                    
                    Gib die komplette Test-Klasse unter der Überschrift "UNIT_TESTS:" zurück.`
                },
                {
                    role: "user",
                    content: `Erstelle Unit-Tests für diesen Java-Code:\n\n${sourceCode}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 3000,
        });

        const response = chatCompletion.choices[0]?.message?.content || "";

        console.log(response);
        
        // Parse unit tests from response
        const testsMatch = response.match(/UNIT_TESTS:[\s\S]*?```java\s*([\s\S]*?)```/);
        
        const unitTests = testsMatch ? testsMatch[1].trim() : `// No unit tests generated.\n\npublic class GeneratedTests {\n    // Add your tests here\n}`;

        res.json({
            status: 'success',
            data: unitTests
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));