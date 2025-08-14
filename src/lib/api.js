import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://127.0.0.1:8000/api',
//   withCredentials: true,
// });

const API_BASE = import.meta.env.VITE_API_BASE;


export default api;

export const getProducts = async () => {
  const res = await api.get('/products');
  return res.data.data;
};

export const addProduct = async (product) => {
  const res = await api.post('/products', product);
  return res.data.data;
};

//

export async function fetchGames() {
  const res = await fetch(`${API_BASE}/api/games`);
  if (!res.ok) throw new Error("Gagal mengambil data");
  return res.json();
}

export async function createGame(game) {
  const res = await fetch(`${API_BASE}/api/games`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
  if (!res.ok) throw new Error("Gagal menambahkan game");
  return res.json();
}

export async function updateGame(id, game) {
  const res = await fetch(`${API_BASE}/api/games/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(game),
  });
  if (!res.ok) throw new Error("Gagal mengedit game");
  return res.json();
}

export async function deleteGame(id) {
  const res = await fetch(`${API_BASE}/api/games/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Gagal menghapus game");
  return res.json();
}

export async function getJSON(path, params = {}) {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}