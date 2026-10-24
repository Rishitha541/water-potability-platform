const API_URL = import.meta.env.VITE_API_URL;

export async function predictWater(readings) {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(readings),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.[0]?.msg || err.detail || `Request failed (${res.status})`);
  }

  return res.json();
}