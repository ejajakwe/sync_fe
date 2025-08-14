import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

/** TODO: pindahkan ke env (VITE_API_BASE) */
const API_BASE = "http://127.0.0.1:8000";

/** Map slug/nama game → key validasi backend */
function getValidationKey(slug = "", gameName = "") {
  const s = (slug || "").toLowerCase();
  const n = (gameName || "").toLowerCase();

  if (s.includes("mobile-legend") || n.includes("mobile legends")) return "mobile-legends";
  if (s.includes("free-fire") || s.includes("freefire") || n.includes("free fire")) return "free-fire";
  if (s.includes("genshin") || n.includes("genshin")) return "genshin-impact";
  if (s.includes("pubg") || n.includes("pubg")) return "pubg-mobile";
  if (s.includes("codm") || s.includes("call-of-duty") || n.includes("call of duty")) return "call-of-duty-mobile";
  if (s.includes("honor-of-kings") || s.includes("hok") || n.includes("honor of kings")) return "honor-of-kings";
  return null; // tidak perlu validasi
}

/** Deteksi nama field ID & Server dari konfigurasi game.fields (robust) */
function getAccountFieldNames(fields = []) {
  let idField = null;
  let serverField = null;

  const isIdLike = (s) =>
    ["id", "user_id", "userid", "uid", "playerid", "characterid"].some((k) =>
      s.includes(k)
    );

  const isServerLike = (s) =>
    ["server", "serverid", "zone", "zone_id", "region", "shard"].some((k) =>
      s.includes(k)
    );

  for (const f of fields) {
    const n = (f?.name || "").toLowerCase();
    const l = (f?.label || "").toLowerCase();

    if (!idField && (isIdLike(n) || isIdLike(l))) idField = f.name;
    if (!serverField && (isServerLike(n) || isServerLike(l))) serverField = f.name;
  }
  return { idField, serverField };
}

/** === Helpers Validasi Frontend === */
const onlyDigits = (v) => v.replace(/[^\d]/g, "");
const isDigits = (v) => /^\d+$/.test(v);
const isGmail = (v) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(v);
const isPhone = (v) => /^\d{8,15}$/.test(v); // 8–15 digit

