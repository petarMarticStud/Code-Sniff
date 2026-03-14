🕵️‍♂️ Code-SniffCode-Sniff ist ein intelligenter Code-Review-Assistent, der Java-Quellcode auf Komplexität analysiert und KI-gestützte Refactoring-Vorschläge liefert.Das Projekt nutzt eine Unified Monorepo-Architektur, bei der Frontend und Backend zentral verwaltet werden.🚀 FeaturesStatische Code-Analyse: Berechnet die zyklomatische Komplexität und identifiziert "Code Smells".AST Parsing: Nutzt tree-sitter-java für präzise Code-Interpretation.KI-Refactoring: Integriertes OpenAI SDK für menschenähnliche Verbesserungsvorschläge.Modernes UI: Interaktives Dashboard mit Tailwind CSS v4.Unified Setup: Ein einziger Befehl startet die gesamte Entwicklungsumgebung.🛠 Tech StackKomponenteTechnologieFrontendReact (Vite), Tailwind CSS v4BackendNode.js, ExpressAnalyseTree-sitter (Java)KIOpenAI API (GPT Models)💻 Local SetupFolge diesen Schritten, um das Projekt lokal zu installieren und zu starten.1. VoraussetzungenNode.js (v18 oder höher)Ein OpenAI API Key2. InstallationKlone das Repository und installiere alle Abhängigkeiten (Root, Client & Server) mit einem Befehl:Bashgit clone https://github.com/petarmarticStud/code-sniff.git
cd code-sniff

# Installiert alle Pakete im gesamten Monorepo
npm run install:all
3. KonfigurationErstelle im Ordner server/ eine Datei namens .env und füge deine Zugangsdaten hinzu:Code-SnippetPORT=3000
   OPENAI_API_KEY=dein_openai_api_key_hier
4. Anwendung startenStarte das Frontend und das Backend gleichzeitig im Development-Modus:Bash# Startet beide Server (Vite & Express)
   npm run dev
   Frontend UI: http://localhost:5173Backend API: http://localhost:3000🏗 Projekt-StrukturPlaintextcode-sniff/
   ├── client/          # React Frontend (Vite + Tailwind)
   ├── server/          # Node.js Backend (Express + Tree-sitter)
   ├── package.json     # Zentrale Steuerung (Root)
   └── README.md        # Dokumentation
   📈 Roadmap[x] Initiales Projekt-Setup & Architektur[x] Tailwind CSS v4 Integration[ ] Implementierung des Java-Datei-Uploads (Multer)[ ] Tree-sitter Integration für AST-Metriken[ ] KI-Modul für Refactoring-Vorschläge[ ] Finales Dashboard Design👥 TeamPeter: Backend Engineering, AST-Analyse & APIJamil: Frontend Architektur & UI/UX Design⚠️ Admin-Hinweis (Nur für Setup)Damit die oben genannten Befehle funktionieren, muss die package.json im Hauptverzeichnis (/code-sniff/package.json) wie folgt konfiguriert sein:JSON{
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
   Möchtest du, dass ich dir jetzt helfe, die package.json im Hauptordner genau so anzupassen, damit der npm run dev Befehl sofort funktioniert?