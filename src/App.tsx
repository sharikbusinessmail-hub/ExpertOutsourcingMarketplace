import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Home, Briefcase, MessageCircle, User, Bell, Search, ChevronLeft, ChevronRight, MapPin, Code2, Cpu, Megaphone,
  Calculator, Landmark, Hammer, Zap, Sparkles, Truck, Palette, GraduationCap, Car, ShieldCheck, Repeat, Plus,
  Camera, Clock, Wrench, Package, Send, Globe, Check, Navigation, LogOut, X, Lock, Mail, AlertTriangle, Users, Loader2, ExternalLink, CheckCheck, ImagePlus, Crosshair, BellOff,
} from "lucide-react";
import { api, supabase, uploadAvatar, type Bid, type Chat, type Job, type Msg, type Notice, type Person, type Profile } from "./api";
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
const EXPERT_CATS = ["it", "hw", "mk", "ac", "bf", "el", "ds", "ed", "au"];

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
const catOf = (id: string) => CATS.find(c => c.id === id) ?? CATS[0];
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
const canBid = (p: Profile, cat: string) => !EXPERT_CATS.includes(cat) || (p.level === "skilled" && p.skills?.includes(cat) && !!p.nic);

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
function systemNotify(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { new Notification(title, { body }); }
  catch { navigator.serviceWorker?.getRegistration().then(r => r?.showNotification(title, { body })).catch(() => {}); }
}

export default function App() {
  const [stage, setStage] = useState<"boot" | "lang" | "auth" | "app">("boot");
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("atha-lang") as Lang) || "en");
  const [me, setMe] = useState<Profile | null>(null);
  const t = { ...T.en, ...T[lang] } as Dict;
  useEffect(() => { localStorage.setItem("atha-lang", lang); }, [lang]);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setStage("lang");
      try { setMe((await api<{ profile: Profile }>("/profile")).profile); setStage("app"); } catch { setStage("lang"); }
    });
  }, []);
  const logout = async () => { await supabase.auth.signOut(); setMe(null); setStage("auth"); };
  return (
    <div className="app-h grid place-items-center sm:p-6">
      <div className="relative w-full sm:w-[390px] app-h phone-frame bg-cream sm:rounded-[52px] sm:ring-[10px] ring-black overflow-hidden flex flex-col shadow-2xl">
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-[2000]" />
        <Boundary>
        {stage === "boot" && <div className="flex-1 grid place-items-center"><Logo big /></div>}
        {stage === "lang" && <LangScreen lang={lang} setLang={setLang} t={t} next={() => setStage("auth")} />}
        {stage === "auth" && <AuthScreen t={t} lang={lang} back={() => setStage("lang")} done={p => { setMe(p); setStage("app"); }} />}
        {stage === "app" && me && !me.avatar && <AvatarGate me={me} done={setMe} logout={logout} />}
        {stage === "app" && me && me.avatar && <MainApp t={t} lang={lang} setLang={setLang} me={me} setMe={setMe} logout={logout} />}
        </Boundary>
      </div>
    </div>
  );
}

