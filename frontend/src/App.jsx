import { useState } from "react";
import PredictionForm from "./components/PredictionForm";
import MapView from "./components/MapView";
import ReportUpload from "./components/ReportUpload";
import "./App.css";

const TABS = [
  { key: "predict", label: "Predict", component: PredictionForm },
  { key: "report", label: "Report", component: ReportUpload },
  { key: "map", label: "Map", component: MapView },
];

function App() {
  const [active, setActive] = useState("predict");
  const ActiveComponent = TABS.find((t) => t.key === active).component;

  return (
    <div>
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            style={{
              padding: "0.5rem 1.25rem",
              background: active === t.key ? "#2c3e50" : "#f0f0f0",
              color: active === t.key ? "#fff" : "#333",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <ActiveComponent />
    </div>
  );
}

export default App;