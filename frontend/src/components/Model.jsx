// Set to false to hide the accuracy numbers (the rest of the page stays).
const SHOW_ACCURACY = true;

// EDIT THESE to match your project report. Labels are placeholders.
const RESULTS = [
  { label: "Model result 1", value: 63.9 },
  { label: "Model result 2", value: 66.2 },
  { label: "Baseline (always predict majority)", value: 61.0 },
];

// Typical drinking-water guideline values (WHO / EPA style). Edit to match your backend rules.
const LIMITS = [
  ["pH", "6.5 – 8.5"],
  ["Total dissolved solids", "up to 500 ppm"],
  ["Chloramines", "up to 4 mg/L"],
  ["Sulfate", "up to 250 mg/L"],
  ["Trihalomethanes", "up to 80 µg/L"],
  ["Turbidity", "up to 5 NTU"],
];

export default function Model() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Model and method</h1>
          <p className="page-sub">How the verdicts are produced and why guidelines come first.</p>
        </div>
      </div>

      <h2 className="section-title">Why guidelines lead</h2>
      <section className="card">
        <p>
          The machine-learning model is trained on a dataset where the measurements only weakly
          predict potability, so its accuracy stays modest. The platform therefore puts published
          drinking-water guidelines first. The model adds a confidence score but never overrides a
          guideline flag.
        </p>
      </section>

      {SHOW_ACCURACY && (
        <>
          <h2 className="section-title">Accuracy</h2>
          <section className="card">
            {RESULTS.map((r) => (
              <div className="bar-row" key={r.label}>
                <span className="bar-label wide">{r.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${r.value}%`, background: "#0d9488" }} />
                </div>
                <span className="bar-n">{r.value}%</span>
              </div>
            ))}
          </section>
        </>
      )}

      <h2 className="section-title">Guideline limits used</h2>
      <section className="card">
        <table className="table">
          <thead><tr><th>Parameter</th><th>Acceptable range</th></tr></thead>
          <tbody>
            {LIMITS.map(([p, l]) => (
              <tr key={p}><td>{p}</td><td>{l}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2 className="section-title">How hotspots are formed</h2>
      <section className="card">
        <p>
          Citizen photo reports are given a cloudiness estimate. When several unsafe reports fall
          close together, they are grouped into one hotspot zone, drawn on the map as a red circle
          with a radius covering those reports.
        </p>
        <p className="muted small">
          Photo estimates are not lab tests and are not independently verified.
        </p>
      </section>
    </div>
  );
}