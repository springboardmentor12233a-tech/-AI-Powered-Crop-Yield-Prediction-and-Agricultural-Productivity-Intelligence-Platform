import { useEffect, useState } from "react";
import "./App.css";

function App() {
    const [backendMsg, setBackendMsg] = useState("");

    useEffect(() => {
        fetch("/api/health")
            .then(res => res.json())
            .then(data => setBackendMsg(data.message))
            .catch(() => setBackendMsg(""));
    }, []);

    return (
        <div className="screen">
            <h1 className="title">YieldSenseAI</h1>
            {backendMsg && <p className="backend">{backendMsg}</p>}
        </div>
    );
}

export default App;
