# 🕵️‍♂️ Code-Sniff

**Code-Sniff** ist ein intelligenter Code-Review-Assistent, der Java-Quellcode auf Komplexität analysiert und **KI-gestützte Refactoring-Vorschläge** liefert.

Das Projekt nutzt eine **Unified Monorepo-Architektur**, bei der Frontend und Backend zentral verwaltet werden.

---

## 🚀 Features

- **Statische Code-Analyse**  
  Berechnet die zyklomatische Komplexität und identifiziert *Code Smells*.

- **AST Parsing**  
  Nutzt `tree-sitter-java` für präzise Code-Interpretation.

- **KI-Refactoring**  
  Integriertes OpenAI SDK für menschenähnliche Verbesserungsvorschläge.

- **Modernes UI**  
  Interaktives Dashboard mit Tailwind CSS v4.

- **Unified Setup**  
  Ein einziger Befehl startet die gesamte Entwicklungsumgebung.

---

## 🛠 Tech Stack

| Komponente | Technologie |
|---------|------------|
| Frontend | React (Vite), Tailwind CSS v4 |
| Backend | Node.js, Express |
| Analyse | Tree-sitter (Java) |
| KI | GroQ API (Llama Models) |

---

## 💻 Local Setup

Folge diesen Schritten, um das Projekt lokal zu installieren und zu starten.

### 1. Voraussetzungen

- Node.js **v18 oder höher**
- Ein **Groq API Key**

---

### 2. Installation

Klone das Repository und installiere alle Abhängigkeiten (Root, Client & Server) mit **einem Befehl**:

```bash
git clone https://github.com/petarmarticStud/code-sniff.git
cd code-sniff

# Installiert alle Pakete im gesamten Monorepo
npm run install:all
```

## 3. Konfiguration

Erstelle im Ordner `server/` eine Datei namens `.env` und füge deine Zugangsdaten hinzu:

```env
PORT=3000
OPENAI_API_KEY=dein_groq_api_key_hier
```
## 4. Startet beide Server (Vite & Express)
```bash
npm run dev
```

## 🏗 Projektstruktur

```plaintext
code-sniff/
├── client/          # React Frontend (Vite + Tailwind)
├── server/          # Node.js Backend (Express + Tree-sitter)
├── package.json     # Zentrale Steuerung (Root)
└── README.md        # Dokumentation
```

## ⚠️Admin-Hinweis (Nur für Setup)
Damit die oben genannten Befehle funktionieren, muss die package.json im Hauptverzeichnis
(/code-sniff/package.json) wie folgt konfiguriert sein:
```json
{
  "name": "code-sniff",
  "version": "1.0.0",
  "scripts": {
    "install:all": "npm install && npm install --prefix client && npm install --prefix server",
    "dev": "concurrently \"npm run dev --prefix client\" \"npm run dev --prefix server\"",
    "start": "npm run start --prefix server"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

