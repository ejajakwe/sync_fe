import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getJSON } from "@/lib/api";

export default function Search() {
    const [params] = useSearchParams();
    const q = params.get("q") || "";
    const type = params.get("type") || "all";
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(!!q);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;
        async function run() {
            if (!q) { setData(null); setLoading(false); return; }
            setLoading(true);
            setError("");
            try {
                const res = await getJSON("/search", { q, type, per_page: 20 });
                if (!ignore) setData(res);
            } catch (e) {
                if (!ignore) setError(e.message || "Gagal memuat");
            } finally {
                if (!ignore) setLoading(false);
            }
        }
        run();
        return () => { ignore = true; };
    }, [q, type]);

    return (
        <div className="container mx-auto px-6 py-6 text-white">
            <h1 className="text-2xl font-bold mb-4">
                Hasil Pencarian{q ? `: "${q}"` : ""}
            </h1>

            {loading && <div>Memuat...</div>}
            {error && <div className="text-red-400">{error}</div>}

            {!loading && data && (
                <div className="space-y-8">
                    {/* Games */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">Game</h2>
                        {data.results.games?.length ? (
                            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {data.results.games.map((g) => (
                                    <li key={g.id} className="bg-[#323232] rounded-2xl p-3">
                                        <Link to={`/game/${g.slug}`} className="block">
                                            <img src={g.image_url || "/placeholder.png"} alt={g.name}
                                                className="w-full h-32 object-cover rounded-xl mb-2" />
                                            <div className="font-medium">{highlight(g.name, q)}</div>
                                            {g.publisher && <div className="text-xs text-gray-300">{highlight(g.publisher, q)}</div>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : <div className="text-gray-300">Tidak ada game yang cocok.</div>}
                    </section>

                    {/* Levelings */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3">Leveling</h2>
                        {data.results.levelings?.length ? (
                            <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {data.results.levelings.map((l) => (
                                    <li key={l.id} className="bg-[#323232] rounded-2xl p-3">
                                        <Link to={`/leveling/${l.slug || l.id}`} className="block">
                                            <img src={l.image_url || "/placeholder.png"} alt={l.name}
                                                className="w-full h-32 object-cover rounded-xl mb-2" />
                                            <div className="font-medium">{highlight(l.name, q)}</div>
                                            {l.publisher && <div className="text-xs text-gray-300">{highlight(l.publisher, q)}</div>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : <div className="text-gray-300">Tidak ada leveling yang cocok.</div>}
                    </section>
                </div>
            )}
        </div>
    );
}

// kecil: highlight kata yang cocok
function highlight(text, q) {
    if (!text || !q) return text;
    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    const parts = String(text).split(re);
    return parts.map((p, i) =>
        re.test(p) ? <mark key={i} className="bg-orange-600/40 rounded px-1">{p}</mark> : p
    );
}
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }