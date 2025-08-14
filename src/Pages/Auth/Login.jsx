import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_BASE;

// ---- Helper: sanitasi & validasi ----
const sanitizeEmail = (v) => {
  // hanya karakter email umum, buang karakter berbahaya
  return String(v || "")
    .replace(/['"`;<>]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase()
    .slice(0, 254);
};

const sanitizePassword = (v) => {
  // buang karakter injeksi umum (opsional), batasi panjang, hilangkan newline
  return String(v || "")
    .replace(/[\r\n]/g, "")
    .replace(/<|>|`|"/g, "")
    .slice(0, 128);
};

const isEmailValid = (email) => {
  // email standar; kalau ingin wajib gmail gunakan /@gmail\.com$/i
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isPasswordValid = (pwd) => {
  // minimal 8 karakter, tanpa spasi di depan/belakang
  return typeof pwd === "string" && pwd.length >= 8 && !/^\s|\s$/.test(pwd);
};

// brute-force guard ringan di klien
const MAX_FAILS = 5;
const BLOCK_MS = 60_000;

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [errEmail, setErrEmail] = useState("");
  const [errPass, setErrPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const navigate = useNavigate();

  // muat status blokir dari sessionStorage
  useEffect(() => {
    const until = Number(sessionStorage.getItem("login_block_until") || 0);
    if (until > Date.now()) setBlockedUntil(until);
  }, []);

  const handleEmail = (v) => {
    const s = sanitizeEmail(v);
    setEmail(s);
    if (!s) setErrEmail("Email wajib diisi.");
    else if (!isEmailValid(s)) setErrEmail("Format email tidak valid.");
    else setErrEmail("");
  };

  const handlePass = (v) => {
    const s = sanitizePassword(v);
    setPass(s);
    if (!s) setErrPass("Password wajib diisi.");
    else if (!isPasswordValid(s)) setErrPass("Minimal 8 karakter dan tidak diawali/diakhiri spasi.");
    else setErrPass("");
  };

  const blocked = Date.now() < blockedUntil;
  const disabled = submitting || blocked || !email || !pass || errEmail || errPass;

  const handleLogin = async () => {
    if (disabled) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // (opsional) tambahkan header custom agar backend bisa log asal permintaan
          "X-Client": "syncpedia-frontend",
        },
        // kirim nilai yang sudah disanitasi
        body: JSON.stringify({
          email,
          password: pass,
        }),
      });

      if (res.status === 429) {
        // dibatasi server
        setErrPass("Terlalu banyak percobaan. Coba lagi nanti.");
        return;
      }

      if (!res.ok) {
        // hitung gagal dan blokir sementara di klien
        const fails = Number(sessionStorage.getItem("login_fails") || 0) + 1;
        sessionStorage.setItem("login_fails", String(fails));
        if (fails >= MAX_FAILS) {
          const until = Date.now() + BLOCK_MS;
          sessionStorage.setItem("login_block_until", String(until));
          setBlockedUntil(until);
          setErrPass("Terlalu banyak percobaan. Coba lagi dalam 1 menit.");
        } else {
          setErrPass("Email atau password salah.");
        }
        return;
      }

      // sukses
      sessionStorage.removeItem("login_fails");
      sessionStorage.removeItem("login_block_until");

      await res.json(); // jika backend mengembalikan token, ambil di sini
      loginAdmin();     // flag lokal sesuai implementasi sekarang
      navigate("/kelola");
      window.location.reload();
    } catch {
      setErrPass("Gangguan jaringan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
      <div className="bg-[#1f1f1f] bg-opacity-90 rounded-xl shadow-lg w-full max-w-md p-8 text-white">
        <h2 className="text-3xl font-bold mb-6 text-center">
          <span className="text-orange-500">Admin</span> Login
        </h2>

        <div className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => handleEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-[#333] focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-invalid={Boolean(errEmail)}
              aria-describedby="email-err"
              autoComplete="username"
              inputMode="email"
            />
            {errEmail && (
              <p id="email-err" className="text-xs text-red-400 mt-1">{errEmail}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={pass}
              onChange={(e) => handlePass(e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-[#333] focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-invalid={Boolean(errPass)}
              aria-describedby="pass-err"
              autoComplete="current-password"
            />
            {errPass && (
              <p id="pass-err" className="text-xs text-red-400 mt-1">{errPass}</p>
            )}
          </div>

          <button
            onClick={handleLogin}
            disabled={disabled}
            className={`w-full py-2 rounded-md font-semibold transition-colors ${disabled ? "bg-gray-600 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
              }`}
          >
            {blocked ? "Sementara Diblokir…" : submitting ? "Memproses…" : "Login"}
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-gray-400">
          Hak akses hanya untuk <span className="text-orange-400 font-medium">Admin</span>.
        </p>
      </div>
    </div>
  );
}
