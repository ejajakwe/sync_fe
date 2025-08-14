import { useState, useEffect } from "react";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import GameFormModal from "@/Components/GameFormModal";
import GameDetailModal from "@/Components/GameDetailModal";
import LevelingFormModal from "@/Components/LevelingFormModal";
import LevelingDetailModal from "@/Components/LevelingDetailModal";
import BannerFormModal from "@/Components/BannerFormModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Kelola() {
  // Game state
  const [games, setGames] = useState([]);
  const [editingGame, setEditingGame] = useState(null);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [gameDetail, setGameDetail] = useState(null);
  const [gameDetailModalOpen, setGameDetailModalOpen] = useState(false);
  const [showGameList, setShowGameList] = useState(true);

  // Leveling state
  const [levelings, setLevelings] = useState([]);
  const [editingLeveling, setEditingLeveling] = useState(null);
  const [levelingModalOpen, setLevelingModalOpen] = useState(false);
  const [levelingDetail, setLevelingDetail] = useState(null);
  const [levelingDetailModalOpen, setLevelingDetailModalOpen] = useState(false);
  const [showLevelingList, setShowLevelingList] = useState(true);

  // Banner state
  const [banners, setBanners] = useState([]);
  const [showBannerList, setShowBannerList] = useState(true);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);

  // Margin
  const [marginModalOpen, setMarginModalOpen] = useState(false);
  const [markupPercent, setMarkupPercent] = useState(0);
  const [markupFixed, setMarkupFixed] = useState(0);

  // Fetch data
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/games")
      .then((res) => res.json())
      .then(setGames)
      .catch((err) => console.error("Gagal fetch games", err));

    fetch("http://127.0.0.1:8000/api/levelings")
      .then((res) => res.json())
      .then(setLevelings)
      .catch((err) => console.error("Gagal fetch levelings", err));

    fetch("http://127.0.0.1:8000/api/banners")
      .then((res) => res.json())
      .then(setBanners)
      .catch((err) => console.error("Gagal fetch banners", err));
  }, []);

  // === Game ===
  const handleSaveGame = async (formData) => {
    try {
      const isEdit = formData.get("_method") === "PUT";
      const url = isEdit
        ? `http://127.0.0.1:8000/api/games/${formData.get("id")}`
        : "http://127.0.0.1:8000/api/games";

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal simpan game");
      alert(`Game berhasil ${isEdit ? "diedit" : "ditambahkan"}`);
      window.location.reload();
    } catch (err) {
      console.error("❌", err);
      alert("Gagal menyimpan game ke database.");
    }
  };

  const handleDeleteGame = async (id) => {
    if (!confirm("Yakin hapus game ini?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/games/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus game");
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      alert("Gagal menghapus game");
    }
  };

  const handleSyncProductsWithMargin = async () => {
    if (!confirm("Sinkronisasi akan menimpa data nominal berdasarkan Digiflazz. Lanjutkan?")) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/sync-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          markup_percent: parseFloat(markupPercent) || 0,
          markup_fixed: parseInt(markupFixed) || 0
        }),
      });

      if (!res.ok) throw new Error("Gagal melakukan sinkronisasi produk");

      alert("✅ Berhasil sinkronisasi produk");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("❌ Gagal sinkron produk Digiflazz");
    }
  };


  // === Leveling ===
  const handleSaveLeveling = async (formData) => {
    try {
      const isEdit = formData.get("_method") === "PUT";
      const url = isEdit
        ? `http://127.0.0.1:8000/api/levelings/${formData.get("id")}`
        : "http://127.0.0.1:8000/api/levelings";

      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal simpan leveling");
      alert(`Leveling berhasil ${isEdit ? "diedit" : "ditambahkan"}`);
      window.location.reload();
    } catch (err) {
      console.error("❌", err);
      alert("Gagal menyimpan leveling ke database.");
    }
  };

  const handleDeleteLeveling = async (id) => {
    if (!confirm("Yakin hapus leveling ini?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/levelings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal hapus leveling");
      setLevelings((prev) => prev.filter((lvl) => lvl.id !== id));
    } catch (err) {
      alert("Gagal menghapus leveling");
    }
  };

  // === Banner ===
  const handleUploadBanner = async (fd) => {
    const res = await fetch("http://127.0.0.1:8000/api/banners", {
      method: "POST",
      body: fd,
    });

    if (res.ok) {
      const added = await res.json();
      setBanners([...banners, added]);
      alert("✅ Banner berhasil diunggah");
    } else {
      alert("❌ Gagal upload banner");
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!confirm("Yakin hapus banner ini?")) return;
    await fetch(`http://127.0.0.1:8000/api/banners/${id}`, { method: "DELETE" });
    setBanners(banners.filter((b) => b.id !== id));
  };

  return (
    <div className="bg-[#1f1f1f] text-white min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">

        {/* === Game Section === */}
        <div>
          <div className="flex justify-between items-center mb-4 lg:px-8">
            <h1 className="text-2xl font-bold">Kelola Game</h1>
            <div className="flex gap-3">
              <Button onClick={() => setMarginModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                🔄 Sync Produk
              </Button>
              <Button onClick={() => setShowGameList(!showGameList)} className="bg-orange-500 hover:bg-orange-600">
                {showGameList ? "Sembunyikan" : "Tampilkan"}
              </Button>
              <Button onClick={() => { setEditingGame(null); setGameModalOpen(true); }} className="bg-green-600">+ Tambah Game</Button>
            </div>
          </div>
          {showGameList && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:px-8 mb-12">
              {games.map((g) => (
                <Card key={g.id} className="bg-[#2d2d2d] border-none">
                  <CardContent className="p-0">
                    <img src={g.image_url} alt={g.name} className="w-full h-[140px] object-cover rounded-t-md" />
                  </CardContent>
                  <CardHeader className="px-4 pt-3 pb-2">
                    <CardTitle className="text-base">{g.name}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">{g.publisher}</CardDescription>
                  </CardHeader>
                  <div className="flex flex-col gap-2 px-4 pb-4">
                    <Button size="sm" className="bg-blue-600" onClick={() => { setEditingGame(g); setGameModalOpen(true); }}>Edit</Button>
                    <Button size="sm" className="bg-yellow-600" onClick={() => { setGameDetail(g); setGameDetailModalOpen(true); }}>Kelola Detail</Button>
                    <Button size="sm" className="bg-red-600" onClick={() => handleDeleteGame(g.id)}>Hapus</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* === Leveling Section === */}
        <div>
          <div className="flex justify-between items-center mb-4 lg:px-8">
            <h1 className="text-2xl font-bold">Kelola Leveling</h1>
            <div className="flex gap-3">
              <Button onClick={() => setShowLevelingList(!showLevelingList)} className="bg-orange-500 hover:bg-orange-600">
                {showLevelingList ? "Sembunyikan" : "Tampilkan"}
              </Button>
              <Button onClick={() => { setEditingLeveling(null); setLevelingModalOpen(true); }} className="bg-green-600">+ Tambah Leveling</Button>
            </div>
          </div>
          {showLevelingList && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:px-8 mb-12">
              {levelings.map((lvl) => (
                <Card key={lvl.id} className="bg-[#2d2d2d] border-none">
                  <CardContent className="p-0">
                    <img src={lvl.image_url} alt={lvl.name} className="w-full h-[140px] object-cover rounded-t-md" />
                  </CardContent>
                  <CardHeader className="px-4 pt-3 pb-2">
                    <CardTitle className="text-base">{lvl.name}</CardTitle>
                    <CardDescription className="text-xs text-gray-400">{lvl.publisher}</CardDescription>
                  </CardHeader>
                  <div className="flex flex-col gap-2 px-4 pb-4">
                    <Button size="sm" className="bg-blue-600" onClick={() => { setEditingLeveling(lvl); setLevelingModalOpen(true); }}>Edit</Button>
                    <Button size="sm" className="bg-yellow-600" onClick={() => { setLevelingDetail(lvl); setLevelingDetailModalOpen(true); }}>Kelola Detail</Button>
                    <Button size="sm" className="bg-red-600" onClick={() => handleDeleteLeveling(lvl.id)}>Hapus</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* === Banner Section === */}
        <div>
          <div className="flex justify-between items-center mb-4 lg:px-8">
            <h1 className="text-2xl font-bold">Kelola Banner</h1>
            <div className="flex gap-3">
              <Button onClick={() => setShowBannerList(!showBannerList)} className="bg-orange-500 hover:bg-orange-600">
                {showBannerList ? "Sembunyikan" : "Tampilkan"}
              </Button>
              <Button onClick={() => setBannerModalOpen(true)} className="bg-green-600">+ Tambah Banner</Button>
            </div>
          </div>
          {showBannerList && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:px-8 mb-12">
              {banners.map((b) => (
                <div key={b.id} className="relative bg-[#222] p-2 rounded shadow">
                  <img src={b.image_url} alt="banner" className="w-full h-32 object-cover rounded" />
                  <div className="text-sm text-center mt-1 capitalize text-white">{b.type}</div>
                  <button onClick={() => handleDeleteBanner(b.id)} className="absolute top-1 right-1 bg-red-600 text-white px-2 py-1 rounded text-xs">Hapus</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === Modals === */}
      {gameModalOpen && (
        <GameFormModal
          initialData={editingGame}
          onClose={() => { setGameModalOpen(false); setEditingGame(null); }}
          onSubmit={(data) => { handleSaveGame(data); setGameModalOpen(false); }}
        />
      )}
      {gameDetailModalOpen && (
        <GameDetailModal
          game={gameDetail}
          onClose={() => { setGameDetailModalOpen(false); setGameDetail(null); }}
          onSaveSuccess={() => { setGameDetailModalOpen(false); setGameDetail(null); window.location.reload(); }}
        />
      )}
      {levelingModalOpen && (
        <LevelingFormModal
          initialData={editingLeveling}
          onClose={() => { setLevelingModalOpen(false); setEditingLeveling(null); }}
          onSubmit={(data) => { handleSaveLeveling(data); setLevelingModalOpen(false); }}
        />
      )}
      {levelingDetailModalOpen && (
        <LevelingDetailModal
          leveling={levelingDetail}
          onClose={() => { setLevelingDetailModalOpen(false); setLevelingDetail(null); }}
          onSaveSuccess={() => { setLevelingDetailModalOpen(false); setLevelingDetail(null); window.location.reload(); }}
        />
      )}
      {bannerModalOpen && (
        <BannerFormModal
          onClose={() => setBannerModalOpen(false)}
          onSubmit={(fd) => {
            handleUploadBanner(fd);
            setBannerModalOpen(false);
          }}
        />
      )}
      {marginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border-gray-700 p-6 rounded w-full max-w-md text-white space-y-4">
            <h2 className="text-xl font-bold">🛠️Atur Margin</h2>
            <div>
              <h3 className="text-sm font-semibold mb-2">Markup Persentase (%)</h3>
              <input
                type="number"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                className="w-full p-2 mb-4 rounded bg-[#333] text-white"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Markup Tetap (Rp)</h3>
              <input
                type="number"
                value={markupFixed}
                onChange={(e) => setMarkupFixed(e.target.value)}
                className="w-full p-2 mb-4 rounded bg-[#333] text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setMarginModalOpen(false)} className="bg-gray-500">Batal</Button>
              <Button onClick={() => { setMarginModalOpen(false); handleSyncProductsWithMargin(); }} className="bg-purple-600">Sync Sekarang</Button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}