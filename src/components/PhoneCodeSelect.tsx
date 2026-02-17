import { useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";
import { COUNTRY_CODES } from "@/data/countries";
import { createPortal } from "react-dom";

interface PhoneCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

// Map Arabic country names to ISO 3166-1 alpha-2 codes for flags
const COUNTRY_ISO: Record<string, string> = {
  "أفغانستان": "AF", "ألبانيا": "AL", "الجزائر": "DZ", "أندورا": "AD",
  "أنغولا": "AO", "أنتيغوا وبربودا": "AG", "الأرجنتين": "AR", "أرمينيا": "AM",
  "أستراليا": "AU", "النمسا": "AT", "أذربيجان": "AZ", "الباهاماس": "BS",
  "البحرين": "BH", "بنغلاديش": "BD", "بربادوس": "BB", "بيلاروسيا": "BY",
  "بلجيكا": "BE", "بليز": "BZ", "بنين": "BJ", "بوتان": "BT",
  "بوليفيا": "BO", "البوسنة والهرسك": "BA", "بوتسوانا": "BW", "البرازيل": "BR",
  "بروناي": "BN", "بلغاريا": "BG", "بوركينا فاسو": "BF", "بوروندي": "BI",
  "كابو فيردي": "CV", "كمبوديا": "KH", "الكاميرون": "CM", "كندا": "CA",
  "جمهورية أفريقيا الوسطى": "CF", "تشاد": "TD", "تشيلي": "CL", "الصين": "CN",
  "كولومبيا": "CO", "جزر القمر": "KM", "الكونغو": "CG",
  "جمهورية الكونغو الديمقراطية": "CD", "كوستاريكا": "CR", "كرواتيا": "HR",
  "كوبا": "CU", "قبرص": "CY", "التشيك": "CZ", "الدنمارك": "DK",
  "جيبوتي": "DJ", "دومينيكا": "DM", "جمهورية الدومينيكان": "DO",
  "الإكوادور": "EC", "مصر": "EG", "السلفادور": "SV",
  "غينيا الاستوائية": "GQ", "إريتريا": "ER", "إستونيا": "EE",
  "إسواتيني": "SZ", "إثيوبيا": "ET", "فيجي": "FJ", "فنلندا": "FI",
  "فرنسا": "FR", "الغابون": "GA", "غامبيا": "GM", "جورجيا": "GE",
  "ألمانيا": "DE", "غانا": "GH", "اليونان": "GR", "غرينادا": "GD",
  "غواتيمالا": "GT", "غينيا": "GN", "غينيا بيساو": "GW", "غيانا": "GY",
  "هايتي": "HT", "هندوراس": "HN", "المجر": "HU", "آيسلندا": "IS",
  "الهند": "IN", "إندونيسيا": "ID", "إيران": "IR", "العراق": "IQ",
  "أيرلندا": "IE", "إيطاليا": "IT", "ساحل العاج": "CI", "جامايكا": "JM",
  "اليابان": "JP", "الأردن": "JO", "كازاخستان": "KZ", "كينيا": "KE",
  "كيريباتي": "KI", "الكويت": "KW", "قيرغيزستان": "KG", "لاوس": "LA",
  "لاتفيا": "LV", "لبنان": "LB", "ليسوتو": "LS", "ليبيريا": "LR",
  "ليبيا": "LY", "ليختنشتاين": "LI", "ليتوانيا": "LT", "لوكسمبورغ": "LU",
  "مدغشقر": "MG", "مالاوي": "MW", "ماليزيا": "MY", "المالديف": "MV",
  "مالي": "ML", "مالطا": "MT", "جزر مارشال": "MH", "موريتانيا": "MR",
  "موريشيوس": "MU", "المكسيك": "MX", "ولايات ميكرونيزيا المتحدة": "FM",
  "مولدوفا": "MD", "موناكو": "MC", "منغوليا": "MN", "الجبل الأسود": "ME",
  "المغرب": "MA", "موزمبيق": "MZ", "ميانمار": "MM", "ناميبيا": "NA",
  "ناورو": "NR", "نيبال": "NP", "هولندا": "NL", "نيوزيلندا": "NZ",
  "نيكاراغوا": "NI", "النيجر": "NE", "نيجيريا": "NG",
  "كوريا الشمالية": "KP", "مقدونيا الشمالية": "MK", "النرويج": "NO",
  "عُمان": "OM", "باكستان": "PK", "بالاو": "PW", "فلسطين": "PS",
  "بنما": "PA", "بابوا غينيا الجديدة": "PG", "باراغواي": "PY",
  "بيرو": "PE", "الفلبين": "PH", "بولندا": "PL", "البرتغال": "PT",
  "قطر": "QA", "رومانيا": "RO", "روسيا": "RU", "رواندا": "RW",
  "سانت كيتس ونيفيس": "KN", "سانت لوسيا": "LC", "سانت فينسنت والغرينادين": "VC",
  "ساموا": "WS", "سان مارينو": "SM", "ساو تومي وبرينسيبي": "ST",
  "السعودية": "SA", "السنغال": "SN", "صربيا": "RS", "سيشل": "SC",
  "سيراليون": "SL", "سنغافورة": "SG", "سلوفاكيا": "SK", "سلوفينيا": "SI",
  "جزر سليمان": "SB", "الصومال": "SO", "جنوب أفريقيا": "ZA",
  "كوريا الجنوبية": "KR", "جنوب السودان": "SS", "إسبانيا": "ES",
  "سريلانكا": "LK", "السودان": "SD", "سورينام": "SR", "السويد": "SE",
  "سويسرا": "CH", "سوريا": "SY", "تايوان": "TW", "طاجيكستان": "TJ",
  "تنزانيا": "TZ", "تايلاند": "TH", "تيمور الشرقية": "TL", "توغو": "TG",
  "تونغا": "TO", "ترينيداد وتوباغو": "TT", "تونس": "TN", "تركيا": "TR",
  "تركمانستان": "TM", "توفالو": "TV", "أوغندا": "UG", "أوكرانيا": "UA",
  "الإمارات العربية المتحدة": "AE", "المملكة المتحدة": "GB",
  "الولايات المتحدة": "US", "أوروغواي": "UY", "أوزبكستان": "UZ",
  "فانواتو": "VU", "الفاتيكان": "VA", "فنزويلا": "VE", "فيتنام": "VN",
  "اليمن": "YE", "زامبيا": "ZM", "زيمبابوي": "ZW"
};

// Convert ISO alpha-2 to flag emoji
const isoToFlag = (iso: string) => {
  return iso
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
};

// Build list: { country, code, flag, iso }
const EXCLUDED = ["إسرائيل"];

interface CountryEntry {
  country: string;
  code: string;
  flag: string;
}

const countryList: CountryEntry[] = Object.entries(COUNTRY_CODES)
  .filter(([country]) => !EXCLUDED.includes(country))
  .map(([country, code]) => ({
    country,
    code,
    flag: COUNTRY_ISO[country] ? isoToFlag(COUNTRY_ISO[country]) : "🏳️",
  }))
  .sort((a, b) => a.code.localeCompare(b.code));

const PhoneCodeSelect = ({ value, onChange }: PhoneCodeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = countryList.filter((entry) => {
    if (entry.code.includes(search)) return true;
    if (entry.country.includes(search)) return true;
    return false;
  });

  const handleOpen = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
    setSearch("");
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      handleClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, handleClose]);

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Find current flag
  const currentEntry = countryList.find((e) => e.code === value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? handleClose() : handleOpen())}
        className="h-12 w-24 rounded-xl border border-primary/20 bg-card px-2 flex items-center justify-between text-xs font-semibold text-foreground shadow-sm transition-colors focus:border-primary"
        dir="ltr"
      >
        <span className="flex items-center gap-1">
          {currentEntry && <span className="text-sm">{currentEntry.flag}</span>}
          {value}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-52 bg-card border border-primary/20 rounded-xl shadow-lg overflow-hidden"
          style={{ top: pos.top, left: pos.left }}
          dir="ltr"
        >
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="ابحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/50 bg-background text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <ul className="max-h-40 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted-foreground text-center">لا توجد نتائج</li>
            ) : (
              filtered.map((entry, i) => (
                <li
                  key={`${entry.code}-${entry.country}-${i}`}
                  onClick={() => { onChange(entry.code); handleClose(); }}
                  className={`px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-primary/10 flex items-center gap-2 ${value === entry.code ? "bg-primary/15 text-primary font-bold" : "text-foreground"}`}
                >
                  <span className="text-sm">{entry.flag}</span>
                  <span>{entry.code}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{entry.country}</span>
                </li>
              ))
            )}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

export default PhoneCodeSelect;
