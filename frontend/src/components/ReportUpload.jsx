import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ReportUpload() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
      },
      () => setError("Could not get your location. Enter it manually.")
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!lat || !lon) {
      setError("Latitude and longitude are required.");
      return;
    }
    if (!photo) {
      setError("Please choose a photo.");
      return;
    }

    const formData = new FormData();
    formData.append("latitude", lat);
    formData.append("longitude", lon);
    if (description) formData.append("description", description);
    formData.append("photo", photo);

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reports`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) throw new Error(data.detail || "Too many reports. Try again later.");
        if (res.status === 400) throw new Error(data.detail || "Invalid file.");
        throw new Error(data.detail || `Request failed (${res.status})`);
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1rem" }}>
      <h2>Report Water Quality</h2>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Upload a photo of water near you. We estimate how cloudy it looks — this is not a lab test.
      </p>

      <form onSubmit={handleSubmit}>
        <button type="button" onClick={useMyLocation} style={{ marginBottom: "1rem" }}>
          📍 Use my location
        </button>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <label style={{ flex: 1, fontSize: "0.9rem" }}>
            Latitude
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              style={{ display: "block", width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
            />
          </label>
          <label style={{ flex: 1, fontSize: "0.9rem" }}>
            Longitude
            <input
              type="number"
              step="any"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              style={{ display: "block", width: "100%", padding: "0.5rem", boxSizing: "border-box" }}
            />
          </label>
        </div>

        <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Description (optional)
          <input
            type="text"
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ display: "block", width: "100%", padding: "0.5rem", boxSizing: "border-box", marginTop: "0.25rem" }}
          />
        </label>

        <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Photo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files[0])}
            style={{ display: "block", marginTop: "0.25rem" }}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>

      {error && <p style={{ color: "#c0392b", marginTop: "1rem" }}>⚠ {error}</p>}

      {result && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: 8,
            background: "#eafaf1",
            border: "1px solid #27ae60",
          }}
        >
          <strong>Report submitted ✅</strong>
          <p style={{ margin: "0.5rem 0 0" }}>
            Estimated: <strong>{result.turbidity_label.replace("_", " ")}</strong>
            <br />
            Status: {result.status} (not independently verified)
          </p>
        </div>
      )}
    </div>
  );
}