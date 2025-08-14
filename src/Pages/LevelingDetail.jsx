import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../Components/ui/dialog";

export default function LevelingDetail() {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const { id } = useParams();
  const { slug } = useParams();
  const [leveling, setLeveling] = useState(null);
  const [form, setForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [selectedNominal, setSelectedNominal] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [whatsapp, setWhatsapp] = useState("");
  const [waError, setWaError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/levelings/slug/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        const parsedFields = typeof data.fields === "string" ? JSON.parse(data.fields) : data.fields;
        const parsedPMs =
          typeof data.payment_methods === "string"
            ? JSON.parse(data.payment_methods)
            : Array.isArray(data.payment_methods)
              ? data.payment_methods
              : [];

        setLeveling({
          ...data,
          fields: parsedFields ?? [],
          nominal: data.nominals || [],
          payment_methods: parsedPMs,
        });

        setPaymentMethods(parsedPMs);
      });
  }, [id]);

  const totalPrice = selectedNominal ? selectedNominal.price * quantity : 0;

  // --- Helpers: sanitasi & validasi ---
  const sanitizeInput = (value) => {
    // buang karakter umum injeksi: kutip, titik-koma, backtick, tag html, dan double-dash
    return value.replace(/(--|['";`<>])/g, "").trim();
  };

  const isGmail = (val) => /^[^\s@]+@gmail\.com$/i.test(String(val || "").trim());
  const validateField = (name, value) => {
    const key = name.toLowerCase();
    const v = String(value || "");

    // Email
    if (key.includes("email")) {
      if (!v) return "Email wajib diisi.";
      if (!isGmail(v)) return "Email harus menggunakan @gmail.com";
      return "";
    }

    // Field lain wajib diisi
    if (!v.trim()) return "Field ini wajib diisi.";
    return "";
  };

  const handleFormChange = (field, rawValue) => {
    // Untuk email: hilangkan spasi
    const lower = field.toLowerCase();
    let val = lower.includes("email") ? rawValue.replace(/\s+/g, "") : rawValue;
    val = sanitizeInput(val);

    setForm((prev) => ({ ...prev, [field]: val }));

    // set error
    const msg = validateField(field, val);
    setFormErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleWhatsappChange = (raw) => {
    // hanya angka
    const onlyNumbers = raw.replace(/\D/g, "");
    setWhatsapp(onlyNumbers);

    if (!onlyNumbers) {
      setWaError("Nomor WhatsApp wajib diisi.");
    } else if (!/^[0-9]{10,14}$/.test(onlyNumbers)) {
      setWaError("Nomor WhatsApp harus 10–14 digit angka.");
    } else {
      setWaError("");
    }
  };

  // semua field dari leveling.fields harus terisi & valid
  const allDynamicFieldsFilled =
    Array.isArray(leveling?.fields) &&
    leveling.fields.every((f) => String(form[f.name] || "").trim() !== "");

  const allDynamicFieldsValid =
    Array.isArray(leveling?.fields) &&
    leveling.fields.every((f) => !formErrors[f.name]);

  // email valid (jika ada field email)
  const emailFieldName =
    Array.isArray(leveling?.fields) &&
    leveling.fields.find((f) => f.name?.toLowerCase().includes("email"))?.name;

  const emailValid = emailFieldName ? isGmail(form[emailFieldName] || "") : true;

  // whatsapp valid
  const whatsappValid = /^[0-9]{10,14}$/.test(whatsapp);

  const isFormComplete =
    allDynamicFieldsFilled &&
    allDynamicFieldsValid &&
    emailValid &&
    whatsappValid &&
    selectedNominal &&
    selectedPayment;

  // Helper untuk ambil nilai field by partial name (untuk pesan WA)
  const getValByPartial = (partial) => {
    if (!Array.isArray(leveling?.fields)) return "";
    const f = leveling.fields.find((x) =>
      String(x.name || "").toLowerCase().includes(partial.toLowerCase())
    );
    return f ? form[f.name] || "" : "";
  };

  if (!leveling) return <div className="text-white p-10">Leveling tidak ditemukan.</div>;

  return (
    <div className="bg-[#1f1f1f] text-white min-h-screen">
      <Navbar />

      {/* HEADER */}
      <div
        className="relative w-full h-[400px] bg-cover bg-top"
        style={{ backgroundImage: `url(${leveling.header_image_url || leveling.image_url})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center px-16 gap-6">
          <img src={leveling.image_url} alt={leveling.name} className="w-28 h-28 rounded-md shadow-lg" />
          <div>
            <h1 className="text-2xl font-bold">{leveling.name}</h1>
            <p className="text-gray-300">{leveling.publisher}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-200">
              <span>⚡ Proses Cepat</span>
              <span>💬 Bantuan 24/7</span>
              <span>🔒 Aman</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORM dan RINGKASAN */}
      <div className="max-w-7xl mx-auto lg:px-8 py-10 grid md:grid-cols-3 gap-8">
        {/* FORM INPUT */}
        <div className="md:col-span-2 space-y-10">
          {/* 1. DATA AKUN */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">1. Masukkan Data Akun</h2>
            <div className="bg-[#2c2c2c] p-6 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {leveling.fields.map((f) => (
                  <div key={f.name} className="flex flex-col">
                    <Input
                      placeholder={f.placeholder}
                      value={form[f.name] || ""}
                      onChange={(e) => handleFormChange(f.name, e.target.value)}
                      className="bg-[#444] text-white placeholder-gray-400 border-none"
                    />
                    {formErrors[f.name] && (
                      <p className="text-xs text-red-400 mt-1">{formErrors[f.name]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. PILIH NOMINAL */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">2. Pilih Nominal</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {leveling.nominal.map((item) => (
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
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">3. Masukkan Jumlah Pembelian</h2>
            <div className="bg-[#2c2c2c] p-4 rounded-lg flex gap-4 items-center">
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-[#444] text-white w-full border-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="bg-red-500 text-white rounded-full w-10 h-10"
                >
                  −
                </Button>
                <Button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="bg-orange-500 text-white rounded-full w-10 h-10"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* 4. PILIH PEMBAYARAN */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">4. Pilih Pembayaran</h2>
            <div className="bg-[#2c2c2c] p-6 rounded-lg space-y-4">
              {["ewallet", "virtual_account"].map((group) => (
                <div key={group}>
                  <p className="text-white font-semibold mb-2 capitalize">
                    {group.replace("_", " ")}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {paymentMethods
                      .filter((pm) => pm.type === group)
                      .map((pm, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedPayment(pm)}
                          className={`cursor-pointer border-2 p-4 rounded-lg bg-[#383838] ${selectedPayment?.name === pm.name
                              ? "border-orange-500"
                              : "border-transparent hover:border-gray-500"
                            }`}
                        >
                          <img src={pm.logo} alt={pm.name} className="h-8 mb-2" />
                          <p className="text-white font-semibold text-sm">{pm.name}</p>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. KONTAK */}
          <div>
            <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3 mb-4">5. Detail Kontak</h2>
            <div className="bg-[#2c2c2c] p-6 rounded-lg space-y-4">
              <div className="flex flex-col">
                <Input
                  placeholder="Nomor WhatsApp"
                  value={whatsapp}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  className="bg-[#444] text-white border-none"
                />
                {waError && <p className="text-xs text-red-400 mt-1">{waError}</p>}
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
              <p className="text-sm text-gray-300">
                Kamu bisa hubungi admin di WhatsApp atau Instagram.
              </p>
            </div>

            <div className="bg-[#2a2a2a] p-4 rounded-md">
              <div className="flex gap-3 mb-4">
                <img src={leveling.image_url} className="w-12 h-12 rounded" />
                <div>
                  <div className="text-sm font-semibold">{leveling.title}</div>
                  <div className="text-xs text-gray-400">
                    {selectedNominal?.label || "Belum dipilih"}
                  </div>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Harga</span>
                  <span>
                    {selectedNominal ? `Rp ${selectedNominal.price.toLocaleString()}` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah</span>
                  <span>{selectedNominal ? quantity : "-"}</span>
                </div>
                <hr className="my-2 border-gray-600" />
                <div className="flex justify-between font-bold text-orange-400">
                  <span>Total</span>
                  <span>
                    {selectedNominal ? `Rp ${totalPrice.toLocaleString()}` : "-"}
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-3"
              disabled={!isFormComplete}
              onClick={() => setShowConfirm(true)}
            >
              🛒 Pesan Sekarang
            </Button>
          </div>
        </div>
      </div>

      {/* KONFIRMASI MODAL */}
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
              {leveling.fields.map((field) => (
                <div className="flex justify-between" key={field.name}>
                  <span>{field.label}</span>
                  <span>{form[field.name]}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span>Item</span>
                <span>{selectedNominal.label}</span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah</span>
                <span>{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>WhatsApp</span>
                <span>{whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran</span>
                <span>{selectedPayment?.name}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>Rp {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button className="bg-red-600" onClick={() => setShowConfirm(false)}>
                Batalkan
              </Button>
              <Button
                className="bg-orange-600 text-white"
                onClick={() => {
                  const email = getValByPartial("email");
                  const password = getValByPartial("password");
                  const login = getValByPartial("login");
                  const note = getValByPartial("catatan") || getValByPartial("note");

                  const message = `‌‌‌‎Format Joki @syncpedia
_____

Email : ${email}
Password : ${password}
Login : ${login}
Catatan : ${note}

Payment : ${selectedPayment?.name || ""}
Quantity : ${quantity}
Kontak : ${whatsapp}

📍V2L ( verifikasi dua langkah / verifikasi perangkat baru) di matikan terlebih dahulu agar mempermudah penjoki proses untuk login

selama proses akun ditabrak/diloginkan sebanyak 2x proses joki di berhentikan & tidak ada refund`;

                  const waUrl = `https://wa.me/628884206137?text=${encodeURIComponent(message)}`;
                  window.open(waUrl, "_blank");
                }}
              >
                Konfirmasi Pesan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Footer />
    </div>
  );
}
