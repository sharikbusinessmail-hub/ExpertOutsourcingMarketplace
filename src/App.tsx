import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Home, Briefcase, MessageCircle, User, Bell, Search, ChevronLeft, ChevronRight, MapPin, Code2, Cpu, Megaphone,
  Calculator, Landmark, Hammer, Zap, Sparkles, Truck, Palette, GraduationCap, Car, ShieldCheck, Repeat, Plus,
  Camera, Star, Clock, Wrench, Package, Send, Phone, Globe, Check, Navigation, LogOut, X,
} from "lucide-react";

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

const ME: [number, number] = [6.9897, 79.8925];
const JOBS = [
  { id: 1, cat: "hw", title: "Cracked screen — Samsung A54", place: "Wattala North", km: 0.8, price: 3000, ll: [6.9952, 79.8901], bids: 4, time: "12 min ago", remote: false, poster: "Dilani" },
  { id: 2, cat: "it", title: "QA test my Flutter delivery app", place: "Remote · Hendala", km: 2.1, price: 15000, ll: [6.9998, 79.8752], bids: 7, time: "1 h ago", remote: true, poster: "Ashan" },
  { id: 3, cat: "hr", title: "Re-tile bathroom floor (6×8 ft)", place: "Kelaniya", km: 3.4, price: 22000, ll: [6.9606, 79.9188], bids: 3, time: "2 h ago", remote: false, poster: "Fathima" },
  { id: 4, cat: "mk", title: "Instagram creator for café launch", place: "Mattakkuliya", km: 2.9, price: 25000, ll: [6.9701, 79.8732], bids: 11, time: "3 h ago", remote: false, poster: "Brew Lab" },
  { id: 5, cat: "el", title: "Leaking kitchen pipe under sink", place: "Hunupitiya", km: 1.5, price: 2500, ll: [6.9811, 79.9032], bids: 2, time: "20 min ago", remote: false, poster: "Ramesh" },
  { id: 6, cat: "ac", title: "Monthly bookkeeping for small shop", place: "Ja-Ela", km: 4.6, price: 12000, ll: [7.0261, 79.8951], bids: 5, time: "5 h ago", remote: true, poster: "Lanka Mart" },
  { id: 7, cat: "lb", title: "2 helpers to move furniture, 3rd floor", place: "Wattala", km: 0.5, price: 6000, ll: [6.9871, 79.8962], bids: 6, time: "8 min ago", remote: false, poster: "Kumari" },
  { id: 8, cat: "hw", title: "Laptop won't boot — Lenovo IdeaPad", place: "Peliyagoda", km: 3.9, price: 4500, ll: [6.9612, 79.8865], bids: 3, time: "40 min ago", remote: false, poster: "Isuru" },
  { id: 9, cat: "cl", title: "Deep clean 2-bedroom flat", place: "Enderamulla", km: 2.4, price: 8000, ll: [6.9969, 79.9101], bids: 4, time: "1 h ago", remote: false, poster: "Nimal" },
] as const;
type Job = (typeof JOBS)[number];

const rs = (n: number) => "Rs " + n.toLocaleString();
const catOf = (id: string) => CATS.find(c => c.id === id)!;

