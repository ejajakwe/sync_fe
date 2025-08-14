import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

/* ---------- UI kecil ---------- */
function Badge({ value }) {
  let cls = "bg-yellow-600";
  if (["PAID", "Sukses"].includes(value)) cls = "bg-green-600";
  if (["FAILED", "Gagal", "EXPIRED"].includes(value)) cls = "bg-red-600";
  return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{value}</span>;
}
const fmtIDR = (n) => (n == null ? "-" : Number(n).toLocaleString("id-ID"));

/* ---------- Keamanan & Validasi Invoice ---------- */
// buang karakter berbahaya: kutip, backtick, tag html, titik-koma, dan double-dash
function sanitizeInvoice(v) {
  const cleaned = String(v || "")
    .replace(/['"`;<>]/g, "")
    .replace(/--/g, "")
    .trim();
  return cleaned.toUpperCase();
}
// Contoh valid: "INV-ABCDE12345" atau alfanumerik (boleh dash) 6–32 char
const INVOICE_REGEX = /^(INV-[A-Z0-9-]{5,28}|[A-Z0-9-]{6,32})$/;
function isInvoiceValid(v) {
  return INVOICE_REGEX.test(sanitizeInvoice(v));
}

/* ---------- Ambil cache lokal (opsional) ---------- */
function readLocalExtra(inv) {
  try {
    const byInvoice = localStorage.getItem(`order:${inv}`);
    if (byInvoice) return JSON.parse(byInvoice);
    const last = localStorage.getItem("lastOrderExtra");
    if (last) return JSON.parse(last);
  } catch {}
  return {};
}

/* ---------- Komponen Halaman ---------- */
export default function Invoice() {
  const { invoice: invoiceParam } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(() => sanitizeInvoice(invoiceParam || ""));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(invoice));
  const [error, setError] = useState("");
  const [localExtra, setLocalExtra] = useState(() => readLocalExtra(invoice));

  // Anti-bruteforce ringan (klien)
  const [failCount, setFailCount] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);

  useEffect(() => {
    const s = sanitizeInvoice(invoiceParam || "");
    setInvoice(s);
    setLocalExtra(readLocalExtra(s));
  }, [invoiceParam]);

  useEffect(() => {
    let stop = false;
    let timer;

    async function fetchStatus() {
      try {
        if (!invoice) return;

        // blokir sementara jika terlalu banyak percobaan
        if (Date.now() < blockedUntil) {
          setError("Terlalu banyak percobaan. Coba lagi beberapa saat.");
          setLoading(false);
          return;
        }

        // validasi format
        if (!isInvoiceValid(invoice)) {
          setData(null);
          setLoading(false);
          setError("No Invoice Tidak Valid");
          return;
        }

        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/transactions/invoice/${invoice}`);

        // invoice tidak ditemukan -> hentikan polling & tampilkan pesan
        if (res.status === 404) {
          setData(null);
          setLoading(false);
          setError("No Invoice Tidak Ditemukan");
          // naikan failCount & blokir jika sering
          setFailCount((c) => {
            const next = c + 1;
            if (next >= 5) setBlockedUntil(Date.now() + 60_000); // blokir 60 detik
            return next;
          });
          return;
        }

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (stop) return;

        setData(json);
        setLoading(false);
        setError("");
        setFailCount(0); // reset gagal saat berhasil

        // polling hanya jika belum final
        const finalTopup = ["Sukses", "Gagal"].includes(json.topup_status);
        const finalPay = ["PAID", "EXPIRED", "REFUNDED", "FAILED"].includes(json.payment_status);
        if (!(finalTopup && finalPay)) {
          timer = setTimeout(fetchStatus, 5000);
        } else {
          localStorage.removeItem(`order:${invoice}`);
        }
      } catch {
        if (stop) return;
        // error jaringan/500 -> retry lebih lambat, jangan bocorkan detail
        setError("Gagal memuat status. Mencoba ulang…");
        setLoading(false);
        timer = setTimeout(fetchStatus, 7000);
      }
    }

    if (invoice) fetchStatus();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [invoice, blockedUntil]);

  if (!invoiceParam) {
    return (
      <SearchInvoice
        onSubmit={(inv) => {
          const s = sanitizeInvoice(inv);
          if (!isInvoiceValid(s)) return;
          navigate(`/cek-transaksi/${s}`);
        }}
      />
    );
  }

  // Gabungkan data API + fallback localStorage
  const extraApi = parseExtraFromApi(data);
  const extra = {
    nominal: extraApi.nominal || localExtra.nominalLabel || "",
    whatsapp: extraApi.whatsapp || localExtra.whatsapp || "",
  };

  return (
    <div className="bg-[#1f1f1f] text-white min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Cek Transaksi</h1>
          <MiniSearch
            placeholder="Cari invoice lain…"
            onSubmit={(inv) => {
              const s = sanitizeInvoice(inv);
              if (!isInvoiceValid(s)) return;
              navigate(`/cek-transaksi/${s}`);
            }}
          />
        </div>

        {loading && <div className="bg-[#2a2a2a] rounded-xl p-6">Memuat status transaksi…</div>}

        {!loading && error && (
          <div className="bg-[#2a2a2a] rounded-xl p-6 text-red-400">{error}</div>
        )}

        {!loading && !error && data && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* KIRI: Informasi */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Informasi</h2>

              <div className="text-sm space-y-1">
                <Row k="Invoice" v={<span className="font-mono">{data.invoice}</span>} />
                <Row k="Metode" v={(data.payment_type || "-").toUpperCase()} />
                <Row k="Subtotal" v={`Rp ${fmtIDR(data.gross_amount)}`} />
                <Row k="Nominal" v={extra.nominal || "-"} />
                <Row k="WhatsApp" v={extra.whatsapp || "-"} />
              </div>

              <div className="border-t border-[#3a3a3a] my-3" />
              <h3 className="text-sm font-semibold text-gray-300">Status Saat Ini</h3>
              <div className="flex items-center gap-3 text-sm">
                <span>Status Pembayaran</span>
                <Badge value={data.payment_status} />
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span>Status Transaksi</span>
                <Badge value={data.topup_status} />
              </div>

              {data.sn && (
                <div className="mt-3">
                  <div className="text-xs opacity-70">SN</div>
                  <div className="font-mono">{data.sn}</div>
                </div>
              )}
              {data.message && <div className="text-sm opacity-80 mt-1">{data.message}</div>}
            </div>

            {/* KANAN: Aksi */}
            <div className="bg-[#2a2a2a] rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold">Bayar Sekarang</h2>

              {data.pay_url && data.payment_status === "UNPAID" && (
                <a
                  href={data.pay_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center rounded-lg px-4 py-3 bg-orange-600 hover:bg-orange-700"
                >
                  Klik di sini untuk melakukan pembayaran
                </a>
              )}

              <div className="text-sm text-gray-300">
                {data.payment_status === "PAID" && data.topup_status === "Sukses" && "Transaksi selesai. Terima kasih! 🎉"}
                {data.payment_status === "PAID" && data.topup_status === "Pending" && "Pembayaran diterima, topup sedang diproses…"}
                {data.payment_status === "EXPIRED" && "Pembayaran kedaluwarsa. Silakan buat pesanan baru."}
                {data.payment_status === "FAILED" && "Pembayaran gagal. Silakan coba lagi."}
                {data.topup_status === "Gagal" && "Topup gagal dari penyedia. Hubungi admin untuk bantuan."}
                {!["PAID","EXPIRED","REFUNDED","FAILED"].includes(data.payment_status) &&
                 !["Sukses","Gagal"].includes(data.topup_status) &&
                 "Menunggu pembayaran…"}
              </div>

              <div className="text-xs text-gray-400 pt-3 border-t border-[#3a3a3a]">
                Butuh bantuan? <a href="https://wa.me/628884206137" className="underline">Hubungi admin</a>.
              </div>
              <div className="text-xs text-gray-500">
                <Link to="/">← Kembali ke beranda</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

/* ---------- Kecil-kecil ---------- */
function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
function parseExtraFromApi(d) {
  if (!d) return {};
  const nominal =
    d.nominal_label ??
    d.item_label ??
    d.product_label ??
    (d.items && d.items[0]?.name) ??
    d.sku_label ??
    d.sku ??
    "";
  const whatsapp =
    d.customer_phone ??
    d.whatsapp ??
    (d.customer && d.customer.phone) ??
    d.phone ??
    "";
  return { nominal, whatsapp };
}

/* ---------- Komponen: Search di halaman /cek-transaksi ---------- */
function SearchInvoice({ onSubmit }) {
  const [inv, setInv] = useState("");
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const onChange = (e) => {
    const s = sanitizeInvoice(e.target.value);
    setInv(s);
    if (!s) setErr("");
    else if (!isInvoiceValid(s)) setErr("No Invoice Tidak Valid");
    else setErr("");
  };

  const submit = (e) => {
    e.preventDefault();
    const s = sanitizeInvoice(inv);
    if (!s || !isInvoiceValid(s)) {
      setErr("No Invoice Tidak Valid");
      return;
    }
    setErr("");
    onSubmit(s);
  };

  return (
    <div className="bg-[#1f1f1f] text-white min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-6">Cek Transaksi</h1>
        <div className="bg-[#2a2a2a] rounded-xl p-6">
          <p className="text-sm text-gray-300 mb-3">
            Masukkan <strong>Nomor Invoice</strong> untuk melihat status pembayaran &amp; transaksi.
          </p>
          <form onSubmit={submit} className="flex gap-2">
            <input
              ref={inputRef}
              value={inv}
              onChange={onChange}
              placeholder="Contoh: INV-ABCDE12345"
              className="flex-1 rounded-lg bg-[#3a3a3a] px-4 py-3 outline-none"
              aria-invalid={Boolean(err)}
              aria-describedby="inv-error"
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-700"
              disabled={!inv || Boolean(err)}
            >
              Cari
            </button>
          </form>
          {err && (
            <p id="inv-error" className="text-xs text-red-400 mt-2">
              {err}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Tip: kamu juga bisa tempel (Ctrl+V) dari clipboard.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ---------- Komponen: Mini search di header halaman detail ---------- */
function MiniSearch({ onSubmit, placeholder = "Cari invoice…" }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const s = sanitizeInvoice(e.target.value);
    setVal(s);
    if (!s) setErr("");
    else if (!isInvoiceValid(s)) setErr("No Invoice Tidak Valid");
    else setErr("");
  };

  const submit = (e) => {
    e.preventDefault();
    const s = sanitizeInvoice(val);
    if (!s || !isInvoiceValid(s)) {
      setErr("No Invoice Tidak Valid");
      return;
    }
    setErr("");
    onSubmit(s);
  };

  return (
    <form onSubmit={submit} className="hidden md:flex gap-2">
      <input
        value={val}
        onChange={onChange}
        placeholder={placeholder}
        className="rounded-lg bg-[#2a2a2a] px-3 py-2 outline-none text-sm"
        aria-invalid={Boolean(err)}
        aria-describedby="mini-inv-error"
      />
      <button
        type="submit"
        className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-sm"
        disabled={!val || Boolean(err)}
      >
        Cari
      </button>
      {err && (
        <span id="mini-inv-error" className="self-center text-xs text-red-400">
          {err}
        </span>
      )}
    </form>
  );
}
