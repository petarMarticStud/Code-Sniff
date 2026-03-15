const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { analyzeCode } = require('./parser');

const app = express();
app.use(cors());
app.use(express.json());

// POST-Endpunkt für die Analyse
app.post('/api/analyze', (req, res) => {
    const { sourceCode } = req.body;


    if (!sourceCode || typeof sourceCode !== 'string') {
        return res.status(400).json({ error: 'Ungültiger Dateiinhalt' });
    }

    try {
        const result = analyzeCode(sourceCode);
        res.json({ status: 'success', data: result });
    } catch (err) {
        res.status(500).json({ error: 'Parsing fehlgeschlagen' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));