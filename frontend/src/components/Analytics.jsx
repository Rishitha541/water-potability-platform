const GROUPS = [
  { key: "clear", label: "Clear", color: "#27ae60" },
  { key: "slightly_cloudy", label: "Slightly cloudy", color: "#f39c12" },
  { key: "very_cloudy", label: "Very cloudy", color: "#e74c3c" },
];

export default function Analytics({ reports, hotspots, loading, status, reload }) {
  const total = reports.length;
  const counts = GROUPS.map((g) => ({
    ...g,
    n: reports.filter((r) => r.turbidity_label === g.key).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  const veryPct = total ? Math.round((counts[2].n / total) * 100) : 0;

  return (
    <div>
      <div className="page-head">
        <h1>Analytics</h1>
        <button onClick={reload} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
      </div>

      {status !== "online" && (
        <p className="note">The server is waking up. Charts fill in once it responds.</p>
      )}

      <section className="tiles">
        <div className="tile"><div className="tile-value">{total}</div><div className="tile-label">Total reports</div></div>
        <div className="tile"><div className="tile-value">{hotspots.length}</div><div className="tile-label">Hotspot zones</div></div>
        <div className="tile"><div className="tile-value">{veryPct}%</div><div className="tile-label">Very cloudy share</div></div>
      </section>

      <h2 className="section-title">Reports by cloudiness</h2>
      <section className="card">
        {counts.map((c) => (
          <div className="bar-row" key={c.key}>
            <span className="bar-label">{c.label}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(c.n / max) * 100}%`, background: c.color }} />
            </div>
            <span className="bar-n">{c.n}</span>
          </div>
        ))}
      </section>

      <h2 className="section-title">Hotspot zones</h2>
      <section className="card">
        {hotspots.length === 0 && <p className="muted">No hotspot zones right now.</p>}
        {hotspots.map((h) => (
          <div className="feed-row" key={h.cluster_id}>
            <span className="pill very_cloudy">Zone {h.cluster_id}</span>
            <span className="feed-desc">{h.report_count} unsafe reports</span>
            <span className="muted small">radius {Math.round(h.radius_m)} m</span>
          </div>
        ))}
      </section>
    </div>
  );
}