import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Home, Briefcase, MessageCircle, User, Bell, Search, ChevronLeft, ChevronRight, MapPin, Code2, Cpu, Megaphone,
  Calculator, Landmark, Hammer, Zap, Sparkles, Truck, Palette, GraduationCap, Car, ShieldCheck, Repeat, Plus,
  Camera, Clock, Wrench, Package, Send, Globe, Check, Navigation, LogOut, X, Lock, Mail, AlertTriangle, Users, Loader2, ExternalLink, CheckCheck, ImagePlus, Crosshair, BellOff, Sun, Moon, Plane, FileText, Building2, Trash2, Handshake,
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { api, cvComplete, supabase, uploadAvatar, type Bid, type Chat, type Job, type Msg, type Notice, type Person, type Profile, type Cv } from "./api";
type Lang = "en" | "si" | "ta";
type Tab = "home" | "jobs" | "chats" | "me";

const T = {
  en: { welcome: "Lend a hand.\nEarn a living.", sub: "Hire skilled people nearby, or get paid for yours.", choose: "Choose your language", cont: "Continue", login: "Log in", signup: "Sign up", phone: "Mobile number", name: "Full name", otp: "Send code", verify: "Verify & continue", want: "I want to", hire: "Hire", earn: "Earn", both: "Both", hi: "Good morning", search: "What do you need help with?", cats: "Categories", near: "Jobs near you", seeAll: "See all", avail: "You're available now", availSub: "3 jobs in Wattala match your skills", home: "Home", jobs: "Jobs", chats: "Chats", me: "Me", find: "Find work", posts: "My posts", post: "Post a job", bid: "Place a bid", labour: "Labour", mat: "Materials", mode: "Current mode", client: "Client", expert: "Expert", sw: "Switch to", out: "Log out", msg: "Message…", code: "Enter the 4-digit code sent to" },
  si: { welcome: "අතක් දෙන්න.\nආදායමක් ලබන්න.", sub: "ළඟම සිටින දක්ෂයින් කුලියට ගන්න, නැත්නම් ඔබේ දක්ෂතාවයෙන් උපයන්න.", choose: "භාෂාව තෝරන්න", cont: "ඉදිරියට", login: "පිවිසෙන්න", signup: "ලියාපදිංචි වන්න", phone: "ජංගම අංකය", name: "සම්පූර්ණ නම", otp: "කේතය යවන්න", verify: "තහවුරු කරන්න", want: "මට අවශ්‍යයි", hire: "කුලියට ගන්න", earn: "උපයන්න", both: "දෙකම", hi: "සුභ උදෑසනක්", search: "ඔබට කුමන උදව්වක්ද?", cats: "කාණ්ඩ", near: "ළඟම රැකියා", seeAll: "සියල්ල", avail: "ඔබ දැන් සූදානම්", availSub: "වත්තලේ රැකියා 3ක් ඔබට ගැලපේ", home: "මුල", jobs: "රැකියා", chats: "කතාබස්", me: "මම", find: "වැඩ සොයන්න", posts: "මගේ පළකිරීම්", post: "රැකියාවක් පළ කරන්න", bid: "ලංසුවක් තබන්න", labour: "ශ්‍රමය", mat: "ද්‍රව්‍ය", mode: "වත්මන් ආකාරය", client: "සේවාලාභී", expert: "විශේෂඥ", sw: "මාරු වන්න", out: "ඉවත් වන්න", msg: "පණිවිඩය…", code: "යැවූ ඉලක්කම් 4 කේතය ඇතුළත් කරන්න" },
  ta: { welcome: "கை கொடுங்கள்.\nவருமானம் பெறுங்கள்.", sub: "அருகிலுள்ள திறமையானவர்களை அமர்த்துங்கள், அல்லது உங்கள் திறமையால் சம்பாதியுங்கள்.", choose: "மொழியைத் தேர்ந்தெடுக்கவும்", cont: "தொடரவும்", login: "உள்நுழை", signup: "பதிவு செய்", phone: "கைபேசி எண்", name: "முழு பெயர்", otp: "குறியீட்டை அனுப்பு", verify: "சரிபார்த்து தொடர்", want: "நான் விரும்புவது", hire: "அமர்த்த", earn: "சம்பாதிக்க", both: "இரண்டும்", hi: "காலை வணக்கம்", search: "உங்களுக்கு என்ன உதவி தேவை?", cats: "வகைகள்", near: "அருகிலுள்ள வேலைகள்", seeAll: "அனைத்தும்", avail: "நீங்கள் இப்போது தயார்", availSub: "வத்தளையில் 3 வேலைகள் பொருந்துகின்றன", home: "முகப்பு", jobs: "வேலைகள்", chats: "அரட்டை", me: "நான்", find: "வேலை தேடு", posts: "என் பதிவுகள்", post: "வேலை பதிவிடு", bid: "ஏலம் இடு", labour: "உழைப்பு", mat: "பொருட்கள்", mode: "தற்போதைய முறை", client: "வாடிக்கையாளர்", expert: "நிபுணர்", sw: "மாறு", out: "வெளியேறு", msg: "செய்தி…", code: "அனுப்பப்பட்ட 4 இலக்க குறியீட்டை உள்ளிடவும்" },
};
type Dict = typeof T.en;

const CATS = [
  { id: "it", icon: Code2, en: "IT & Software", si: "IT සහ මෘදුකාංග", ta: "IT & மென்பொருள்", tint: "bg-[#e6eefc] text-[#2457c5]" },
  { id: "hw", icon: Cpu, en: "IT Hardware", si: "IT දෘඩාංග", ta: "IT வன்பொருள்", tint: "bg-[#e7f4ef] text-[#0f7a6c]" },
  { id: "mk", icon: Megaphone, en: "Marketing & PR", si: "අලෙවිකරණය", ta: "சந்தைப்படுத்தல்", tint: "bg-[#fde6d8] text-[#c2410c]" },
  { id: "ac", icon: Calculator, en: "Accounting", si: "ගිණුම්කරණය", ta: "கணக்கியல்", tint: "bg-[#f1e8fb] text-[#7c3aed]" },
  { id: "bf", icon: Landmark, en: "Banking & Finance", si: "බැංකු සහ මූල්‍ය", ta: "வங்கி & நிதி", tint: "bg-[#fdf3d6] text-[#a16207]" },
  { id: "hr", icon: Hammer, en: "Home & Renovation", si: "නිවාස අලුත්වැඩියා", ta: "வீடு புதுப்பித்தல்", tint: "bg-[#f6e7e1] text-[#9a3412]" },
  { id: "el", icon: Zap, en: "Electrical & Plumbing", si: "විදුලි සහ ජල", ta: "மின் & குழாய்", tint: "bg-[#fff1cc] text-[#b45309]" },
  { id: "cl", icon: Sparkles, en: "Cleaning", si: "පිරිසිදු කිරීම", ta: "சுத்தம்", tint: "bg-[#e3f3f7] text-[#0e7490]" },
  { id: "lb", icon: Truck, en: "Moving & Labour", si: "ප්‍රවාහන සහ ශ්‍රම", ta: "இடமாற்றம் & உழைப்பு", tint: "bg-[#ececec] text-[#3f3f46]" },
  { id: "ds", icon: Palette, en: "Design & Creative", si: "නිර්මාණ", ta: "வடிவமைப்பு", tint: "bg-[#fde4ef] text-[#be185d]" },
  { id: "ed", icon: GraduationCap, en: "Tutoring", si: "උපකාරක පන්ති", ta: "பயிற்சி", tint: "bg-[#e5f0e0] text-[#3f6212]" },
  { id: "av", icon: Plane, en: "Aviation", si: "ගුවන් සේවා", ta: "விமானப் போக்குவரத்து", tint: "bg-[#e0f2fe] text-[#0369a1]" },
  { id: "au", icon: Car, en: "Automotive", si: "වාහන", ta: "வாகனம்", tint: "bg-[#e7e9f5] text-[#3730a3]" },
];

// Cities used as a fallback location when GPS is unavailable.
const CITIES: Record<string, [number, number]> = {
  Colombo: [6.9271, 79.8612], Wattala: [6.9897, 79.8925], Kelaniya: [6.9553, 79.922], "Ja-Ela": [7.0744, 79.8919], Negombo: [7.2083, 79.8358],
  Gampaha: [7.0873, 79.9998], Dehiwala: [6.8517, 79.8653], Moratuwa: [6.773, 79.8816], Kandy: [7.2906, 80.6337], Galle: [6.0535, 80.221],
  Matara: [5.9549, 80.555], Kurunegala: [7.4818, 80.3609], Anuradhapura: [8.3114, 80.4037], Jaffna: [9.6615, 80.0255], Trincomalee: [8.5874, 81.2152],
  Batticaloa: [7.7102, 81.6924], Ratnapura: [6.6828, 80.3992], Badulla: [6.9934, 81.055],
};
// Categories that need a verified skilled profile to bid on.
const EXPERT_CATS = ["it", "hw", "mk", "ac", "bf", "el", "ds", "ed", "au", "av"];

const PRIORITY = {
  urgent: { label: "Urgent", color: "#dc2626", soft: "bg-[#fee2e2] text-[#b91c1c]" },
  high: { label: "High", color: "#dc2626", soft: "bg-[#fee2e2] text-[#b91c1c]" },
  medium: { label: "Medium", color: "#eab308", soft: "bg-[#fef9c3] text-[#854d0e]" },
  low: { label: "Low", color: "#16a34a", soft: "bg-[#dcfce7] text-[#166534]" },
} as const;
type Priority = keyof typeof PRIORITY;
const prio = (j: { priority?: string }) => PRIORITY[(j.priority as Priority) ?? "medium"] ?? PRIORITY.medium;
function PriorityChip({ j }: { j: { priority?: string } }) {
  const p = prio(j);
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${p.soft}`}><span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />{p.label}</span>;
}
const rs = (n: number) => "Rs " + Number(n || 0).toLocaleString();
// Community-added categories ("x-<slug>") get a neutral style and their saved name.
const CUSTOM_CATS: Record<string, string> = {};
const customCat = (id: string) => { const n = CUSTOM_CATS[id] ?? id.slice(2).split("-").map(w => (w[0]?.toUpperCase() ?? "") + w.slice(1)).join(" "); return { id, icon: Package, en: n, si: n, ta: n, tint: "bg-[#efe9df] text-[#57534e]" }; };
const catOf = (id: string) => CATS.find(c => c.id === id) ?? (id?.startsWith("x-") ? customCat(id) : CATS[0]);
const ago = (iso: string) => {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};
const kmBetween = (a: [number, number], b: [number, number]) => {
  const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLng = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLng / 2) ** 2;
  return Math.round(12742 * Math.asin(Math.sqrt(h)) * 10) / 10;
};
const jobLL = (j: Job): [number, number] => (j.ll as [number, number]) ?? CITIES[j.city] ?? CITIES.Colombo;
const gmapsDir = (ll: [number, number]) => `https://www.google.com/maps/dir/?api=1&destination=${ll[0]},${ll[1]}`;
const nearestCity = (ll: [number, number]) => Object.entries(CITIES).sort((a, b) => kmBetween(ll, a[1]) - kmBetween(ll, b[1]))[0][0];
const yearsFor = (p: Profile, cat: string) => Number(p.skillYears?.[cat] ?? p.years) || 0;
const canBid = (p: Profile, cat: string, minYears = 0) => yearsFor(p, cat) >= minYears && (!EXPERT_CATS.includes(cat) || (p.level === "skilled" && p.skills?.includes(cat) && !!p.nic));

type Loc = { ll: [number, number]; source: "gps" | "city" };
type Ctx = { t: Dict; lang: Lang; me: Profile; loc: Loc };

// Keeps a crash in one screen from blanking the whole app.
class Boundary extends Component<{ children: ReactNode; onReset?: () => void }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error, info: ErrorInfo) { console.log("atha UI error", err, info.componentStack); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="absolute inset-0 z-[2500] bg-cream flex flex-col items-center justify-center text-center px-8">
        <span className="w-16 h-16 rounded-[22px] bg-flame-soft text-flame grid place-items-center"><AlertTriangle size={28} /></span>
        <p className="font-extrabold text-xl mt-4">Something went wrong</p>
        <p className="text-sm text-ink/55 mt-1 break-words max-w-full">{this.state.err.message}</p>
        <button onClick={() => { this.setState({ err: null }); this.props.onReset?.(); }} className="mt-6 h-12 px-6 rounded-full bg-flame text-white font-bold">Go back</button>
        <button onClick={() => location.reload()} className="mt-3 text-sm font-semibold text-ink/50">Reload app</button>
      </div>
    );
  }
}

// `new Notification()` throws on Android Chrome; use the service-worker path when available.
async function systemNotify(title: string, body: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: undefined,
            actionTypeId: "",
            extra: null,
          },
        ],
      });
    } catch (e) {
      console.log("Native local notification failed", e);
    }
    return;
  }

  // Web browser fallback
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { new Notification(title, { body }); }
  catch { navigator.serviceWorker?.getRegistration().then(r => r?.showNotification(title, { body })).catch(() => {}); }
}

export default function App() {
  const [stage, setStage] = useState<"boot" | "lang" | "auth" | "finish" | "app">("boot");
  const [gps, setGps] = useState<[number, number] | null>(null);
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("atha-lang") as Lang) || "en");
  const [me, setMe] = useState<Profile | null>(null);
  const t = { ...T.en, ...T[lang] } as Dict;
  useEffect(() => { localStorage.setItem("atha-lang", lang); }, [lang]);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setStage("lang");
      try { const p = (await api<{ profile: Profile }>("/profile")).profile; setMe(p); setStage(p.onboarded === false ? "finish" : "app"); } catch { setStage("lang"); }
    });
  }, []);
  // Precise location is requested on the very first screen. Browsers (especially iOS Safari) only
  // show the permission dialog reliably from a tap, so we also show an explicit prompt.
  const [geo, setGeo] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const askLocation = useCallback(() => {
    if (!navigator.geolocation) return setGeo("denied");
    setGeo("asking");
    navigator.geolocation.getCurrentPosition(
      p => { setGps([p.coords.latitude, p.coords.longitude]); setGeo("granted"); },
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);
  useEffect(() => {
    if (stage !== "lang" || geo !== "idle") return;
    navigator.permissions?.query({ name: "geolocation" }).then(r => { if (r.state === "granted") askLocation(); else if (r.state === "denied") setGeo("denied"); }).catch(() => {});
  }, [stage, geo, askLocation]);
  const logout = async () => { await supabase.auth.signOut(); setMe(null); setStage("auth"); };
  return (
    <div className="app-h grid place-items-center sm:p-6">
      <div className="relative w-full sm:w-[390px] app-h phone-frame bg-cream sm:rounded-[52px] sm:ring-[10px] ring-black overflow-hidden flex flex-col shadow-2xl">
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-[2000]" />
        <Boundary>
        {stage === "boot" && <div className="flex-1 grid place-items-center"><Logo big /></div>}
        {stage === "lang" && <LangScreen lang={lang} setLang={setLang} t={t} geo={geo} ask={askLocation} next={() => { if (geo === "idle") askLocation(); setStage("auth"); }} />}
        {stage === "auth" && <AuthScreen t={t} lang={lang} gps={gps} setGps={setGps} back={() => setStage("lang")} done={p => { setMe(p); setStage(p.onboarded === false ? "finish" : "app"); }} />}
        {stage === "finish" && me && <AuthScreen t={t} lang={lang} gps={gps} setGps={setGps} finish={me} back={logout} done={p => { setMe(p); setStage("app"); }} />}
        {stage === "app" && me && !me.avatar && <AvatarGate me={me} done={setMe} logout={logout} />}
        {stage === "app" && me && me.avatar && <MainApp t={t} lang={lang} setLang={setLang} me={me} setMe={setMe} logout={logout} />}
        </Boundary>
      </div>
    </div>
  );
}

/* ---------- Onboarding ---------- */
type Provider = "google" | "apple" | "azure";
const PROVIDERS: [Provider, string, React.ReactNode][] = [
  ["google", "Google", <svg key="g" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" /><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" /></svg>],
  ["apple", "Apple", <svg key="a" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" /></svg>],
  ["azure", "Microsoft", <svg key="m" viewBox="0 0 24 24" width="17" height="17"><path fill="#F25022" d="M1 1h10.5v10.5H1z" /><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" /><path fill="#00A4EF" d="M1 12.5h10.5V23H1z" /><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" /></svg>],
];

function SocialButtons({ setErr }: { setErr: (e: string) => void }) {
  const [busy, setBusy] = useState<Provider | "">("");
  const go = async (provider: Provider) => {
    setBusy(provider); setErr("");
    const label = provider === "azure" ? "Microsoft" : provider[0].toUpperCase() + provider.slice(1);
    try {
      // Supabase's public settings say which providers are switched on; fail clearly instead of a blank redirect.
      const st = await fetch(`https://${projectId}.supabase.co/auth/v1/settings`, { headers: { apikey: publicAnonKey } }).then(r => r.json());
      if (!st.external?.[provider]) { setErr(`${label} sign-in isn't switched on yet. Enable it in Supabase → Authentication → Providers.`); setBusy(""); return; }
    } catch { /* continue and let Supabase report */ }
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + window.location.pathname, scopes: provider === "azure" ? "email" : undefined, skipBrowserRedirect: true } });
    if (error || !data?.url) { setErr(error?.message ?? `Couldn't start ${label} sign-in.`); setBusy(""); return; }
    // Google, Apple and Microsoft refuse to load inside frames (like the Make preview), so leave the frame.
    if (window.top !== window.self) {
      const w = window.open(data.url, "_blank");
      if (!w) setErr(`Open the published app in its own tab to use ${label} sign-in.`);
      setBusy("");
    } else window.location.assign(data.url);
  };
  return (
    <div className="grid grid-cols-3 gap-2">
      {PROVIDERS.map(([k, l, icon]) => (
        <button key={k} onClick={() => go(k)} disabled={!!busy} className="h-12 rounded-2xl bg-white flex items-center justify-center gap-1.5 text-sm font-bold disabled:opacity-60">
          {busy === k ? <Loader2 size={16} className="animate-spin" /> : icon}{l}
        </button>
      ))}
    </div>
  );
}

