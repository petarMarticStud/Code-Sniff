📂 Code-Sniff is an intelligent code-review assistant that analyzes Java source code for complexity and provides AI-powered refactoring suggestions.This project is designed with a Unified Host Architecture, meaning both the React frontend and the Node.js backend run on the same localhost port for a seamless experience.

🚀 Features
- Static Code Analysis: Calculates Cyclomatic Complexity and identifies "Code Smells" using AST parsing.
- AST Parsing: Leverages tree-sitter-java for high-performance, fault-tolerant Java code interpretation.
- AI-Powered Refactoring: Integrated OpenAI SDK to provide human-like code improvements and explanations.
- Interactive Dashboard: A modern UI featuring syntax highlighting, error markers, and side-by-side code comparisons.
- Single-Port Access: No cross-origin (CORS) issues; the entire app is served from a single entry point.


🛠 Tech Stack
- Frontend: React (Vite), Tailwind CSS
- Backend: Node.js, Express
- Analysis Engine: Tree-sitter (Java)
- AI Engine: OpenAI API (GPT Models)



💻 Local Setup (Unified Mode)
This project is optimized to serve the frontend via the backend Express server, 
making it easy to run the entire stack with a single command

  1. Prerequisites
     - Node.js (v18 or higher)
     - An OpenAI API Key
       
  2. Installation & Build
       # Clone the repository
      - git clone https://github.com/petarmarticStud/code-sniff.git
      - cd code-sniff
        
      # Install all dependencies (Root, Client, and Server)
      - npm install && npm install --prefix client && npm install --prefix server
        
  3. Configuration
  # Create a .env file inside the server/ directory:
  - OPENAI_API_KEY=your_actual_api_key_here
    PORT=3000
    
4. Launching the App
  # To build the frontend and start the backend on http://localhost:3000:
  - npm run start:unified
    
🏗 System Architecture
The project follows a Production-Ready local setup:
  - Frontend Build: The React app is compiled into static assets in client/dist.
  - Static Serving: The Express server uses express.static to serve these files.
  - API Routing: All analysis logic is handled via /api/* endpoints.
  - Result: Users only need to navigate to one URL; the browser treats the API and the UI as the same origin.



**Important Note for the Root package.json**
  To ensure the npm run start:unified command works, your root directory package.json should include:

"scripts": {
  "build:frontend": "cd client && npm run build",
  "start:unified": "npm run build:frontend && cd server && node index.js"
}

