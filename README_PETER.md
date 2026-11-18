# Code-Sniff 2.0 – Umsetzung der Anforderungen (Peter Martic)

Diese Datei dokumentiert, welche Anforderungen aus der *SRS CodeSniff 2.0* (Jamil und Peter) in meinem Teil
umgesetzt wurden und was dafür im Projekt geändert wurde.

## Übersicht

| Anforderung | Beschreibung | Priorität | Status |
|---|---|---|---|
| **SHRD M1** | Projekt-Upload (.zip) | Must | ✅ umgesetzt |
| PM M1 | Kommentar-Varianten und Test-Sichtbarkeit | Must | ⏳ offen |
| PM M2 | KI-Refactoring über mehrere Dateien und Änderungsverfolgung | Must | ⏳ offen |
| **PM M3** | Unabhängige JUnit-Auswertung | Must | 🔧 Umgebung vorbereitet, Runner offen |
| PM M4 | Vergleich der Bedingungen und JSON-Export | Must | ⏳ offen |
| PM M5 | Experiment-Case-Definition | Must | ⏳ offen |
| PM S1 | Wiederholte Ausführung | Should | ⏳ offen |
| PM S2 | Ausführung geänderter Working-Tests | Should | ⏳ offen |
| PM S3 | Batch-Ausführung der Bedingungen A–D | Should | ⏳ offen |
| PM C1 | Ergebnis-Dashboard | Could | ⏳ offen |
| PM C2 | HTML-Report | Could | ⏳ offen |
| PM NF1–NF4 | Datenintegrität, Reproduzierbarkeit, Isolation, Wartbarkeit | Must/Should | ⏳ offen |

**Stand:** 1 von 15 Anforderungen umgesetzt (SHRD M1), PM M3 vorbereitet.

---

## ✅ SHRD M1 – Projekt-Upload

> *As a developer, I want to upload a whole Java project so that related classes are analyzed together.*

### Akzeptanzkriterien und Umsetzung

| Akzeptanzkriterium | Umsetzung |
|---|---|
| System akzeptiert ein .zip-Archiv und extrahiert alle .java-Dateien | Button **„Projekt hochladen (.zip)“** im Frontend, Endpunkt `POST /api/project/upload` im Backend |
| Die Ordnerstruktur wird als Dateibaum angezeigt | Neue Komponente `ProjectTree`, Ordner auf- und zuklappbar |
| Limits: max. 20 MB, max. 200 .java-Dateien | Serverseitige Prüfung, Ablehnung mit verständlicher Fehlermeldung |
| Dateien mit Syntaxfehlern werden markiert, die übrigen trotzdem analysiert | Rotes ⚠-Badge mit Zeilennummern im Tooltip; ein Parserfehler betrifft nur die jeweilige Datei |

### Ablauf in der App
1. **„Projekt hochladen (.zip)“** anklicken und Archiv wählen
2. Der Dateibaum mit allen `.java`-Dateien erscheint; fehlerhafte Dateien sind rot markiert
3. Datei anklicken → die bestehende Methodenauswahl öffnet sich
4. **„Analysieren“** → Health Score, AST und AI Advisor wie bei einer einzelnen Datei

Die Analyse mehrerer Dateien in einem KI-Request gehört nicht zu SHRD M1, sondern folgt mit PM M2.

### Was dafür gemacht wurde

| Datei | Änderung |
|---|---|
| `server/projectUpload.js` | **Neu.** Entpacken des Archivs, Prüfung der Limits, Filtern der `.java`-Dateien, Syntaxprüfung pro Datei |
| `server/parser.js` | **Neu:** `checkSyntax()` und `collectSyntaxErrors()` liefern Syntaxfehler mit Zeile und Spalte. `parseJava()` behebt einen Absturz bei Dateien > 32 KB |
| `server/index.js` | **Neu:** Route `POST /api/project/upload` mit `multer` (max. 20 MB) |
| `server/package.json` | Neue Abhängigkeit `adm-zip` zum Entpacken |
| `client/src/components/ProjectTree.jsx` | **Neu.** Dateibaum mit Markierung der Syntaxfehler |
| `client/src/App.jsx` | Upload-Button, Upload-Logik, Einbindung des Dateibaums |
| `client/src/locales.json` | Neue Texte auf Deutsch und Englisch |

### Zusätzliche Absicherung
- **Zip Slip:** Archivpfade, die aus dem Projektordner herausführen (`../`, absolute Pfade), werden verworfen.
- **macOS-Archive:** Metadateien (`__MACOSX/._*.java`) werden ignoriert, damit sie nicht als fehlerhafte Java-Dateien erscheinen.

### Getestet
| Testfall | Ergebnis |
|---|---|
| Gültiges Projekt mit einer fehlerhaften Datei | Beide Dateien angezeigt, nur die fehlerhafte markiert (mit Zeilennummern) |
| Archiv mit `../Evil.java` | Unsicherer Pfad verworfen, restliche Dateien übernommen |
| 201 .java-Dateien | Abgelehnt: „Project contains more than 200 .java files.“ |
| Archiv > 20 MB | Abgelehnt (HTTP 413) |
| Archiv ohne .java-Dateien | Abgelehnt |
| Keine gültige Zip-Datei / falsche Endung | Abgelehnt |
| Java-Datei > 32 KB | Wird korrekt verarbeitet |

