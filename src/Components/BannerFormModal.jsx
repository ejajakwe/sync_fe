import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BannerFormModal({ onSubmit, onClose }) {
  const [type, setType] = useState("hero");
  const [image, setImage] = useState(null);

  const handleSubmit = () => {
    if (!image || !type) return;
    const formData = new FormData();
    formData.append("type", type);
    formData.append("image", image);

    onSubmit(formData); // ⬅ kirim ke Kelola.jsx
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border-gray-700 p-6 rounded w-full max-w-md text-white space-y-4">
        <h2 className="text-xl font-bold">🖼️ Tambah Banner</h2>

        {/* Tipe Banner */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Tipe Banner</h3>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 rounded bg-[#333] border-none text-white"
          >
            <option value="hero">Hero</option>
            <option value="joki">Joki</option>
          </select>
        </div>

        {/* File Upload */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Gambar Banner</h3>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="bg-[#333] border-none"
          />
        </div>

        {/* Tombol */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-none bg-gray-600 hover:bg-gray-700">
            Batal
          </Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            Tambah
          </Button>
        </div>
      </div>
    </div>
  );
}
