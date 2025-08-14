import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import JokiCarousel from "../Components/JokiCarousel";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function Leveling() {
  const [levelings, setLevelings] = useState([]);

  useEffect(() => {
    // Fetch data dari API Laravel
    fetch("http://127.0.0.1:8000/api/levelings")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil data leveling");
        }
        return res.json();
      })
      .then((data) => setLevelings(data))
      .catch((err) => {
        console.error("❌ Error:", err);
        alert("Gagal memuat data leveling. Pastikan backend Laravel berjalan.");
      });
  }, []);

  return (
    <div className="bg-[#1f1f1f] text-white min-h-screen">
      <Navbar />
      <JokiCarousel />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold mb-6 lg:px-8">Pilih Leveling</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:px-8">
          {levelings.map((leveling) => (
            <Link to={`/leveling/${leveling.slug}`} key={leveling.id}>
              <Card className="hover:shadow-lg transition-shadow bg-gray-200 border-none h-[201px] flex flex-col justify-between">
                <CardContent className="p-0">
                  <img
                    src={leveling.image_url} // ✅ dari backend
                    alt={leveling.name}
                    className="w-full h-[140px] object-cover rounded-t-md"
                  />
                </CardContent>
                <CardHeader className="px-4 py-3">
                  <CardTitle className="text-sm leading-tight text-black">
                    {leveling.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-600">
                    {leveling.publisher}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}