---

## 🔧 PM M3 – Vorbereitung der Docker-Umgebung

> *As a researcher, I want to test generated production code against unchanged unit tests so that I can measure preservation of tested behavior.*

PM M3 und PM NF3 verlangen, dass KI-generierter Code in einem frischen, lokalen Docker-Container mit Maven und
festgelegter JDK-Version getestet wird: ohne Netzwerk, ohne root-Rechte, mit Ressourcen-Limits und Timeout.
**Umgesetzt ist bisher nur die Umgebung; der Runner im Backend ist noch offen.**

### Warum Docker
- Die Arbeit erzeugt gezielt manipulierten KI-Code. Dieser darf nicht mit Benutzerrechten auf dem eigenen Rechner laufen
  (Zugriff auf Dateien, `.env` mit API-Key, Netzwerk).
- Die geschützten Referenztests werden nicht in den Container eingebunden und können daher nicht verändert werden (PM NF1).
- Endlosschleifen und Speicherverbrauch werden durch Limits und Timeout abgefangen.
- Jeder Lauf nutzt exakt dieselbe Umgebung, damit Unterschiede zwischen den Bedingungen A–D nur vom KI-Output kommen (PM NF2).

### Was dafür gemacht wurde
1. **WSL2** installiert (Administrator-PowerShell, danach Neustart):
   ```powershell
   wsl --install --no-distribution
   ```
2. **Docker Desktop** installiert (Option „Use WSL 2“); Version 29.9.3.
3. **Ressourcen begrenzt** in `%USERPROFILE%\.wslconfig`, damit Docker bei 7,7 GB RAM den Rechner nicht ausbremst:
   ```ini
   [wsl2]
   memory=3GB
   processors=4
   swap=2GB
   ```
   Danach `wsl --shutdown`. Geprüft: Docker sieht 2,8 GB RAM und 4 Kerne.
4. **Maven-Image** geladen und getestet:
   ```bash
   docker pull maven:3.9-eclipse-temurin-21
   ```

### Geprüfte Laufparameter (Grundlage für den Runner)
```bash
docker run --rm --network none --user 1000:1000 -e HOME=/tmp -e MAVEN_CONFIG=/tmp/.m2 \
  --memory 1g --cpus 2 --pids-limit 256 --entrypoint mvn maven:3.9-eclipse-temurin-21 -v
```

| Parameter | Zweck | Bezug zur SRS |
|---|---|---|
| `--rm` | Frischer Container pro Lauf, wird danach gelöscht | „fresh local Docker container“ |
| `--network none` | Kein Netzwerkzugriff (geprüft: kein Internet erreichbar) | „run Maven offline without container network access“ |
| `--user 1000:1000` | Ausführung ohne root-Rechte | „non-root container“ |
| `--memory`, `--cpus`, `--pids-limit` | Grenzen für Speicher, CPU und Prozessanzahl | „CPU, memory and process limits“ |
| `--entrypoint mvn` | Umgeht das Startskript des Images, das sonst als root schreiben will | — |

### Versionen (für die Reproduzierbarkeit, PM NF2)
- Maven 3.9.16
- Java 21.0.12 (Eclipse Temurin)
- Image-Digest:
  ```
  maven@sha256:99e61abcff91a9b1333463bd8451fb18495d6eba9250ac66a338b518f8278320
  ```

> Docker Desktop muss laufen, wenn Tests ausgeführt werden.

### Noch offen für PM M3
- Backend-Runner, der den Container startet, das Projekt einbindet und den Timeout durchsetzt
- Baseline-Lauf des Originalprojekts (kompiliert, mindestens ein Test, alle Tests grün)
- Auswertung der Surefire-XML-Berichte (Kompilierfehler, fehlgeschlagene Tests, Timeout, Umgebungsfehler)
- Maven-Abhängigkeiten vorab bereitstellen, damit Maven offline läuft

---

## 🛠 Weitere Änderungen (keine eigene Anforderung)

Diese Fehler sind beim Arbeiten an SHRD M1 aufgefallen und wurden behoben, weil die KI-Analyse sonst nicht funktioniert hätte.

| Problem | Ursache | Lösung | Datei |
|---|---|---|---|
| KI-Analyse lieferte `404 model_not_found` | Groq bietet `llama-3.3-70b-versatile` nicht mehr an | Umstellung auf `openai/gpt-oss-120b`, zentral als Konstante `AI_MODEL` | `server/index.js` |
| AI Advisor zeigte immer „Keine Vorschläge erhalten“ | Das neue Modell schreibt `**SUGGESTIONS_DE:**`, der Regex erwartete `# SUGGESTIONS_DE:` | Regex akzeptiert beide Schreibweisen | `server/index.js` |
| Analyse stürzte bei Dateien > 32 KB ab („Invalid argument“) | Standard-Puffergröße von node-tree-sitter | Parsen über `parseJava()` mit passender `bufferSize` | `server/parser.js` |

> `gpt-oss-120b` ist ein Reasoning-Modell: Seine internen Denk-Tokens zählen gegen `max_tokens`.
> Ist das Limit zu niedrig, wird die Antwort abgeschnitten und die App zeigt nur den Originalcode.
