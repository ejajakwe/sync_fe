import { Input } from "@/Components/ui/input";
import { LogIn, LogOut, Search, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isAdminLoggedIn, logoutAdmin } from "@/lib/auth";
import { useEffect, useRef, useState, useMemo } from "react";
import { getJSON } from "@/lib/api";

const menuItems = [
  { name: "Game", href: "/" },
  { name: "Leveling", href: "/leveling" },
  { name: "Cek Transaksi", href: "/cek-transaksi" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Admin
  const [isAdmin, setIsAdmin] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ games: [], levelings: [] });

  // ====== VALIDASI / SANITASI QUERY (tambahan) ======
  const MAX_Q_LEN = 64;
  const sanitizeQuery = (q) => {
    if (!q) return "";
    let v = q.slice(0, MAX_Q_LEN);
    // hapus karakter berisiko
    v = v.replace(/['"`<>%;(){}\[\]\\\/=+\|^~&]/g, "");
    // hapus pola berbahaya
    v = v.replace(/(--|\/\*|\*\/|@@|xp_)/gi, "");
    return v;
  };
  const isQuerySafe = (q) => q === sanitizeQuery(q);
  // ===================================================

  // Keyboard selection
  const [activeIndex, setActiveIndex] = useState(-1);
  const flatList = useMemo(() => {
    const out = [];
    if (suggestions.games.length) out.push({ __group: "GAMES" });
    out.push(...suggestions.games.map((g) => ({ ...g, __type: "game" })));
    if (suggestions.levelings.length) out.push({ __group: "LEVELING" });
    out.push(...suggestions.levelings.map((l) => ({ ...l, __type: "leveling" })));
    return out;
  }, [suggestions]);

  const inputWrapRef = useRef(null);
  const boxRef = useRef(null);
  const debounceRef = useRef();

  useEffect(() => {
    setIsAdmin(isAdminLoggedIn());
  }, [location]);

  // Fetch suggestions (debounce)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim() || !isQuerySafe(query)) {
      setSuggestions({ games: [], levelings: [] });
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await getJSON("/search/suggest", { q: query.trim(), limit: 8 });
        setSuggestions(res?.suggestions || { games: [], levelings: [] });
        setOpen(true);
        setActiveIndex(-1);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on outside / ESC
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target) &&
        inputWrapRef.current &&
        !inputWrapRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    setIsAdmin(false);
    navigate("/");
  };

  const clearQuery = () => {
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    inputWrapRef.current?.querySelector("input")?.focus();
  };

  const goToItem = (item) => {
    if (!item) return;
    if (item.__type === "game") navigate(`/game/${item.slug}`);
    else navigate(`/leveling/${item.slug || item.id}`);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    // cegah Enter ketika query tidak aman
    if (e.key === "Enter" && (!query.trim() || !isQuerySafe(query))) {
      e.preventDefault();
      return;
    }
    if (!open || !flatList.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      let i = activeIndex;
      do { i = (i + 1) % flatList.length; } while (flatList[i].__group);
      setActiveIndex(i);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      let i = activeIndex;
      do { i = (i - 1 + flatList.length) % flatList.length; } while (flatList[i].__group);
      setActiveIndex(i);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && flatList[activeIndex] && !flatList[activeIndex].__group) {
        e.preventDefault();
        goToItem(flatList[activeIndex]);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#242424]/95 text-white shadow-md backdrop-blur-sm">
      {/* BARIS ATAS */}
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="text-2xl font-extrabold tracking-wide whitespace-nowrap">
          SYNC<span className="text-orange-500">PEDIA</span>
        </Link>

        {/* Search - dibuat LEBAR seperti gambar 1 */}
        <div className="relative w-full">
          {/* Ikon kiri menempel */}
          <div ref={inputWrapRef} className="relative">
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 h-5 w-5 text-gray-300 pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => {
                const raw = e.target.value;
                const safe = sanitizeQuery(raw);
                setQuery(safe);
              }}
              onKeyDown={onKeyDown}
              placeholder="Cari Game atau Leveling"
              aria-label="Cari"
              className="h-10 pl-12 pr-12 rounded-full bg-[#353535] text-white border-none focus-visible:ring-2 placeholder:text-gray-400"
            />
            {query && (
              <button
                aria-label="Bersihkan"
                onClick={clearQuery}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80"
              >
                <X className="w-5 h-5 text-gray-300" />
              </button>
            )}
          </div>

          {/* DROPDOWN – lebarnya mengikuti input, dengan max width besar */}
          {open && (suggestions.games.length || suggestions.levelings.length) ? (
            <div
              ref={boxRef}
              role="listbox"
              className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#1f1f1f] shadow-2xl ring-1 ring-black/40 overflow-hidden"
            >
              {/* GAMES */}
              {suggestions.games.length > 0 && (
                <Group
                  title="GAMES"
                  items={suggestions.games}
                  activeIndex={activeIndex}
                  flatList={flatList}
                  onHover={setActiveIndex}
                  onSelect={(item) => goToItem({ ...item, __type: "game" })}
                />
              )}

              {/* LEVELING */}
              {suggestions.levelings.length > 0 && (
                <Group
                  title="LEVELING"
                  items={suggestions.levelings}
                  activeIndex={activeIndex}
                  flatList={flatList}
                  onHover={setActiveIndex}
                  onSelect={(item) => goToItem({ ...item, __type: "leveling" })}
                />
              )}
            </div>
          ) : (
            open &&
            loading && (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#1f1f1f] shadow-2xl ring-1 ring-black/40 px-4 py-3 text-sm text-gray-300">
                Mencari…
              </div>
            )
          )}
        </div>

        {/* Admin Area */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          {isAdmin ? (
            <>
              <Link to="/dashboard" className="hover:text-orange-500">Data</Link>
              <Link to="/kelola" className="hover:text-orange-500">Kelola</Link>
              <button onClick={handleLogout} className="flex items-center gap-1 hover:text-orange-500">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center gap-1 hover:text-orange-500">
              <LogIn className="w-5 h-5" />
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>

      {/* BARIS MENU */}
      <div className="mx-auto max-w-7xl px-6 pb-2 flex items-center gap-6 text-sm">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`transition-colors ${location.pathname === item.href
              ? "text-orange-500 font-semibold"
              : "text-white hover:text-orange-500"
              }`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** ====== Dropdown Group ====== */
function Group({ title, items, activeIndex, flatList, onHover, onSelect }) {
  return (
    <div className="py-2">
      <div className="px-4 pb-1 text-[11px] font-semibold tracking-wider text-gray-400">
        {title}
      </div>
      <ul className="max-h-[360px] overflow-auto scrollbar-thin scrollbar-thumb-white/10">
        {items.map((it) => {
          const idx = flatList.findIndex(
            (x) => !x.__group && x.id === it.id && (x.__type || title.toLowerCase())
          );
          const active = idx === activeIndex;
          return (
            <li key={it.id}>
              <button
                onMouseEnter={() => onHover(idx)}
                onClick={() => onSelect(it)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-white/5" : "hover:bg-white/5"
                  }`}
              >
                <img
                  src={it.image_url || "/placeholder.png"}
                  alt=""
                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-semibold truncate">{it.name}</div>
                  {/* Publisher tampil kecil & muted */}
                  {it.publisher && (
                    <div className="text-xs text-gray-400 truncate">
                      {it.publisher}
                    </div>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
