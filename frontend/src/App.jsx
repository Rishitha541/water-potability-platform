import { useCallback, useEffect, useState } from "react";
import PredictionForm from "./components/PredictionForm";
import ReportUpload from "./components/ReportUpload";
import MapView from "./components/MapView";
import Overview from "./components/Overview";
import Analytics from "./components/Analytics";
import Model from "./components/Model";
import "./Shell.css";

const API_URL = import.meta.env.VITE_API_URL;

const PAGES = [
  { key: "overview", label: "Overview", icon: "▦" },
  { key: "predict", label: "Test water", icon: "💧" },
  { key: "report", label: "Report a problem", icon: "📷" },
  { key: "map", label: "Live map", icon: "🗺" },
  { key: "analytics", label: "Analytics", icon: "📊" },
  { key: "model", label: "Model and method", icon: "🧪" },
];

export default function App() {
  const [page, setPage] = useState("overview");
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [status, setStatus] = useState("waking"); // waking | online
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r, h] = await Promise.all([
        fetch(`${API_URL}/reports`),
        fetch(`${API_URL}/hotspots`),
      ]);
      if (!r.ok || !h.ok) throw new Error("bad response");
      setReports(await r.json());
      setHotspots(await h.json());
      setStatus("online");
    } catch {
      setStatus("waking");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // While the free server is asleep, keep retrying every 8 seconds.
  useEffect(() => {
    if (status === "online") return;
    const id = setInterval(loadData, 8000);
    return () => clearInterval(id);
  }, [status, loadData]);

  const shared = { reports, hotspots, loading, status, reload: loadData };

  let content;
  switch (page) {
    case "predict":
      content = <PredictionForm />;
      break;
    case "report":
      content = <ReportUpload />;
      break;
    case "map":
      content = <MapView />;
      break;
    case "analytics":
      content = <Analytics {...shared} />;
      break;
    case "model":
      content = <Model />;
      break;
    default:
      content = <Overview {...shared} go={setPage} />;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">💧</span>
          <div>
            <div className="brand-name">AquaWatch</div>
            <div className="brand-sub">Community water safety</div>
          </div>
        </div>

        <nav className="nav">
          {PAGES.map((p) => (
            <button
              key={p.key}
              className={"nav-item" + (page === p.key ? " active" : "")}
              onClick={() => setPage(p.key)}
            >
              <span className="nav-icon">{p.icon}</span>
              {p.label}
            </button>
          ))}
        </nav>

        <div className="server-status">
          <span className={"dot " + status} />
          {status === "online" ? "Server online" : "Server waking up"}
        </div>
      </aside>

      <main className="main">
        <div className="page" key={page}>
          {content}
        </div>
      </main>
    </div>
  );
}