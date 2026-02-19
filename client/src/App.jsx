import { useEffect, useState } from 'react'

function App() {
    const [backendMsg, setBackendMsg] = useState('Waiting for server...')

    useEffect(() => {
        fetch('/api/analyze')
            .then(res => res.json())
            .then(data => setBackendMsg(data.message))
            .catch(err => setBackendMsg('Connection failed!'))
    }, [])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
            <h1 className="text-3xl font-bold mb-4">Code-Sniff Connection Test</h1>
            <div className="p-6 bg-slate-800 rounded-lg shadow-xl">
                Status: <span className="text-green-400 font-mono">{backendMsg}</span>
            </div>
        </div>
    )
}
export default App