function OtpInput({ value, set }: { value: string; set: (v: string) => void }) {
  return <input inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={value} onChange={e => set(e.target.value.replace(/\D/g, ""))} placeholder="••••••" className="w-full h-16 rounded-2xl bg-white text-center text-3xl font-extrabold tracking-[0.5em] outline-none" />;
}

// Handles password login, email+password sign-up with email/SMS codes, and onboarding for Google/Apple/Microsoft accounts (`finish`).
function AuthScreen({ t, lang, back, done, gps, setGps, finish }: { t: Dict; lang: Lang; back: () => void; done: (p: Profile) => void; gps: [number, number] | null; setGps: (ll: [number, number]) => void; finish?: Profile }) {
  const [mode, setMode] = useState<"login" | "signup">(finish ? "signup" : "signup");
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState<"" | "email" | "phone">("");
  const [code, setCode] = useState("");
  const [f, setF] = useState({ isOrg: false, name: finish?.name ?? "", orgName: "", email: finish?.email ?? "", phone: "", password: "", city: "", address: "", role: "both" as Profile["role"], level: "casual" as Profile["level"], skills: [] as string[], years: "", nic: "", bio: "", home: null as [number, number] | null, skillYears: {} as Record<string, string>, skillNames: {} as Record<string, string> });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : finish?.avatar ?? "", [photo, finish]);
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const role = f.isOrg ? "hire" : f.role;
  const earns = role !== "hire";
  const steps = earns ? 3 : 2;
  const phoneE164 = "+94" + f.phone.replace(/\D/g, "").replace(/^0/, "");

  // Fill "Where are you?" from precise GPS: nearest city + street/area via OpenStreetMap.
  const applyGps = useCallback(async (ll: [number, number]) => {
    setLocBusy(true);
    let area = "";
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=17&lat=${ll[0]}&lon=${ll[1]}`, { headers: { "Accept-Language": "en" } });
      const a = (await r.json()).address ?? {};
      area = [a.road, a.suburb ?? a.neighbourhood ?? a.village ?? a.town].filter(Boolean).join(", ");
    } catch { /* city alone is enough */ }
    setF(v => ({ ...v, home: ll, city: nearestCity(ll), address: v.address || area }));
    setLocBusy(false);
  }, []);
  const detect = () => {
    if (!navigator.geolocation) return setErr("This device doesn't support location.");
    setLocBusy(true); setErr("");
    navigator.geolocation.getCurrentPosition(
      p => { const ll: [number, number] = [p.coords.latitude, p.coords.longitude]; setGps(ll); applyGps(ll); },
      e => { setLocBusy(false); setErr(e.code === e.PERMISSION_DENIED ? "Location is blocked — allow it in your browser settings, or pick your city below." : "Couldn't get your location. Pick your city below."); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };
  useEffect(() => { if (step === 1 && gps && !f.home) applyGps(gps); }, [step, gps, f.home, applyGps]);

  const profileBody = () => ({
    name: f.isOrg ? f.orgName.trim() : f.name.trim(), isOrg: f.isOrg, orgName: f.isOrg ? f.orgName.trim() : "", phone: f.phone ? phoneE164 : "",
    city: f.city, address: f.address, home: f.home, role, level: earns ? f.level : "casual", skills: earns && f.level === "skilled" ? f.skills : [],
    years: earns && f.level === "skilled" ? Math.max(0, ...Object.values(skillYearsNum({ skills: f.skills, years: f.skillYears, names: f.skillNames }))) : 0,
    skillYears: earns && f.level === "skilled" ? skillYearsNum({ skills: f.skills, years: f.skillYears, names: f.skillNames }) : {}, skillNames: f.skillNames, nic: f.nic, bio: f.bio, onboarded: true,
  });
  const saveProfile = async () => {
    let p = (await api<{ profile: Profile }>("/profile", { method: "PUT", body: profileBody() })).profile;
    if (photo) p = await uploadAvatar(await squarePhoto(photo));
    return p;
  };
  // After the account exists: try SMS verification; if no SMS provider is set up, continue without it.
  const afterEmail = async () => {
    const p = await saveProfile();
    if (f.phone && !p.phoneVerified) {
      const { error } = await supabase.auth.updateUser({ phone: phoneE164 });
      if (!error) { setCode(""); setOtp("phone"); setBusy(false); return; }
      console.log("SMS verification unavailable", error.message);
    }
    done(p);
  };

  const login = async () => {
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    if (error) { setErr(error.message); setBusy(false); return; }
    try { done((await api<{ profile: Profile }>("/profile")).profile); } catch (e: any) { setErr(/404|not found/i.test(e.message) ? "Signed in, but the atha server is out of date. Redeploy the edge function in Make settings, then try again." : e.message); setBusy(false); }
  };
  const signup = async () => {
    setBusy(true); setErr("");
    try {
      if (finish) { done(await saveProfile()); return; }
      const chk = await api<{ ok: boolean; reason?: string }>("/check-email", { body: { email: f.email.trim() } }).catch(() => ({ ok: true } as { ok: boolean; reason?: string }));
      if (!chk.ok) throw new Error(chk.reason ?? "Please use a real email address.");
      const { data, error } = await supabase.auth.signUp({ email: f.email.trim(), password: f.password, options: { data: { name: profileBody().name }, emailRedirectTo: window.location.origin + window.location.pathname } });
      if (error) throw error;
      if (data.user && !data.user.identities?.length) throw new Error("That email already has an account — log in instead.");
      if (data.session) await afterEmail();
      else { setCode(""); setOtp("email"); setBusy(false); }
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setErr("");
    try {
      if (otp === "email") {
        const { error } = await supabase.auth.verifyOtp({ email: f.email.trim(), token: code, type: "email" });
        if (error) throw error;
        await afterEmail();
      } else {
        const { error } = await supabase.auth.verifyOtp({ phone: phoneE164, token: code, type: "phone_change" });
        if (error) throw error;
        done((await api<{ profile: Profile }>("/profile", { method: "PUT", body: {} })).profile);
      }
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const resend = async () => {
    setErr("");
    const { error } = otp === "email" ? await supabase.auth.resend({ type: "signup", email: f.email.trim() }) : await supabase.auth.updateUser({ phone: phoneE164 });
    setErr(error ? error.message : "");
    if (!error) alert("New code sent.");
  };
  const skipPhone = async () => { setBusy(true); try { done((await api<{ profile: Profile }>("/profile")).profile); } catch (e: any) { setErr(e.message); setBusy(false); } };

  const nextStep = () => {
    setErr("");
    if (step === 0) {
      if (!photo && !finish?.avatar) return setErr(f.isOrg ? "Add your organisation logo — it's required for every account." : "Add a profile photo — it's required for every account.");
      if (f.isOrg ? !f.orgName.trim() : !f.name.trim()) return setErr(f.isOrg ? "Enter your organisation name." : "Enter your name.");
      if (!finish && (!f.email.includes("@") || f.password.length < 6)) return setErr("Enter a valid email and a password of at least 6 characters.");
      if (f.phone && f.phone.replace(/\D/g, "").replace(/^0/, "").length !== 9) return setErr("Enter a 9-digit Sri Lankan mobile number, e.g. 77 123 4567.");
    }
    if (step === 1 && !f.city) return setErr("Choose your city, or use your precise location.");
    if (step === 2 && f.level === "skilled" && (!f.skills.length || !f.nic)) return setErr("Skilled profiles need at least one skill and an NIC number.");
    if (step === 2 && f.level === "skilled" && missingYears({ skills: f.skills, years: f.skillYears, names: f.skillNames }).length) return setErr("Enter your years of experience for each skill.");
    if (step < steps - 1) setStep(step + 1); else signup();
  };

  if (otp) return (
    <div className="flex-1 flex flex-col px-6 pt-14 pb-[max(2rem,env(safe-area-inset-bottom))] overflow-y-auto">
      <div className="rise flex-1 flex flex-col" key={otp}>
        <span className="w-16 h-16 rounded-[22px] bg-flame text-white grid place-items-center mt-4">{otp === "email" ? <Mail size={28} /> : <MessageCircle size={28} />}</span>
        <h2 className="text-[28px] font-extrabold mt-5 leading-tight">{otp === "email" ? "Check your email" : "Verify your phone"}</h2>
        <p className="text-sm text-ink/60 mt-2">We sent a 6-digit code to <b className="text-ink">{otp === "email" ? f.email.trim() : phoneE164}</b>. Enter it below.</p>
        {otp === "email" && <p className="text-xs text-ink/45 mt-2">Got a link instead? Tap it on this device to finish signing up.</p>}
        <div className="mt-6"><OtpInput value={code} set={setCode} /></div>
        <Err msg={err} />
        <button onClick={resend} className="mt-4 text-sm font-bold text-flame">Resend code</button>
        <div className="mt-auto pt-6">
          <Primary busy={busy} disabled={code.length < 6} onClick={verify}>Verify</Primary>
          {otp === "phone" && <button onClick={skipPhone} className="w-full mt-3 text-sm font-semibold text-ink/50">Skip — verify phone later</button>}
        </div>
      </div>
    </div>
  );

  const titles = [finish ? "Finish your profile" : t.signup, "Where are you?", "Your skills"];
  return (
    <div className="flex-1 flex flex-col px-6 pt-14 pb-[max(2rem,env(safe-area-inset-bottom))] overflow-y-auto">
      <button onClick={step ? () => setStep(step - 1) : back} className="w-10 h-10 shrink-0 rounded-full bg-white grid place-items-center">{step || !finish ? <ChevronLeft size={20} /> : <LogOut size={17} />}</button>
      <div className="rise flex-1 flex flex-col" key={mode + step}>
        <h2 className="text-[28px] font-extrabold mt-6">{mode === "signup" ? titles[step] : t.login}</h2>
        {mode === "signup" && <div className="flex gap-1.5 mt-3">{Array.from({ length: steps }).map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-flame" : "bg-ink/10"}`} />)}</div>}
        {step === 0 && !finish && <>
          <div className="mt-5 grid grid-cols-2 p-1 bg-white rounded-full">
            {(["login", "signup"] as const).map(m => <button key={m} onClick={() => { setMode(m); setErr(""); }} className={`py-2.5 rounded-full text-sm font-bold transition ${mode === m ? "bg-ink text-white" : "text-ink/50"}`}>{m === "login" ? t.login : t.signup}</button>)}
          </div>
          <div className="mt-4"><SocialButtons setErr={setErr} /></div>
          <div className="flex items-center gap-3 mt-4 text-[11px] font-bold text-ink/35"><span className="h-px flex-1 bg-ink/10" />OR WITH EMAIL<span className="h-px flex-1 bg-ink/10" /></div>
        </>}
        <div className="mt-4 space-y-3">
          {step === 0 && <>
            {mode === "signup" && <div className="grid grid-cols-2 gap-2">
              {([[false, "I'm an individual", User], [true, "We're an organisation", Building2]] as const).map(([k, l, I]) => (
                <button key={l} onClick={() => setF({ ...f, isOrg: k })} className={`py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 text-sm font-bold border-2 ${f.isOrg === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><I size={18} />{l}</button>
              ))}
            </div>}
            {mode === "signup" && <PhotoPicker preview={preview} pick={setPhoto} label={f.isOrg ? "Add your organisation logo" : "Add a profile photo"} />}
            {mode === "signup" && (f.isOrg
              ? <Field label="Organisation name"><div className="flex items-center gap-2"><Building2 size={15} className="text-ink/40" /><input value={f.orgName} onChange={up("orgName")} placeholder="Lanka Builders (Pvt) Ltd" className={inputCls} /></div></Field>
              : <Field label={t.name}><input value={f.name} onChange={up("name")} placeholder="Dilani Perera" className={inputCls} /></Field>)}
            {!finish && <Field label={f.isOrg && mode === "signup" ? "Work email" : "Email"}><div className="flex items-center gap-2"><Mail size={15} className="text-ink/40" /><input type="email" value={f.email} onChange={up("email")} placeholder="you@example.com" className={inputCls} /></div></Field>}
            {mode === "signup" && <Field label={`${t.phone} — we'll text a code`}><div className="flex items-center gap-2"><span className="font-semibold text-ink/50">+94</span><input inputMode="tel" value={f.phone} onChange={up("phone")} placeholder="77 123 4567" className={inputCls} /></div></Field>}
            {!finish && <Field label="Password"><div className="flex items-center gap-2"><Lock size={15} className="text-ink/40" /><input type="password" value={f.password} onChange={up("password")} onKeyDown={e => e.key === "Enter" && mode === "login" && login()} placeholder="••••••" className={inputCls} /></div></Field>}
          </>}
          {step === 1 && <>
            <button onClick={detect} disabled={locBusy} className={`w-full rounded-2xl p-4 flex items-center gap-3 text-left ${f.home ? "bg-teal/10" : "bg-ink text-white"}`}>
              <span className={`w-11 h-11 rounded-full grid place-items-center shrink-0 ${f.home ? "bg-teal text-white" : "bg-flame"}`}>{locBusy ? <Loader2 size={19} className="animate-spin" /> : f.home ? <Check size={19} /> : <Crosshair size={19} />}</span>
              <span className="min-w-0"><span className={`block font-bold ${f.home ? "text-teal" : ""}`}>{f.home ? "Precise location detected" : "Use my precise location"}</span><span className={`block text-xs ${f.home ? "text-ink/55" : "text-white/60"}`}>{f.home ? "Tap to refresh · you can edit below" : "Auto-fills your city and area via GPS"}</span></span>
            </button>
            <Field label="City"><CitySelect value={f.city} set={v => setF({ ...f, city: v })} /></Field>
            <Field label="Area / street (optional)"><input value={f.address} onChange={up("address")} placeholder="Hendala Rd, Wattala North" className={inputCls} /></Field>
            {!f.isOrg && <div>
              <p className="text-xs font-semibold text-ink/50 mb-2">{t.want}</p>
              <div className="grid grid-cols-3 gap-2">
                {([["hire", t.hire, Briefcase], ["earn", t.earn, Wrench], ["both", t.both, Repeat]] as const).map(([k, l, I]) => (
                  <button key={k} onClick={() => setF({ ...f, role: k })} className={`py-3 rounded-2xl flex flex-col items-center gap-1.5 text-sm font-semibold border-2 ${f.role === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><I size={18} />{l}</button>
                ))}
              </div>
            </div>}
            {f.isOrg && <p className="text-xs text-ink/55 bg-white rounded-2xl p-3 flex gap-2"><Building2 size={15} className="text-flame shrink-0" />Organisations post jobs and review applicants' CVs, salary expectations and locations.</p>}
          </>}
          {step === 2 && <>
            <div className="grid grid-cols-2 gap-2">
              {([["casual", "Odd jobs", "Cleaning, moving, small help"], ["skilled", "Skilled expert", "Trade or professional skills"]] as const).map(([k, l, d]) => (
                <button key={k} onClick={() => setF({ ...f, level: k })} className={`p-3 rounded-2xl text-left border-2 ${f.level === k ? "border-flame bg-flame-soft" : "border-transparent bg-white"}`}><p className="font-bold text-sm">{l}</p><p className="text-[11px] text-ink/55 mt-0.5">{d}</p></button>
              ))}
            </div>
            {f.level === "casual" ? (
              <p className="text-xs text-ink/55 bg-white rounded-2xl p-3 flex gap-2"><ShieldCheck size={15} className="text-teal shrink-0" />You can bid on odd jobs (cleaning, moving, home help). Jobs needing expertise unlock once you add skills and your NIC.</p>
            ) : <>
              <div><p className="text-xs font-semibold text-ink/50 mb-2">Skills</p><SkillsEditor lang={lang} value={{ skills: f.skills, years: f.skillYears, names: f.skillNames }} set={v => setF({ ...f, skills: v.skills, skillYears: v.years, skillNames: v.names })} /></div>
              <Field label="NIC number"><input value={f.nic} onChange={up("nic")} placeholder="199012345678" className={inputCls} /></Field>
              <Field label="Short bio"><textarea value={f.bio} onChange={up("bio")} rows={2} placeholder="Certified electrician, 8 years in Gampaha district" className={inputCls + " resize-none"} /></Field>
            </>}
          </>}
        </div>
        <Err msg={err} />
        <div className="mt-auto pt-6">
          <Primary busy={busy} onClick={mode === "login" ? login : nextStep}>{mode === "login" ? t.login : step < steps - 1 ? t.cont : finish ? "Finish" : "Create account"}</Primary>
          <p className="text-center text-xs text-ink/40 mt-3">By continuing you agree to our Terms & Privacy</p>
        </div>
      </div>
    </div>
  );
}

function Logo({ big }: { big?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${big ? "w-12 h-12 rounded-2xl" : "w-9 h-9 rounded-xl"} bg-flame grid place-items-center text-white font-extrabold ${big ? "text-2xl" : "text-lg"}`}>a</div>
      <span className={`font-extrabold tracking-tight ${big ? "text-3xl" : "text-xl"}`}>atha</span>
    </div>
  );
}

function LangScreen({ lang, setLang, t, next, geo, ask }: { lang: Lang; setLang: (l: Lang) => void; t: Dict; next: () => void; geo: "idle" | "asking" | "granted" | "denied"; ask: () => void }) {
  const [hide, setHide] = useState(false);
  const opts: [Lang, string, string][] = [["en", "English", "Aa"], ["si", "සිංහල", "අ"], ["ta", "தமிழ்", "அ"]];
  return (
    <div className="flex-1 flex flex-col px-6 pt-16 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <Logo big />
      <div className="mt-10 relative rounded-[28px] bg-ink text-white p-6 overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-flame/30" />
        <div className="absolute right-6 bottom-6 w-16 h-16 rounded-full border-[6px] border-flame/70" />
        <h1 className="relative text-[30px] leading-[1.1] font-extrabold whitespace-pre-line">{t.welcome}</h1>
        <p className="relative text-sm text-white/65 mt-3 max-w-[85%]">{t.sub}</p>
      </div>
      <p className="mt-8 mb-3 text-sm font-semibold text-ink/60 flex items-center gap-1.5"><Globe size={15} />{t.choose}</p>
      <div className="space-y-2.5">
        {opts.map(([k, label, glyph]) => (
          <button key={k} onClick={() => setLang(k)} className={`w-full flex items-center gap-4 p-3.5 rounded-2xl bg-white border-2 transition ${lang === k ? "border-flame" : "border-transparent"}`}>
            <span className={`w-11 h-11 rounded-xl grid place-items-center text-lg font-bold ${lang === k ? "bg-flame text-white" : "bg-cream"}`}>{glyph}</span>
            <span className="font-semibold text-[17px] flex-1 text-left">{label}</span>
            <span className={`w-6 h-6 rounded-full grid place-items-center ${lang === k ? "bg-flame text-white" : "border-2 border-line"}`}>{lang === k && <Check size={14} strokeWidth={3} />}</span>
          </button>
        ))}
      </div>
      {!hide && geo !== "granted" && (
        <div className="absolute inset-0 z-[2100] bg-black/45 flex items-end">
          <div className="w-full bg-cream rounded-t-[32px] p-6 pb-9 rise">
            <div className="w-16 h-16 rounded-[22px] bg-flame text-white grid place-items-center"><Crosshair size={30} /></div>
            <h3 className="text-[24px] font-extrabold mt-4 leading-tight">{geo === "denied" ? "Location is blocked" : "Allow precise location"}</h3>
            <p className="text-sm text-ink/60 mt-2">{geo === "denied"
              ? "Turn on location for this site in your browser or phone settings, then tap Try again. You can still pick your city manually."
              : "atha uses GPS to show jobs and helpers near you and to fill in your address when you sign up."}</p>
            <Primary busy={geo === "asking"} onClick={ask} className="mt-6"><Navigation size={17} />{geo === "denied" ? "Try again" : "Allow location"}</Primary>
            <button onClick={() => setHide(true)} className="w-full mt-3 text-sm font-semibold text-ink/50">Not now</button>
          </div>
        </div>
      )}
      <button onClick={next} className="mt-auto w-full py-4 rounded-full bg-flame text-white font-bold text-[16px] flex items-center justify-center gap-2 active:scale-[.98] transition">{t.cont}<ChevronRight size={18} /></button>
    </div>
  );
}

/* ---------- Auth ---------- */

const inputCls = "w-full bg-transparent outline-none font-semibold placeholder:text-ink/30";
function Err({ msg }: { msg: string }) {
  return msg ? <p className="mt-3 text-sm text-[#b91c1c] bg-[#fee2e2] rounded-2xl px-4 py-2.5 flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" />{msg}</p> : null;
}
function Primary({ children, onClick, busy, disabled, className = "" }: { children: React.ReactNode; onClick: () => void; busy?: boolean; disabled?: boolean; className?: string }) {
  return <button disabled={busy || disabled} onClick={onClick} className={`w-full h-14 rounded-full bg-flame text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[.98] transition ${className}`}>{busy && <Loader2 size={18} className="animate-spin" />}{children}</button>;
}
function CitySelect({ value, set }: { value: string; set: (v: string) => void }) {
  return <select value={value} onChange={e => set(e.target.value)} className={inputCls + " appearance-none"}><option value="">Select your city</option>{Object.keys(CITIES).map(c => <option key={c}>{c}</option>)}</select>;
}
type SkillSet = { skills: string[]; years: Record<string, string>; names: Record<string, string> };
const slugify = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const missingYears = (v: SkillSet) => v.skills.filter(k => v.years[k] === undefined || v.years[k] === "");
const skillYearsNum = (v: SkillSet) => Object.fromEntries(v.skills.map(k => [k, Number(v.years[k]) || 0]));

// Pick skills (including typed-in ones) and give years of experience for each.
function SkillsEditor({ lang, value, set }: { lang: Lang; value: SkillSet; set: (v: SkillSet) => void }) {
  const [other, setOther] = useState("");
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => {
    const on = value.skills.includes(id);
    set({ ...value, skills: on ? value.skills.filter(x => x !== id) : [...value.skills, id] });
  };
  const addOther = () => {
    const name = other.trim().slice(0, 30), slug = slugify(name);
    if (!slug) return;
    const id = `x-${slug}`; CUSTOM_CATS[id] = name;
    set({ ...value, skills: value.skills.includes(id) ? value.skills : [...value.skills, id], names: { ...value.names, [id]: name } });
    setOther(""); setOpen(false);
  };
  const customs = value.skills.filter(k => k.startsWith("x-"));
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {CATS.map(c => {
          const on = value.skills.includes(c.id);
          return <button key={c.id} type="button" onClick={() => toggle(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 flex items-center gap-1 ${on ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><c.icon size={12} />{c[lang]}</button>;
        })}
        {customs.map(k => <button key={k} type="button" onClick={() => toggle(k)} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-flame bg-flame-soft text-flame flex items-center gap-1"><Package size={12} />{value.names[k] ?? catOf(k).en}<X size={11} /></button>)}
        <button type="button" onClick={() => setOpen(!open)} className="px-3 py-1.5 rounded-full text-xs font-bold border-2 border-dashed border-ink/25 bg-white flex items-center gap-1"><Plus size={12} />Other</button>
      </div>
      {open && <div className="flex gap-2">
        <input autoFocus value={other} onChange={e => setOther(e.target.value)} onKeyDown={e => e.key === "Enter" && addOther()} maxLength={30} placeholder="Type your skill, e.g. Welding" className="flex-1 h-11 rounded-2xl bg-white px-4 text-sm outline-none" />
        <button type="button" onClick={addOther} className="px-4 rounded-2xl bg-ink text-white text-sm font-bold">Add</button>
      </div>}
      {value.skills.length > 0 && <div className="bg-white rounded-2xl p-3">
        <p className="text-[11px] font-semibold text-ink/45 mb-2">Years of experience for each skill</p>
        <div className="space-y-1.5">
          {value.skills.map(k => (
            <div key={k} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-semibold truncate">{value.names[k] ?? catOf(k)[lang]}</span>
              <input type="number" inputMode="numeric" min={0} max={60} value={value.years[k] ?? ""} onChange={e => set({ ...value, years: { ...value.years, [k]: e.target.value } })} placeholder="0" className="w-16 h-9 rounded-xl bg-cream text-center font-bold outline-none" />
              <span className="text-xs text-ink/45 w-6">yrs</span>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}

function SkillPicker({ lang, value, set }: { lang: Lang; value: string[]; set: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATS.map(c => {
        const on = value.includes(c.id);
        return <button key={c.id} type="button" onClick={() => set(on ? value.filter(x => x !== c.id) : [...value, c.id])} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 flex items-center gap-1 ${on ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><c.icon size={12} />{c[lang]}</button>;
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block bg-white rounded-2xl px-4 py-3"><span className="block text-[11px] font-semibold text-ink/45 mb-0.5">{label}</span>{children}</label>;
}

function Avatar({ p, size = 48, online, className = "" }: { p?: Partial<Person> | null; size?: number; online?: boolean; className?: string }) {
  const name = p?.name || "?";
  return (
    <span className={`relative shrink-0 inline-block ${className}`} style={{ width: size, height: size }}>
      {p?.avatar
        ? <img src={p.avatar} alt={name} className="w-full h-full object-cover rounded-[30%]" />
        : <span className="w-full h-full rounded-[30%] bg-flame-soft text-flame grid place-items-center font-bold" style={{ fontSize: size * 0.4 }}>{name[0]}</span>}
      {online !== undefined && <span className={`absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white ${online ? "bg-[#22c55e]" : "bg-ink/25"}`} />}
    </span>
  );
}

// Square-crop and downscale a chosen photo so uploads stay small.
async function squarePhoto(file: File, px = 512): Promise<Blob> {
  const img = await createImageBitmap(file);
  const s = Math.min(img.width, img.height);
  const cv = document.createElement("canvas"); cv.width = cv.height = px;
  cv.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, px, px);
  return new Promise(r => cv.toBlob(b => r(b!), "image/jpeg", 0.85));
}

// Downscale a job snapshot to at most `max` px on the long side and return a JPEG data URL.
async function jobPhotoData(file: File, max = 1280): Promise<string> {
  const img = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
  return cv.toDataURL("image/jpeg", 0.82);
}

function PhotoPicker({ preview, pick, label = "Add a profile photo" }: { preview: string; pick: (f: File) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button type="button" onClick={() => ref.current?.click()} className="w-full flex items-center gap-4 bg-white rounded-2xl p-3 text-left">
      <input ref={ref} type="file" accept="image/*" capture="user" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ""; }} />
      <span className="w-16 h-16 rounded-[30%] overflow-hidden bg-cream grid place-items-center border-2 border-dashed border-ink/20">
        {preview ? <img src={preview} alt="Profile" className="w-full h-full object-cover" /> : <ImagePlus size={22} className="text-ink/40" />}
      </span>
      <span><span className="block font-bold text-sm">{preview ? "Looks good — tap to change" : label}</span><span className="text-xs text-ink/50">Required · helps people trust who they're hiring</span></span>
    </button>
  );
}

function AvatarGate({ me, done, logout }: { me: Profile; done: (p: Profile) => void; logout: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const save = async () => {
    if (!file) return setErr("Choose a photo to continue.");
    setBusy(true); setErr("");
    try { done(await uploadAvatar(await squarePhoto(file))); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  return (
    <div className="flex-1 flex flex-col px-6 pt-16 pb-[max(2rem,env(safe-area-inset-bottom))] rise">
      <Logo />
      <h2 className="text-[28px] font-extrabold mt-8 leading-tight">Add your photo, {me.name.split(" ")[0]}</h2>
      <p className="text-sm text-ink/55 mt-2">A clear face photo is required for everyone on atha, so clients and experts know who's coming.</p>
      <div className="mt-6"><PhotoPicker preview={preview} pick={setFile} /></div>
      <Err msg={err} />
      <div className="mt-auto space-y-3"><Primary busy={busy} onClick={save}>Save & continue</Primary><button onClick={logout} className="w-full text-sm font-semibold text-ink/50">Log out</button></div>
    </div>
  );
}

const lastSeenText = (online: boolean, iso?: string) => {
  if (online) return "Online";
  if (!iso) return "Offline";
  const d = new Date(iso), m = (Date.now() - d.getTime()) / 60000;
  if (m < 2) return "Last seen just now";
  if (m < 60) return `Last seen ${Math.round(m)} min ago`;
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return new Date().toDateString() === d.toDateString() ? `Last seen today at ${time}` : `Last seen ${d.toLocaleDateString([], { day: "numeric", month: "short" })} at ${time}`;
};

/* ---------- Main app ---------- */

type GeoState = "unknown" | "prompt" | "granted" | "denied";
function useLocation(city: string) {
  const fallback = CITIES[city] ?? CITIES.Colombo;
  const [loc, setLoc] = useState<Loc>({ ll: fallback, source: "city" });
  const [perm, setPerm] = useState<GeoState>("unknown");
  const watch = useRef<string | number | null>(null);

  const start = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const req = await Geolocation.requestPermissions();
        if (req.location === "granted") {
          setPerm("granted");
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
          setLoc({ ll: [pos.coords.latitude, pos.coords.longitude], source: "gps" });

          if (watch.current) await Geolocation.clearWatch({ id: String(watch.current) });
          const id = await Geolocation.watchPosition({ enableHighAccuracy: true }, (p) => {
            if (p?.coords) setLoc({ ll: [p.coords.latitude, p.coords.longitude], source: "gps" });
          });
          watch.current = id;
          return;
        } else {
          setPerm("denied");
          return;
        }
      } catch (err) {
        setPerm("denied");
        return;
      }
    }

    if (!navigator.geolocation) return setPerm("denied");
    if (watch.current !== null) navigator.geolocation.clearWatch(Number(watch.current));
    watch.current = navigator.geolocation.watchPosition(
      p => { setPerm("granted"); setLoc({ ll: [p.coords.latitude, p.coords.longitude], source: "gps" }); },
      e => { if (e.code === e.PERMISSION_DENIED) setPerm("denied"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    setLoc(l => l.source === "gps" ? l : { ll: fallback, source: "city" });

    if (Capacitor.isNativePlatform()) {
      Geolocation.checkPermissions().then(status => {
        if (status.location === "granted") { setPerm("granted"); start(); } 
        else { setPerm("prompt"); }
      }).catch(() => setPerm("prompt"));
      return () => { if (watch.current) Geolocation.clearWatch({ id: String(watch.current) }); };
    }

    navigator.permissions?.query({ name: "geolocation" }).then(r => {
      setPerm(r.state as GeoState);
      if (r.state === "granted") start();
      r.onchange = () => { setPerm(r.state as GeoState); if (r.state === "granted") start(); };
    }).catch(() => setPerm("prompt"));

    return () => { if (watch.current !== null) navigator.geolocation.clearWatch(Number(watch.current)); };
  }, [city, start, fallback]);

  return { loc, perm, request: start };
}

function LocationPrompt({ perm, allow, skip, city }: { perm: GeoState; allow: () => void; skip: () => void; city: string }) {
  return (
    <div className="absolute inset-0 z-[2100] bg-black/45 flex items-end">
      <div className="w-full bg-cream rounded-t-[32px] p-6 pb-9 rise">
        <div className="w-16 h-16 rounded-[22px] bg-flame text-white grid place-items-center"><Crosshair size={30} /></div>
        <h3 className="text-[24px] font-extrabold mt-4 leading-tight">{perm === "denied" ? "Location is blocked" : "Use your precise location?"}</h3>
        <p className="text-sm text-ink/60 mt-2">{perm === "denied"
          ? "Turn on location for this site in your browser or phone settings, then tap Try again. Until then we'll show jobs in " + city + "."
          : "atha matches you with jobs and helpers within 30 km. Precise GPS gives accurate distances and directions."}</p>
        <Primary onClick={allow} className="mt-6"><Navigation size={17} />{perm === "denied" ? "Try again" : "Allow precise location"}</Primary>
        <button onClick={skip} className="w-full mt-3 text-sm font-semibold text-ink/50">Not now — use {city}</button>
      </div>
    </div>
  );
}

const NOTE_ICON: Record<Notice["kind"], typeof Bell> = { msg: MessageCircle, bid: Package, hired: Check, job: Briefcase };
const NOTE_LABEL: Record<Notice["kind"], string> = { msg: "New message", bid: "New bid", hired: "Hired", job: "Job match" };

function NotificationsSheet({ notes, close, open }: { notes: Notice[]; close: () => void; open: (n: Notice) => void }) {
  return (
    <Sheet close={close}>
      <h3 className="text-[22px] font-extrabold">Notifications</h3>
      {notes.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-center">
          <span className="w-16 h-16 rounded-[22px] bg-white grid place-items-center text-ink/30"><BellOff size={28} /></span>
          <p className="font-bold mt-4">You're all caught up</p>
          <p className="text-sm text-ink/50 mt-1 max-w-[240px]">No new notifications. Bids, messages and matching jobs will show up here.</p>
        </div>
      ) : (
        <div className="mt-4 bg-white rounded-[22px] overflow-hidden">
          {notes.map((n, i) => {
            const I = NOTE_ICON[n.kind] ?? Bell;
            return (
              <button key={n.id ?? i} onClick={() => open(n)} className={`w-full flex items-start gap-3 p-4 text-left ${i ? "border-t border-line" : ""}`}>
                <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${n.read ? "bg-cream text-ink/50" : "bg-flame-soft text-flame"}`}><I size={18} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-ink/40">{NOTE_LABEL[n.kind]} · {ago(n.at)}</span>
                  <span className={`block truncate ${n.read ? "font-semibold" : "font-extrabold"}`}>{n.title}</span>
                  <span className="block text-sm text-ink/55 line-clamp-2">{n.body}</span>
                </span>
                {!n.read && <span className="w-2.5 h-2.5 mt-2 rounded-full bg-flame shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function Toast({ n, open, close }: { n: Notice; open: () => void; close: () => void }) {
  useEffect(() => { const x = setTimeout(close, 5000); return () => clearTimeout(x); }, [n, close]);
  const I = NOTE_ICON[n.kind] ?? Bell;
  return (
    <div className="absolute top-12 left-3 right-3 z-[2050] rise">
      <button onClick={open} className="w-full bg-ink text-white rounded-[22px] p-3.5 flex items-center gap-3 text-left shadow-2xl">
        <span className="w-10 h-10 rounded-xl bg-flame grid place-items-center shrink-0"><I size={18} /></span>
        <span className="flex-1 min-w-0"><span className="block text-[11px] font-bold uppercase tracking-wide text-flame">{NOTE_LABEL[n.kind]}</span><span className="block font-bold truncate">{n.title}</span><span className="block text-sm text-white/65 truncate">{n.body}</span></span>
      </button>
    </div>
  );
}

function MainApp({ t, lang, setLang, me, setMe, logout }: { t: Dict; lang: Lang; setLang: (l: Lang) => void; me: Profile; setMe: (p: Profile) => void; logout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [mode, setMode] = useState<"client" | "expert">(me.role === "earn" ? "expert" : "client");
  const [mapCat, setMapCat] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [manage, setManage] = useState<Job | null>(null);
  const [chat, setChat] = useState<string | null>(null);
  const [posting, setPosting] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mine, setMine] = useState<Job[]>([]);
  const { loc, perm, request } = useLocation(me.city);
  const [geoAsked, setGeoAsked] = useState(false);
  const ctx: Ctx = { t, lang, me, loc };
  const [notice, setNotice] = useState<Notice | null>(null);
  const [badges, setBadges] = useState({ chats: 0, jobs: 0 });
  const [online, setOnline] = useState<Set<string>>(new Set());
  const chatRef = useRef<string | null>(null);
  chatRef.current = chat;
  const [notes, setNotes] = useState<Notice[]>([]);
  const [bell, setBell] = useState(false);
  const unreadNotes = notes.filter(n => !n.read).length;
  useEffect(() => {
    api<{ notifications: Notice[] }>("/notifications").then(r => setNotes(r.notifications)).catch(() => {});
    // Alert experts about already-posted jobs that match their skills.
    if (me.role !== "hire") api("/jobs/matches", { method: "POST" }).catch(() => {});
  }, [me.id, me.role, me.skills?.join(), me.level]);
  const openBell = () => { setBell(true); if (unreadNotes) { setNotes(n => n.map(x => ({ ...x, read: true }))); api("/notifications/read", { method: "PUT" }).catch(() => {}); } };

  const refresh = useCallback(async () => {
    const [a, b] = await Promise.all([api<{ jobs: Job[] }>("/jobs"), api<{ jobs: Job[] }>("/jobs/mine")]).catch(() => [{ jobs: [] }, { jobs: [] }]);
    setJobs(a.jobs); setMine(b.jobs);
  }, []);
  useEffect(() => { refresh(); const x = setInterval(refresh, 30000); return () => clearInterval(x); }, [refresh]);

  // Realtime: personal notification channel + global presence for online status.
  useEffect(() => {
    const inbox = supabase.channel(`user:${me.id}`).on("broadcast", { event: "notify" }, ({ payload }) => {
      const n = payload as Notice;
      window.dispatchEvent(new CustomEvent("atha-notify", { detail: n }));
      setNotes(list => list.some(x => x.id && x.id === n.id) ? list : [n, ...list].slice(0, 50));
      if (n.kind === "msg" && chatRef.current === n.chatId) return;
      setNotice(n);
      setBadges(b => n.kind === "msg" ? { ...b, chats: b.chats + 1 } : n.kind === "job" ? b : { ...b, jobs: b.jobs + 1 });
      if (n.kind !== "msg") refresh();
      if (n.kind === "job" || document.hidden) systemNotify(n.title, n.body);
    }).subscribe();
    
    const presence = supabase.channel("online", { config: { presence: { key: me.id } } });
    presence.on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(presence.presenceState()))))
      .subscribe(s => { if (s === "SUBSCRIBED") presence.track({ at: new Date().toISOString() }); });
      
    const ping = () => api("/ping", { method: "POST" }).catch(() => {});
    ping(); 
    const x = setInterval(ping, 60000);
    window.addEventListener("pagehide", ping);
    
    // Native Push Notification Prompts
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().catch(() => {});
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === "granted") PushNotifications.register();
      }).catch(() => {});
    } else {
      try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission()?.catch?.(() => {}); } catch { /* unsupported */ }
    }

    return () => { 
      supabase.removeChannel(inbox); 
      supabase.removeChannel(presence); 
      clearInterval(x); 
      window.removeEventListener("pagehide", ping); 
      ping(); 
    };
  }, [me.id, refresh]);

  // Experts see others' jobs: within 30 km by GPS, or in their city when GPS is unavailable. Remote jobs always show.
  const nearby = useMemo(() => jobs
    .filter(j => j.ownerId !== me.id)
    .map(j => ({ ...j, km: kmBetween(loc.ll, jobLL(j)) }))
    .filter(j => j.remote || (loc.source === "gps" ? j.km <= 30 : j.city === me.city))
    .sort((a, b) => a.km - b.km), [jobs, loc, me]);

  const openChat = async (otherId: string, jobId: string) => {
    try { const { chat } = await api<{ chat: Chat }>("/chats", { body: { otherId, jobId } }); setJob(null); setManage(null); setMapCat(null); setTab("chats"); setChat(chat.id); }
    catch (e: any) { alert(e.message); }
  };
  const switchMode = (m: "client" | "expert") => { setMode(m); setTab("home"); };
  const openNotice = (n: Notice) => {
    if (n.kind === "msg" && n.chatId) { setTab("chats"); setChat(n.chatId); setBadges(b => ({ ...b, chats: Math.max(0, b.chats - 1) })); return; }
    if (n.kind === "job") {
      if (me.role !== "hire") setMode("expert");
      const j = jobs.find(x => x.id === n.jobId);
      if (j) setJob(j); else setTab("jobs");
      return;
    }
    const j = mine.find(x => x.id === n.jobId); setTab("jobs"); setBadges(b => ({ ...b, jobs: 0 }));
    if (n.kind === "hired") setMode("expert"); else if (j) setManage(j);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto safe-pad overscroll-contain">
        {tab === "home" && <HomeTab {...ctx} mode={mode} nearby={nearby} mine={mine} openMap={setMapCat} openJob={setJob} post={setPosting} manage={setManage} unread={unreadNotes} openBell={openBell} />}
        {tab === "jobs" && (mode === "expert"
          ? <ExpertJobs {...ctx} nearby={nearby} openJob={setJob} />
          : <ClientDashboard {...ctx} mine={mine} post={() => setPosting("")} manage={setManage} />)}
        {tab === "chats" && <ChatsTab me={me} online={online} open={setChat} />}
        {tab === "me" && <MeTab {...ctx} mode={mode} setMode={switchMode} setLang={setLang} setMe={setMe} logout={logout} />}
      </div>
      <nav className="absolute safe-bottom left-4 right-4 z-[1500] bg-ink rounded-full p-1.5 flex items-center justify-between shadow-xl">
        {([["home", Home, t.home], ["jobs", Briefcase, t.jobs], ["chats", MessageCircle, t.chats], ["me", User, t.me]] as const).map(([k, I, l]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => { setTab(k); if (k === "chats" || k === "jobs") setBadges(b => ({ ...b, [k]: 0 })); }} className={`relative h-11 rounded-full flex items-center justify-center gap-1.5 transition-all duration-300 ${on ? "bg-flame text-white px-5 ring-2 ring-white/90 ring-offset-2 ring-offset-ink" : "text-white/70 w-14"}`}>
              <I size={18} />{on && <span className="text-sm font-bold">{l}</span>}
              {!on && (k === "chats" || k === "jobs") && badges[k] > 0 && <span className="absolute top-1 right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-flame text-white text-[10px] font-extrabold grid place-items-center ring-2 ring-ink">{badges[k]}</span>}
            </button>
          );
        })}
      </nav>
      {mapCat !== null && <MapScreen {...ctx} requestLoc={request} jobs={nearby} initial={mapCat} close={() => setMapCat(null)} openJob={setJob} />}
      {job && <JobSheet {...ctx} job={job} close={() => setJob(null)} chat={() => openChat(job.ownerId, job.id)} onBid={refresh} />}
      {manage && <ManageSheet {...ctx} job={mine.find(j => j.id === manage.id) ?? manage} close={() => setManage(null)} chat={openChat} changed={refresh} />}
      {chat && <Boundary onReset={() => setChat(null)}><Conversation id={chat} me={me} t={t} online={online} close={() => setChat(null)} /></Boundary>}
      {notice && <Toast n={notice} close={() => setNotice(null)} open={() => { setNotice(null); openNotice(notice); }} />}
      {bell && <NotificationsSheet notes={notes} close={() => setBell(false)} open={n => { setBell(false); openNotice(n); }} />}
      {!geoAsked && (perm === "prompt" || perm === "denied") && <LocationPrompt perm={perm} city={me.city} allow={() => { request(); if (perm === "prompt") setGeoAsked(true); }} skip={() => setGeoAsked(true)} />}
      {posting !== null && <PostSheet {...ctx} initialCat={posting} close={() => setPosting(null)} posted={() => { setPosting(null); refresh(); setTab("jobs"); }} />}
    </>
  );
}

const getDark = () => localStorage.getItem("atha-theme") === "dark";
const applyTheme = (dark: boolean) => { document.documentElement.classList.toggle("dark", dark); localStorage.setItem("atha-theme", dark ? "dark" : "light"); };
if (typeof window !== "undefined") document.documentElement.classList.toggle("dark", getDark());
function ThemeToggle() {
  const [dark, setDark] = useState(getDark);
  return <button onClick={() => { applyTheme(!dark); setDark(!dark); }} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="w-11 h-11 rounded-full bg-white grid place-items-center">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>;
}

function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  return <div className="px-5 pt-14 pb-3 flex items-center justify-between"><h1 className="text-[26px] font-extrabold">{title}</h1>{right}</div>;
}

const STATUS: Record<string, [string, string]> = {
  open: ["Receiving bids", "bg-[#dcfce7] text-[#166534]"], assigned: ["In progress", "bg-[#dbeafe] text-[#1e40af]"],
  done: ["Completed", "bg-ink/10 text-ink/70"], closed: ["Closed", "bg-ink/10 text-ink/50"],
};
function StatusPill({ s }: { s: string }) {
  const [l, c] = STATUS[s] ?? STATUS.open;
  return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c}`}>{l}</span>;
}

function HomeTab({ t, lang, me, loc, mode, nearby, mine, openMap, openJob, post, manage, unread, openBell }: Ctx & { unread: number; openBell: () => void; mode: string; nearby: (Job & { km: number })[]; mine: Job[]; openMap: (c: string) => void; openJob: (j: Job) => void; post: (c: string) => void; manage: (j: Job) => void }) {
  const expert = mode === "expert";
  const active = mine.filter(j => j.status === "open" || j.status === "assigned");
  return (
    <div className="rise">
      <div className="px-5 pt-14 flex items-center gap-3">
        <Avatar p={me} size={44} />
        <div className="flex-1">
          <p className="text-xs text-ink/50 font-medium">{t.hi}, {me.name.split(" ")[0]}</p>
          <button onClick={() => openMap("all")} className="font-bold flex items-center gap-1 text-left"><MapPin size={13} className="text-flame" />{me.address || me.city}<span className="text-[10px] font-semibold text-ink/40 ml-1">{loc.source === "gps" ? "GPS" : "City"}</span><ChevronRight size={13} className="text-ink/30" /></button>
        </div>
        <button onClick={() => openMap("all")} aria-label="Open map at my location" className="w-11 h-11 rounded-full bg-white grid place-items-center text-flame"><Navigation size={18} /></button>
        <ThemeToggle />
        <button onClick={openBell} aria-label="Notifications" className="relative w-11 h-11 rounded-full bg-white grid place-items-center">
          <Bell size={19} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-flame text-white text-[10px] font-extrabold grid place-items-center ring-2 ring-cream">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </div>
      {expert ? <>
        <button onClick={() => openMap("all")} className="mx-5 mt-5 w-[calc(100%-40px)] flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-ink/45 text-sm"><Search size={18} />Find work near you</button>
        <div className="mx-5 mt-4 rounded-[24px] bg-ink text-white p-4 flex items-center gap-3">
          <div className="relative w-3 h-3 ml-1"><span className="absolute inset-0 rounded-full bg-[#34d399]" /><span className="absolute inset-0 rounded-full bg-[#34d399] ring-pulse" /></div>
          <div className="flex-1 ml-1"><p className="font-bold text-[15px]">{t.avail}</p><p className="text-xs text-white/60">{nearby.length} jobs {loc.source === "gps" ? "within 30 km" : `in ${me.city}`}</p></div>
          <button onClick={() => openMap("all")} className="text-flame font-bold text-sm flex items-center gap-1"><Navigation size={14} />Map</button>
        </div>
      </> : (
        <button onClick={() => post("")} className="mx-5 mt-5 w-[calc(100%-40px)] rounded-[24px] bg-ink text-white p-5 text-left flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-flame grid place-items-center"><Plus size={22} /></span>
          <span className="flex-1"><span className="block font-bold text-[17px]">{t.post}</span><span className="text-xs text-white/60">Set a base price, experts nearby will bid</span></span>
          <ChevronRight className="text-white/50" />
        </button>
      )}
      <div className="px-5 mt-6"><h2 className="font-extrabold text-lg">{t.cats}</h2></div>
      <div className="px-5 mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
        {CATS.map(c => (
          <button key={c.id} onClick={() => (expert ? openMap(c.id) : post(c.id))} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
            <span className={`w-[62px] h-[62px] rounded-[20px] grid place-items-center ${c.tint}`}><c.icon size={24} /></span>
            <span className="text-[11px] font-semibold text-center leading-tight">{c[lang]}</span>
          </button>
        ))}
      </div>
      {expert ? <>
        <div className="px-5 mt-7 flex items-baseline justify-between"><h2 className="font-extrabold text-lg">{t.near}</h2><button onClick={() => openMap("all")} className="text-sm font-semibold text-flame">{t.seeAll}</button></div>
        <div className="flex gap-3 overflow-x-auto px-5 py-3 snap-x [scrollbar-width:none]">
          {nearby.length === 0 && <p className="text-sm text-ink/50">No open jobs nearby yet.</p>}
          {nearby.slice(0, 6).map(j => <JobCard key={j.id} j={j} lang={lang} onClick={() => openJob(j)} wide />)}
        </div>
      </> : active.length > 0 && <>
        <div className="px-5 mt-7"><h2 className="font-extrabold text-lg">Your active jobs</h2></div>
        <div className="px-5 py-3 space-y-2.5">{active.slice(0, 3).map(j => <MyJobCard key={j.id} j={j} lang={lang} onClick={() => manage(j)} />)}</div>
      </>}
    </div>
  );
}

function JobCard({ j, lang, onClick, wide }: { j: Job & { km?: number }; lang: Lang; onClick: () => void; wide?: boolean }) {
  const c = catOf(j.cat);
  return (
    <button onClick={onClick} className={`${wide ? "min-w-[250px] snap-start" : "w-full"} text-left bg-white rounded-[22px] p-4 active:scale-[.98] transition`}>
      <div className="flex items-center gap-2">
        <span className={`w-9 h-9 rounded-xl grid place-items-center ${c.tint}`}><c.icon size={17} /></span>
        <span className="text-[11px] font-semibold text-ink/50 flex-1">{c[lang]}{EXPERT_CATS.includes(j.cat) && <ShieldCheck size={11} className="inline ml-1 text-teal" />}</span>
        <PriorityChip j={j} />
      </div>
      <p className="font-bold mt-3 leading-snug">{j.title}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-ink/55 flex items-center gap-1"><MapPin size={12} />{j.remote ? "Remote · " : j.km !== undefined ? `${j.km} km · ` : ""}{j.place}</span>
        <span className="font-extrabold text-flame text-right leading-tight">{rs(j.price)}{j.negotiable && <span className="block text-[10px] font-bold text-teal">Negotiable</span>}</span>
      </div>
      {j.org && <p className="mt-2 text-[11px] font-bold text-ink/55 flex items-center gap-1"><Building2 size={11} />{j.poster}{j.cvRequired && " · CV required"}</p>}
    </button>
  );
}

function MyJobCard({ j, lang, onClick }: { j: Job; lang: Lang; onClick: () => void }) {
  const c = catOf(j.cat);
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-[22px] p-4 active:scale-[.98] transition">
      <div className="flex items-center gap-2">
        <span className={`w-9 h-9 rounded-xl grid place-items-center ${c.tint}`}><c.icon size={17} /></span>
        <span className="text-[11px] font-semibold text-ink/50 flex-1">{c[lang]} · {ago(j.created)}</span>
        <StatusPill s={j.status} />
      </div>
      <p className="font-bold mt-3 leading-snug">{j.title}</p>
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="flex items-center gap-1 text-ink/60 font-semibold"><Users size={13} />{j.status === "assigned" ? `Hired ${j.assignee}` : `${j.bids} ${j.bids === 1 ? "bid" : "bids"}`}</span>
        <span className="font-extrabold text-sm">{rs(j.agreed ?? j.price)}</span>
      </div>
    </button>
  );
}

/* ---------- Map (Google Maps tiles) ---------- */

// Pin colour follows urgency: urgent/high red, medium yellow, low green.
function pinIcon(price: number, active: boolean, priority?: string) {
  const bg = prio({ priority }).color;
  const fg = priority === "medium" || !priority ? "#1a1714" : "#fff";
  const ring = active ? "outline:3px solid #1a1714;outline-offset:2px;" : "";
  const urgent = priority === "urgent" ? "&#9888; " : "";
  return L.divIcon({
    className: "pin", iconSize: [90, 34], iconAnchor: [45, 34],
    html: `<div style="display:flex;flex-direction:column;align-items:center"><div style="background:${bg};color:${fg};font:800 12px Figtree;padding:6px 10px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.25);${ring}">${urgent}${rs(price)}</div><div style="width:8px;height:8px;background:${bg};transform:rotate(45deg);margin-top:-5px"></div></div>`,
  });
}
const meIcon = L.divIcon({ className: "pin", iconSize: [22, 22], iconAnchor: [11, 11], html: `<div style="position:relative;width:22px;height:22px"><span class="ring-pulse" style="position:absolute;inset:0;border-radius:999px;background:#2563eb"></span><span style="position:absolute;inset:3px;border-radius:999px;background:#2563eb;border:3px solid #fff"></span></div>` });

function FlyTo({ ll }: { ll: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(ll, 14, { duration: 0.6 }); }, [ll[0], ll[1], map]);
  return null;
}

function MapScreen({ lang, loc, me, jobs, initial, close, openJob, requestLoc }: Ctx & { jobs: (Job & { km: number })[]; initial: string; close: () => void; openJob: (j: Job) => void; requestLoc: () => void }) {
  const [cat, setCat] = useState(initial);
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const list = useMemo(() => jobs.filter(j => (cat === "all" || j.cat === cat) && j.title.toLowerCase().includes(q.toLowerCase())), [cat, jobs, q]);
  const selJob = list.find(j => j.id === sel);
  const focus = selJob ? jobLL(selJob) : loc.ll;
  const [recenter, setRecenter] = useState(0);
  return (
    <div className="absolute inset-0 z-[1600] bg-cream flex flex-col rise">
      <div className="absolute inset-0">
        <MapContainer center={loc.ll} zoom={13} zoomControl={false} attributionControl={false} className="w-full h-full">
          <TileLayer url="https://mt{s}.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}" subdomains={["0", "1", "2", "3"]} maxZoom={20} />
          <Marker position={loc.ll} icon={meIcon} />
          {list.filter(j => !j.remote || j.ll).map(j => <Marker key={j.id} position={jobLL(j)} icon={pinIcon(j.price, sel === j.id, j.priority)} zIndexOffset={j.priority === "urgent" || j.priority === "high" ? 500 : 0} eventHandlers={{ click: () => { setSel(j.id); openJob(j); } }} />)}
          <FlyTo ll={focus} key={recenter} />
        </MapContainer>
      </div>
      <div className="relative z-[1000] pt-14 px-4">
        <div className="flex gap-2">
          <button onClick={close} className="w-12 h-12 rounded-full bg-white shadow-lg grid place-items-center"><ChevronLeft size={20} /></button>
          <label className="flex-1 h-12 rounded-full bg-white shadow-lg flex items-center gap-2 px-4 text-sm"><Search size={17} className="text-ink/40" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search jobs" className="flex-1 outline-none bg-transparent" /></label>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 [scrollbar-width:none]">
          {[{ id: "all", en: "All", si: "සියල්ල", ta: "அனைத்தும்" }, ...CATS].map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setSel(null); }} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold shadow-md ${cat === c.id ? "bg-ink text-white" : "bg-white"}`}>{c[lang]}</button>
          ))}
        </div>
      </div>
      <div className="relative z-[1000] mt-auto px-4 pb-3 flex items-end justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/95 rounded-2xl px-3 py-2 shadow-lg flex gap-3 text-[11px] font-bold">
          {([["#dc2626", "Urgent / High"], ["#eab308", "Medium"], ["#16a34a", "Low"]] as const).map(([c, l]) => <span key={l} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}</span>)}
        </div>
        <button onClick={() => { setSel(null); setRecenter(r => r + 1); requestLoc(); }} aria-label="My location" className="pointer-events-auto w-12 h-12 rounded-full bg-white shadow-lg grid place-items-center text-[#2563eb]"><Crosshair size={20} /></button>
      </div>
      <div className="relative z-[1000] bg-cream rounded-t-[28px] pt-2 pb-6 shadow-[0_-10px_30px_rgba(0,0,0,.12)] max-h-[45%] flex flex-col">
        <div className="w-10 h-1.5 rounded-full bg-ink/15 mx-auto" />
        <div className="px-5 pt-3 pb-2 flex items-baseline justify-between">
          <p className="font-extrabold">{list.length} jobs</p>
          {selJob ? <a href={gmapsDir(jobLL(selJob))} target="_blank" rel="noreferrer" className="text-xs font-bold text-flame flex items-center gap-1"><Navigation size={12} />Directions in Google Maps</a>
            : <p className="text-xs text-ink/50">{loc.source === "gps" ? "within 30 km" : `in ${me.city}`} · live</p>}
        </div>
        <div className="overflow-y-auto px-4 space-y-2.5">
          {list.length === 0 && <p className="text-sm text-ink/50 text-center py-6">No jobs in this category right now.</p>}
          {list.map(j => <div key={j.id} onMouseEnter={() => setSel(j.id)} className={`rounded-[22px] ${sel === j.id ? "ring-2 ring-flame" : ""}`}><JobCard j={j} lang={lang} onClick={() => openJob(j)} /></div>)}
        </div>
      </div>
    </div>
  );
}

/* ---------- Job detail & bidding (expert) ---------- */

function JobSheet({ t, lang, me, loc, job, close, chat, onBid }: Ctx & { job: Job; close: () => void; chat: () => void; onBid: () => void }) {
  const c = catOf(job.cat);
  const [labour, setLabour] = useState<number>(job.price);
  const [mat, setMat] = useState(0);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [neg, setNeg] = useState(false);
  const [salary, setSalary] = useState("");
  const [from, setFrom] = useState({ city: me.city, area: me.address });
  const own = job.ownerId === me.id;
  const cvBlocked = !!job.cvRequired && !cvComplete(me);
  const yearsBlocked = yearsFor(me, job.cat) < (job.minYears ?? 0);
  const allowed = me.role !== "hire" && canBid(me, job.cat, job.minYears) && !cvBlocked;
  const ll = jobLL(job);
  const bid = async () => {
    setBusy(true); setErr("");
    if (job.org && !Number(salary)) { setBusy(false); return setErr("Add your salary expectation."); }
    // Send GPS only if applying from your current city; otherwise the chosen city's centre.
    const gps = loc.source === "gps" && from.city === me.city;
    const fromLl = gps ? loc.ll : CITIES[from.city];
    try { await api(`/jobs/${job.id}/bids`, { body: { labour, mat, note, negotiable: neg, salary: Number(salary) || 0, fromCity: from.city, fromArea: from.area, fromLl, fromSource: gps ? "gps" : "city" } }); setSent(true); onBid(); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <Sheet close={close}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${c.tint}`}><c.icon size={13} />{c[lang]}</span>
        {job.remote && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white">Remote OK</span>}
        <PriorityChip j={job} />
        {EXPERT_CATS.includes(job.cat) && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-teal flex items-center gap-1"><ShieldCheck size={12} />Verified experts only</span>}
        {job.cvRequired && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white flex items-center gap-1"><FileText size={12} className="text-flame" />CV required</span>}
        {!!job.minYears && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white flex items-center gap-1"><Clock size={12} className="text-flame" />{job.minYears}+ yrs exp</span>}
        {job.negotiable && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-teal flex items-center gap-1"><Handshake size={12} />Negotiable</span>}
      </div>
      <Gallery urls={job.photoUrls} alt={job.title} />
      <h3 className="text-[22px] font-extrabold mt-3 leading-tight">{job.title}</h3>
      <p className="text-sm text-ink/55 mt-1 flex items-center gap-1"><MapPin size={13} />{job.place}, {job.city} · {kmBetween(loc.ll, ll)} km · {job.bids} bids</p>
      <div className="mt-4 rounded-2xl bg-ink text-white p-4">
        <p className="text-[11px] font-bold text-flame">CLIENT BRIEF</p>
        <p className="text-sm mt-1.5 text-white/85">{job.desc || "No description."}</p>
        <p className="text-xs mt-3 text-white/55 flex items-center gap-2"><Avatar p={{ name: job.poster, avatar: job.posterAvatar }} size={22} />{job.org && <Building2 size={13} />}Salary {rs(job.price)}{job.negotiable ? " (negotiable)" : ""} · {job.poster} · {ago(job.created)}</p>
      </div>
      {job.sow && <SowCard sow={job.sow} />}
      {!job.remote && <a href={gmapsDir(ll)} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-sm font-bold"><Navigation size={15} className="text-flame" />Open in Google Maps<ExternalLink size={13} className="text-ink/40" /></a>}
      {own ? <p className="mt-4 text-sm text-ink/55 text-center">This is your job — manage it from the Jobs tab.</p>
        : !allowed ? (
          <div className="mt-4 rounded-2xl bg-white p-4 flex gap-3">
            <Lock size={18} className="text-flame shrink-0 mt-0.5" />
            <p className="text-sm">{yearsBlocked && me.role !== "hire" ? <>This job needs at least <b>{job.minYears} years</b> of experience. Your profile shows {yearsFor(me, job.cat)} for this skill. Update it in <b>Me → Profile</b> if that's out of date.</> : cvBlocked && me.role !== "hire" ? <>{job.poster} only accepts applicants with a <b>complete CV</b> — headline, summary, education, work history and languages. Fill it in under <b>Me → My CV</b>.</> : me.role === "hire" ? "Your account is client-only. Change your role in Me to start bidding." : <>This job requires a <b>skilled profile</b> with <b>{c.en}</b> listed and your NIC. Update it in <b>Me → Skills & verification</b>.</>}</p>
          </div>
        ) : !sent ? <>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Stepper label={t.labour} icon={<Wrench size={12} />} v={labour} set={setLabour} />
            <Stepper label={t.mat} icon={<Package size={12} />} v={mat} set={setMat} />
          </div>
          {job.org && <div className="mt-2 space-y-2">
            <Field label="Salary expectation (Rs)"><input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 85000 / month" className={inputCls + " text-lg"} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Applying from (city)"><CitySelect value={from.city} set={v => setFrom({ ...from, city: v })} /></Field>
              <Field label="Area"><input value={from.area} onChange={e => setFrom({ ...from, area: e.target.value })} placeholder="Nugegoda" className={inputCls} /></Field>
            </div>
            <p className="text-[11px] text-ink/45 px-1 flex items-center gap-1"><FileText size={11} />Your full CV and profile are shared with {job.poster}.</p>
          </div>}
          <NegToggle on={neg} set={setNeg} label="My price is negotiable" />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder={job.org ? "Cover note (why you're a good fit)" : "Note to client (e.g. can come at 4pm)"} className="mt-2 w-full h-12 rounded-2xl bg-white px-4 text-sm outline-none" />
          <Err msg={err} />
          <div className="flex gap-2 mt-4">
            <button onClick={chat} className="w-14 h-14 shrink-0 rounded-full bg-white grid place-items-center"><MessageCircle size={20} /></button>
            <Primary busy={busy} onClick={bid}>{job.org ? "Apply" : t.bid} · {rs(labour + mat)}{neg ? " (neg.)" : ""}</Primary>
          </div>
        </> : (
          <div className="mt-4 rounded-2xl bg-white p-5 text-center rise">
            <span className="w-12 h-12 rounded-full bg-teal text-white grid place-items-center mx-auto"><Check /></span>
            <p className="font-bold mt-2">{job.org ? "Application sent" : "Bid sent"} — {rs(labour + mat)}</p>
            <p className="text-xs text-ink/50">You'll see {job.poster}'s response in My bids.</p>
            <button onClick={chat} className="mt-3 text-sm font-bold text-flame">Message {job.poster}</button>
          </div>
        )}
    </Sheet>
  );
}

function Stepper({ label, icon, v, set }: { label: string; icon: React.ReactNode; v: number; set: (n: number) => void }) {
  return (
    <div className="bg-white rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-ink/50 flex items-center gap-1">{icon}{label}</p>
      <input type="number" value={v} onChange={e => set(Math.max(0, Number(e.target.value)))} className="font-extrabold text-lg mt-0.5 w-full outline-none bg-transparent" />
      <div className="flex gap-1.5 mt-2">
        <button onClick={() => set(Math.max(0, v - 500))} className="flex-1 py-1 rounded-lg bg-cream font-bold">−</button>
        <button onClick={() => set(v + 500)} className="flex-1 py-1 rounded-lg bg-cream font-bold">+</button>
      </div>
    </div>
  );
}

function NegToggle({ on, set, label }: { on: boolean; set: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => set(!on)} className="mt-2 w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 text-sm font-semibold">
      <span className="flex items-center gap-2"><Handshake size={16} className="text-teal" />{label}</span>
      <span className={`w-11 h-6 rounded-full p-0.5 transition ${on ? "bg-teal" : "bg-ink/15"}`}><span className={`block w-5 h-5 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} /></span>
    </button>
  );
}

function Gallery({ urls, alt }: { urls?: string[]; alt: string }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!urls?.length) return null;
  return (
    <>
      <div className={`mt-3 grid gap-2 ${urls.length === 1 ? "grid-cols-1" : urls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {urls.map((u, i) => <button key={u} onClick={() => setOpen(u)} className={`overflow-hidden rounded-[18px] bg-white ${urls.length === 1 ? "h-48" : "h-28"}`}><img src={u} alt={`${alt} photo ${i + 1}`} className="w-full h-full object-cover" /></button>)}
      </div>
      {open && <button onClick={() => setOpen(null)} className="fixed inset-0 z-[2600] bg-black/90 grid place-items-center p-4"><img src={open} alt={alt} className="max-w-full max-h-full rounded-2xl" /></button>}
    </>
  );
}

function Sheet({ close, children }: { close: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-[1800] flex flex-col justify-end">
      <div onClick={close} className="absolute inset-0 bg-black/40" />
      <div className="relative bg-cream rounded-t-[32px] p-5 pb-[max(2rem,env(safe-area-inset-bottom))] rise max-h-[90%] overflow-y-auto">
        <button onClick={close} className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white grid place-items-center"><X size={17} /></button>
        <div className="w-10 h-1.5 rounded-full bg-ink/15 mx-auto mb-4" />
        {children}
      </div>
    </div>
  );
}

/* ---------- Jobs tab ---------- */

function Seg<T extends string>({ value, set, opts }: { value: T; set: (v: T) => void; opts: [T, string][] }) {
  return <div className="mx-5 grid grid-cols-2 p-1 bg-white rounded-full">{opts.map(([k, l]) => <button key={k} onClick={() => set(k)} className={`py-2.5 rounded-full text-sm font-bold ${value === k ? "bg-ink text-white" : "text-ink/50"}`}>{l}</button>)}</div>;
}

function ExpertJobs({ t, lang, loc, me, nearby, openJob }: Ctx & { nearby: (Job & { km: number })[]; openJob: (j: Job) => void }) {
  const [seg, setSeg] = useState<"find" | "bids">("find");
  const [bids, setBids] = useState<Bid[] | null>(null);
  useEffect(() => { if (seg === "bids") api<{ bids: Bid[] }>("/bids/mine").then(r => setBids(r.bids)).catch(() => setBids([])); }, [seg]);
  return (
    <div className="rise">
      <Header title={t.find} />
      <Seg value={seg} set={setSeg} opts={[["find", "Open jobs"], ["bids", "My bids"]]} />
      {seg === "find" ? (
        <div className="px-5 mt-4 space-y-2.5">
          <p className="text-xs text-ink/50 flex items-center gap-1"><MapPin size={12} />{loc.source === "gps" ? "Using your GPS location · within 30 km" : `Location off — showing jobs in ${me.city}`}</p>
          {nearby.length === 0 && <p className="text-sm text-ink/50 text-center py-8">No open jobs near you yet.</p>}
          {nearby.map(j => <JobCard key={j.id} j={j} lang={lang} onClick={() => openJob(j)} />)}
        </div>
      ) : (
        <div className="px-5 mt-4 space-y-2.5">
          {bids === null && <Loader2 className="animate-spin mx-auto text-ink/30 mt-8" />}
          {bids?.length === 0 && <p className="text-sm text-ink/50 text-center py-8">You haven't bid on any jobs yet.</p>}
          {bids?.map(b => (
            <button key={b.id} onClick={() => b.job && openJob(b.job)} className="w-full text-left bg-white rounded-[22px] p-4">
              <div className="flex items-center justify-between gap-2"><p className="font-bold">{b.job?.title ?? "Job removed"}</p><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${b.status === "accepted" ? "bg-[#dcfce7] text-[#166534]" : b.status === "declined" ? "bg-ink/10 text-ink/50" : "bg-flame-soft text-flame"}`}>{b.status === "accepted" ? "Hired" : b.status === "declined" ? "Not selected" : "Pending"}</span></div>
              <p className="text-xs text-ink/50 mt-1">Your bid {rs(b.labour + b.mat)} · base {rs(b.job?.price ?? 0)} · {ago(b.created)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientDashboard({ t, lang, mine, post, manage }: Ctx & { mine: Job[]; post: () => void; manage: (j: Job) => void }) {
  const [seg, setSeg] = useState<"active" | "past">("active");
  const active = mine.filter(j => j.status === "open" || j.status === "assigned");
  const past = mine.filter(j => j.status === "done" || j.status === "closed");
  const stats = [[active.filter(j => j.status === "open").length, "Open"], [mine.reduce((s, j) => s + (j.status === "open" ? j.bids : 0), 0), "Bids waiting"], [mine.filter(j => j.status === "assigned").length, "In progress"]];
  const list = seg === "active" ? active : past;
  return (
    <div className="rise">
      <Header title={t.posts} right={<button onClick={post} className="h-10 px-4 rounded-full bg-flame text-white text-sm font-bold flex items-center gap-1"><Plus size={16} />{t.post}</button>} />
      <div className="mx-5 grid grid-cols-3 gap-2 mb-4">
        {stats.map(([v, l]) => <div key={l} className="bg-ink text-white rounded-2xl p-3"><p className="font-extrabold text-2xl">{v}</p><p className="text-[11px] text-white/55">{l}</p></div>)}
      </div>
      <Seg value={seg} set={setSeg} opts={[["active", `Active (${active.length})`], ["past", `Past (${past.length})`]]} />
      <div className="px-5 mt-4 space-y-2.5">
        {list.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-ink/50">{seg === "active" ? "You haven't posted any jobs yet." : "No completed jobs yet."}</p>
            {seg === "active" && <button onClick={post} className="mt-3 text-sm font-bold text-flame">Post your first job</button>}
          </div>
        )}
        {list.map(j => <MyJobCard key={j.id} j={j} lang={lang} onClick={() => manage(j)} />)}
      </div>
    </div>
  );
}

function ManageSheet({ t, lang, me, job, close, chat, changed }: Ctx & { job: Job; close: () => void; chat: (otherId: string, jobId: string) => void; changed: () => void }) {
  const [bids, setBids] = useState<Bid[] | null>(null);
  const [busy, setBusy] = useState("");
  const c = catOf(job.cat);
  const load = useCallback(() => api<{ bids: Bid[] }>(`/jobs/${job.id}/bids`).then(r => setBids(r.bids)).catch(() => setBids([])), [job.id]);
  useEffect(() => { load(); const x = setInterval(load, 20000); return () => clearInterval(x); }, [load]);
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent<Notice>).detail.jobId === job.id) load(); };
    window.addEventListener("atha-notify", on);
    return () => window.removeEventListener("atha-notify", on);
  }, [me.id, job.id, load]);
  const accept = async (b: Bid) => { setBusy(b.id); try { await api("/bids/accept", { method: "PUT", body: { bidId: b.id } }); await load(); changed(); } catch (e: any) { alert(e.message); } setBusy(""); };
  const setStatus = async (status: string) => { setBusy(status); try { await api(`/jobs/${job.id}/status`, { method: "PUT", body: { status } }); changed(); close(); } catch (e: any) { alert(e.message); } setBusy(""); };
  const [view, setView] = useState<Bid | null>(null);
  const sorted = (bids ?? []).slice().sort((a, b) => a.labour + a.mat - (b.labour + b.mat));
  return (
    <Sheet close={close}>
      <div className="flex items-center gap-2"><span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${c.tint}`}><c.icon size={13} />{c[lang]}</span><StatusPill s={job.status} /></div>
      <Gallery urls={job.photoUrls} alt={job.title} />
      <h3 className="text-[22px] font-extrabold mt-3 leading-tight">{job.title}</h3>
      <p className="text-sm text-ink/55 mt-1">{job.place}, {job.city} · base {rs(job.price)}{job.negotiable ? " (negotiable)" : ""} · posted {ago(job.created)}</p>
      {job.sow && <SowCard sow={job.sow} />}
      {job.status === "assigned" && <div className="mt-3 rounded-2xl bg-[#dbeafe] p-3 text-sm text-[#1e40af] font-semibold">Hired {job.assignee} for {rs(job.agreed ?? 0)}</div>}
      <p className="font-extrabold mt-5">{bids?.length ?? 0} {job.org ? (bids?.length === 1 ? "applicant" : "applicants") : bids?.length === 1 ? "bid" : "bids"}</p>
      <div className="mt-2 space-y-2.5">
        {bids === null && <Loader2 className="animate-spin mx-auto text-ink/30" />}
        {bids?.length === 0 && <p className="text-sm text-ink/50 bg-white rounded-2xl p-4 text-center">No bids yet — nearby experts are being notified.</p>}
        {sorted.map((b, i) => (
          <div key={b.id} className={`bg-white rounded-[22px] p-4 ${b.status === "accepted" ? "ring-2 ring-teal" : b.status === "declined" ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <Avatar p={b} size={44} />
              <div className="flex-1 min-w-0"><p className="font-bold flex items-center gap-1">{b.name}{b.verified && <ShieldCheck size={14} className="text-teal" />}</p><p className="text-xs text-ink/50 flex items-center gap-2"><MapPin size={11} />{b.city}<Clock size={11} />{b.years || 0} yrs exp</p></div>
              <div className="text-right"><p className="font-extrabold text-lg">{rs(b.labour + b.mat)}</p>{b.negotiable && <p className="text-[10px] font-bold text-teal">NEGOTIABLE</p>}{i === 0 && sorted.length > 1 && <p className="text-[10px] font-bold text-teal">LOWEST</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-cream rounded-xl p-2.5"><p className="text-ink/50">{t.labour}</p><p className="font-bold text-sm">{rs(b.labour)}</p></div>
              <div className="bg-cream rounded-xl p-2.5"><p className="text-ink/50">{t.mat}</p><p className="font-bold text-sm">{rs(b.mat)}</p></div>
            </div>
            {job.org && <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-flame-soft rounded-xl p-2.5"><p className="text-ink/50">Salary expectation</p><p className="font-bold text-sm text-flame">{b.salary ? rs(b.salary) : "—"}</p></div>
              <div className="bg-cream rounded-xl p-2.5 min-w-0"><p className="text-ink/50">Applying from</p><p className="font-bold text-sm truncate">{b.from ? [b.from.area, b.from.city].filter(Boolean).join(", ") : b.city}</p>{b.from?.ll && <p className="text-[10px] text-ink/45">{kmBetween(b.from.ll, jobLL(job))} km from job{b.from.source === "gps" ? " · GPS" : ""}</p>}</div>
            </div>}
            {b.note && <p className="text-xs mt-3 text-ink/70">"{b.note}"</p>}
            {b.ai && <div className="mt-3 rounded-xl bg-ink text-white p-3">
              <p className="text-[10px] font-extrabold text-flame flex items-center gap-1"><Sparkles size={11} />AI FIT SUMMARY · {b.ai.score}/100</p>
              <p className="text-xs mt-1 text-white/85">{b.ai.fit}</p>
              {b.ai.flags.length > 0 && <p className="text-[11px] mt-1.5 text-[#fca5a5] flex gap-1"><AlertTriangle size={11} className="shrink-0 mt-0.5" />{b.ai.flags.join(" · ")}</p>}
            </div>}
            {b.applicant && <button onClick={() => setView(b)} className="mt-3 w-full py-2.5 rounded-full border border-line text-sm font-bold flex items-center justify-center gap-1.5"><FileText size={15} className="text-flame" />View profile & CV{!b.applicant.cvComplete && <span className="text-[10px] text-ink/40">(partial)</span>}</button>}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => chat(b.expertId, job.id)} className="py-2.5 rounded-full bg-cream font-bold text-sm flex items-center justify-center gap-1.5"><MessageCircle size={15} />Chat</button>
              {job.status === "open" ? <button disabled={!!busy} onClick={() => accept(b)} className="py-2.5 rounded-full bg-ink text-white font-bold text-sm disabled:opacity-50">{busy === b.id ? "…" : "Accept"}</button>
                : <span className="py-2.5 text-center text-sm font-bold text-ink/50">{b.status === "accepted" ? "Hired" : "—"}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-5">
        {["assigned", "done"].includes(job.status) && (job.disputeId
          ? <p className="col-span-2 text-center text-xs font-bold text-ink/50 flex items-center justify-center gap-1"><AlertTriangle size={13} className="text-flame" />Dispute under review</p>
          : <button onClick={async () => { const reason = prompt("What went wrong? An admin will review this with the job brief and your chat."); if (!reason?.trim()) return; setBusy("dispute"); try { await api(`/jobs/${job.id}/dispute`, { body: { reason } }); changed(); close(); } catch (e: any) { alert(e.message); } setBusy(""); }} className="col-span-2 py-3 rounded-full border border-line text-sm font-bold text-flame flex items-center justify-center gap-1.5"><AlertTriangle size={15} />Report a problem</button>)}
        {job.status === "assigned" && <Primary busy={busy === "done"} onClick={() => setStatus("done")} className="col-span-2">Mark as completed</Primary>}
        {view && <ApplicantSheet b={view} job={job} lang={lang} close={() => setView(null)} />}
        {job.status === "open" && <button onClick={() => setStatus("closed")} className="col-span-2 py-3 rounded-full border border-line text-sm font-bold text-ink/60">Close job</button>}
      </div>
    </Sheet>
  );
}

function PostSheet({ t, lang, me, loc, initialCat, close, posted }: Ctx & { initialCat: string; close: () => void; posted: () => void }) {
  const [f, setF] = useState({ cat: initialCat || "", title: "", desc: "", price: "", city: me.city, place: me.address, remote: false, negotiable: false, cvRequired: true, minYears: 0, catName: "" });
  const [kind, setKind] = useState<"odd" | "skilled">(initialCat && !EXPERT_CATS.includes(initialCat) ? "odd" : "skilled");
  const odd = kind === "odd";
  const [custom, setCustom] = useState<{ id: string; name: string; uses: number }[]>([]);
  useEffect(() => { api<{ categories: { id: string; name: string; uses: number }[] }>("/categories").then(r => { r.categories.forEach(c => { CUSTOM_CATS[c.id] = c.name; }); setCustom(r.categories); }).catch(() => {}); }, []);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [priority, setPriority] = useState<Priority>("medium");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const publish = async () => {
    if (!f.cat || !f.title || !Number(f.price) || !f.city) return setErr("Choose a category, add a title, salary and city.");
    if (f.cat === "other" && !f.catName.trim()) return setErr("Name your category.");
    if (odd && EXPERT_CATS.includes(f.cat)) return setErr("Pick an odd-job category.");
    setBusy(true); setErr("");
    // Use GPS when the job is in the user's own city; otherwise place it at the chosen city's centre.
    const base = loc.source === "gps" && f.city === me.city ? loc.ll : CITIES[f.city];
    const ll: [number, number] = [base[0] + (Math.random() - 0.5) * 0.004, base[1] + (Math.random() - 0.5) * 0.004];
    try { await api("/jobs", { body: { ...f, ...(odd ? { negotiable: false, minYears: 0, remote: false } : {}), kind, price: Number(f.price), ll, priority, photos: await Promise.all(photos.map(p => jobPhotoData(p.file))) } }); posted(); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  if (me.role === "earn") return <Sheet close={close}><p className="text-sm py-6 text-center">Expert-only accounts can't post jobs. Change your role in Me.</p></Sheet>;
  return (
    <Sheet close={close}>
      <h3 className="text-[22px] font-extrabold">{t.post}</h3>
      {me.isOrg && <p className="text-xs text-ink/55 mt-1 flex items-center gap-1"><Building2 size={12} />Posting as {me.orgName || me.name}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {([["odd", "Odd job", "Quick help, anyone nearby", Sparkles], ["skilled", "Skilled job", "Experts, experience, CV", ShieldCheck]] as const).map(([k, l, d, I]) => (
          <button key={k} onClick={() => { setKind(k); if (k === "odd" && EXPERT_CATS.includes(f.cat)) setF({ ...f, cat: "" }); }} className={`p-3 rounded-2xl text-left border-2 ${kind === k ? "border-flame bg-flame-soft" : "border-transparent bg-white"}`}>
            <p className={`font-bold text-sm flex items-center gap-1.5 ${kind === k ? "text-flame" : ""}`}><I size={15} />{l}</p><p className="text-[11px] text-ink/55 mt-0.5">{d}</p>
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
        const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith("image/"));
        setPhotos(p => [...p, ...files.map(file => ({ file, url: URL.createObjectURL(file) }))].slice(0, 3));
        e.target.value = "";
      }} />
      <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold text-ink/50">Photos ({photos.length}/3)</p><p className="text-[11px] text-ink/40">Helps experts quote accurately</p></div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={p.url} className="relative h-24 rounded-[18px] overflow-hidden bg-white">
            <img src={p.url} alt={`Job photo ${i + 1}`} className="w-full h-full object-cover" />
            <button onClick={() => setPhotos(list => list.filter(x => x.url !== p.url))} aria-label="Remove photo" className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white grid place-items-center"><X size={13} /></button>
          </div>
        ))}
        {photos.length < 3 && <button onClick={() => fileRef.current?.click()} className="h-24 rounded-[18px] border-2 border-dashed border-ink/25 bg-white flex flex-col items-center justify-center gap-1 text-ink/50"><Camera size={20} className="text-flame" /><span className="text-[11px] font-bold">Add photo</span></button>}
      </div>
      <p className="text-xs font-semibold text-ink/50 mt-4 mb-2">Category</p>
      <div className="flex flex-wrap gap-1.5">{(odd ? CATS.filter(c => !EXPERT_CATS.includes(c.id)) : CATS).map(c => <button key={c.id} onClick={() => setF({ ...f, cat: c.id })} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 flex items-center gap-1 ${f.cat === c.id ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><c.icon size={12} />{c[lang]}</button>)}
        {custom.map(c => <button key={c.id} onClick={() => setF({ ...f, cat: c.id })} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 flex items-center gap-1 ${f.cat === c.id ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-[#efe9df]"}`}><Package size={12} />{c.name}</button>)}
        <button onClick={() => setF({ ...f, cat: "other" })} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 border-dashed flex items-center gap-1 ${f.cat === "other" ? "border-flame bg-flame-soft text-flame" : "border-ink/25 bg-white"}`}><Plus size={12} />Other</button>
      </div>
      {f.cat === "other" && <div className="mt-2 space-y-2">
        <Field label="New category name — others can use it too"><input value={f.catName} onChange={e => setF({ ...f, catName: e.target.value })} maxLength={30} placeholder="e.g. Care taking" className={inputCls} /></Field>
        <p className="text-[11px] text-ink/50 px-1">Keep it short and general (1–3 words) so others can reuse it. Describe the details in the title instead.</p>
        <div className="flex flex-wrap gap-1.5">{["Care taking", "Gardening", "Pet care", "Cooking", "Babysitting", "Delivery", "Tailoring", "Event help", "Elder care", "Laundry"].filter(x => !custom.some(c => c.name.toLowerCase() === x.toLowerCase())).map(x => <button key={x} onClick={() => setF({ ...f, catName: x })} className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${f.catName === x ? "bg-ink text-white" : "bg-white text-ink/70"}`}>{x}</button>)}</div>
        {f.catName.trim().split(/\s+/).length > 3 && <p className="text-[11px] text-flame font-semibold px-1 flex items-center gap-1"><AlertTriangle size={12} />That's long for a category. Try something like "Care taking".</p>}
      </div>}
      <div className="mt-3 space-y-2.5">
        <Field label="Title"><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Leaking kitchen pipe under sink" className={inputCls} /></Field>
        <Field label="Details"><textarea value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} rows={2} placeholder="What's wrong, when you need it, anything to bring" className={inputCls + " resize-none"} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="City"><CitySelect value={f.city} set={v => setF({ ...f, city: v })} /></Field>
          <Field label="Area"><input value={f.place} onChange={e => setF({ ...f, place: e.target.value })} placeholder="Hunupitiya" className={inputCls} /></Field>
        </div>
        <Field label="Salary (Rs)"><input type="number" inputMode="numeric" min={1} value={f.price} onChange={e => setF({ ...f, price: e.target.value })} placeholder="3000" className={inputCls + " text-lg"} /></Field>
      </div>
      {!odd && <>
      <div className="mt-3 grid grid-cols-2 p-1 bg-white rounded-full text-sm font-bold">
        <button onClick={() => setF({ ...f, remote: false })} className={`py-2.5 rounded-full ${!f.remote ? "bg-ink text-white" : "text-ink/50"}`}>On-site</button>
        <button onClick={() => setF({ ...f, remote: true })} className={`py-2.5 rounded-full ${f.remote ? "bg-ink text-white" : "text-ink/50"}`}>Remote OK</button>
      </div>
      <NegToggle on={f.negotiable} set={v => setF({ ...f, negotiable: v })} label="Salary is negotiable" />
      <div className="mt-2 bg-white rounded-2xl px-4 py-3 flex items-center justify-between">
        <span><span className="block text-sm font-semibold flex items-center gap-2"><Clock size={16} className="text-flame" />Minimum experience</span><span className="block text-[11px] text-ink/45">Experts with less can't apply</span></span>
        <span className="flex items-center gap-2">
          <button onClick={() => setF({ ...f, minYears: Math.max(0, f.minYears - 1) })} className="w-8 h-8 rounded-full bg-cream font-bold">−</button>
          <span className="w-14 text-center font-extrabold text-sm">{f.minYears ? `${f.minYears} yr${f.minYears > 1 ? "s" : ""}` : "Any"}</span>
          <button onClick={() => setF({ ...f, minYears: Math.min(40, f.minYears + 1) })} className="w-8 h-8 rounded-full bg-cream font-bold">+</button>
        </span>
      </div>
      {me.isOrg && <p className="mt-2 text-xs text-ink/55 flex gap-1.5"><FileText size={14} className="shrink-0 text-flame" />As an organisation, only applicants with a complete CV can apply.</p>}
      <p className="text-xs font-semibold text-ink/50 mt-4 mb-2">How urgent is it?</p>
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.keys(PRIORITY) as Priority[]).map(k => {
          const p = PRIORITY[k], on = priority === k;
          return <button key={k} onClick={() => setPriority(k)} className={`py-2.5 rounded-2xl text-xs font-extrabold border-2 flex flex-col items-center gap-1 ${on ? "bg-white" : "bg-white/60 border-transparent text-ink/55"}`} style={on ? { borderColor: p.color } : undefined}><span className="w-3 h-3 rounded-full" style={{ background: p.color }} />{p.label}</button>;
        })}
      </div>
      </>}
      {odd && <p className="mt-3 text-xs text-ink/55 flex gap-1.5"><Sparkles size={14} className="shrink-0 text-flame" />Fixed salary, shown to everyone nearby who does odd jobs.{me.isOrg ? " Applicants need a complete CV." : ""}</p>}
      {EXPERT_CATS.includes(f.cat) && <p className="mt-3 text-xs text-teal flex gap-1.5"><ShieldCheck size={14} className="shrink-0" />Only verified skilled experts can bid on this category.</p>}
      <Err msg={err} />
      <Primary busy={busy} onClick={publish} className="mt-4">Publish & find helpers</Primary>
    </Sheet>
  );
}

/* ---------- Chats ---------- */

function ChatsTab({ me, online, open }: { me: Profile; online: Set<string>; open: (id: string) => void }) {
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    const load = () => api<{ chats: Chat[] }>("/chats").then(r => { setChats(r.chats); setErr(""); }).catch(e => { setErr(e.message); setChats([]); });
    load();
    const on = (e: Event) => { if ((e as CustomEvent<Notice>).detail.kind === "msg") load(); };
    window.addEventListener("atha-notify", on);
    const x = setInterval(load, 30000);
    return () => { clearInterval(x); window.removeEventListener("atha-notify", on); };
  }, [me.id]);
  return (
    <div className="rise">
      <Header title="Chats" />
      <div className="px-5"><Err msg={err} /></div>
      {chats === null && <Loader2 className="animate-spin mx-auto text-ink/30 mt-8" />}
      {chats?.length === 0 && !err && <p className="text-sm text-ink/50 text-center px-8 py-10">No conversations yet. Message a client from a job, or an expert from their bid.</p>}
      {!!chats?.length && (
        <div className="mx-5 bg-white rounded-[22px] overflow-hidden">
          {chats.map((c, i) => {
            const mine = c.lastFrom === me.id;
            const other = c.other ?? { id: "", name: "User" };
            return (
              <button key={c.id} onClick={() => open(c.id)} className={`w-full flex items-center gap-3 p-4 text-left ${i ? "border-t border-line" : ""}`}>
                <Avatar p={other} size={48} online={online.has(other.id)} />
                <div className="flex-1 min-w-0"><p className="font-bold truncate">{other.name || "User"}</p><p className="text-[11px] text-ink/45 truncate">{c.jobTitle}</p><p className={`text-sm truncate ${c.unread ? "font-bold" : "text-ink/55"}`}>{mine && "You: "}{c.last || "Say hello"}</p></div>
                <div className="flex flex-col items-end gap-1"><span className="text-[11px] text-ink/40">{ago(c.lastAt)}</span>{c.unread > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-flame text-white text-[11px] font-bold grid place-items-center">{c.unread}</span>}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Conversation({ id, me, t, online, close }: { id: string; me: Profile; t: Dict; online: Set<string>; close: () => void }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [txt, setTxt] = useState("");
  const [typing, setTyping] = useState(false);
  const [act, setAct] = useState<string | null>(null);
  const [reportMsg, setReportMsg] = useState<Msg | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const chan = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimer = useRef<number>(0);
  const lastTypingSent = useRef(0);
  const markRead = useCallback(() => { if (!document.hidden) api(`/chats/${id}/read`, { method: "PUT" }).catch(() => {}); }, [id]);
  const load = useCallback(() => api<{ chat: Chat; messages: Msg[] }>(`/chats/${id}/messages`).then(r => { setChat(r.chat); setMsgs((r.messages ?? []).filter(m => m && m.id && typeof m.text === "string")); markRead(); }).catch(e => alert(e.message)), [id, markRead]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`chat:${id}`)
      .on("broadcast", { event: "msg" }, ({ payload }) => {
        const m = payload as Msg;
        if (!m?.id || typeof m.text !== "string") return;
        setMsgs(list => list.some(x => x.id === m.id) ? list : [...list.filter(x => !(String(x.id).startsWith("tmp") && x.text === m.text && m.from === me.id)), m]);
        if (m.from !== me.id) { setTyping(false); markRead(); }
      })
      .on("broadcast", { event: "del" }, ({ payload }) => { const d = payload as { id: string }; setMsgs(list => list.filter(m => m.id !== d.id)); })
      .on("broadcast", { event: "read" }, ({ payload }) => {
        const { by, at } = payload as { by: string; at: string };
        if (by !== me.id) setMsgs(list => list.map(m => m.from === me.id && !m.readAt ? { ...m, readAt: at } : m));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if ((payload as { from: string }).from === me.id) return;
        setTyping(true); clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => setTyping(false), 3500);
      })
      .subscribe();
    chan.current = ch;
    const vis = () => !document.hidden && markRead();
    document.addEventListener("visibilitychange", vis);
    return () => { supabase.removeChannel(ch); clearTimeout(typingTimer.current); document.removeEventListener("visibilitychange", vis); };
  }, [id, me.id, load, markRead]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, typing]);

  const onType = (v: string) => {
    setTxt(v);
    if (v && Date.now() - lastTypingSent.current > 2000) {
      lastTypingSent.current = Date.now();
      chan.current?.send({ type: "broadcast", event: "typing", payload: { from: me.id } });
    }
  };
  const send = async () => {
    const text = txt.trim(); if (!text) return;
    setTxt("");
    const temp: Msg = { id: "tmp" + Date.now(), from: me.id, text, at: new Date().toISOString() };
    setMsgs(m => [...m, temp]);
    try {
      const { message } = await api<{ message: Msg }>(`/chats/${id}/messages`, { body: { text } });
      setMsgs(list => list.some(x => x.id === message.id) ? list.filter(x => x.id !== temp.id) : list.map(x => x.id === temp.id ? message : x));
    } catch (e: any) { setMsgs(m => m.filter(x => x.id !== temp.id)); setTxt(text); alert(e.message); }
  };
  const del = async (m: Msg) => {
    setAct(null);
    if (!confirm("Delete this message for everyone?")) return;
    const prev = msgs; setMsgs(list => list.filter(x => x.id !== m.id));
    try { await api(`/chats/${id}/messages/${m.id}`, { method: "DELETE" }); } catch (e: any) { setMsgs(prev); alert(e.message); }
  };
  const report = async (m: Msg, reason: string) => {
    setReportMsg(null);
    try { await api(`/chats/${id}/messages/${m.id}/report`, { body: { reason } }); alert("Thanks — our team will review this message."); } catch (e: any) { alert(e.message); }
  };
  const other = chat?.other;
  const isOnline = !!other && online.has(other.id);
  const status = typing ? "typing…" : other ? lastSeenText(isOnline, other.lastSeen) : "";
  const lastMine = [...msgs].reverse().find(m => m.from === me.id && !String(m.id).startsWith("tmp"));
  return (
    <div className="absolute inset-0 z-[1900] bg-cream flex flex-col rise">
      <div className="pt-14 px-4 pb-3 flex items-center gap-3 bg-white">
        <button onClick={close} className="w-10 h-10 rounded-full bg-cream grid place-items-center"><ChevronLeft size={20} /></button>
        <Avatar p={other} size={42} online={other ? isOnline : undefined} />
        <div className="flex-1 min-w-0">
          <p className="font-bold leading-tight truncate">{other?.name ?? "…"}</p>
          <p className={`text-xs truncate ${typing ? "text-flame font-semibold" : isOnline ? "text-[#16a34a] font-semibold" : "text-ink/50"}`}>{status}</p>
        </div>
      </div>
      {chat?.jobTitle && <p className="text-center text-[11px] font-semibold text-ink/45 bg-white/60 py-1.5 flex items-center justify-center gap-1"><Briefcase size={11} />{chat.jobTitle}</p>}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.length === 0 && <p className="text-center text-sm text-ink/40 py-8">No messages yet. Start the conversation.</p>}
        {msgs.map(m => {
          const mine = m.from === me.id, pending = String(m.id).startsWith("tmp");
          return (
            <div key={m.id} className={`max-w-[78%] w-fit ${mine ? "ml-auto" : ""}`}>
            <button type="button" disabled={pending} onClick={() => setAct(act === m.id ? null : m.id)} onContextMenu={e => { e.preventDefault(); setAct(m.id); }} className={`block text-left w-full px-4 py-2.5 rounded-[20px] text-[15px] ${mine ? "bg-flame text-white rounded-br-md" : "bg-white rounded-bl-md"} ${act === m.id ? "ring-2 ring-ink/30" : ""}`}>
              {m.text}
              <span className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 ${mine ? "text-white/70" : "text-ink/35"}`}>
                {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {mine && (pending ? <Clock size={11} /> : m.readAt ? <CheckCheck size={13} className="text-white" strokeWidth={2.75} /> : <Check size={12} />)}
              </span>
            </button>
            {act === m.id && <div className={`mt-1 flex gap-1.5 rise ${mine ? "justify-end" : ""}`}>
              {mine
                ? <button onClick={() => del(m)} className="px-3 py-1.5 rounded-full bg-white text-xs font-bold text-[#dc2626] flex items-center gap-1 shadow-sm"><Trash2 size={13} />Delete</button>
                : <button onClick={() => { setAct(null); setReportMsg(m); }} className="px-3 py-1.5 rounded-full bg-white text-xs font-bold text-[#dc2626] flex items-center gap-1 shadow-sm"><AlertTriangle size={13} />Report</button>}
              <button onClick={() => { navigator.clipboard?.writeText(m.text); setAct(null); }} className="px-3 py-1.5 rounded-full bg-white text-xs font-bold shadow-sm">Copy</button>
            </div>}
            </div>
          );
        })}
        {lastMine?.readAt && msgs[msgs.length - 1]?.id === lastMine.id && <p className="text-right text-[10px] text-ink/40 -mt-1">Seen {new Date(lastMine.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
        {typing && <div className="w-fit bg-white rounded-[20px] rounded-bl-md px-4 py-3 flex gap-1">{[0, 1, 2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}</div>}
        <div ref={end} />
      </div>
      {reportMsg && <Sheet close={() => setReportMsg(null)}>
        <h3 className="text-[22px] font-extrabold">Report message</h3>
        <p className="text-sm text-ink/55 mt-1 line-clamp-2">"{reportMsg.text}"</p>
        <div className="mt-4 space-y-2">{["Spam or scam", "Harassment or abuse", "Asking to pay outside atha", "Inappropriate content", "Something else"].map(x => <button key={x} onClick={() => report(reportMsg, x)} className="w-full bg-white rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold flex items-center justify-between">{x}<ChevronRight size={17} className="text-ink/35" /></button>)}</div>
      </Sheet>}
      <div className="p-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex gap-2">
        <input value={txt} onChange={e => onType(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={t.msg} className="flex-1 h-12 rounded-full bg-white px-5 outline-none" />
        <button onClick={send} className="w-12 h-12 rounded-full bg-flame text-white grid place-items-center"><Send size={18} /></button>
      </div>
    </div>
  );
}

/* ---------- Me ---------- */

function MeTab({ t, lang, me, mode, setMode, setLang, setMe, logout }: Ctx & { mode: string; setMode: (m: "client" | "expert") => void; setLang: (l: Lang) => void; setMe: (p: Profile) => void; logout: () => void }) {
  const [edit, setEdit] = useState(false);
  const [cv, setCv] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const expert = mode === "expert";
  return (
    <div className="rise px-4 pt-14">
      <div className="flex items-center gap-4 px-1">
        <label className="relative cursor-pointer">
          <Avatar p={me} size={68} />
          <span className="absolute -right-1 -bottom-1 w-7 h-7 rounded-full bg-ink text-white grid place-items-center ring-2 ring-cream">{photoBusy ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}</span>
          <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setPhotoBusy(true); try { setMe(await uploadAvatar(await squarePhoto(f))); } catch (er: any) { alert(er.message); } setPhotoBusy(false); }} />
        </label>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold truncate">{me.name}</p>
          {me.isOrg && <p className="text-xs font-bold text-ink/60 flex items-center gap-1"><Building2 size={12} />{me.orgName || "Organisation"}</p>}
          <p className={`text-sm flex items-center gap-1 font-medium ${me.verified ? "text-teal" : "text-ink/50"}`}><ShieldCheck size={15} />{me.verified ? "Skilled · NIC added" : me.level === "skilled" ? "Add NIC to verify" : "Odd-jobs profile"}</p>
          <p className="text-xs text-ink/50 flex items-center gap-1"><MapPin size={11} />{me.city}</p>
        </div>
      </div>
      <div className="mt-6 bg-ink text-white rounded-[22px] p-4 flex items-center justify-between">
        <div><p className="text-xs text-white/55">{t.mode}</p><p className="font-bold text-lg">{expert ? t.expert : t.client}</p></div>
        {me.role === "both"
          ? <button onClick={() => setMode(expert ? "client" : "expert")} className="text-flame font-bold flex items-center gap-1.5"><Repeat size={17} />{t.sw} {expert ? t.client.toLowerCase() : t.expert.toLowerCase()}</button>
          : <button onClick={() => setEdit(true)} className="text-xs text-white/60 font-semibold">Change role</button>}
      </div>
      {me.role !== "hire" && (
        <div className="mt-3 bg-white rounded-[22px] p-4">
          <p className="text-xs font-semibold text-ink/50">Skills</p>
          <div className="flex flex-wrap gap-1.5 mt-2">{me.skills?.length ? me.skills.map(s => { const c = catOf(s); return <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.tint}`}>{c[lang]}</span>; }) : <span className="text-sm text-ink/50">Odd jobs only (cleaning, moving, home help)</span>}</div>
        </div>
      )}
      <div className="mt-3 bg-white rounded-[22px] overflow-hidden">
        <button onClick={() => setEdit(true)} className="w-full flex items-center justify-between px-4 py-4 text-[15px]">Profile, skills & verification<ChevronRight size={18} className="text-ink/35" /></button>
        {me.role !== "hire" && <button onClick={() => setCv(true)} className="w-full border-t border-line flex items-center justify-between px-4 py-4 text-[15px]">
          <span className="flex items-center gap-2"><FileText size={16} />My CV</span>
          <span className="flex items-center gap-2">{cvComplete(me) ? <span className="text-xs font-bold text-teal flex items-center gap-1"><Check size={13} />Complete</span> : <span className="text-xs text-ink/45">{me.level === "casual" ? "Optional" : "Incomplete"}</span>}<ChevronRight size={18} className="text-ink/35" /></span>
        </button>}
        <div className="border-t border-line px-4 py-3 flex items-center justify-between text-[15px]">
          <span className="flex items-center gap-2"><Globe size={16} />Language</span>
          <div className="flex gap-1">{([["en", "EN"], ["si", "සි"], ["ta", "த"]] as const).map(([k, l]) => <button key={k} onClick={() => setLang(k)} className={`w-9 h-8 rounded-full text-xs font-bold ${lang === k ? "bg-ink text-white" : "bg-cream"}`}>{l}</button>)}</div>
        </div>
      </div>
      <button onClick={logout} className="mt-4 w-full py-4 rounded-[22px] border border-line text-flame font-semibold flex items-center justify-center gap-2"><LogOut size={16} />{t.out}</button>
      {cv && <CvSheet me={me} close={() => setCv(false)} saved={p => { setMe(p); setCv(false); }} />}
      {edit && <EditProfile lang={lang} me={me} close={() => setEdit(false)} saved={p => { setMe(p); setEdit(false); if (p.role === "earn") setMode("expert"); if (p.role === "hire") setMode("client"); }} />}
    </div>
  );
}

function EditProfile({ lang, me, close, saved }: { lang: Lang; me: Profile; close: () => void; saved: (p: Profile) => void }) {
  const [f, setF] = useState({ ...me, years: String(me.years || "") });
  // Older profiles only have one overall number: use it as the starting value for each skill.
  const [sk, setSk] = useState<SkillSet>(() => ({ skills: me.skills ?? [], years: Object.fromEntries((me.skills ?? []).map(k => [k, String(me.skillYears?.[k] ?? me.years ?? "")])), names: {} }));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    if (f.level === "skilled" && !sk.skills.length) return setErr("Pick at least one skill for a skilled profile.");
    if (f.level === "skilled" && missingYears(sk).length) return setErr("Enter your years of experience for each skill.");
    if (f.isOrg && !f.orgName?.trim()) return setErr("Add your organisation name.");
    setBusy(true); setErr("");
    try { saved((await api<{ profile: Profile }>("/profile", { method: "PUT", body: { ...f, ...(f.level === "skilled" ? { skills: sk.skills, skillYears: skillYearsNum(sk), skillNames: sk.names, years: Math.max(0, ...Object.values(skillYearsNum(sk))) } : { years: Number(f.years) || 0 }) } })).profile); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  return (
    <Sheet close={close}>
      <h3 className="text-[22px] font-extrabold">Your profile</h3>
      <div className="mt-4 space-y-2.5">
        <Field label="Full name"><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Phone"><input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} className={inputCls} /></Field>
          <Field label="City"><CitySelect value={f.city} set={v => setF({ ...f, city: v })} /></Field>
        </div>
        <Field label="Area / street"><input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-2">{([[false, "Individual"], [true, "Organisation"]] as const).map(([k, l]) => <button key={l} onClick={() => setF({ ...f, isOrg: k, role: k && f.role === "earn" ? "hire" : f.role })} className={`py-2.5 rounded-2xl text-sm font-bold border-2 flex items-center justify-center gap-1.5 ${!!f.isOrg === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}>{k ? <Building2 size={15} /> : <User size={15} />}{l}</button>)}</div>
        {f.isOrg && <Field label="Organisation name"><input value={f.orgName ?? ""} onChange={e => setF({ ...f, orgName: e.target.value })} placeholder="Acme Lanka (Pvt) Ltd" className={inputCls} /></Field>}
        <div className="grid grid-cols-3 gap-2">{([["hire", "Hire"], ["earn", "Earn"], ["both", "Both"]] as const).map(([k, l]) => <button key={k} onClick={() => setF({ ...f, role: k })} className={`py-2.5 rounded-2xl text-sm font-bold border-2 ${f.role === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}>{l}</button>)}</div>
        {f.role !== "hire" && <>
          <div className="grid grid-cols-2 gap-2">{([["casual", "Odd jobs"], ["skilled", "Skilled expert"]] as const).map(([k, l]) => <button key={k} onClick={() => setF({ ...f, level: k })} className={`py-2.5 rounded-2xl text-sm font-bold border-2 ${f.level === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}>{l}</button>)}</div>
          {f.level === "skilled" && <>
            <SkillsEditor lang={lang} value={sk} set={setSk} />
            <Field label="NIC number"><input value={f.nic} onChange={e => setF({ ...f, nic: e.target.value })} className={inputCls} /></Field>
            <Field label="Short bio"><textarea value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} rows={2} className={inputCls + " resize-none"} /></Field>
          </>}
        </>}
      </div>
      <Err msg={err} />
      <Primary busy={busy} onClick={save} className="mt-4">Save</Primary>
    </Sheet>
  );
}

/* ---------- CV ---------- */

const emptyCv: Cv = { headline: "", summary: "", dob: "", languages: "", certifications: "", links: "", education: [], work: [] };

function CvSheet({ me, close, saved }: { me: Profile; close: () => void; saved: (p: Profile) => void }) {
  const [cv, setCv] = useState<Cv>({ ...emptyCv, ...(me.cv ?? {}) });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const done = cvComplete({ cv });
  const setEdu = (i: number, k: keyof Cv["education"][number], v: string) => setCv({ ...cv, education: cv.education.map((e, j) => j === i ? { ...e, [k]: v } : e) });
  const setWork = (i: number, k: keyof Cv["work"][number], v: string) => setCv({ ...cv, work: cv.work.map((e, j) => j === i ? { ...e, [k]: v } : e) });
  const save = async () => {
    setBusy(true); setErr("");
    const clean = { ...cv, education: cv.education.filter(e => e.school || e.qual), work: cv.work.filter(w => w.role || w.org) };
    try { saved((await api<{ profile: Profile }>("/profile", { method: "PUT", body: { cv: clean } })).profile); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const del = (fn: () => void) => <button onClick={fn} aria-label="Remove" className="w-8 h-8 rounded-full bg-cream grid place-items-center text-ink/50"><Trash2 size={14} /></button>;
  return (
    <Sheet close={close}>
      <h3 className="text-[22px] font-extrabold">My CV</h3>
      <p className="text-xs text-ink/55 mt-1">{me.level === "casual" ? "Optional for odd jobs. " : ""}A complete CV lets you apply to organisation jobs, and we can generate a PDF from it.</p>
      <div className={`mt-3 rounded-2xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 ${done ? "bg-teal/10 text-teal" : "bg-white text-ink/55"}`}>{done ? <><Check size={14} />Complete — you can apply to organisation jobs</> : <><FileText size={14} />Needs headline, summary, languages, 1 education & 1 work entry</>}</div>
      <div className="mt-4 space-y-2.5">
        <Field label="Professional headline"><input value={cv.headline} onChange={e => setCv({ ...cv, headline: e.target.value })} placeholder="Senior electrician · 8 yrs commercial wiring" className={inputCls} /></Field>
        <Field label="Summary"><textarea value={cv.summary} onChange={e => setCv({ ...cv, summary: e.target.value })} rows={3} placeholder="A few lines about your strengths and what you're looking for" className={inputCls + " resize-none"} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date of birth"><input type="date" value={cv.dob} onChange={e => setCv({ ...cv, dob: e.target.value })} className={inputCls} /></Field>
          <Field label="Languages"><input value={cv.languages} onChange={e => setCv({ ...cv, languages: e.target.value })} placeholder="Sinhala, English" className={inputCls} /></Field>
        </div>
      </div>
      <div className="flex items-center justify-between mt-5"><p className="font-extrabold">Work experience</p><button onClick={() => setCv({ ...cv, work: [...cv.work, { role: "", org: "", from: "", to: "", desc: "" }] })} className="text-sm font-bold text-flame flex items-center gap-1"><Plus size={15} />Add</button></div>
      <div className="mt-2 space-y-2">
        {cv.work.length === 0 && <p className="text-xs text-ink/45 bg-white rounded-2xl p-3 text-center">No roles yet</p>}
        {cv.work.map((w, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 space-y-2">
            <div className="flex gap-2"><input value={w.role} onChange={e => setWork(i, "role", e.target.value)} placeholder="Job title" className="flex-1 font-bold outline-none text-sm" />{del(() => setCv({ ...cv, work: cv.work.filter((_, j) => j !== i) }))}</div>
            <input value={w.org} onChange={e => setWork(i, "org", e.target.value)} placeholder="Company / client" className="w-full outline-none text-sm" />
            <div className="grid grid-cols-2 gap-2"><input value={w.from} onChange={e => setWork(i, "from", e.target.value)} placeholder="From (2019)" className="bg-cream rounded-xl px-3 py-2 text-sm outline-none" /><input value={w.to} onChange={e => setWork(i, "to", e.target.value)} placeholder="To (Present)" className="bg-cream rounded-xl px-3 py-2 text-sm outline-none" /></div>
            <textarea value={w.desc} onChange={e => setWork(i, "desc", e.target.value)} rows={2} placeholder="What you did" className="w-full bg-cream rounded-xl px-3 py-2 text-sm outline-none resize-none" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-5"><p className="font-extrabold">Education</p><button onClick={() => setCv({ ...cv, education: [...cv.education, { school: "", qual: "", year: "" }] })} className="text-sm font-bold text-flame flex items-center gap-1"><Plus size={15} />Add</button></div>
      <div className="mt-2 space-y-2">
        {cv.education.length === 0 && <p className="text-xs text-ink/45 bg-white rounded-2xl p-3 text-center">No education yet</p>}
        {cv.education.map((e, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 space-y-2">
            <div className="flex gap-2"><input value={e.qual} onChange={ev => setEdu(i, "qual", ev.target.value)} placeholder="Qualification (NVQ L4, A/L, BSc)" className="flex-1 font-bold outline-none text-sm" />{del(() => setCv({ ...cv, education: cv.education.filter((_, j) => j !== i) }))}</div>
            <div className="grid grid-cols-[1fr_90px] gap-2"><input value={e.school} onChange={ev => setEdu(i, "school", ev.target.value)} placeholder="School / institute" className="bg-cream rounded-xl px-3 py-2 text-sm outline-none" /><input value={e.year} onChange={ev => setEdu(i, "year", ev.target.value)} placeholder="Year" className="bg-cream rounded-xl px-3 py-2 text-sm outline-none" /></div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2.5">
        <Field label="Certifications & licences"><textarea value={cv.certifications} onChange={e => setCv({ ...cv, certifications: e.target.value })} rows={2} placeholder="CEB wiring licence, First aid…" className={inputCls + " resize-none"} /></Field>
        <Field label="Links (portfolio, LinkedIn)"><input value={cv.links} onChange={e => setCv({ ...cv, links: e.target.value })} placeholder="linkedin.com/in/…" className={inputCls} /></Field>
      </div>
      <Err msg={err} />
      <Primary busy={busy} onClick={save} className="mt-4">Save CV</Primary>
    </Sheet>
  );
}

function ApplicantSheet({ b, job, lang, close }: { b: Bid; job: Job; lang: Lang; close: () => void }) {
  const a = b.applicant, cv = a?.cv;
  return (
    <Sheet close={close}>
      <div className="flex items-center gap-3">
        <Avatar p={b} size={60} />
        <div className="min-w-0"><p className="text-xl font-extrabold flex items-center gap-1">{b.name}{b.verified && <ShieldCheck size={16} className="text-teal" />}</p><p className="text-sm text-ink/60 truncate">{cv?.headline || (a?.level === "skilled" ? "Skilled expert" : "Odd-jobs helper")}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-flame-soft rounded-2xl p-3"><p className="text-ink/50">Salary expectation</p><p className="font-extrabold text-base text-flame">{b.salary ? rs(b.salary) : "—"}</p>{b.negotiable && <p className="text-[10px] font-bold text-teal">Negotiable</p>}</div>
        <div className="bg-white rounded-2xl p-3"><p className="text-ink/50">Applying from</p><p className="font-bold text-sm">{b.from ? [b.from.area, b.from.city].filter(Boolean).join(", ") : b.city}</p>{b.from?.ll && <p className="text-[10px] text-ink/45">{kmBetween(b.from.ll, jobLL(job))} km from job</p>}</div>
      </div>
      {b.from?.ll && <a href={gmapsDir(b.from.ll)} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white text-sm font-bold"><MapPin size={14} className="text-flame" />See location on map<ExternalLink size={12} className="text-ink/40" /></a>}
      {(a?.phone || a?.email) && <p className="mt-3 text-xs text-ink/60">{[a.phone, a.email].filter(Boolean).join(" · ")}</p>}
      {a?.skills?.length ? <div className="flex flex-wrap gap-1.5 mt-3">{a.skills.map(s => { const c = catOf(s); return <span key={s} className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.tint}`}>{c[lang]}</span>; })}<span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white">{a.years || 0} yrs exp</span></div> : null}
      {!cv ? <p className="mt-4 text-sm text-ink/50 bg-white rounded-2xl p-4 text-center">{a?.bio || "This applicant hasn't filled in a CV yet."}</p> : <>
        <CvBlock title="Summary"><p className="text-sm text-ink/75 whitespace-pre-line">{cv.summary}</p></CvBlock>
        {cv.work.length > 0 && <CvBlock title="Experience">{cv.work.map((w, i) => <div key={i} className={i ? "mt-3 pt-3 border-t border-line" : ""}><p className="font-bold text-sm">{w.role}</p><p className="text-xs text-ink/55">{w.org} · {w.from}–{w.to || "Present"}</p>{w.desc && <p className="text-xs text-ink/70 mt-1">{w.desc}</p>}</div>)}</CvBlock>}
        {cv.education.length > 0 && <CvBlock title="Education">{cv.education.map((e, i) => <p key={i} className="text-sm mt-1"><b>{e.qual}</b> · {e.school}{e.year && <span className="text-ink/50"> · {e.year}</span>}</p>)}</CvBlock>}
        <CvBlock title="Languages"><p className="text-sm">{cv.languages || "—"}</p></CvBlock>
        {cv.certifications && <CvBlock title="Certifications"><p className="text-sm whitespace-pre-line">{cv.certifications}</p></CvBlock>}
        {cv.links && <CvBlock title="Links"><p className="text-sm break-all">{cv.links}</p></CvBlock>}
      </>}
    </Sheet>
  );
}

function CvBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-3 bg-white rounded-2xl p-4"><p className="text-[11px] font-extrabold text-flame tracking-wide uppercase mb-1.5">{title}</p>{children}</div>;
}

function SowCard({ sow }: { sow: NonNullable<Job["sow"]> }) {
  return (
    <div className="mt-3 rounded-2xl bg-white p-4">
      <p className="text-[11px] font-extrabold text-flame flex items-center gap-1"><Sparkles size={12} />STATEMENT OF WORK · AI SCOPED</p>
      <p className="text-sm mt-1.5 text-ink/80">{sow.summary}</p>
      {sow.deliverables.length > 0 && <ul className="mt-2 space-y-1">{sow.deliverables.map(d => <li key={d} className="text-xs flex gap-1.5"><Check size={13} className="text-teal shrink-0" />{d}</li>)}</ul>}
      {sow.skills.length > 0 && <div className="flex flex-wrap gap-1 mt-2.5">{sow.skills.map(k => <span key={k} className="px-2 py-0.5 rounded-full bg-cream text-[11px] font-bold">{k}</span>)}</div>}
      {sow.estimate && <p className="text-[11px] text-ink/50 mt-2">Estimate: {sow.estimate}</p>}
    </div>
  );
}