export default function App() {
  const [stage, setStage] = useState<"lang" | "auth" | "app">("lang");
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  return (
    <div className="min-h-[100dvh] grid place-items-center sm:p-6">
      <div className="relative w-full sm:w-[390px] h-[100dvh] sm:h-[844px] bg-cream sm:rounded-[52px] sm:ring-[10px] ring-black overflow-hidden flex flex-col shadow-2xl">
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-[2000]" />
        {stage === "lang" && <LangScreen lang={lang} setLang={setLang} t={t} next={() => setStage("auth")} />}
        {stage === "auth" && <AuthScreen t={t} back={() => setStage("lang")} next={() => setStage("app")} />}
        {stage === "app" && <MainApp t={t} lang={lang} logout={() => setStage("auth")} />}
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
    <div className="flex-1 flex flex-col px-6 pt-16 pb-8">
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

function AuthScreen({ t, back, next }: { t: Dict; back: () => void; next: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [role, setRole] = useState("both");
  const [otp, setOtp] = useState(false);
  const [phone, setPhone] = useState("77 123 4567");
  return (
    <div className="flex-1 flex flex-col px-6 pt-14 pb-8 overflow-y-auto">
      <button onClick={otp ? () => setOtp(false) : back} className="w-10 h-10 rounded-full bg-white grid place-items-center"><ChevronLeft size={20} /></button>
      {!otp ? (
        <div className="rise flex-1 flex flex-col">
          <h2 className="text-[28px] font-extrabold mt-6">{mode === "signup" ? t.signup : t.login}</h2>
          <div className="mt-5 grid grid-cols-2 p-1 bg-white rounded-full">
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`py-2.5 rounded-full text-sm font-bold transition ${mode === m ? "bg-ink text-white" : "text-ink/50"}`}>{m === "login" ? t.login : t.signup}</button>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field label={t.name}><input defaultValue="Dilani Perera" className="w-full bg-transparent outline-none font-semibold" /></Field>
            )}
            <Field label={t.phone}>
              <div className="flex items-center gap-2"><span className="font-semibold text-ink/50">🇱🇰 +94</span><input value={phone} onChange={e => setPhone(e.target.value)} className="flex-1 bg-transparent outline-none font-semibold" /></div>
            </Field>
            {mode === "signup" && (
              <div>
                <p className="text-xs font-semibold text-ink/50 mb-2">{t.want}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[["hire", t.hire, Briefcase], ["earn", t.earn, Wrench], ["both", t.both, Repeat]].map(([k, l, I]: any) => (
                    <button key={k} onClick={() => setRole(k)} className={`py-3 rounded-2xl flex flex-col items-center gap-1.5 text-sm font-semibold border-2 ${role === k ? "border-flame bg-flame-soft text-flame" : "border-transparent bg-white"}`}><I size={18} />{l}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setOtp(true)} className="mt-auto pt-6"><span className="block w-full py-4 rounded-full bg-flame text-white font-bold">{t.otp}</span></button>
          <p className="text-center text-xs text-ink/40 mt-3">By continuing you agree to our Terms & Privacy</p>
        </div>
      ) : (
        <OtpStep t={t} phone={phone} next={next} />
      )}
    </div>
  );
}

function OtpStep({ t, phone, next }: { t: Dict; phone: string; next: () => void }) {
  const [code, setCode] = useState("");
  useEffect(() => { if (code.length === 4) { const x = setTimeout(next, 500); return () => clearTimeout(x); } }, [code, next]);
  return (
    <div className="rise flex-1 flex flex-col">
      <h2 className="text-[28px] font-extrabold mt-6">OTP</h2>
      <p className="text-sm text-ink/60 mt-1">{t.code} <b className="text-ink">+94 {phone}</b></p>
      <div className="flex gap-3 mt-8">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 h-16 rounded-2xl bg-white grid place-items-center text-2xl font-extrabold border-2 ${code.length === i ? "border-flame" : "border-transparent"}`}>{code[i] ?? ""}</div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, i) => (
          <button key={i} disabled={!k} onClick={() => setCode(c => (k === "⌫" ? c.slice(0, -1) : (c + k).slice(0, 4)))} className="h-14 rounded-2xl text-xl font-semibold active:bg-white disabled:opacity-0">{k}</button>
        ))}
      </div>
      <p className="text-center text-xs text-ink/40 mt-2">Tip: type any 4 digits</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block bg-white rounded-2xl px-4 py-3"><span className="block text-[11px] font-semibold text-ink/45 mb-0.5">{label}</span>{children}</label>;
}

/* ---------- Main app ---------- */

function MainApp({ t, lang, logout }: { t: Dict; lang: Lang; logout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [mapCat, setMapCat] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [chat, setChat] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  return (
    <>
      <div className="flex-1 overflow-y-auto pb-28">
        {tab === "home" && <HomeTab t={t} lang={lang} openMap={setMapCat} openJob={setJob} />}
        {tab === "jobs" && <JobsTab t={t} lang={lang} openJob={setJob} post={() => setPosting(true)} />}
        {tab === "chats" && <ChatsTab open={setChat} />}
        {tab === "me" && <MeTab t={t} logout={logout} />}
      </div>
      <nav className="absolute bottom-4 left-4 right-4 z-[1500] bg-ink rounded-full p-1.5 flex items-center justify-between shadow-xl">
        {([["home", Home, t.home], ["jobs", Briefcase, t.jobs], ["chats", MessageCircle, t.chats], ["me", User, t.me]] as const).map(([k, I, l]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} className={`h-11 rounded-full flex items-center justify-center gap-1.5 transition-all duration-300 ${on ? "bg-flame text-white px-5 ring-2 ring-white/90 ring-offset-2 ring-offset-ink" : "text-white/70 w-14"}`}>
              <I size={18} />{on && <span className="text-sm font-bold">{l}</span>}
            </button>
          );
        })}
      </nav>
      {mapCat !== null && <MapScreen t={t} lang={lang} initial={mapCat} close={() => setMapCat(null)} openJob={setJob} />}
      {job && <JobSheet t={t} lang={lang} job={job} close={() => setJob(null)} chat={() => { setJob(null); setMapCat(null); setTab("chats"); setChat(job.poster); }} />}
      {chat && <Conversation name={chat} t={t} close={() => setChat(null)} />}
      {posting && <PostSheet t={t} lang={lang} close={() => setPosting(false)} />}
    </>
  );
}

function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  return <div className="px-5 pt-14 pb-3 flex items-center justify-between"><h1 className="text-[26px] font-extrabold">{title}</h1>{right}</div>;
}

function HomeTab({ t, lang, openMap, openJob }: { t: Dict; lang: Lang; openMap: (c: string) => void; openJob: (j: Job) => void }) {
  return (
    <div className="rise">
      <div className="px-5 pt-14 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-flame text-white grid place-items-center font-bold text-lg">D</div>
        <div className="flex-1">
          <p className="text-xs text-ink/50 font-medium">{t.hi},</p>
          <p className="font-bold flex items-center gap-1"><MapPin size={13} className="text-flame" />Wattala North</p>
        </div>
        <button className="relative w-11 h-11 rounded-full bg-white grid place-items-center"><Bell size={19} /><span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-flame" /></button>
      </div>
      <button onClick={() => openMap("all")} className="mx-5 mt-5 w-[calc(100%-40px)] flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 text-ink/45 text-sm"><Search size={18} />{t.search}</button>
      <div className="mx-5 mt-4 rounded-[24px] bg-ink text-white p-4 flex items-center gap-3 relative overflow-hidden">
        <div className="relative w-3 h-3 ml-1"><span className="absolute inset-0 rounded-full bg-[#34d399]" /><span className="absolute inset-0 rounded-full bg-[#34d399] ring-pulse" /></div>
        <div className="flex-1 ml-1"><p className="font-bold text-[15px]">{t.avail}</p><p className="text-xs text-white/60">{t.availSub}</p></div>
        <button onClick={() => openMap("all")} className="text-flame font-bold text-sm flex items-center gap-1"><Navigation size={14} />Map</button>
      </div>
      <div className="px-5 mt-6 flex items-baseline justify-between"><h2 className="font-extrabold text-lg">{t.cats}</h2></div>
      <div className="px-5 mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
        {CATS.map(c => (
          <button key={c.id} onClick={() => openMap(c.id)} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
            <span className={`w-[62px] h-[62px] rounded-[20px] grid place-items-center ${c.tint}`}><c.icon size={24} /></span>
            <span className="text-[11px] font-semibold text-center leading-tight">{c[lang]}</span>
          </button>
        ))}
      </div>
      <div className="px-5 mt-7 flex items-baseline justify-between"><h2 className="font-extrabold text-lg">{t.near}</h2><button onClick={() => openMap("all")} className="text-sm font-semibold text-flame">{t.seeAll}</button></div>
      <div className="flex gap-3 overflow-x-auto px-5 py-3 snap-x [scrollbar-width:none]">
        {JOBS.slice(0, 5).map(j => <JobCard key={j.id} j={j} lang={lang} onClick={() => openJob(j)} wide />)}
      </div>
    </div>
  );
}

function JobCard({ j, lang, onClick, wide }: { j: Job; lang: Lang; onClick: () => void; wide?: boolean }) {
  const c = catOf(j.cat);
  return (
    <button onClick={onClick} className={`${wide ? "min-w-[250px] snap-start" : "w-full"} text-left bg-white rounded-[22px] p-4 active:scale-[.98] transition`}>
      <div className="flex items-center gap-2">
        <span className={`w-9 h-9 rounded-xl grid place-items-center ${c.tint}`}><c.icon size={17} /></span>
        <span className="text-[11px] font-semibold text-ink/50 flex-1">{c[lang]}</span>
        <span className="text-[11px] text-ink/40">{j.time}</span>
      </div>
      <p className="font-bold mt-3 leading-snug">{j.title}</p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-ink/55 flex items-center gap-1"><MapPin size={12} />{j.km} km · {j.place}</span>
        <span className="font-extrabold text-flame">{rs(j.price)}</span>
      </div>
    </button>
  );
}

/* ---------- Map ---------- */

function pinIcon(price: number, active: boolean) {
  return L.divIcon({
    className: "pin",
    iconSize: [80, 34],
    iconAnchor: [40, 34],
    html: `<div style="display:flex;flex-direction:column;align-items:center"><div style="background:${active ? "#ec5a12" : "#1a1714"};color:#fff;font:700 12px Figtree;padding:6px 10px;border-radius:999px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,.25)">${rs(price)}</div><div style="width:8px;height:8px;background:${active ? "#ec5a12" : "#1a1714"};transform:rotate(45deg);margin-top:-5px"></div></div>`,
  });
}
const meIcon = L.divIcon({ className: "pin", iconSize: [22, 22], iconAnchor: [11, 11], html: `<div style="position:relative;width:22px;height:22px"><span class="ring-pulse" style="position:absolute;inset:0;border-radius:999px;background:#2563eb"></span><span style="position:absolute;inset:3px;border-radius:999px;background:#2563eb;border:3px solid #fff"></span></div>` });

function FlyTo({ ll }: { ll: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(ll, 14, { duration: 0.6 }); }, [ll, map]);
  return null;
}

function MapScreen({ t, lang, initial, close, openJob }: { t: Dict; lang: Lang; initial: string; close: () => void; openJob: (j: Job) => void }) {
  const [cat, setCat] = useState(initial);
  const [sel, setSel] = useState<number | null>(null);
  const list = useMemo(() => JOBS.filter(j => cat === "all" || j.cat === cat), [cat]);
  const focus = (list.find(j => j.id === sel)?.ll ?? ME) as [number, number];
  return (
    <div className="absolute inset-0 z-[1600] bg-cream flex flex-col rise">
      <div className="absolute inset-0">
        <MapContainer center={ME} zoom={13} zoomControl={false} attributionControl={false} className="w-full h-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <Marker position={ME} icon={meIcon} />
          {list.map(j => <Marker key={j.id} position={j.ll as unknown as [number, number]} icon={pinIcon(j.price, sel === j.id)} eventHandlers={{ click: () => setSel(j.id) }} />)}
          <FlyTo ll={focus} />
        </MapContainer>
      </div>
      <div className="relative z-[1000] pt-14 px-4">
        <div className="flex gap-2">
          <button onClick={close} className="w-12 h-12 rounded-full bg-white shadow-lg grid place-items-center"><ChevronLeft size={20} /></button>
          <div className="flex-1 h-12 rounded-full bg-white shadow-lg flex items-center gap-2 px-4 text-sm text-ink/50"><Search size={17} />{t.search}</div>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 [scrollbar-width:none]">
          {[{ id: "all", en: "All", si: "සියල්ල", ta: "அனைத்தும்" }, ...CATS].map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setSel(null); }} className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-bold shadow-md ${cat === c.id ? "bg-ink text-white" : "bg-white"}`}>{c[lang]}</button>
          ))}
        </div>
      </div>
      <div className="relative z-[1000] mt-auto bg-cream rounded-t-[28px] pt-2 pb-6 shadow-[0_-10px_30px_rgba(0,0,0,.12)] max-h-[45%] flex flex-col">
        <div className="w-10 h-1.5 rounded-full bg-ink/15 mx-auto" />
        <div className="px-5 pt-3 pb-2 flex items-baseline justify-between"><p className="font-extrabold">{list.length} jobs nearby</p><p className="text-xs text-ink/50">within 5 km · live</p></div>
        <div className="overflow-y-auto px-4 space-y-2.5">
          {list.length === 0 && <p className="text-sm text-ink/50 text-center py-6">No jobs in this category right now.</p>}
          {list.map(j => (
            <div key={j.id} onMouseEnter={() => setSel(j.id)} className={`rounded-[22px] ${sel === j.id ? "ring-2 ring-flame" : ""}`}><JobCard j={j} lang={lang} onClick={() => openJob(j)} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Job detail & bidding ---------- */

function JobSheet({ t, lang, job, close, chat }: { t: Dict; lang: Lang; job: Job; close: () => void; chat: () => void }) {
  const c = catOf(job.cat);
  const [labour, setLabour] = useState<number>(job.price);
  const [mat, setMat] = useState(job.cat === "hw" ? 6200 : 0);
  const [sent, setSent] = useState(false);
  return (
    <Sheet close={close}>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${c.tint}`}><c.icon size={13} />{c[lang]}</span>
        {job.remote && <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white">Remote OK</span>}
      </div>
      <h3 className="text-[22px] font-extrabold mt-3 leading-tight">{job.title}</h3>
      <p className="text-sm text-ink/55 mt-1 flex items-center gap-1"><MapPin size={13} />{job.place} · {job.km} km · {job.bids} bids</p>
      <div className="mt-4 rounded-2xl bg-ink text-white p-4">
        <p className="text-[11px] font-bold text-flame flex items-center gap-1"><Sparkles size={12} />AI BRIEF FROM PHOTO</p>
        <p className="text-sm mt-1.5 text-white/85">Client budget {rs(job.price)}. Posted by {job.poster}. Bring your own tools; on-site visit required.</p>
      </div>
      {!sent ? (
        <>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Stepper label={t.labour} icon={<Wrench size={12} />} v={labour} set={setLabour} />
            <Stepper label={t.mat} icon={<Package size={12} />} v={mat} set={setMat} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={chat} className="w-14 h-14 rounded-full bg-white grid place-items-center"><MessageCircle size={20} /></button>
            <button onClick={() => setSent(true)} className="flex-1 h-14 rounded-full bg-flame text-white font-bold">{t.bid} · {rs(labour + mat)}</button>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-5 text-center rise">
          <span className="w-12 h-12 rounded-full bg-teal text-white grid place-items-center mx-auto"><Check /></span>
          <p className="font-bold mt-2">Bid sent — {rs(labour + mat)}</p>
          <p className="text-xs text-ink/50">You'll be notified when {job.poster} responds.</p>
        </div>
      )}
    </Sheet>
  );
}

