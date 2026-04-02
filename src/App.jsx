import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const ADMIN_CREDENTIALS = { username: "beba", password: "familia2026" };

const initialTeams = [
  { id: 1, name: "Los Relámpagos", color: "#F59E0B", emoji: "⚡", members: ["Papá", "Lucía", "Tomás"], points: 45 },
  { id: 2, name: "Las Estrellas", color: "#3B82F6", emoji: "⭐", members: ["Mamá", "Sofía", "Mateo"], points: 38 },
  { id: 3, name: "Los Tigres", color: "#EF4444", emoji: "🐯", members: ["Tío Juan", "Camila", "Nico"], points: 52 },
  { id: 4, name: "Las Águilas", color: "#10B981", emoji: "🦅", members: ["Tía Ana", "Diego", "Valentina"], points: 41 },
];

const initialGames = [
  { id: 1, name: "Trivia Familiar", description: "Preguntas de cultura general para toda la familia", status: "completed", category: "mental", icon: "🧠" },
  { id: 2, name: "Carrera de Sacos", description: "Carrera por relevos con sacos de arpillera", status: "completed", category: "physical", icon: "🏃" },
  { id: 3, name: "Pictionary", description: "Dibuja y adivina palabras contra reloj", status: "completed", category: "creative", icon: "🎨" },
  { id: 4, name: "Búsqueda del Tesoro", description: "Encuentra las pistas escondidas en el jardín", status: "pending", category: "adventure", icon: "🗺️" },
  { id: 5, name: "Karaoke Battle", description: "Duelo de canciones por equipos", status: "pending", category: "creative", icon: "🎤" },
  { id: 6, name: "Quiz Musical", description: "Adivina la canción en 5 segundos", status: "pending", category: "mental", icon: "🎵" },
  { id: 7, name: "Relevos Acuáticos", description: "Posta de agua con vasos y baldes", status: "pending", category: "physical", icon: "💦" },
  { id: 8, name: "Mímica Express", description: "Actúa la palabra antes de que se acabe el tiempo", status: "pending", category: "creative", icon: "🎭" },
];

