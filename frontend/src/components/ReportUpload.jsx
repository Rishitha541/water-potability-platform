import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function ReportUpload() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function getLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setError("");
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
      },
      () => setError("Could not get your location. Enter it manually.")
    );
  }

  function pickFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError("");
    setPhoto(file);
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
      setError(
        /fetch|network/i.test(err.message)
          ? "Can't reach the server. It may be waking up. Wait a minute and try again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhoto(null);
    setDescription("");
    setResult(null);
    setError("");
  }

  const label = result?.turbidity_label?.replace(/_/g, " ");

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Report a problem</h1>
          <p className="page-sub">
            Photograph water near you. We estimate how cloudy it looks. This is not a lab test.
          </p>
        </div>
      </div>

      <div className="split">
        <form className="card" onSubmit={handleSubmit}>
          <h3 className="group-title first">1. Add a photo</h3>
          <label
            className={"dropzone" + (drag ? " drag" : "")}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pickFile(e.dataTransfer.files[0]);
            }}
          >
            {preview ? (
              <img src={preview} alt="Selected water" />
            ) : (
              <>
                <span className="dz-icon">📷</span>
                <strong>Drop a photo here or click to choose</strong>
                <span className="muted small">JPG or PNG</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={(e) => pickFile(e.target.files[0])} />
          </label>
          {photo && <p className="muted small">{photo.name}</p>}

          <h3 className="group-title">2. Where is it?</h3>
          <button type="button" className="btn btn-secondary" onClick={getLocation}>
            📍 Use my location
          </button>
          <div className="fields two">
            <label className="field">
              Latitude
              <input type="number" step="any" className="plain" value={lat} onChange={(e) => setLat(e.target.value)} />
            </label>
            <label className="field">
              Longitude
              <input type="number" step="any" className="plain" value={lon} onChange={(e) => setLon(e.target.value)} />
            </label>
          </div>

          <h3 className="group-title">3. Add a note (optional)</h3>
          <label className="field">
            <input
              type="text"
              className="plain"
              maxLength={300}
              placeholder="For example: brown water from the tap since morning"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Submitting…" : "Submit report"}
          </button>
        </form>

        <div className="result-col">
          {error && <div className="alert">⚠ {error}</div>}

          {result ? (
            <div className="verdict" style={{ "--c": "#10b981" }}>
              <div className="verdict-head">
                <span className="verdict-icon">✅</span>
                <div>
                  <div className="verdict-label">Report submitted</div>
                  <div className="muted small">Thank you for helping your community</div>
                </div>
              </div>
              <p className="verdict-msg">
                Estimated cloudiness: <strong>{label}</strong>
                <br />
                Status: {result.status} (not independently verified)
              </p>
              <button type="button" className="btn btn-secondary" onClick={reset}>
                Report another
              </button>
            </div>
          ) : (
            <div className="card">
              <h3 className="card-title">What happens next</h3>
              <ol className="tips">
                <li>The photo is analysed for cloudiness.</li>
                <li>Your report appears on the live map.</li>
                <li>Several unsafe reports close together form a hotspot zone.</li>
              </ol>
              <p className="muted small">
                Tip: take the photo in daylight, with the water in a clear glass if possible.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}