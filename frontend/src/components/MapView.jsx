import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = import.meta.env.VITE_API_URL;
const DEFAULT_CENTER = [17.42, 78.47]; // Hyderabad area, adjust if needed

const TURBIDITY_COLOR = {
  clear: "#27ae60",
  slightly_cloudy: "#f39c12",
  very_cloudy: "#e74c3c",
};

export default function MapView() {
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [reportsRes, hotspotsRes] = await Promise.all([
          fetch(`${API_URL}/reports`),
          fetch(`${API_URL}/hotspots`),
        ]);
        if (!reportsRes.ok || !hotspotsRes.ok) throw new Error("Failed to load map data");
        setReports(await reportsRes.json());
        setHotspots(await hotspotsRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p style={{ textAlign: "center", padding: "2rem" }}>Loading map...</p>;
  if (error) return <p style={{ color: "#c0392b", textAlign: "center", padding: "2rem" }}>⚠ {error}</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem" }}>
      <h2>Water Safety Map</h2>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Pins show citizen reports. Red circles are hotspots with multiple unsafe reports nearby.
      </p>

      <MapContainer center={DEFAULT_CENTER} zoom={11} style={{ height: 500, width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {hotspots.map((h) => (
          <Circle
            key={h.cluster_id}
            center={[h.latitude, h.longitude]}
            radius={h.radius_m}
            pathOptions={{ color: "#e74c3c", fillColor: "#e74c3c", fillOpacity: 0.2 }}
          >
            <Popup>
              <strong>Hotspot</strong>
              <br />
              {h.report_count} unsafe reports nearby
            </Popup>
          </Circle>
        ))}

        {reports.map((r) => (
          <CircleMarker
            key={r.id}
            center={[r.latitude, r.longitude]}
            radius={6}
            pathOptions={{
              color: TURBIDITY_COLOR[r.turbidity_label] || "#999",
              fillColor: TURBIDITY_COLOR[r.turbidity_label] || "#999",
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <strong>{r.turbidity_label?.replace("_", " ") || "Unknown"}</strong>
              <br />
              Status: {r.status}
              <br />
              {r.description && <>{r.description}<br /></>}
              <small>{new Date(r.created_at).toLocaleString()}</small>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666" }}>
        <span style={{ color: TURBIDITY_COLOR.clear }}>●</span> Clear &nbsp;
        <span style={{ color: TURBIDITY_COLOR.slightly_cloudy }}>●</span> Slightly cloudy &nbsp;
        <span style={{ color: TURBIDITY_COLOR.very_cloudy }}>●</span> Very cloudy &nbsp;
        <span style={{ color: "#e74c3c" }}>◯</span> Hotspot zone
      </div>
    </div>
  );
}