import { useState } from "react";
import { predictWater } from "../services/api";

const GROUPS = [
  {
    title: "Acidity and minerals",
    fields: [
      { key: "ph", label: "pH", unit: "pH", hint: "Ideal 6.5 – 8.5" },
      { key: "Hardness", label: "Hardness", unit: "mg/L", hint: "Calcium and magnesium" },
      { key: "Solids", label: "Dissolved solids (TDS)", unit: "ppm", hint: "Guideline up to 500" },
      { key: "Conductivity", label: "Conductivity", unit: "µS/cm", hint: "Tracks ions in water" },
    ],
  },
  {
    title: "Chemicals",
    fields: [
      { key: "Chloramines", label: "Chloramines", unit: "mg/L", hint: "Disinfectant, up to 4" },
      { key: "Sulfate", label: "Sulfate", unit: "mg/L", hint: "Guideline up to 250" },
      { key: "Trihalomethanes", label: "Trihalomethanes", unit: "µg/L", hint: "Guideline up to 80" },
    ],
  },
  {
    title: "Clarity",
    fields: [
      { key: "Organic_carbon", label: "Organic carbon", unit: "mg/L", hint: "Organic matter" },
      { key: "Turbidity", label: "Turbidity", unit: "NTU", hint: "Cloudiness, up to 5" },
    ],
  },
];

const UNSAFE = {
  ph: 9.1, Hardness: 210, Solids: 500, Chloramines: 3.5, Sulfate: 250,
  Conductivity: 450, Organic_carbon: 5, Trihalomethanes: 95, Turbidity: 6.1,
};
const CLEAN = {
  ph: 7.2, Hardness: 150, Solids: 300, Chloramines: 2, Sulfate: 150,
  Conductivity: 350, Organic_carbon: 2, Trihalomethanes: 40, Turbidity: 1,
};

const VERDICTS = {
  not_recommended: { label: "Not recommended", color: "#ef4444", icon: "⛔" },
  uncertain: { label: "Uncertain", color: "#f59e0b", icon: "⚠️" },
  no_issues_found: { label: "No issues found", color: "#10b981", icon: "✅" },
};

function Gauge({ value, color }) {
  const pct = Math.max(0, Math.min(100, (value || 0) * 100));
  const arc = "M20 100 A80 80 0 0 1 180 100";
  return (
    <svg viewBox="0 0 200 118" className="gauge" role="img" aria-label={`Model confidence ${pct.toFixed(0)} percent`}>
      <path d={arc} pathLength="100" className="gauge-track" />
      <path
        d={arc}
        pathLength="100"
        className="gauge-fill"
        style={{ stroke: color, strokeDasharray: `${pct} 100` }}
      />
      <text x="100" y="92" textAnchor="middle" className="gauge-num">{pct.toFixed(0)}%</text>
      <text x="100" y="112" textAnchor="middle" className="gauge-cap">model confidence (potable)</text>
    </svg>
  );
}

function friendly(message) {
  if (/fetch|network/i.test(message)) {
    return "Can't reach the server. The free server may be waking up. Wait a minute and try again.";
  }
  return message;
}

export default function PredictionForm() {
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filled = Object.values(values).filter((v) => v !== undefined && !Number.isNaN(v)).length;
  const ready = filled >= 3;

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value === "" ? undefined : Number(value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      setResult(await predictWater(values));
    } catch (err) {
      setError(friendly(err.message));
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setValues({});
    setResult(null);
    setError("");
  }

  const verdict = result ? VERDICTS[result.verdict] || VERDICTS.uncertain : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Test your water</h1>
          <p className="page-sub">Enter at least 3 of the 9 readings. Leave unknown ones blank.</p>
        </div>
      </div>

      <div className="split">
        <form className="card" onSubmit={handleSubmit}>
          <div className="form-top">
            <div className="meter">
              <div className="meter-fill" style={{ width: `${(filled / 9) * 100}%` }} />
            </div>
            <span className="meter-text">{filled}/9 readings</span>
          </div>

          <div className="chips">
            <button type="button" className="chip" onClick={() => setValues(UNSAFE)}>Try unsafe sample</button>
            <button type="button" className="chip" onClick={() => setValues(CLEAN)}>Try clean sample</button>
            <button type="button" className="chip" onClick={clearAll}>Clear</button>
          </div>

          {GROUPS.map((g) => (
            <div key={g.title}>
              <h3 className="group-title">{g.title}</h3>
              <div className="fields">
                {g.fields.map((f) => (
                  <label key={f.key} className="field">
                    {f.label}
                    <span className="box">
                      <input
                        type="number"
                        step="any"
                        value={values[f.key] ?? ""}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                      />
                      <span className="unit">{f.unit}</span>
                    </span>
                    <span className="hint">{f.hint}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || !ready}>
            {loading ? "Checking…" : ready ? "Check water" : `Add ${3 - filled} more reading${3 - filled === 1 ? "" : "s"}`}
          </button>
        </form>

        <div className="result-col">
          {error && <div className="alert">⚠ {error}</div>}

          {!result && !error && (
            <div className="card placeholder">
              <div className="placeholder-icon">💧</div>
              <h3>Your verdict appears here</h3>
              <p className="muted">
                Each reading is checked against drinking-water guidelines. You also get a model
                confidence score and an explanation for anything flagged.
              </p>
            </div>
          )}

          {result && (
            <div className="verdict" style={{ "--c": verdict.color }}>
              <div className="verdict-head">
                <span className="verdict-icon">{verdict.icon}</span>
                <div>
                  <div className="verdict-label">{verdict.label}</div>
                  <div className="muted small">{result.readings_provided}/9 readings used</div>
                </div>
              </div>

              <Gauge value={result.probability_potable} color={verdict.color} />
              <p className="verdict-msg">{result.verdict_message}</p>

              {result.flags?.length > 0 && (
                <>
                  <h3 className="group-title">Flagged readings</h3>
                  <div className="flags">
                    {result.flags.map((f, i) => (
                      <div className="flag" key={i}>
                        <div className="flag-top">
                          <strong>{f.parameter}</strong>
                          <span className="flag-val">{f.value}{f.unit}</span>
                          <span className="pill very_cloudy">{f.status}</span>
                        </div>
                        <p><b>Drinking:</b> {f.drinking}</p>
                        <p><b>Skin and hair:</b> {f.skin_hair}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className="disclaimer">{result.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}