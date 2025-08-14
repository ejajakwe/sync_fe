import React, { useEffect, useState } from "react";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const API = "http://127.0.0.1:8000/api/admin";

// helper untuk pilih field WA yang ada
const pickWhatsapp = (r) =>
    r?.customer_phone || r?.whatsapp || r?.phone || r?.meta?.whatsapp || "-";

export default function Dashboard() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        fetch(`${API}/transactions/recent?limit=20`)
            .then(async (r) => {
                const text = await r.text();
                try { return JSON.parse(text); }
                catch { throw new Error("API mengembalikan non-JSON. Cek backend (500/404)."); }
            })
            .then(setRows)
            .catch((e) => setErr(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-[#1f1f1f] text-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

                <Card className="bg-[#1f1f1f] text-white border-white/10">
                    <CardHeader><CardTitle>Transaksi Terbaru</CardTitle></CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-gray-400">Memuat…</div>
                        ) : err ? (
                            <div className="text-red-400">{err}</div>
                        ) : rows.length === 0 ? (
                            <div className="text-gray-400">Belum ada data.</div>
                        ) : (
                            <div className="overflow-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-300">
                                            <th className="py-2 pr-4">Invoice</th>
                                            <th className="py-2 pr-4">Akun</th>
                                            <th className="py-2 pr-4">Nominal</th>
                                            <th className="py-2 pr-4">WhatsApp</th>{/* <-- baru */}
                                            <th className="py-2 pr-4">Harga</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 pr-4">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r, i) => (
                                            <tr key={i} className="border-t border-white/10">
                                                <td className="py-2 pr-4">{r.invoice ?? "-"}</td>
                                                <td className="py-2 pr-4">{r.customer_no ?? "-"}</td>
                                                <td className="py-2 pr-4">{r.nominal || "-"}</td>
                                                <td className="py-2 pr-4">{pickWhatsapp(r)}</td>{/* <-- baru */}
                                                <td className="py-2 pr-4">
                                                    {Intl.NumberFormat("id-ID", {
                                                        style: "currency",
                                                        currency: "IDR",
                                                        maximumFractionDigits: 0,
                                                    }).format(r.gross_amount ?? 0)}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <span
                                                        className={
                                                            "px-2 py-0.5 rounded text-xs " +
                                                            (r.payment_status === "PAID"
                                                                ? "bg-green-600"
                                                                : r.payment_status === "UNPAID"
                                                                    ? "bg-yellow-600"
                                                                    : "bg-red-600")
                                                        }
                                                    >
                                                        {r.payment_status ?? "-"}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {r.created_at
                                                        ? new Date(r.created_at).toLocaleString("id-ID", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Footer />
        </div>
    );
}