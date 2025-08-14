import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import HeroCarousel from "../Components/HeroCarousel";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function Game() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    // Fetch data dari API Laravel
    fetch("http://127.0.0.1:8000/api/games")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Gagal mengambil data game");
        }
        return res.json();
      })
      .then((data) => setGames(data))
      .catch((err) => {
        console.error("❌ Error:", err);
        alert("Gagal memuat data game. Pastikan backend Laravel berjalan.");
      });
  }, []);

  return (
    <div className="bg-[#1f1f1f] text-white min-h-screen">
      <Navbar />
      <HeroCarousel />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-xl font-bold mb-6 lg:px-8">Pilih Game</h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 lg:px-8">
            {games.map((game) => (
              <Link to={`/game/${game.slug}`} key={game.id}>
                <Card className="hover:shadow-lg transition-shadow bg-gray-200 border-none h-[201px] flex flex-col justify-between">
                  <CardContent className="p-0">
                    <img
                      src={game.image_url} 
                      alt={game.name}
                      className="w-full h-[140px] object-cover rounded-t-md"
                    />
                  </CardContent>
                  <CardHeader className="px-4 py-3">
                    <CardTitle className="text-sm leading-tight text-black">
                      {game.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-600">
                      {game.publisher}
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
