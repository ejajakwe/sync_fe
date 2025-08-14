import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LevelingFormModal({ onSubmit, onClose, initialData }) {
  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.name || "");
      setPublisher(initialData.publisher || "");
    }
  }, [initialData]);

  const handleSubmit = () => {
    if (!title || !publisher || !image) return;
    const formData = new FormData();
    formData.append("name", title);
    formData.append("publisher", publisher);
    formData.append("image", image);

    if (initialData) {
      formData.append("_method", "PUT");
      formData.append("id", initialData.id);
    }

    onSubmit(formData); // ⬅ kirim ke Kelola
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border-gray-700 p-6 rounded w-full max-w-md text-white space-y-4">
        <h2 className="text-xl font-bold">{initialData ? "🛠️Edit" : "🛠️Tambah"} Leveling</h2>
        <div>
          <h3 className="text-sm font-semibold mb-2">Nama Leveling</h3>
          <Input
            placeholder="Nama Leveling"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#333] border-none"
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">Publisher</h3>
          <Input
            placeholder="Publisher"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className="bg-[#333] border-none"
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2">Logo Leveling</h3>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="bg-[#333] border-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-none bg-gray-600 hover:bg-gray-700">Batal</Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            {initialData ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </div>
    </div>
  );
}