const STORAGE_KEYS = {
  teams: "family-games-teams",
  games: "family-games-games",
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const sortById = (a, b) => Number(a.id) - Number(b.id);

const normalizeTeams = (teams) =>
  teams.map((team) => ({
    ...team,
    members: Array.isArray(team.members) ? team.members : [],
    points: Number(team.points) || 0,
  }));

const normalizeGames = (games) => games.map((game) => ({ ...game }));

const loadStoredState = (key, fallback) => {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const loadFromSupabase = async () => {
  if (!supabase) return null;

  const [{ data: teamsData, error: teamsError }, { data: gamesData, error: gamesError }] = await Promise.all([
    supabase.from("teams").select("*").order("id", { ascending: true }),
    supabase.from("games").select("*").order("id", { ascending: true }),
  ]);

  if (teamsError || gamesError) {
    throw teamsError || gamesError;
  }

  return {
    teams: normalizeTeams(teamsData || []),
    games: normalizeGames(gamesData || []),
  };
};

const syncToSupabase = async (teams, games) => {
  if (!supabase) return;

  await supabase.from("teams").delete().not("id", "is", null);
  await supabase.from("games").delete().not("id", "is", null);

  if (teams.length > 0) {
    const { error } = await supabase.from("teams").insert(teams);
    if (error) throw error;
  }

  if (games.length > 0) {
    const { error } = await supabase.from("games").insert(games);
    if (error) throw error;
  }
};

// ─────────────────────────────────────────────
// ICONS (inline SVG components)
// ─────────────────────────────────────────────
const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Trophy: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  Gamepad: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>,
  LogOut: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2 2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  Minus: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Star: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  ChevDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
};

// ─────────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-sky-500",
  };

  return (
    <div className={`fixed top-5 right-5 z-999 ${colors[type] || colors.info} text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideIn`}
      style={{ animation: "slideIn 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
      <span className="text-lg">{type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"}</span>
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity"><Icons.X /></button>
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400"><Icons.X /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleAdmin = () => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      onLogin("admin");
    } else {
      setError("Credenciales incorrectas");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%)" }}>

      {/* Decorative orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute top-[40%] right-[20%] w-64 h-64 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #10b981, transparent 70%)", filter: "blur(50px)" }} />

      {/* Logo area */}
      <div className="text-center mb-10 relative z-10">
        <div className="text-6xl mb-4" style={{ filter: "drop-shadow(0 0 20px rgba(245,158,11,0.3))" }}>🎲</div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2"
          style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", textShadow: "0 2px 30px rgba(0,0,0,0.3)" }}>
          Cassarino <span className="text-amber-400">Olimpiadas</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium tracking-wide">Semana Santa 2026</p>
      </div>

      {!showAdminForm ? (
        <div className="flex flex-col sm:flex-row gap-5 relative z-10 w-full max-w-xl px-4">
          {/* Admin Card */}
          <button
            onClick={() => setShowAdminForm(true)}
            onMouseEnter={() => setHoveredCard("admin")}
            onMouseLeave={() => setHoveredCard(null)}
            className="flex-1 group relative rounded-3xl p-6 md:p-8 text-left transition-all duration-500 border border-white/10"
            style={{
              background: hoveredCard === "admin"
                ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))"
                : "rgba(255,255,255,0.05)",
              transform: hoveredCard === "admin" ? "translateY(-4px)" : "translateY(0)",
              boxShadow: hoveredCard === "admin" ? "0 20px 60px rgba(245,158,11,0.15)" : "0 4px 20px rgba(0,0,0,0.1)",
            }}>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">🔐</div>
            <h3 className="text-xl font-bold text-white mb-2">Administrador</h3>
          </button>

          {/* Guest Card */}
          <button
            onClick={() => onLogin("guest")}
            onMouseEnter={() => setHoveredCard("guest")}
            onMouseLeave={() => setHoveredCard(null)}
            className="flex-1 group relative rounded-3xl p-6 md:p-8 text-left transition-all duration-500 border border-white/10"
            style={{
              background: hoveredCard === "guest"
                ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))"
                : "rgba(255,255,255,0.05)",
              transform: hoveredCard === "guest" ? "translateY(-4px)" : "translateY(0)",
              boxShadow: hoveredCard === "guest" ? "0 20px 60px rgba(59,130,246,0.15)" : "0 4px 20px rgba(0,0,0,0.1)",
            }}>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">👀</div>
            <h3 className="text-xl font-bold text-white mb-2">Jugador</h3>
          </button>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-3xl p-8 border border-white/10"
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
            <button onClick={() => { setShowAdminForm(false); setError(""); }}
              className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors">
              ← Volver
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Acceso Administrador</h3>
            {error && <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm font-medium block mb-1.5">Usuario</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="admin" />
              </div>
              <div>
                <label className="text-slate-400 text-sm font-medium block mb-1.5">Contraseña</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdmin()}
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="••••••••" />
              </div>
              <button onClick={handleAdmin}
                className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-[0.98]">
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// SIDEBAR NAV
// ─────────────────────────────────────────────
const Sidebar = ({ role, currentView, setCurrentView, onLogout, isOpen, setIsOpen }) => {
  const adminLinks = [
    { id: "dashboard", label: "Dashboard", icon: Icons.Home },
    { id: "teams", label: "Equipos", icon: Icons.Users },
    { id: "games", label: "Juegos", icon: Icons.Gamepad },
    { id: "ranking", label: "Ranking", icon: Icons.Trophy },
  ];
  const guestLinks = [
    { id: "teams", label: "Equipos", icon: Icons.Users },
    { id: "games", label: "Juegos", icon: Icons.Gamepad },
    { id: "ranking", label: "Ranking", icon: Icons.Trophy },
  ];
  const links = role === "admin" ? adminLinks : guestLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.04)" }}>
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎲</span>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight" style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif" }}>
                Cassarino <span className="text-amber-500">Olimpiadas</span>
              </h2>
              <span className={`text-[10px] font-bold tracking-widest uppercase ${role === "admin" ? "text-amber-600" : "text-blue-500"}`}>
                {role === "admin" ? "Administrador" : "Jugador"}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = currentView === link.id;
            return (
              <button key={link.id} onClick={() => { setCurrentView(link.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-amber-50 text-amber-700 shadow-sm shadow-amber-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}>
                <Icon /> {link.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <Icons.LogOut /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
};

// ─────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────
const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
    <input value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
      placeholder={placeholder} />
    {value && (
      <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Icons.X /></button>
    )}
  </div>
);

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({ icon, label, value, accent, sub }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: `${accent}18` }}>{icon}</div>
      {sub && <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">{sub}</span>}
    </div>
    <p className="text-2xl font-black text-slate-800">{value}</p>
    <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
  </div>
);

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────
const AdminDashboard = ({ teams, games, setCurrentView }) => {
  const totalPoints = teams.reduce((s, t) => s + t.points, 0);
  const completedGames = games.filter((g) => g.status === "completed").length;
  const pendingGames = games.filter((g) => g.status === "pending").length;
  const leader = [...teams].sort((a, b) => b.points - a.points)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Resumen general de la jornada familiar</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Equipos" value={teams.length} accent="#3B82F6" />
        <StatCard icon="🎮" label="Juegos totales" value={games.length} accent="#8B5CF6" />
        <StatCard icon="✅" label="Realizados" value={completedGames} accent="#10B981" sub={`${Math.round((completedGames / games.length) * 100)}%`} />
        <StatCard icon="⏳" label="Pendientes" value={pendingGames} accent="#F59E0B" />
      </div>

      {/* Leader highlight */}
      {leader && (
        <div className="bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-amber-200/40"
            style={{ background: `linear-gradient(135deg, ${leader.color}, ${leader.color}cc)` }}>
            {leader.emoji}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Líder actual</p>
            <p className="text-xl font-black text-slate-800">{leader.name}</p>
            <p className="text-sm text-slate-500">{leader.points} puntos</p>
          </div>
          <div className="text-5xl opacity-20">🏆</div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => setCurrentView("teams")}
          className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-amber-300 hover:shadow-md transition-all group">
          <span className="text-2xl mb-3 inline-block group-hover:scale-110 transition-transform">👥</span>
          <p className="font-bold text-slate-700 text-sm">Gestionar Equipos</p>
          <p className="text-xs text-slate-400 mt-1">Crear, editar y administrar</p>
        </button>
        <button onClick={() => setCurrentView("games")}
          className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group">
          <span className="text-2xl mb-3 inline-block group-hover:scale-110 transition-transform">🎮</span>
          <p className="font-bold text-slate-700 text-sm">Gestionar Juegos</p>
          <p className="text-xs text-slate-400 mt-1">Crear y marcar estado</p>
        </button>
        <button onClick={() => setCurrentView("ranking")}
          className="bg-white border border-slate-200 rounded-2xl p-5 text-left hover:border-emerald-300 hover:shadow-md transition-all group">
          <span className="text-2xl mb-3 inline-block group-hover:scale-110 transition-transform">🏆</span>
          <p className="font-bold text-slate-700 text-sm">Ver Ranking</p>
          <p className="text-xs text-slate-400 mt-1">Tabla de posiciones</p>
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-slate-700 text-sm">Progreso de la jornada</p>
          <p className="text-sm font-bold text-amber-600">{completedGames}/{games.length}</p>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(completedGames / games.length) * 100}%`,
              background: "linear-gradient(90deg, #f59e0b, #f97316)",
            }} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// TEAMS VIEW
// ─────────────────────────────────────────────
const TEAM_COLORS = ["#F59E0B", "#3B82F6", "#EF4444", "#10B981", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"];
const TEAM_EMOJIS = ["⚡", "⭐", "🐯", "🦅", "🔥", "🌊", "🎯", "🚀", "💎", "🌟", "🐉", "🦁"];

const TeamsView = ({ teams, setTeams, isAdmin, showToast }) => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [form, setForm] = useState({ name: "", color: TEAM_COLORS[0], emoji: "⚡", members: "" });
  const [memberInput, setMemberInput] = useState("");
  const [expandedTeam, setExpandedTeam] = useState(null);

  const filtered = teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.members.some((m) => m.toLowerCase().includes(search.toLowerCase())));

  const openCreate = () => {
    setEditingTeam(null);
    setForm({ name: "", color: TEAM_COLORS[teams.length % TEAM_COLORS.length], emoji: TEAM_EMOJIS[teams.length % TEAM_EMOJIS.length], members: "" });
    setMemberInput("");
    setModalOpen(true);
  };
  const openEdit = (team) => {
    setEditingTeam(team);
    setForm({ name: team.name, color: team.color, emoji: team.emoji, members: team.members.join(", ") });
    setMemberInput("");
    setModalOpen(true);
  };
  const handleSave = () => {
    if (!form.name.trim()) return;
    const members = form.members.split(",").map((m) => m.trim()).filter(Boolean);
    if (editingTeam) {
      setTeams((prev) => prev.map((t) => (t.id === editingTeam.id ? { ...t, name: form.name, color: form.color, emoji: form.emoji, members } : t)));
      showToast(`Equipo "${form.name}" actualizado`, "success");
    } else {
      setTeams((prev) => {
        const maxId = prev.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
        return [...prev, { id: maxId + 1, name: form.name, color: form.color, emoji: form.emoji, members, points: 0 }];
      });
      showToast(`Equipo "${form.name}" creado`, "success");
    }
    setModalOpen(false);
  };
  const handleDelete = (team) => {
    setTeams((prev) => prev.filter((t) => t.id !== team.id));
    showToast(`Equipo "${team.name}" eliminado`, "info");
  };
  const updatePoints = (id, delta) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, points: Math.max(0, t.points + delta) } : t)));
    showToast(`Puntaje ${delta > 0 ? "sumado" : "restado"}`, "success");
  };
  const addMember = (teamId) => {
    if (!memberInput.trim()) return;
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, members: [...t.members, memberInput.trim()] } : t)));
    setMemberInput("");
    showToast("Integrante agregado", "success");
  };
  const removeMember = (teamId, idx) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, members: t.members.filter((_, i) => i !== idx) } : t)));
    showToast("Integrante removido", "info");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Equipos</h1>
          <p className="text-slate-400 text-sm mt-1">{teams.length} equipos registrados</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64"><SearchBar value={search} onChange={setSearch} placeholder="Buscar equipo o integrante..." /></div>
          {isAdmin && (
            <button onClick={openCreate}
              className="bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-amber-200 whitespace-nowrap">
              <Icons.Plus /> Nuevo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((team) => (
          <div key={team.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md"
                    style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}cc)` }}>
                    {team.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{team.name}</h3>
                    <p className="text-xs text-slate-400">{team.members.length} integrantes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {isAdmin && (
                    <>
                      <button onClick={() => updatePoints(team.id, -1)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center transition-colors"><Icons.Minus /></button>
                      <div className="px-3 py-1 rounded-lg font-black text-lg text-slate-800 min-w-12 text-center" style={{ background: `${team.color}15` }}>{team.points}</div>
                      <button onClick={() => updatePoints(team.id, 1)} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-500 flex items-center justify-center transition-colors"><Icons.Plus /></button>
                    </>
                  )}
                  {!isAdmin && (
                    <div className="px-3 py-1 rounded-lg font-black text-lg text-slate-800" style={{ background: `${team.color}15` }}>{team.points} pts</div>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="mt-4">
                <button onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                  className="text-xs font-semibold text-slate-500 flex items-center gap-1 hover:text-slate-700 transition-colors">
                  <span className={`transition-transform duration-200 ${expandedTeam === team.id ? "rotate-180" : ""}`}><Icons.ChevDown /></span>
                  Ver integrantes
                </button>

                {expandedTeam === team.id && (
                  <div className="mt-3 space-y-2">
                    {team.members.map((m, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-slate-600 font-medium">{m}</span>
                        {isAdmin && (
                          <button onClick={() => removeMember(team.id, i)} className="text-slate-300 hover:text-red-400 transition-colors"><Icons.X /></button>
                        )}
                      </div>
                    ))}
                    {isAdmin && (
                      <div className="flex gap-2 mt-2">
                        <input value={memberInput} onChange={(e) => setMemberInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addMember(team.id)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-100"
                          placeholder="Nombre del integrante..." />
                        <button onClick={() => addMember(team.id)}
                          className="bg-amber-500 text-white px-3 rounded-lg text-sm font-bold hover:bg-amber-400 transition-colors">Agregar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="flex border-t border-slate-100">
                <button onClick={() => openEdit(team)} className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-blue-500 transition-all">
                  <Icons.Edit /> Editar
                </button>
                <button onClick={() => handleDelete(team)} className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all border-l border-slate-100">
                  <Icons.Trash /> Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-400 font-medium">No se encontraron equipos</p>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingTeam ? "Editar Equipo" : "Nuevo Equipo"}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Nombre del equipo</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_EMOJIS.map((e) => (
                <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${form.emoji === e ? "border-amber-400 bg-amber-50 scale-110" : "border-slate-100 hover:border-slate-300"}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_COLORS.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${form.color === c ? "border-slate-800 scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Integrantes (separados por coma)</label>
            <input value={form.members} onChange={(e) => setForm({ ...form, members: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              placeholder="Nombre1, Nombre2, Nombre3..." />
          </div>
          <button onClick={handleSave}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition-colors mt-2 shadow-sm">
            {editingTeam ? "Guardar Cambios" : "Crear Equipo"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ─────────────────────────────────────────────
// GAMES VIEW
// ─────────────────────────────────────────────
const CATEGORIES = ["mental", "physical", "creative", "adventure"];
const CATEGORY_LABELS = { mental: "Mental", physical: "Físico", creative: "Creativo", adventure: "Aventura" };
const GAME_ICONS = ["🧠", "🏃", "🎨", "🗺️", "🎤", "🎵", "💦", "🎭", "🎯", "⚽", "🏀", "🎲"];

const GamesView = ({ games, setGames, isAdmin, showToast }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", category: "mental", icon: "🧠", status: "pending" });

  const filtered = games.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || g.status === filter;
    return matchSearch && matchFilter;
  });

  const openCreate = () => {
    setEditingGame(null);
    setForm({ name: "", description: "", category: "mental", icon: "🧠", status: "pending" });
    setModalOpen(true);
  };
  const openEdit = (game) => {
    setEditingGame(game);
    setForm({ name: game.name, description: game.description, category: game.category, icon: game.icon, status: game.status });
    setModalOpen(true);
  };
  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingGame) {
      setGames((prev) => prev.map((g) => (g.id === editingGame.id ? { ...g, ...form } : g)));
      showToast(`Juego "${form.name}" actualizado`, "success");
    } else {
      setGames((prev) => {
        const maxId = prev.reduce((max, g) => Math.max(max, Number(g.id) || 0), 0);
        return [...prev, { id: maxId + 1, ...form }];
      });
      showToast(`Juego "${form.name}" creado`, "success");
    }
    setModalOpen(false);
  };
  const toggleStatus = (game) => {
    const newStatus = game.status === "completed" ? "pending" : "completed";
    setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, status: newStatus } : g)));
    showToast(`"${game.name}" marcado como ${newStatus === "completed" ? "realizado" : "pendiente"}`, "success");
  };
  const handleDelete = (game) => {
    setGames((prev) => prev.filter((g) => g.id !== game.id));
    showToast(`Juego "${game.name}" eliminado`, "info");
  };

  const completedCount = games.filter((g) => g.status === "completed").length;
  const pendingCount = games.filter((g) => g.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Juegos</h1>
          <p className="text-slate-400 text-sm mt-1">{completedCount} realizados · {pendingCount} pendientes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56"><SearchBar value={search} onChange={setSearch} placeholder="Buscar juego..." /></div>
          {isAdmin && (
            <button onClick={openCreate}
              className="bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm shadow-amber-200 whitespace-nowrap">
              <Icons.Plus /> Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "Todos", count: games.length },
          { id: "completed", label: "Realizados", count: completedCount },
          { id: "pending", label: "Pendientes", count: pendingCount },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === tab.id
                ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}>
            {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((game) => (
          <div key={game.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: game.status === "completed" ? "#10B98118" : "#F59E0B18" }}>
                  {game.icon}
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  game.status === "completed"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}>
                  {game.status === "completed" ? "✓ Realizado" : "◷ Pendiente"}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{game.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{game.description}</p>
              <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                {CATEGORY_LABELS[game.category] || game.category}
              </span>
            </div>
            {isAdmin && (
              <div className="flex border-t border-slate-100">
                <button onClick={() => toggleStatus(game)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-emerald-500 transition-all">
                  {game.status === "completed" ? <><Icons.Clock /> Pendiente</> : <><Icons.Check /> Realizado</>}
                </button>
                <button onClick={() => openEdit(game)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-blue-500 transition-all border-l border-slate-100">
                  <Icons.Edit /> Editar
                </button>
                <button onClick={() => handleDelete(game)} className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all border-l border-slate-100">
                  <Icons.Trash /> Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎮</p>
          <p className="text-slate-400 font-medium">No se encontraron juegos</p>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingGame ? "Editar Juego" : "Nuevo Juego"}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Ícono</label>
            <div className="flex flex-wrap gap-2">
              {GAME_ICONS.map((ic) => (
                <button key={ic} onClick={() => setForm({ ...form, icon: ic })}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${form.icon === ic ? "border-amber-400 bg-amber-50 scale-110" : "border-slate-100 hover:border-slate-300"}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1.5">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, category: c })}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${form.category === c ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
          {editingGame && (
            <div>
              <label className="text-sm font-semibold text-slate-600 block mb-1.5">Estado</label>
              <div className="flex gap-2">
                {["pending", "completed"].map((s) => (
                  <button key={s} onClick={() => setForm({ ...form, status: s })}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${form.status === s ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                    {s === "completed" ? "Realizado" : "Pendiente"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleSave}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 rounded-xl transition-colors mt-2 shadow-sm">
            {editingGame ? "Guardar Cambios" : "Crear Juego"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

// ─────────────────────────────────────────────
// RANKING VIEW
// ─────────────────────────────────────────────
const RankingView = ({ teams }) => {
  const sorted = useMemo(() => [...teams].sort((a, b) => b.points - a.points), [teams]);
  const maxPoints = sorted.length > 0 ? sorted[0].points : 1;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Ranking</h1>
        <p className="text-slate-400 text-sm mt-1">Tabla de posiciones en tiempo real</p>
      </div>

      {/* Podium for top 3 */}
      {sorted.length >= 3 && (
        <div className="flex items-end justify-center gap-3 md:gap-5 py-6">
          {[sorted[1], sorted[0], sorted[2]].map((team, idx) => {
            const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const heights = { 1: "h-36 md:h-44", 2: "h-28 md:h-36", 3: "h-24 md:h-28" };
            return (
              <div key={team.id} className="flex flex-col items-center">
                <div className="text-3xl mb-2">{medals[rank - 1]}</div>
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-lg mb-2"
                  style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}cc)` }}>
                  {team.emoji}
                </div>
                <p className="font-bold text-slate-800 text-sm md:text-base text-center">{team.name}</p>
                <p className="text-xs text-slate-400 font-semibold">{team.points} pts</p>
                <div className={`w-20 md:w-28 ${heights[rank]} mt-3 rounded-t-2xl`}
                  style={{ background: `linear-gradient(180deg, ${team.color}30, ${team.color}10)`, borderTop: `3px solid ${team.color}` }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {sorted.map((team, idx) => (
          <div key={team.id} className={`flex items-center gap-4 p-4 md:p-5 ${idx > 0 ? "border-t border-slate-100" : ""} hover:bg-slate-50/50 transition-colors`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
              idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-600" : idx === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-400"
            }`}>
              {idx + 1}
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
              style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}cc)` }}>
              {team.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">{team.name}</p>
              <p className="text-xs text-slate-400">{team.members.length} integrantes</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 md:w-40 h-2.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(team.points / maxPoints) * 100}%`, background: team.color }} />
              </div>
              <p className="font-black text-slate-800 text-base min-w-14 text-right">{team.points}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────
const AppLayout = ({ role, onLogout }) => {
  const [currentView, setCurrentView] = useState(role === "admin" ? "dashboard" : "teams");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState(() => loadStoredState(STORAGE_KEYS.teams, initialTeams));
  const [games, setGames] = useState(() => loadStoredState(STORAGE_KEYS.games, initialGames));
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let ignore = false;

    const hydrate = async () => {
      try {
        const cloudData = await loadFromSupabase();
        if (!cloudData || ignore) return;

        if (cloudData.teams.length > 0) {
          setTeams(cloudData.teams);
        }
        if (cloudData.games.length > 0) {
          setGames(cloudData.games);
        }
      } catch {
        // Si Supabase falla, queda funcionando con localStorage.
      }
    };

    hydrate();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    if (!supabase) return;

    const timeoutId = setTimeout(() => {
      syncToSupabase(teams, games).catch(() => {
        // Fallo de red/permiso: no interrumpe UX local.
      });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [teams, games]);

  useEffect(() => {
    if (!supabase) return;

    const intervalId = setInterval(async () => {
      try {
        const cloudData = await loadFromSupabase();
        if (!cloudData) return;

        const nextTeams = [...cloudData.teams].sort(sortById);
        const nextGames = [...cloudData.games].sort(sortById);

        setTeams((prev) => (JSON.stringify([...prev].sort(sortById)) === JSON.stringify(nextTeams) ? prev : nextTeams));
        setGames((prev) => (JSON.stringify([...prev].sort(sortById)) === JSON.stringify(nextGames) ? prev : nextGames));
      } catch {
        // Si falla polling, se reintenta en el próximo ciclo.
      }
    }, 8000);

    return () => clearInterval(intervalId);
  }, []);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const isAdmin = role === "admin";

  const renderView = () => {
    switch (currentView) {
      case "dashboard": return <AdminDashboard teams={teams} games={games} setCurrentView={setCurrentView} />;
      case "teams": return <TeamsView teams={teams} setTeams={setTeams} isAdmin={isAdmin} showToast={showToast} />;
      case "games": return <GamesView games={games} setGames={setGames} isAdmin={isAdmin} showToast={showToast} />;
      case "ranking": return <RankingView teams={teams} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80">
      <Sidebar role={role} currentView={currentView} setCurrentView={setCurrentView}
        onLogout={onLogout} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Top bar (mobile) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎲</span>
          <span className="font-black text-slate-800" style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif" }}>
            Cassarino <span className="text-amber-500">Olimpiadas</span>
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* Content area */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {renderView()}
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} key={toast.key} />}
    </div>
  );
};

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Nunito', sans-serif; }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      {!auth ? <LoginScreen onLogin={setAuth} /> : <AppLayout role={auth} onLogout={() => setAuth(null)} />}
    </>
  );
}