import { useEffect, useState } from "react";
import { Button } from "@/Components/ui/button";

export default function SyncDigiflazz() {
    const API_BASE = import.meta.env.VITE_API_BASE;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/admin/digiflazz-products`, { credentials: "include" });
        const data = await res.json();
        setProducts(data);
        setLoading(false);
    };

    const toggleActivation = async (product) => {
        const action = product.active ? "deactivate" : "activate";
        await fetch(`${API_BASE}/api/admin/nominals/${product.id}/${action}`, {
            method: "POST",
            credentials: "include"
        });
        fetchProducts();
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">🧩 Produk Digiflazz</h2>
            {loading && <p>Loading...</p>}
            {!loading && (
                <div className="space-y-3">
                    {products.map((p) => (
                        <div key={p.id} className="flex justify-between items-center bg-[#222] text-white p-4 rounded-lg">
                            <div>
                                <div className="font-semibold">{p.label}</div>
                                <div className="text-sm text-gray-400">SKU: {p.sku_code}</div>
                                <div className="text-sm text-gray-400">Rp{p.price.toLocaleString()}</div>
                            </div>
                            <Button
                                onClick={() => toggleActivation(p)}
                                className={p.active ? "bg-red-600" : "bg-green-600"}
                            >
                                {p.active ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}