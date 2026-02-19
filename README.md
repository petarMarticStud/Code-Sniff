# 📂 Code-Sniff

**Code-Sniff** is an intelligent code-review assistant designed to analyze Java source code for complexity and provide AI-powered refactoring suggestions. 

This project utilizes a **Unified Host Architecture**, meaning both the React frontend and the Node.js backend run on the same localhost port for a seamless, production-ready experience.

---

## 🚀 Features

* **Static Code Analysis:** Calculates Cyclomatic Complexity and identifies "Code Smells" using AST parsing.
* **AST Parsing:** Leverages `tree-sitter-java` for high-performance, fault-tolerant Java code interpretation.
* **AI-Powered Refactoring:** Integrated OpenAI SDK to provide human-like code improvements and detailed explanations.
* **Interactive Dashboard:** A modern UI featuring syntax highlighting, error markers, and side-by-side code comparisons.
* **Single-Port Access:** No cross-origin (CORS) issues; the entire app is served from a single entry point.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS |
| **Backend** | Node.js, Express |
| **Analysis Engine** | Tree-sitter (Java) |
| **AI Engine** | OpenAI API (GPT Models) |

---

## 💻 Local Setup (Unified Mode)

This project is optimized to serve the frontend via the backend Express server, making it easy to run the entire stack with a single command.

### 1. Prerequisites
* **Node.js** (v18 or higher)
* An **OpenAI API Key**

### 2. Installation & Build
```bash
# Clone the repository
git clone https://github.com/petarmarticStud/code-sniff.git
cd code-sniff

# Install all dependencies (Root, Client, and Server)
npm install && npm install --prefix client && npm install --prefix server
