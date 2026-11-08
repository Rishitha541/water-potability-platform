const LABEL = {
  clear: "Clear",
  slightly_cloudy: "Slightly cloudy",
  very_cloudy: "Very cloudy",
};

export default function Overview({ reports, hotspots, loading, status, go }) {
  const veryCloudy = reports.filter((r) => r.turbidity_label === "very_cloudy").length;
  const latest = [...reports]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  const show = (n) => (status === "online" ? n : "–");

  return (
    <div>
      <section className="banner">
        <h1>Know your water before you drink it</h1>
        <p>
          Check readings against drinking-water guidelines, report cloudy water near you, and see
          problem areas on a live map.
        </p>
        <div className="banner-actions">
          <button className="btn-light" onClick={() => go("predict")}>Test water</button>
          <button className="btn-ghost" onClick={() => go("report")}>Report a problem</button>
          <button className="btn-ghost" onClick={() => go("map")}>Open live map</button>
        </div>
      </section>

      <section className="tiles">
        <Tile label="Reports" value={show(reports.length)} />
        <Tile label="Hotspot zones" value={show(hotspots.length)} />
        <Tile label="Very cloudy reports" value={show(veryCloudy)} />
        <Tile label="Parameters checked" value="9" />
      </section>

      {status !== "online" && (
        <p className="note">
          {loading ? "Loading…" : "The free server is waking up. Numbers appear in about a minute."}
        </p>
      )}

      <h2 className="section-title">How it works</h2>
      <section className="steps">
        <Step n="1" title="Enter readings" text="Type at least 3 of the 9 water measurements you have." />
        <Step n="2" title="Guideline check" text="Each value is compared with drinking-water limits." />
        <Step n="3" title="Clear verdict" text="You get a verdict, flagged readings and what they mean." />
      </section>

      <h2 className="section-title">Latest reports</h2>
      <section className="card feed">
        {latest.length === 0 && <p className="muted">No reports to show yet.</p>}
        {latest.map((r) => (
          <div className="feed-row" key={r.id}>
            <span className={"pill " + (r.turbidity_label || "")}>
              {LABEL[r.turbidity_label] || "Unknown"}
            </span>
            <span className="feed-desc">{r.description || "No description"}</span>
            <span className="muted small">{new Date(r.created_at).toLocaleString()}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Tile({ label, value }) {
  return (
    <div className="tile">
      <div className="tile-value">{value}</div>
      <div className="tile-label">{label}</div>
    </div>
  );
}

function Step({ n, title, text }) {
  return (
    <div className="card step">
      <div className="step-n">{n}</div>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
    </div>
  );
}