import { useState } from "react";
import { predictWater } from "../services/api";

const FIELDS = [
  { key: "ph", label: "pH" },
  { key: "Hardness", label: "Hardness (mg/L)" },
  { key: "Solids", label: "Solids / TDS (ppm)" },
  { key: "Chloramines", label: "Chloramines (mg/L)" },
  { key: "Sulfate", label: "Sulfate (mg/L)" },
  { key: "Conductivity", label: "Conductivity (µS/cm)" },
  { key: "Organic_carbon", label: "Organic carbon (mg/L)" },
  { key: "Trihalomethanes", label: "Trihalomethanes (µg/L)" },
  { key: "Turbidity", label: "Turbidity (NTU)" },
];

const VERDICT_STYLE = {
  not_recommended: { bg: "#fdecea", border: "#e74c3c", text: "#c0392b" },
  uncertain: { bg: "#fff8e1", border: "#f39c12", text: "#b8860b" },
  no_issues_found: { bg: "#eafaf1", border: "#27ae60", text: "#1e8449" },
};

export default function PredictionForm() {
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value === "" ? undefined : Number(value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await predictWater(values);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const style = result ? VERDICT_STYLE[result.verdict] : null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "1rem" }}>
      <h2>Water Quality Check</h2>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Enter at least 3 of the 9 readings. Leave the rest blank if unknown.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {FIELDS.map((f) => (
            <label key={f.key} style={{ fontSize: "0.9rem" }}>
              {f.label}
              <input
                type="number"
                step="any"
                value={values[f.key] ?? ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem",
                  boxSizing: "border-box",
                }}
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "1.25rem",
            padding: "0.6rem 1.5rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Checking..." : "Check Water"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#c0392b", marginTop: "1rem" }}>⚠ {error}</p>
      )}

      {result && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: 8,
            background: style.bg,
            border: `1px solid ${style.border}`,
          }}
        >
          <h3 style={{ color: style.text, margin: 0 }}>
            {result.verdict.replace(/_/g, " ").toUpperCase()}
          </h3>
          <p style={{ margin: "0.5rem 0" }}>{result.verdict_message}</p>
          <p style={{ fontSize: "0.85rem", color: "#555" }}>
            Model confidence (potable): {(result.probability_potable * 100).toFixed(1)}%
            {" · "}Readings used: {result.readings_provided}/9
          </p>

          {result.flags.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <strong>Flagged readings:</strong>
              {result.flags.map((f, i) => (
                <div
                  key={i}
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    background: "#fff",
                    borderRadius: 6,
                    fontSize: "0.85rem",
                  }}
                >
                  <strong>{f.parameter}</strong> ({f.value}
                  {f.unit}) — {f.status}
                  <br />
                  <em>Drinking:</em> {f.drinking}
                  <br />
                  <em>Skin/Hair:</em> {f.skin_hair}
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: "0.75rem", color: "#888", marginTop: "1rem" }}>
            {result.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}