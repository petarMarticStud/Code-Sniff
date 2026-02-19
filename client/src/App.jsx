import { useEffect, useState } from 'react'

function App() {
    return (
        <div className="h-screen w-full bg-slate-900 flex items-center justify-center">
            <div className="bg-white p-10 rounded-2xl shadow-2xl">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                    Tailwind ist am Start!
                </h1>
                <p className="text-slate-600 mt-4 text-center font-medium">
                    Die Konfiguration war erfolgreich.
                </p>
            </div>
        </div>
    )
}

export default App