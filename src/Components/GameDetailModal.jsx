import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";

export default function GameDetailModal({ game, onClose, onSaveSuccess }) {
  const API_BASE = import.meta.env.VITE_API_BASE;
  const [headerImageFile, setHeaderImageFile] = useState(null);
  const [fields, setFields] = useState(
    typeof game?.fields === "string" ? JSON.parse(game.fields) : game?.fields || []
  );
  const [nominals, setNominals] = useState(game?.nominals || []);
  const [paymentMethods, setPaymentMethods] = useState(() => {
    if (Array.isArray(game?.payment_methods)) return game.payment_methods;
    if (typeof game?.payment_methods === "string") {
      try {
        return JSON.parse(game.payment_methods);
      } catch {
        return [];
      }
    }
    return [];
  });

  const addField = () => setFields([...fields, { name: "", label: "", placeholder: "" }]);
  const removeField = (i) => setFields(fields.filter((_, idx) => idx !== i));
  const updateField = (i, key, val) => {
    const clone = [...fields];
    clone[i][key] = val;
    setFields(clone);
  };

  const addNominal = () =>
    setNominals([
      ...nominals,
      { label: "", price: "", sku_code: "" },
    ]);
  const removeNominal = (i) => setNominals(nominals.filter((_, idx) => idx !== i));
  const updateNominal = (i, key, val) => {
    const clone = [...nominals];
    clone[i][key] = val;
    setNominals(clone);
  };

  const addPaymentMethod = () => {
    setPaymentMethods([
      ...paymentMethods,
      { name: "", type: "ewallet", fee: 0, logo: null },
    ]);
  };
  const removePaymentMethod = (i) => {
    setPaymentMethods(paymentMethods.filter((_, idx) => idx !== i));
  };
  const updatePaymentMethod = (i, key, val) => {
    const clone = [...paymentMethods];
    clone[i][key] = val;
    setPaymentMethods(clone);
  };

  const handleSave = async () => {
    try {
      const fd = new FormData();
      fd.append("fields", JSON.stringify(fields));
      fd.append("nominals", JSON.stringify(nominals));
      fd.append(
        "payment_methods",
        JSON.stringify(paymentMethods.map(({ logo, ...rest }) => rest))
      );

      paymentMethods.forEach((pm, i) => {
        if (pm.logo instanceof File) {
          fd.append(`payment_method_logos[${i}]`, pm.logo);
        }
      });

      if (headerImageFile) {
        fd.append("header_image", headerImageFile);
      }

      const res = await fetch(`${API_BASE}/api/games/${game.id}`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error("Gagal simpan detail");

      alert("✅ Berhasil simpan detail game");
      onSaveSuccess?.();
    } catch (err) {
      console.error("❌ Gagal simpan:", err);
      alert("Gagal menyimpan ke database");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] text-white border-none max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            🛠️ Kelola Detail Game
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Image */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Banner Game</h3>
            <Input
              type="file"
              accept="image/*"
              className="bg-[#333] border-none text-white"
              onChange={(e) => setHeaderImageFile(e.target.files[0])}
            />
          </div>

          {/* Fields */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Form Input Akun</h3>
            {fields.map((f, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={f.name}
                  placeholder="name"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) => updateField(i, "name", e.target.value)}
                />
                <Input
                  value={f.label}
                  placeholder="label"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) => updateField(i, "label", e.target.value)}
                />
                <Input
                  value={f.placeholder}
                  placeholder="placeholder"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) => updateField(i, "placeholder", e.target.value)}
                />
                <Button
                  onClick={() => removeField(i)}
                  className="bg-red-600"
                >
                  Hapus
                </Button>
              </div>
            ))}
            <Button onClick={addField} className="bg-orange-600">
              + Tambah Field
            </Button>
          </div>

          {/* Nominals */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Pilihan Nominal</h3>
            {nominals.map((n, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 mb-2 items-center">
                <Input
                  value={n.label}
                  placeholder="Label (e.g. 240 Diamonds)"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) => updateNominal(i, "label", e.target.value)}
                />
                <Input
                  value={n.price}
                  type="number"
                  placeholder="Harga (e.g. 64000)"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) => updateNominal(i, "price", e.target.value)}
                />
                <Input
                  value={n.sku_code || ""}
                  placeholder="SKU Code (e.g. ml5)"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) =>
                    updateNominal(i, "sku_code", e.target.value)
                  }
                />
                {/* <input
                  type="checkbox"
                  checked={n.active || false}
                  onChange={(e) =>
                    updateNominal(i, "active", e.target.checked)
                  }
                  title="Aktifkan?"
                /> */}
                <Button
                  onClick={() => removeNominal(i)}
                  className="bg-red-600"
                >
                  Hapus
                </Button>
              </div>
            ))}
            <Button onClick={addNominal} className="bg-orange-600">
              + Tambah Nominal
            </Button>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Metode Pembayaran</h3>
            {paymentMethods.map((pm, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={pm.name}
                  placeholder="Nama"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) =>
                    updatePaymentMethod(i, "name", e.target.value)
                  }
                />
                <select
                  value={pm.type}
                  onChange={(e) =>
                    updatePaymentMethod(i, "type", e.target.value)
                  }
                  className="bg-[#333] text-white px-2"
                >
                  <option value="ewallet">E-Wallet</option>
                  <option value="virtual_account">Virtual Account</option>
                </select>
                {/* <Input
                  type="number"
                  value={pm.fee}
                  placeholder="Fee"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) =>
                    updatePaymentMethod(i, "fee", e.target.value)
                  }
                /> */}
                <Input
                  type="file"
                  className="bg-[#333] border-none text-white"
                  onChange={(e) =>
                    updatePaymentMethod(i, "logo", e.target.files[0])
                  }
                />
                <Button
                  onClick={() => removePaymentMethod(i)}
                  className="bg-red-600"
                >
                  Hapus
                </Button>
              </div>
            ))}
            <Button onClick={addPaymentMethod} className="bg-orange-600">
              + Tambah Pembayaran
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={onClose} className="bg-gray-600">
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-green-600">
              Simpan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}