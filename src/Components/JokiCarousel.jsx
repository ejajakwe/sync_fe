import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function JokiCarousel() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const API_BASE = import.meta.env.VITE_API_BASE;
  // Ambil banner dari API Laravel
  useEffect(() => {
    fetch(`${API_BASE}/api/banners`)
      .then((res) => res.json())
      .then((data) => {
        const heroBanners = data.filter((b) => b.type === "joki");
        setBanners(heroBanners);
      })
      .catch((err) => {
        console.error("Gagal mengambil banner:", err);
      });
  }, []);

  // Auto-slide setiap 5 detik
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  if (banners.length === 0) return null; // fallback jika tidak ada banner

  return (
    <div className="relative w-full max-w-7xl mx-auto rounded-2xl overflow-hidden mt-4 lg:px-12">
      {/* Gambar */}
      <img
        src={banners[current].image_url}
        alt={`Banner ${current + 1}`}
        className="w-full h-[400px] object-cover transition-all duration-700 rounded-xl"
      />

      {/* Tombol kiri */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
      >
        <ChevronLeft />
      </button>

      {/* Tombol kanan */}
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
      >
        <ChevronRight />
      </button>

      {/* Dot navigasi */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full ${i === current ? "bg-white" : "bg-gray-500"
              }`}
          />
        ))}
      </div>
    </div>
  );
}