function Stepper({ label, icon, v, set }: { label: string; icon: React.ReactNode; v: number; set: (n: number) => void }) {
  return (
    <div className="bg-white rounded-2xl p-3">
      <p className="text-[11px] font-semibold text-ink/50 flex items-center gap-1">{icon}{label}</p>
      <p className="font-extrabold text-lg mt-0.5">{rs(v)}</p>
      <div className="flex gap-1.5 mt-2">
        <button onClick={() => set(Math.max(0, v - 500))} className="flex-1 py-1 rounded-lg bg-cream font-bold">−</button>
        <button onClick={() => set(v + 500)} className="flex-1 py-1 rounded-lg bg-cream font-bold">+</button>
      </div>
    </div>
  );
}

function Sheet({ close, children }: { close: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-[1800] flex flex-col justify-end">
      <div onClick={close} className="absolute inset-0 bg-black/40" />
      <div className="relative bg-cream rounded-t-[32px] p-5 pb-8 rise max-h-[88%] overflow-y-auto">
        <button onClick={close} className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white grid place-items-center"><X size={17} /></button>
        <div className="w-10 h-1.5 rounded-full bg-ink/15 mx-auto mb-4" />
        {children}
      </div>
    </div>
  );
}

/* ---------- Jobs tab ---------- */