/* ---------- Onboarding ---------- */
function Logo({ big }: { big?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${big ? "w-12 h-12 rounded-2xl" : "w-9 h-9 rounded-xl"} bg-flame grid place-items-center text-white font-extrabold ${big ? "text-2xl" : "text-lg"}`}>a</div>
      <span className={`font-extrabold tracking-tight ${big ? "text-3xl" : "text-xl"}`}>atha</span>
    </div>
  );
}

function LangScreen({ lang, setLang, t, next }: { lang: Lang; setLang: (l: Lang) => void; t: Dict; next: () => void }) {
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

function AuthScreen({ t, lang, back, done }: { t: Dict; lang: Lang; back: () => void; done: (p: Profile) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", city: "", address: "", role: "both" as Profile["role"], level: "casual" as Profile["level"], skills: [] as string[], years: "", nic: "", bio: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : "", [photo]);
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const earns = f.role !== "hire";
  const steps = earns ? 3 : 2;

  const login = async () => {
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email: f.email.trim(), password: f.password });
    if (error) { setErr(error.message); setBusy(false); return; }
    try {
      let p = (await api<{ profile: Profile }>("/profile")).profile;
      if (photo && !p.avatar) p = await uploadAvatar(await squarePhoto(photo));
      done(p);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const signup = async () => {
    setBusy(true); setErr("");
    try {
      await api("/signup", { body: { ...f, email: f.email.trim(), level: earns ? f.level : "casual", skills: earns && f.level === "skilled" ? f.skills : [] } });
      await login();
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const nextStep = () => {
    setErr("");
    if (step === 0 && !photo) return setErr("Add a profile photo — it's required for every account.");
    if (step === 0 && (!f.name || !f.email.includes("@") || f.password.length < 6)) return setErr("Enter your name, a valid email and a password of at least 6 characters.");
    if (step === 1 && !f.city) return setErr("Choose your city — we use it to show nearby jobs if GPS is off.");
    if (step === 2 && f.level === "skilled" && (!f.skills.length || !f.nic)) return setErr("Skilled profiles need at least one skill and an NIC number.");
    if (step < steps - 1) setStep(step + 1); else signup();
  };

  return (
    <div className="flex-1 flex flex-col px-6 pt-14 pb-[max(2rem,env(safe-area-inset-bottom))] overflow-y-auto">
      <button onClick={step ? () => setStep(step - 1) : back} className="w-10 h-10 shrink-0 rounded-full bg-white grid place-items-center"><ChevronLeft size={20} /></button>
      <div className="rise flex-1 flex flex-col" key={mode + step}>
        <h2 className="text-[28px] font-extrabold mt-6">{mode === "signup" ? [t.signup, "Where are you?", "Your skills"][step] : t.login}</h2>
        {mode === "signup" && <div className="flex gap-1.5 mt-3">{Array.from({ length: steps }).map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-flame" : "bg-ink/10"}`} />)}</div>}
        {step === 0 && (
          <div className="mt-5 grid grid-cols-2 p-1 bg-white rounded-full">
            {(["login", "signup"] as const).map(m => <button key={m} onClick={() => { setMode(m); setErr(""); }} className={`py-2.5 rounded-full text-sm font-bold transition ${mode === m ? "bg-ink text-white" : "text-ink/50"}`}>{m === "login" ? t.login : t.signup}</button>)}
          </div>
        )}
        <div className="mt-5 space-y-3">
          {step === 0 && <>
            {mode === "signup" && <PhotoPicker preview={preview} pick={setPhoto} />}
            {mode === "signup" && <Field label={t.name}><input value={f.name} onChange={up("name")} placeholder="Dilani Perera" className={inputCls} /></Field>}
            <Field label="Email"><div className="flex items-center gap-2"><Mail size={15} className="text-ink/40" /><input type="email" value={f.email} onChange={up("email")} placeholder="you@example.com" className={inputCls} /></div></Field>
            {mode === "signup" && <Field label={t.phone}><div className="flex items-center gap-2"><span className="font-semibold text-ink/50">+94</span><input value={f.phone} onChange={up("phone")} placeholder="77 123 4567" className={inputCls} /></div></Field>}
            <Field label="Password"><div className="flex items-center gap-2"><Lock size={15} className="text-ink/40" /><input type="password" value={f.password} onChange={up("password")} onKeyDown={e => e.key === "Enter" && mode === "login" && login()} placeholder="••••••" className={inputCls} /></div></Field>
          </>}
          {step === 1 && <>
            <p className="text-sm text-ink/55">If location tracking is off, we show jobs in this city.</p>
            <Field label="City"><CitySelect value={f.city} set={v => setF({ ...f, city: v })} /></Field>
            <Field label="Area / street (optional)"><input value={f.address} onChange={up("address")} placeholder="Hendala Rd, Wattala North" className={inputCls} /></Field>
            <div>
              <p className="text-xs font-semibold text-ink/50 mb-2">{t.want}</p>
              <div className="grid grid-cols-3 gap-2">
                {([["hire", t.hire, Briefcase], ["earn", t.earn, Wrench], ["both", t.both, Repeat]] as const).map(([k, l, I]) => (
                  <button key={k} onClick={() => setF({ ...f, role: k })} className={`py-3 rounded-2xl flex flex-col items-center gap-1.5 text-sm font-semibold border-2 ${f.role === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><I size={18} />{l}</button>
                ))}
              </div>
            </div>
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
              <div><p className="text-xs font-semibold text-ink/50 mb-2">Skills</p><SkillPicker lang={lang} value={f.skills} set={v => setF({ ...f, skills: v })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Years of experience"><input type="number" min={0} value={f.years} onChange={up("years")} placeholder="5" className={inputCls} /></Field>
                <Field label="NIC number"><input value={f.nic} onChange={up("nic")} placeholder="199012345678" className={inputCls} /></Field>
              </div>
              <Field label="Short bio"><textarea value={f.bio} onChange={up("bio")} rows={2} placeholder="Certified electrician, 8 years in Gampaha district" className={inputCls + " resize-none"} /></Field>
            </>}
          </>}
        </div>
        <Err msg={err} />
        <div className="mt-auto pt-6">
          <Primary busy={busy} onClick={mode === "login" ? login : nextStep}>{mode === "login" ? t.login : step < steps - 1 ? t.cont : "Create account"}</Primary>
          <p className="text-center text-xs text-ink/40 mt-3">By continuing you agree to our Terms & Privacy</p>
        </div>
      </div>
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
  const watch = useRef<number | null>(null);
  const start = useCallback(() => {
    if (!navigator.geolocation) return setPerm("denied");
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = navigator.geolocation.watchPosition(
      p => { setPerm("granted"); setLoc({ ll: [p.coords.latitude, p.coords.longitude], source: "gps" }); },
      e => { if (e.code === e.PERMISSION_DENIED) setPerm("denied"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);
  useEffect(() => {
    setLoc(l => l.source === "gps" ? l : { ll: fallback, source: "city" });
    // Ask on launch: start immediately if already allowed, otherwise show our explainer first.
    navigator.permissions?.query({ name: "geolocation" }).then(r => {
      setPerm(r.state as GeoState);
      if (r.state === "granted") start();
      r.onchange = () => { setPerm(r.state as GeoState); if (r.state === "granted") start(); };
    }).catch(() => setPerm("prompt"));
    return () => { if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); };
  }, [city, start]);
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
    ping(); const x = setInterval(ping, 60000);
    window.addEventListener("pagehide", ping);
    try { if ("Notification" in window && Notification.permission === "default") Notification.requestPermission()?.catch?.(() => {}); } catch { /* unsupported */ }
    return () => { supabase.removeChannel(inbox); supabase.removeChannel(presence); clearInterval(x); window.removeEventListener("pagehide", ping); ping(); };
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
        <span className="font-extrabold text-flame">{rs(j.price)}</span>
      </div>
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
          {list.filter(j => !j.remote || j.ll).map(j => <Marker key={j.id} position={jobLL(j)} icon={pinIcon(j.price, sel === j.id, j.priority)} zIndexOffset={j.priority === "urgent" || j.priority === "high" ? 500 : 0} eventHandlers={{ click: () => setSel(j.id) }} />)}
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
  const own = job.ownerId === me.id;
  const allowed = me.role !== "hire" && canBid(me, job.cat);
  const ll = jobLL(job);
  const bid = async () => {
    setBusy(true); setErr("");
    try { await api(`/jobs/${job.id}/bids`, { body: { labour, mat, note } }); setSent(true); onBid(); } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <Sheet close={close}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${c.tint}`}><c.icon size={13} />{c[lang]}</span>
        {job.remote && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white">Remote OK</span>}
        <PriorityChip j={job} />
        {EXPERT_CATS.includes(job.cat) && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-teal flex items-center gap-1"><ShieldCheck size={12} />Verified experts only</span>}
      </div>
      <Gallery urls={job.photoUrls} alt={job.title} />
      <h3 className="text-[22px] font-extrabold mt-3 leading-tight">{job.title}</h3>
      <p className="text-sm text-ink/55 mt-1 flex items-center gap-1"><MapPin size={13} />{job.place}, {job.city} · {kmBetween(loc.ll, ll)} km · {job.bids} bids</p>
      <div className="mt-4 rounded-2xl bg-ink text-white p-4">
        <p className="text-[11px] font-bold text-flame">CLIENT BRIEF</p>
        <p className="text-sm mt-1.5 text-white/85">{job.desc || "No description."}</p>
        <p className="text-xs mt-3 text-white/55 flex items-center gap-2"><Avatar p={{ name: job.poster, avatar: job.posterAvatar }} size={22} />Budget {rs(job.price)} · {job.poster} · {ago(job.created)}</p>
      </div>
      {!job.remote && <a href={gmapsDir(ll)} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-sm font-bold"><Navigation size={15} className="text-flame" />Open in Google Maps<ExternalLink size={13} className="text-ink/40" /></a>}
      {own ? <p className="mt-4 text-sm text-ink/55 text-center">This is your job — manage it from the Jobs tab.</p>
        : !allowed ? (
          <div className="mt-4 rounded-2xl bg-white p-4 flex gap-3">
            <Lock size={18} className="text-flame shrink-0 mt-0.5" />
            <p className="text-sm">{me.role === "hire" ? "Your account is client-only. Change your role in Me to start bidding." : <>This job requires a <b>skilled profile</b> with <b>{c.en}</b> listed and your NIC. Update it in <b>Me → Skills & verification</b>.</>}</p>
          </div>
        ) : !sent ? <>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Stepper label={t.labour} icon={<Wrench size={12} />} v={labour} set={setLabour} />
            <Stepper label={t.mat} icon={<Package size={12} />} v={mat} set={setMat} />
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note to client (e.g. can come at 4pm)" className="mt-2 w-full h-12 rounded-2xl bg-white px-4 text-sm outline-none" />
          <Err msg={err} />
          <div className="flex gap-2 mt-4">
            <button onClick={chat} className="w-14 h-14 shrink-0 rounded-full bg-white grid place-items-center"><MessageCircle size={20} /></button>
            <Primary busy={busy} onClick={bid}>{t.bid} · {rs(labour + mat)}</Primary>
          </div>
        </> : (
          <div className="mt-4 rounded-2xl bg-white p-5 text-center rise">
            <span className="w-12 h-12 rounded-full bg-teal text-white grid place-items-center mx-auto"><Check /></span>
            <p className="font-bold mt-2">Bid sent — {rs(labour + mat)}</p>
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
  const sorted = (bids ?? []).slice().sort((a, b) => a.labour + a.mat - (b.labour + b.mat));
  return (
    <Sheet close={close}>
      <div className="flex items-center gap-2"><span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${c.tint}`}><c.icon size={13} />{c[lang]}</span><StatusPill s={job.status} /></div>
      <Gallery urls={job.photoUrls} alt={job.title} />
      <h3 className="text-[22px] font-extrabold mt-3 leading-tight">{job.title}</h3>
      <p className="text-sm text-ink/55 mt-1">{job.place}, {job.city} · base {rs(job.price)} · posted {ago(job.created)}</p>
      {job.status === "assigned" && <div className="mt-3 rounded-2xl bg-[#dbeafe] p-3 text-sm text-[#1e40af] font-semibold">Hired {job.assignee} for {rs(job.agreed ?? 0)}</div>}
      <p className="font-extrabold mt-5">{bids?.length ?? 0} {bids?.length === 1 ? "bid" : "bids"}</p>
      <div className="mt-2 space-y-2.5">
        {bids === null && <Loader2 className="animate-spin mx-auto text-ink/30" />}
        {bids?.length === 0 && <p className="text-sm text-ink/50 bg-white rounded-2xl p-4 text-center">No bids yet — nearby experts are being notified.</p>}
        {sorted.map((b, i) => (
          <div key={b.id} className={`bg-white rounded-[22px] p-4 ${b.status === "accepted" ? "ring-2 ring-teal" : b.status === "declined" ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <Avatar p={b} size={44} />
              <div className="flex-1 min-w-0"><p className="font-bold flex items-center gap-1">{b.name}{b.verified && <ShieldCheck size={14} className="text-teal" />}</p><p className="text-xs text-ink/50 flex items-center gap-2"><MapPin size={11} />{b.city}<Clock size={11} />{b.years || 0} yrs exp</p></div>
              <div className="text-right"><p className="font-extrabold text-lg">{rs(b.labour + b.mat)}</p>{i === 0 && sorted.length > 1 && <p className="text-[10px] font-bold text-teal">LOWEST</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="bg-cream rounded-xl p-2.5"><p className="text-ink/50">{t.labour}</p><p className="font-bold text-sm">{rs(b.labour)}</p></div>
              <div className="bg-cream rounded-xl p-2.5"><p className="text-ink/50">{t.mat}</p><p className="font-bold text-sm">{rs(b.mat)}</p></div>
            </div>
            {b.note && <p className="text-xs mt-3 text-ink/70">"{b.note}"</p>}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => chat(b.expertId, job.id)} className="py-2.5 rounded-full bg-cream font-bold text-sm flex items-center justify-center gap-1.5"><MessageCircle size={15} />Chat</button>
              {job.status === "open" ? <button disabled={!!busy} onClick={() => accept(b)} className="py-2.5 rounded-full bg-ink text-white font-bold text-sm disabled:opacity-50">{busy === b.id ? "…" : "Accept"}</button>
                : <span className="py-2.5 text-center text-sm font-bold text-ink/50">{b.status === "accepted" ? "Hired" : "—"}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 mt-5">
        {job.status === "assigned" && <Primary busy={busy === "done"} onClick={() => setStatus("done")} className="col-span-2">Mark as completed</Primary>}
        {job.status === "open" && <button onClick={() => setStatus("closed")} className="col-span-2 py-3 rounded-full border border-line text-sm font-bold text-ink/60">Close job</button>}
      </div>
    </Sheet>
  );
}

function PostSheet({ t, lang, me, loc, initialCat, close, posted }: Ctx & { initialCat: string; close: () => void; posted: () => void }) {
  const [f, setF] = useState({ cat: initialCat || "", title: "", desc: "", price: "", city: me.city, place: me.address, remote: false });
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [priority, setPriority] = useState<Priority>("medium");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const publish = async () => {
    if (!f.cat || !f.title || !Number(f.price) || !f.city) return setErr("Choose a category, add a title, base charge and city.");
    setBusy(true); setErr("");
    // Use GPS when the job is in the user's own city; otherwise place it at the chosen city's centre.
    const base = loc.source === "gps" && f.city === me.city ? loc.ll : CITIES[f.city];
    const ll: [number, number] = [base[0] + (Math.random() - 0.5) * 0.004, base[1] + (Math.random() - 0.5) * 0.004];
    try { await api("/jobs", { body: { ...f, price: Number(f.price), ll, priority, photos: await Promise.all(photos.map(p => jobPhotoData(p.file))) } }); posted(); } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  if (me.role === "earn") return <Sheet close={close}><p className="text-sm py-6 text-center">Expert-only accounts can't post jobs. Change your role in Me.</p></Sheet>;
  return (
    <Sheet close={close}>
      <h3 className="text-[22px] font-extrabold">{t.post}</h3>
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
      <div className="flex flex-wrap gap-1.5">{CATS.map(c => <button key={c.id} onClick={() => setF({ ...f, cat: c.id })} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 flex items-center gap-1 ${f.cat === c.id ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><c.icon size={12} />{c[lang]}</button>)}</div>
      <div className="mt-3 space-y-2.5">
        <Field label="Title"><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Leaking kitchen pipe under sink" className={inputCls} /></Field>
        <Field label="Details"><textarea value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} rows={2} placeholder="What's wrong, when you need it, anything to bring" className={inputCls + " resize-none"} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="City"><CitySelect value={f.city} set={v => setF({ ...f, city: v })} /></Field>
          <Field label="Area"><input value={f.place} onChange={e => setF({ ...f, place: e.target.value })} placeholder="Hunupitiya" className={inputCls} /></Field>
        </div>
        <Field label="Base charge (Rs)"><input type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} placeholder="3000" className={inputCls + " text-lg"} /></Field>
      </div>
      <div className="mt-3 grid grid-cols-2 p-1 bg-white rounded-full text-sm font-bold">
        <button onClick={() => setF({ ...f, remote: false })} className={`py-2.5 rounded-full ${!f.remote ? "bg-ink text-white" : "text-ink/50"}`}>On-site</button>
        <button onClick={() => setF({ ...f, remote: true })} className={`py-2.5 rounded-full ${f.remote ? "bg-ink text-white" : "text-ink/50"}`}>Remote OK</button>
      </div>
      <p className="text-xs font-semibold text-ink/50 mt-4 mb-2">How urgent is it?</p>
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.keys(PRIORITY) as Priority[]).map(k => {
          const p = PRIORITY[k], on = priority === k;
          return <button key={k} onClick={() => setPriority(k)} className={`py-2.5 rounded-2xl text-xs font-extrabold border-2 flex flex-col items-center gap-1 ${on ? "bg-white" : "bg-white/60 border-transparent text-ink/55"}`} style={on ? { borderColor: p.color } : undefined}><span className="w-3 h-3 rounded-full" style={{ background: p.color }} />{p.label}</button>;
        })}
      </div>
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
            <div key={m.id} className={`max-w-[78%] w-fit px-4 py-2.5 rounded-[20px] text-[15px] ${mine ? "ml-auto bg-flame text-white rounded-br-md" : "bg-white rounded-bl-md"}`}>
              {m.text}
              <span className={`flex items-center justify-end gap-1 text-[10px] mt-0.5 ${mine ? "text-white/70" : "text-ink/35"}`}>
                {new Date(m.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {mine && (pending ? <Clock size={11} /> : m.readAt ? <CheckCheck size={13} className="text-white" strokeWidth={2.75} /> : <Check size={12} />)}
              </span>
            </div>
          );
        })}
        {lastMine?.readAt && msgs[msgs.length - 1]?.id === lastMine.id && <p className="text-right text-[10px] text-ink/40 -mt-1">Seen {new Date(lastMine.readAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>}
        {typing && <div className="w-fit bg-white rounded-[20px] rounded-bl-md px-4 py-3 flex gap-1">{[0, 1, 2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-ink/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}</div>}
        <div ref={end} />
      </div>
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
        <div className="border-t border-line px-4 py-3 flex items-center justify-between text-[15px]">
          <span className="flex items-center gap-2"><Globe size={16} />Language</span>
          <div className="flex gap-1">{([["en", "EN"], ["si", "සි"], ["ta", "த"]] as const).map(([k, l]) => <button key={k} onClick={() => setLang(k)} className={`w-9 h-8 rounded-full text-xs font-bold ${lang === k ? "bg-ink text-white" : "bg-cream"}`}>{l}</button>)}</div>
        </div>
      </div>
      <button onClick={logout} className="mt-4 w-full py-4 rounded-[22px] border border-line text-flame font-semibold flex items-center justify-center gap-2"><LogOut size={16} />{t.out}</button>
      {edit && <EditProfile lang={lang} me={me} close={() => setEdit(false)} saved={p => { setMe(p); setEdit(false); if (p.role === "earn") setMode("expert"); if (p.role === "hire") setMode("client"); }} />}
    </div>
  );
}

function EditProfile({ lang, me, close, saved }: { lang: Lang; me: Profile; close: () => void; saved: (p: Profile) => void }) {
  const [f, setF] = useState({ ...me, years: String(me.years || "") });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    if (f.level === "skilled" && !f.skills.length) return setErr("Pick at least one skill for a skilled profile.");
    setBusy(true); setErr("");
    try { saved((await api<{ profile: Profile }>("/profile", { method: "PUT", body: { ...f, years: Number(f.years) || 0 } })).profile); } catch (e: any) { setErr(e.message); setBusy(false); }
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
        <div className="grid grid-cols-3 gap-2">{([["hire", "Hire"], ["earn", "Earn"], ["both", "Both"]] as const).map(([k, l]) => <button key={k} onClick={() => setF({ ...f, role: k })} className={`py-2.5 rounded-2xl text-sm font-bold border-2 ${f.role === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}>{l}</button>)}</div>
        {f.role !== "hire" && <>
          <div className="grid grid-cols-2 gap-2">{([["casual", "Odd jobs"], ["skilled", "Skilled expert"]] as const).map(([k, l]) => <button key={k} onClick={() => setF({ ...f, level: k })} className={`py-2.5 rounded-2xl text-sm font-bold border-2 ${f.level === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}>{l}</button>)}</div>
          {f.level === "skilled" && <>
            <SkillPicker lang={lang} value={f.skills} set={v => setF({ ...f, skills: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Years of experience"><input type="number" value={f.years} onChange={e => setF({ ...f, years: e.target.value })} className={inputCls} /></Field>
              <Field label="NIC number"><input value={f.nic} onChange={e => setF({ ...f, nic: e.target.value })} className={inputCls} /></Field>
            </div>
            <Field label="Short bio"><textarea value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} rows={2} className={inputCls + " resize-none"} /></Field>
          </>}
        </>}
      </div>
      <Err msg={err} />
      <Primary busy={busy} onClick={save} className="mt-4">Save</Primary>
    </Sheet>
  );
}
