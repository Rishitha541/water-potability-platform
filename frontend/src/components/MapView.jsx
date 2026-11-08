import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_CENTER = [17.42, 78.47]; // Hyderabad area, adjust if needed

const TURBIDITY_COLOR = {
  clear: "#22c55e",
  slightly_cloudy: "#f59e0b",
  very_cloudy: "#ef4444",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "clear", label: "Clear" },
  { key: "slightly_cloudy", label: "Slightly cloudy" },
  { key: "very_cloudy", label: "Very cloudy" },
];

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.pos, 15, { duration: 1 });
  }, [target, map]);
  return null;
}

export default function MapView() {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [target, setTarget] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [reportsRes, hotspotsRes] = await Promise.all([
        fetch(`${API_URL}/reports`),
        fetch(`${API_URL}/hotspots`),
      ]);
      if (!reportsRes.ok || !hotspotsRes.ok) throw new Error("Failed to load map data");
      setReports(await reportsRes.json());
      setHotspots(await hotspotsRes.json());
    } catch (err) {
      setError(
        /fetch|network/i.test(err.message)
          ? "Can't reach the server. It may be waking up. Wait a minute and retry."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const shown = filter === "all" ? reports : reports.filter((r) => r.turbidity_label === filter);

  if (loading) {
    return (
      <div className="card placeholder">
        <div className="placeholder-icon">🗺</div>
        <h3>Loading the map…</h3>
        <p className="muted">If the free server was asleep, this can take up to a minute.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card placeholder">
        <div className="placeholder-icon">⚠️</div>
        <h3>{error}</h3>
        <button className="btn btn-primary" onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Live map</h1>
          <p className="page-sub">
            Dots are citizen reports. Red circles are hotspots where several unsafe reports cluster.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load}>Refresh</button>
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={"chip" + (filter === f.key ? " on" : "")}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="map-wrap">
        <div className="map-card">
          <MapContainer center={DEFAULT_CENTER} zoom={11} scrollWheelZoom>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            />
            <FlyTo target={target} />

            {hotspots.map((h) => (
              <Circle
                key={h.cluster_id}
                center={[h.latitude, h.longitude]}
                radius={h.radius_m}
                pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.22 }}
              >
                <Popup>
                  <strong>Hotspot</strong>
                  <br />
                  {h.report_count} unsafe reports nearby
                </Popup>
              </Circle>
            ))}

            {shown.map((r) => (
              <CircleMarker
                key={r.id}
                center={[r.latitude, r.longitude]}
                radius={7}
                pathOptions={{
                  color: "#0b1220",
                  weight: 1.5,
                  fillColor: TURBIDITY_COLOR[r.turbidity_label] || "#94a3b8",
                  fillOpacity: 0.95,
                }}
              >
                <Popup>
                  <strong>{r.turbidity_label?.replace(/_/g, " ") || "Unknown"}</strong>
                  <br />
                  Status: {r.status}
                  <br />
                  {r.description && <>{r.description}<br /></>}
                  <small>{new Date(r.created_at).toLocaleString()}</small>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="legend">
            <div><i style={{ background: TURBIDITY_COLOR.clear }} /> Clear</div>
            <div><i style={{ background: TURBIDITY_COLOR.slightly_cloudy }} /> Slightly cloudy</div>
            <div><i style={{ background: TURBIDITY_COLOR.very_cloudy }} /> Very cloudy</div>
            <div><i className="ring" /> Hotspot zone</div>
          </div>
        </div>

        <aside className="card side">
          <div className="side-stats">
            <div><b>{shown.length}</b><span>shown</span></div>
            <div><b>{hotspots.length}</b><span>hotspots</span></div>
          </div>
          <h3 className="card-title">Hotspot zones</h3>
          {hotspots.length === 0 && <p className="muted small">No hotspot zones right now.</p>}
          {hotspots.map((h) => (
            <button
              key={h.cluster_id}
              className="zone"
              onClick={() => setTarget({ pos: [h.latitude, h.longitude], k: Date.now() })}
            >
              <span className="zone-dot" />
              <span className="zone-text">
                <b>Zone {h.cluster_id}</b>
                <small>{h.report_count} unsafe reports · {Math.round(h.radius_m)} m radius</small>
              </span>
              <span className="zone-go">View</span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}