const MY_BIDS = [
  { name: "Nuwan P.", labour: 3500, mat: 6200, eta: "25 min", rating: 4.9, ai: "212 verified screen repairs, 38 on this model." },
  { name: "Ravi T.", labour: 2800, mat: 7400, eta: "50 min", rating: 4.6, ai: "Lowest labour, but parts 19% above area median." },
];

function JobsTab({ t, lang, openJob, post }: { t: Dict; lang: Lang; openJob: (j: Job) => void; post: () => void }) {
  const [seg, setSeg] = useState<"find" | "mine">("find");
  return (
    <div className="rise">
      <Header title={t.jobs} right={<button onClick={post} className="h-10 px-4 rounded-full bg-flame text-white text-sm font-bold flex items-center gap-1"><Plus size={16} />{t.post}</button>} />
      <div className="mx-5 grid grid-cols-2 p-1 bg-white rounded-full">
        {(["find", "mine"] as const).map(s => <button key={s} onClick={() => setSeg(s)} className={`py-2.5 rounded-full text-sm font-bold ${seg === s ? "bg-ink text-white" : "text-ink/50"}`}>{s === "find" ? t.find : t.posts}</button>)}
      </div>
      {seg === "find" ? (
        <div className="px-5 mt-4 space-y-2.5">{JOBS.map(j => <JobCard key={j.id} j={j} lang={lang} onClick={() => openJob(j)} />)}</div>
      ) : (
        <div className="px-5 mt-4">
          <div className="bg-white rounded-[22px] p-4">
            <div className="flex items-center justify-between"><p className="font-bold">Cracked screen — Samsung A54</p><span className="text-[11px] font-bold text-teal flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />LIVE</span></div>
            <p className="text-xs text-ink/50 mt-0.5">Your base: Rs 3,000 · 2 bids</p>
          </div>
          {MY_BIDS.map(b => (
            <div key={b.name} className="bg-white rounded-[22px] p-4 mt-2.5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-flame-soft text-flame grid place-items-center font-bold">{b.name[0]}</span>
                <div className="flex-1"><p className="font-bold flex items-center gap-1">{b.name}<ShieldCheck size={14} className="text-teal" /></p><p className="text-xs text-ink/50 flex items-center gap-2"><Star size={11} className="fill-flame text-flame" />{b.rating}<Clock size={11} />{b.eta}</p></div>
                <p className="font-extrabold text-lg">{rs(b.labour + b.mat)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-cream rounded-xl p-2.5"><p className="text-ink/50">{t.labour}</p><p className="font-bold text-sm">{rs(b.labour)}</p></div>
                <div className="bg-cream rounded-xl p-2.5"><p className="text-ink/50">{t.mat}</p><p className="font-bold text-sm">{rs(b.mat)}</p></div>
              </div>
              <p className="text-xs mt-3 flex gap-1.5 text-ink/70"><Sparkles size={13} className="text-flame shrink-0" />{b.ai}</p>
              <div className="grid grid-cols-2 gap-2 mt-3"><button className="py-2.5 rounded-full bg-cream font-bold text-sm">Counter</button><button className="py-2.5 rounded-full bg-ink text-white font-bold text-sm">Accept</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostSheet({ t, lang, close }: { t: Dict; lang: Lang; close: () => void }) {
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState(true);
  useEffect(() => { if (step === 1) { const x = setTimeout(() => setStep(2), 1600); return () => clearTimeout(x); } }, [step]);
  const c = catOf("hw");
  return (
    <Sheet close={close}>
      <h3 className="text-[22px] font-extrabold">{t.post}</h3>
      {step === 0 && (
        <button onClick={() => setStep(1)} className="mt-4 w-full h-48 rounded-[24px] border-2 border-dashed border-ink/25 bg-white flex flex-col items-center justify-center gap-2">
          <span className="w-14 h-14 rounded-full bg-flame text-white grid place-items-center"><Camera size={24} /></span>
          <p className="font-bold">Snap a photo of the problem</p><p className="text-xs text-ink/50">We'll write the description for you</p>
        </button>
      )}
      {step === 1 && <div className="mt-4 h-48 rounded-[24px] bg-ink text-white flex flex-col items-center justify-center gap-2"><Sparkles className="text-flame animate-pulse" size={30} /><p className="text-sm">Reading your photo…</p></div>}
      {step === 2 && (
        <div className="rise">
          <div className="mt-4 rounded-[22px] bg-white p-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${c.tint}`}><c.icon size={12} />{c[lang]}</span>
            <p className="font-extrabold text-lg mt-2">Cracked display — Samsung A54</p>
            <p className="text-xs text-ink/55 mt-1">Shattered AMOLED, touch likely affected. Frame intact. Needs replacement panel.</p>
          </div>
          <div className="mt-3 grid grid-cols-2 p-1 bg-white rounded-full text-sm font-bold">
            <button onClick={() => setLocal(true)} className={`py-2.5 rounded-full ${local ? "bg-ink text-white" : "text-ink/50"}`}>On-site</button>
            <button onClick={() => setLocal(false)} className={`py-2.5 rounded-full ${!local ? "bg-ink text-white" : "text-ink/50"}`}>Remote OK</button>
          </div>
          <div className="mt-3 bg-white rounded-2xl px-4 py-3 flex items-center justify-between"><span className="text-sm text-ink/50">Base charge</span><span className="font-extrabold text-lg">Rs 3,000</span></div>
          <button onClick={close} className="mt-4 w-full h-14 rounded-full bg-flame text-white font-bold">Publish & find helpers</button>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- Chats ---------- */

const CHATS = [
  { name: "Nuwan P.", last: "I can come by 4:30 with the panel.", time: "2m", unread: 2, on: true },
  { name: "Brew Lab", last: "Can you share your reel stats?", time: "1h", unread: 0, on: false },
  { name: "Fathima", last: "Offer: Rs 24,000 incl. tiles", time: "3h", unread: 1, on: true },
  { name: "Ashan", last: "Thanks, the test report helped!", time: "Mon", unread: 0, on: false },
];

function ChatsTab({ open }: { open: (n: string) => void }) {
  return (
    <div className="rise">
      <Header title="Chats" />
      <div className="mx-5 bg-white rounded-[22px] overflow-hidden">
        {CHATS.map((c, i) => (
          <button key={c.name} onClick={() => open(c.name)} className={`w-full flex items-center gap-3 p-4 text-left ${i ? "border-t border-line" : ""}`}>
            <span className="relative w-12 h-12 rounded-2xl bg-flame-soft text-flame grid place-items-center font-bold text-lg">{c.name[0]}{c.on && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-teal border-2 border-white" />}</span>
            <div className="flex-1 min-w-0"><p className="font-bold">{c.name}</p><p className="text-sm text-ink/55 truncate">{c.last}</p></div>
            <div className="flex flex-col items-end gap-1"><span className="text-[11px] text-ink/40">{c.time}</span>{c.unread > 0 && <span className="w-5 h-5 rounded-full bg-flame text-white text-[11px] font-bold grid place-items-center">{c.unread}</span>}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Conversation({ name, t, close }: { name: string; t: Dict; close: () => void }) {
  const [msgs, setMsgs] = useState([{ me: false, text: "Hi! I saw your screen repair job." }, { me: true, text: "Great, how soon can you come?" }, { me: false, text: "I can come by 4:30 with the panel." }]);
  const [txt, setTxt] = useState("");
  const send = () => { if (txt.trim()) { setMsgs(m => [...m, { me: true, text: txt }]); setTxt(""); } };
  return (
    <div className="absolute inset-0 z-[1700] bg-cream flex flex-col rise">
      <div className="pt-14 px-4 pb-3 flex items-center gap-3 bg-white">
        <button onClick={close} className="w-10 h-10 rounded-full bg-cream grid place-items-center"><ChevronLeft size={20} /></button>
        <span className="w-10 h-10 rounded-xl bg-flame-soft text-flame grid place-items-center font-bold">{name[0]}</span>
        <div className="flex-1"><p className="font-bold leading-tight">{name}</p><p className="text-xs text-teal">Online · 0.8 km away</p></div>
        <button className="w-10 h-10 rounded-full bg-cream grid place-items-center"><Phone size={17} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="mx-auto w-fit bg-white rounded-2xl p-3 text-center">
          <p className="text-[11px] text-ink/50 font-semibold">OFFER</p><p className="font-extrabold">Rs 9,700</p><p className="text-[11px] text-ink/50">Labour 3,500 + Materials 6,200</p>
        </div>
        {msgs.map((m, i) => <div key={i} className={`max-w-[78%] px-4 py-2.5 rounded-[20px] text-[15px] ${m.me ? "ml-auto bg-flame text-white rounded-br-md" : "bg-white rounded-bl-md"}`}>{m.text}</div>)}
      </div>
      <div className="p-3 pb-6 flex gap-2">
        <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={t.msg} className="flex-1 h-12 rounded-full bg-white px-5 outline-none" />
        <button onClick={send} className="w-12 h-12 rounded-full bg-flame text-white grid place-items-center"><Send size={18} /></button>
      </div>
    </div>
  );
}

/* ---------- Me ---------- */

function MeTab({ t, logout }: { t: Dict; logout: () => void }) {
  const [expert, setExpert] = useState(false);
  const items = ["Verification & documents", "Payment methods", "Saved experts", "Notifications", "Language", "Help & support"];
  return (
    <div className="rise px-4 pt-14">
      <div className="flex items-center gap-4 px-1">
        <div className="w-[68px] h-[68px] rounded-[20px] bg-flame text-white grid place-items-center text-2xl font-extrabold">D</div>
        <div><p className="text-2xl font-extrabold">Dilani</p><p className="text-sm text-teal flex items-center gap-1 font-medium"><ShieldCheck size={15} />NIC verified · Tier 2</p></div>
      </div>
      <div className="mt-6 bg-ink text-white rounded-[22px] p-4 flex items-center justify-between">
        <div><p className="text-xs text-white/55">{t.mode}</p><p className="font-bold text-lg">{expert ? t.expert : t.client}</p></div>
        <button onClick={() => setExpert(!expert)} className="text-flame font-bold flex items-center gap-1.5"><Repeat size={17} />{t.sw} {expert ? t.client.toLowerCase() : t.expert.toLowerCase()}</button>
      </div>
      {expert && (
        <div className="mt-3 grid grid-cols-3 gap-2 rise">
          {[["4.9", "Rating"], ["38", "Jobs done"], ["Rs 84k", "This month"]].map(([v, l]) => <div key={l} className="bg-white rounded-2xl p-3 text-center"><p className="font-extrabold text-lg">{v}</p><p className="text-[11px] text-ink/50">{l}</p></div>)}
        </div>
      )}
      <div className="mt-4 bg-white rounded-[22px] overflow-hidden">
        {items.map((it, i) => <button key={it} className={`w-full flex items-center justify-between px-4 py-4 text-[15px] ${i ? "border-t border-line" : ""}`}>{it}<ChevronRight size={18} className="text-ink/35" /></button>)}
      </div>
      <button onClick={logout} className="mt-4 w-full py-4 rounded-[22px] border border-line text-flame font-semibold flex items-center justify-center gap-2"><LogOut size={16} />{t.out}</button>
    </div>
  );
}