export default function GameDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [form, setForm] = useState({});
  const [selectedNominal, setSelectedNominal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [whatsapp, setWhatsapp] = useState("");
  const [errors, setErrors] = useState({});

  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Validasi akun (cek ID ke backend)
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // {ok, username?, message?}

  useEffect(() => {
    fetch(`${API_BASE}/api/games/slug/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        const parsedFields =
          typeof data.fields === "string" ? JSON.parse(data.fields) : data.fields;
        const parsedPMs =
          typeof data.payment_methods === "string"
            ? JSON.parse(data.payment_methods)
            : Array.isArray(data.payment_methods)
              ? data.payment_methods
              : [];

        setGame({
          ...data,
          fields: parsedFields ?? [],
          nominal: (data.nominals || []).filter((n) => n.active !== false),
          payment_methods: parsedPMs,
        });

        setPaymentMethods(parsedPMs);
      });
  }, [slug]);

  // Game apa yang pakai validasi?
  const validationKey = useMemo(
    () => getValidationKey(slug, game?.name),
    [slug, game?.name]
  );
  const requiresCheck = Boolean(validationKey);

  /** Nama field ID / Server dari konfigurasi game */
  const { idField, serverField } = getAccountFieldNames(game?.fields || []);
  const needsZone = ["mobile-legends", "genshin-impact"].includes(validationKey);


  /** Handler perubahan field akun (sanitasi angka untuk id/server) */
  const handleFormChange = (field, value) => {
    let v = value;

    // Hanya angka untuk ID & Server/Zone
    if (field === idField || field === serverField) {
      v = onlyDigits(v);
      setErrors((e) => ({
        ...e,
        [field]:
          !v ? "Wajib diisi"
            : !isDigits(v) ? "Hanya boleh angka"
              : ""
      }));
      // reset hasil cek saat id/server berubah
      setCheckResult(null);
    }

    setForm((prev) => ({ ...prev, [field]: v }));
  };

  const handleWhatsappChange = (v) => {
    const digits = onlyDigits(v);
    setWhatsapp(digits);
    setErrors((e) => ({
      ...e,
      wa: !digits ? "Nomor WA wajib diisi" : (!isPhone(digits) ? "Hanya angka 8–15 digit" : "")
    }));
  };

  // --- Perhitungan harga untuk UI (tanpa biaya/fee) ---
  const subtotal = selectedNominal ? selectedNominal.price * quantity : 0;
  const totalPrice = subtotal; // total = harga x jumlah

  // --- Harga dasar yang DIKIRIM ke backend ---
  const baseAmount = subtotal;

  const isFormComplete =
    (game?.fields || []).every((f) => (form[f.name] || "").trim()) &&
    selectedNominal &&
    selectedPayment &&
    whatsapp.trim();

  /** Gabungkan field akun untuk customer_no (mis. "uid+server") */
  const buildCustomerNoFromForm = () =>
    (game?.fields || [])
      .map((f) => (form[f.name] || "").trim())
      .filter(Boolean)
      .join("+");

  // --- Cek ID ke backend generik (/api/validate/{validationKey}) ---
  async function handleCheckId() {
    const idVal = idField ? (form[idField] || "").trim() : "";
    const zoneVal = serverField ? (form[serverField] || "").trim() : "";

    // Guard frontend
    if (!idVal || !isDigits(idVal)) {
      setCheckResult({ ok: false, message: "ID wajib angka." });
      return;
    }
    if (needsZone && (!zoneVal || !isDigits(zoneVal))) {
      setCheckResult({ ok: false, message: "Server/Zone wajib angka." });
      return;
    }
    if (errors[idField] || (needsZone && errors[serverField])) {
      setCheckResult({ ok: false, message: "Perbaiki isian akun terlebih dahulu." });
      return;
    }

    setChecking(true);
    setCheckResult(null);
    try {
      const body = { game_id: idVal };
      if (zoneVal) body.zone_id = zoneVal;

      const res = await fetch(`${API_BASE}/api/validate/${validationKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setCheckResult(data);
    } catch {
      setCheckResult({ ok: false, message: "Tidak bisa menghubungi server." });
    } finally {
      setChecking(false);
    }
  }

  const handleSubmitOrder = async () => {
    if (!isFormComplete || !selectedNominal) return;

    // Re-check frontend safety (defensive)
    if (errors.wa || errors[idField] || (needsZone && errors[serverField])) {
      return alert("Periksa kembali isian: ada yang belum valid.");
    }
    if (!isPhone(whatsapp)) return alert("Nomor WhatsApp hanya angka 8–15 digit.");
    if (!isDigits(form[idField] || "")) return alert("ID hanya boleh angka.");
    if (needsZone && !isDigits(form[serverField] || "")) return alert("Server/Zone hanya boleh angka.");

    if (requiresCheck) {
      const hasId = Boolean((form[idField] || "").trim());
      const hasServer = Boolean((form[serverField] || "").trim());

      if (!hasId) return alert("Mohon isi ID terlebih dahulu.");
      if (needsZone && !hasServer) return alert("Mohon isi Server/Zone terlebih dahulu.");
      if (!checkResult?.ok) return alert("Mohon verifikasi ID terlebih dahulu (Cek ID).");
    }

    const sku = selectedNominal?.sku_code || selectedNominal?.sku;
    const customer_no = buildCustomerNoFromForm();
    if (!sku || !customer_no) return alert("Data akun belum lengkap!");

    setLoading(true);
    try {
      // 1) draft transaksi
      const draftRes = await fetch(`${API_BASE}/api/transactions/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ sku, customer_no }),
      });
      if (!draftRes.ok) throw new Error("Gagal membuat draft transaksi");
      const { ref_id } = await draftRes.json();

      // 2) create payment (Midtrans) — kirim baseAmount (tanpa fee)
      const payments = selectedPayment?.midtrans_codes || undefined;
      const payRes = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          ref_id,
          amount: Math.round(baseAmount),
          customer: {
            first_name: (form.nickname || form.name || "User").toString(),
            phone: whatsapp,
          },
          items: [
            {
              id: sku,
              price: selectedNominal.price,
              quantity,
              name: `${game?.name || game?.title} - ${selectedNominal.label}`,
            },
          ],
          payments,
          // info tambahan (opsional, untuk analytics di FE)
          // extra: { client_fee: Math.round(fee), client_total: Math.round(totalPrice) },
        }),
      });
      if (!payRes.ok) throw new Error("Gagal membuat pembayaran");
      const { invoice, pay_url } = await payRes.json();

      // 3) open pay url + redirect ke cek transaksi
      if (pay_url) window.open(pay_url, "_blank", "noopener,noreferrer");
      setShowConfirm(false);
      localStorage.setItem(`order:${invoice}`, JSON.stringify({
        nominalLabel: selectedNominal?.label ?? "",
        whatsapp,
        customer_no: (game?.fields || []).map(f => (form[f.name] || "").trim()).filter(Boolean).join("+"),
      }));
      localStorage.setItem("lastOrderExtra", JSON.stringify({
        nominalLabel: selectedNominal?.label ?? "",
        whatsapp,
      }));
      navigate(`/cek-transaksi/${invoice}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat memproses pesanan.");
    } finally {
      setLoading(false);
    }
  };

  if (!game) return <div className="text-white p-10">Game tidak ditemukan.</div>;

  // bantu logika disable button
  const hasId = Boolean((form[idField] || "").trim());
  const hasServer = Boolean((form[serverField] || "").trim());

  return (
    <div className="bg-[#1f1f1f] text-white min-h-screen">
      <Navbar />

      {/* HEADER */}
      <div
        className="relative w-full h-[400px] bg-cover bg-top"
        style={{ backgroundImage: `url(${game.header_image_url || game.image_url})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center px-16 gap-6">
          <img src={game.image_url} alt={game.name} className="w-28 h-28 rounded-md shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <p className="text-gray-300">{game.publisher}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-200">
              <span>⚡ Proses Cepat</span>
              <span>💬 Bantuan 24/7</span>
              <span>🔒 Aman</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORM & RINGKASAN */}
      <div className="max-w-7xl mx-auto lg:px-8 py-10 grid md:grid-cols-3 gap-8">
        {/* FORM INPUT */}
        <div className="md:col-span-2 space-y-10">
          {/* 1. DATA AKUN */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">
              1. Masukkan Data Akun
            </h2>
            <div className="bg-[#2c2c2c] p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(game.fields || []).map((f) => {
                  const isNum = f.name === idField || f.name === serverField;
                  return (
                    <div key={f.name} className="flex flex-col">
                      <Input
                        placeholder={f.placeholder}
                        value={form[f.name] || ""}
                        onChange={(e) => handleFormChange(f.name, e.target.value)}
                        className="bg-[#444] text-white placeholder-gray-400 border-none"
                        inputMode={isNum ? "numeric" : undefined}
                        pattern={isNum ? "\\d*" : undefined}
                        autoComplete="off"
                      />
                      {errors[f.name] && (
                        <span className="text-red-400 text-xs mt-1">{errors[f.name]}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tombol & hasil cek ID (untuk game yang didukung) */}
              {requiresCheck && (
                <div className="mt-3">
                  <Button
                    className="bg-orange-600"
                    onClick={handleCheckId}
                    disabled={
                      checking ||
                      !hasId ||
                      (needsZone && !hasServer) ||
                      !!errors[idField] ||
                      (needsZone && !!errors[serverField])
                    }
                  >
                    {checking ? "Memeriksa..." : "Cek Akun"}
                  </Button>

                  {checkResult && (
                    checkResult.ok ? (
                      <div className="mt-3 bg-green-700/40 border border-green-600 text-green-200 px-4 py-2 rounded">
                        Akun anda adalah {" "}
                        <span className="font-semibold">{checkResult.username}</span>
                      </div>
                    ) : (
                      <div className="mt-3 bg-red-700/40 border border-red-600 text-red-200 px-4 py-2 rounded">
                        {checkResult.message || "ID/Server tidak valid"}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. PILIH NOMINAL */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">
              2. Pilih Nominal
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {(game.nominal || [])
                .slice()
                .sort((a, b) => a.price - b.price)
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNominal(item)}
                    className={`bg-[#383838] p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedNominal?.id === item.id
                      ? "border-orange-500"
                      : "border-transparent hover:border-gray-500"
                      }`}
                  >
                    <p className="font-semibold text-white">{item.label}</p>
                    <p className="text-sm text-gray-400">Rp {item.price.toLocaleString()}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* 3. JUMLAH */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">
              3. Masukkan Jumlah Pembelian
            </h2>
            <div className="bg-[#2c2c2c] p-4 rounded-lg flex gap-4 items-center">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-[#444] text-white w-full border-none"
              />
              <div className="flex gap-2">
                <Button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="bg-red-500 text-white rounded-full w-10 h-10">
                  −
                </Button>
                <Button onClick={() => setQuantity((q) => q + 1)} className="bg-orange-500 text-white rounded-full w-10 h-10">
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* 4. PEMBAYARAN */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">
              4. Pilih Pembayaran
            </h2>
            <div className="bg-[#2c2c2c] p-6 rounded-lg space-y-4">
              {["ewallet", "virtual_account"].map((group) => (
                <div key={group}>
                  <p className="text-white font-semibold mb-2 capitalize">{group.replace("_", " ")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {paymentMethods
                      .filter((pm) => pm.type === group)
                      .map((pm, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedPayment(pm)}
                          className={`cursor-pointer border-2 p-4 rounded-lg bg-[#383838] ${selectedPayment?.name === pm.name ? "border-orange-500" : "border-transparent hover:border-gray-500"
                            }`}
                        >
                          <p className="text-white font-semibold text-sm">{pm.name}</p>
                          <img src={pm.logo} alt={pm.name} className="h-8 mb-2" />
                          {/* <p className="text-gray-400 text-xs italic">Fee {pm.fee}%</p> */}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. KONTAK */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">
              5. Detail Kontak
            </h2>
            <div className="bg-[#2c2c2c] p-6 rounded-lg space-y-4">

              <div className="flex flex-col">
                <Input
                  placeholder="Nomor WhatsApp"
                  value={whatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  className="bg-[#444] text-white border-none"
                  inputMode="numeric"
                  pattern="\\d*"
                  autoComplete="off"
                />
                {errors.wa && <span className="text-red-400 text-xs mt-1">{errors.wa}</span>}
              </div>

              <p className="text-sm text-gray-400 italic">
                *Nomor ini akan dihubungi jika terjadi masalah
              </p>
            </div>
          </div>
        </div>

        {/* RINGKASAN */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <div className="bg-[#2a2a2a] p-4 rounded-md">
              <p className="font-semibold text-sm mb-1 text-white">Butuh Bantuan?</p>
              <p className="text-sm text-gray-300">Kamu bisa hubungi admin di WhatsApp atau Instagram.</p>
            </div>

            <div className="bg-[#2a2a2a] p-4 rounded-md">
              <div className="flex gap-3 mb-4">
                <img src={game.image_url} className="w-12 h-12 rounded" />
                <div>
                  <div className="text-sm font-semibold">{game.title}</div>
                  <div className="text-xs text-gray-400">{selectedNominal?.label || "Belum dipilih"}</div>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between"><span>Harga</span><span>{selectedNominal ? `Rp ${subtotal.toLocaleString()}` : "-"}</span></div>
                <div className="flex justify-between"><span>Jumlah</span><span>{selectedNominal ? quantity : "-"}</span></div>
                <hr className="my-2 border-gray-600" />
                <div className="flex justify-between font-bold text-orange-400">
                  <span>Total</span>
                  <span>{selectedNominal ? `Rp ${totalPrice.toLocaleString()}` : "-"}</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-3 disabled:opacity-60"
              disabled={
                !isFormComplete ||
                loading ||
                !!errors.wa || !!errors[idField] || (needsZone && !!errors[serverField]) ||
                (requiresCheck && (
                  (needsZone && (!hasId || !hasServer)) ||
                  (!needsZone && !hasId) ||
                  !checkResult?.ok
                ))
              }
              onClick={() => setShowConfirm(true)}
            >
              {loading ? "Memproses..." : "🛒 Pesan Sekarang"}
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI */}
      {showConfirm && (
        <Dialog open onOpenChange={setShowConfirm}>
          <DialogContent className="bg-black text-gray-300 max-w-md rounded-xl border-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">✅ Buat Pesanan</DialogTitle>
              <DialogDescription className="text-center mt-1">
                Pastikan data akun dan produk yang kamu pilih sesuai.
              </DialogDescription>
            </DialogHeader>

            <div className="text-sm space-y-1 mt-4">
              {(game.fields || []).map((field) => (
                <div className="flex justify-between" key={field.name}>
                  <span>{field.label}</span>
                  <span>{form[field.name]}</span>
                </div>
              ))}
              <div className="flex justify-between"><span>Item</span><span>{selectedNominal?.label}</span></div>
              <div className="flex justify-between"><span>Jumlah</span><span>{quantity}</span></div>
              <div className="flex justify-between"><span>WhatsApp</span><span>{whatsapp}</span></div>
              <div className="flex justify-between"><span>Pembayaran</span><span>{selectedPayment?.name}</span></div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span><span>Rp {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button className="bg-red-600" onClick={() => setShowConfirm(false)}>Batalkan</Button>
              <Button className="bg-orange-600 text-white" onClick={handleSubmitOrder} disabled={loading}>
                {loading ? "Memproses..." : "Konfirmasi Pesan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
}