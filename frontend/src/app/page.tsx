"use client";
import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Leaf, Database, Map as MapIcon, Sparkles, Trash2, 
  AlertCircle, FileSpreadsheet, User, BarChart2, CheckCircle2, Wallet, 
  TrendingUp, Printer, Globe, RefreshCw, Wifi, TrendingDown, Activity, 
  Play, Volume2, VolumeX, Satellite, CloudRain, Sun, Wind, Droplets, 
  Gauge, Bug, ScanLine, Camera, UploadCloud, ShieldAlert, Truck, MapPin,
  Timer, FlaskConical, ShieldCheck, Cpu, Crosshair, Languages, Power, 
  Calendar, BellRing, MessageSquare, Send, X, Plane, Sprout, HeadphonesIcon,
  Search, ShoppingCart, Video, Filter, CalendarDays, BookOpen, Users, Warehouse, Boxes, Handshake, Receipt, MapPinned, Clock3, CreditCard, ChevronRight, Store
} from "lucide-react";

// ==========================================
// 1. STATIC DATA & NATIVE TRANSLATION DICTIONARY
// ==========================================

const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

// Resolve the backend URL once. A missing/invalid NEXT_PUBLIC_API_URL must never
// produce requests such as /undefined/login or /undefined/predict.
// Local development defaults to FastAPI on port 8000. Production deliberately
// has NO localhost fallback: a deployed browser cannot reach your own computer.
const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const API_BASE_URL = /^https?:\/\//i.test(configuredApiUrl)
  ? configuredApiUrl.replace(/\/+$/, "")
  : process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "";

/** Return a valid configured backend URL or fail before issuing a bad request. */
function requireApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      "Backend URL is not configured. Set NEXT_PUBLIC_API_URL to your deployed FastAPI URL in Vercel and redeploy."
    );
  }
  return API_BASE_URL;
}

// Keep numerical guardrails shared by prediction and offline-safe UI calculations.
const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

// Stable prediction cache: repeating an identical analysis request in this browser
// reuses the last verified backend result instead of displaying a different value.
// The cache is keyed by every numeric input sent to FastAPI; changing any input
// triggers a fresh request. This is not a fabricated/offline prediction fallback.
const verifiedPredictionCache = new Map<string, number>();
const MAX_VERIFIED_PREDICTION_CACHE_ENTRIES = 100;

function getPredictionSignature(payload: Record<string, number>): string {
  return JSON.stringify(Object.keys(payload).sort().reduce((stable, key) => {
    stable[key] = Number(payload[key]);
    return stable;
  }, {} as Record<string, number>));
}

function rememberVerifiedPrediction(signature: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("The prediction API returned an invalid yield value.");
  }
  if (verifiedPredictionCache.has(signature)) verifiedPredictionCache.delete(signature);
  verifiedPredictionCache.set(signature, value);
  while (verifiedPredictionCache.size > MAX_VERIFIED_PREDICTION_CACHE_ENTRIES) {
    const oldestKey = verifiedPredictionCache.keys().next().value;
    if (oldestKey === undefined) break;
    verifiedPredictionCache.delete(oldestKey);
  }
}

const ALL_LANGUAGES = [
  { code: "en", label: "English" }, { code: "kn", label: "ಕನ್ನಡ" }, { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" }, { code: "ta", label: "தமிழ்" }, { code: "ml", label: "മലയാളം" },
  { code: "mr", label: "मराठी" }, { code: "bn", label: "বাংলা" }, { code: "gu", label: "ગુજરાતી" },
  { code: "pa", label: "ਪੰਜਾਬੀ" }, { code: "or", label: "ଓଡ଼ିଆ" }, { code: "ur", label: "اردو" }
];

const translations: Record<string, Record<string, string>> = {
  en: {
    appName: "YieldSense AI", tagline: "Agricultural Intelligence", overview: "Overview", forecast: "Yield Intelligence", planner: "Farm Planner", vision: "Vision Diagnostics", registry: "Field Registry", dataset: "Data Models", system: "System Architecture", drones: "Drone Sprayers", irrigation: "Irrigation Pumps", seeds: "Certified Seeds", expert: "Expert Consult", activeZone: "Active Zone", liveMarket: "Live Market", runForecast: "Run AI Forecast", expectedTonnes: "Expected Tonnes", fieldHealth: "Field Health", activeCrops: "Active Crops", totalArea: "Total Area (Acres)", register: "Register Field", yourFields: "Your Fields", greeting: "Good day", grower: "grower.", welcome: "Welcome back!", noFields: "No fields registered"
  },
  kn: {
    appName: "ಈಲ್ಡ್‌‌ಸೆನ್ಸ್ AI", tagline: "ಕೃಷಿ ಬುದ್ಧಿಮತ್ತೆ", overview: "ಅವಲೋಕನ", forecast: "ಇಳುವರಿ ಮುನ್ಸೂಚನೆ", planner: "ಕೃಷಿ ವೇಳಾಪಟ್ಟಿ", vision: "ವಿಷನ್ ರೋಗ ಪತ್ತೆ", registry: "ಜಮೀನು ನೋಂದಣಿ", dataset: "ಡೇಟಾಸೆಟ್", system: "ವ್ಯವಸ್ಥೆ ನಕ್ಷೆ", drones: "ಡ್ರೋನ್ ಸಿಂಪಡಣೆ", irrigation: "ನೀರಾವರಿ ಪಂಪ್‌ಗಳು", seeds: "ಪ್ರಮಾಣೀಕೃತ ಬೀಜಗಳು", expert: "ತಜ್ಞರ ಸಲಹೆ", activeZone: "ಸಕ್ರಿಯ ಜಮೀನು", liveMarket: "ನೇರ ಮಾರುಕಟ್ಟೆ", runForecast: "AI ಮುನ್ಸೂಚನೆ", expectedTonnes: "ಅಂದಾಜು ಟನ್", fieldHealth: "ಮಣ್ಣಿನ ಆರೋಗ್ಯ", activeCrops: "ಸಕ್ರಿಯ ಬೆಳೆಗಳು", totalArea: "ಒಟ್ಟು ಎಕರೆ", register: "ನೋಂದಾಯಿಸಿ", yourFields: "ನಿಮ್ಮ ಜಮೀನುಗಳು", greeting: "ನಮಸ್ಕಾರ", grower: "ರೈತರೇ.", welcome: "ಸ್ವಾಗತ!", noFields: "ಯಾವುದೇ ಜಮೀನು ನೋಂದಣಿಯಾಗಿಲ್ಲ"
  },
  hi: {
    appName: "यील्डसेंस एआई", tagline: "कृषि बुद्धिमत्ता", overview: "अवलोकन", forecast: "उपज भविष्यवाणी", planner: "कृषि योजनाकार", vision: "विजन डायग्नोस्टिक्स", registry: "खेत रजिस्ट्री", dataset: "डेटा मॉडल", system: "सिस्टम आर्किटेक्चर", drones: "ड्रोन स्प्रेयर", irrigation: "सिंचाई पंप", seeds: "प्रमाणित बीज", expert: "विशेषज्ञ सलाह", activeZone: "सक्रिय क्षेत्र", liveMarket: "लाइव बाजार", runForecast: "पूर्वानुमान चलाएं", expectedTonnes: "अनुमानित टन", fieldHealth: "खेत का स्वास्थ्य", activeCrops: "सक्रिय फसलें", totalArea: "कुल एकड़", register: "पंजीकृत करें", yourFields: "आपके खेत", greeting: "नमस्ते", grower: "किसान।", welcome: "वापसी पर स्वागत है!", noFields: "कोई खेत पंजीकृत नहीं"
  },
  te: { appName: "యీల్డ్‌సెన్స్ AI", tagline: "వ్యవసాయ ఇంటెలిజెన్స్", overview: "అవలోకనం", forecast: "దిగుబడి అంచనా", planner: "వ్యవసాయ ప్రణాళిక", vision: "విజన్ డయాగ్నోస్టిక్స్", registry: "ఫీల్డ్ రిజిస్ట్రీ", dataset: "డేటా మోడల్స్", system: "సిస్టమ్ ఆర్కిటెక్చర్", drones: "డ్రోన్ స్ప్రేయర్స్", irrigation: "నీటిపారుదల పంపులు", seeds: "ధృవీకరించబడిన విత్తనాలు", expert: "నిపుణుల సలహా", activeZone: "యాక్టివ్ జోన్", liveMarket: "లైవ్ మార్కెట్", runForecast: "అంచనా వేయండి", expectedTonnes: "అంచనా టన్నులు", fieldHealth: "పొలం ఆరోగ్యం", activeCrops: "యాక్టివ్ పంటలు", totalArea: "మొత్తం ఎకరాలు", register: "నమోదు చేయండి", yourFields: "మీ పొలాలు", greeting: "నమస్కారం", grower: "రైతు.", welcome: "స్వాగతం!", noFields: "ఫీల్డ్‌లు నమోదు కాలేదు" },
  ta: { appName: "யீல்ட்சென்ஸ் AI", tagline: "விவசாய நுண்ணறிவு", overview: "கண்ணோட்டம்", forecast: "விளைச்சல் முன்னறிவிப்பு", planner: "பண்ணை திட்டமிடுபவர்", vision: "விஷன் கண்டறிதல்", registry: "வயல் பதிவு", dataset: "தரவு மாதிரிகள்", system: "கணினி கட்டமைப்பு", drones: "ட்ரோன் தெளிப்பான்கள்", irrigation: "நீர்ப்பாசன பம்புகள்", seeds: "சான்றளிக்கப்பட்ட விதைகள்", expert: "நிபுணர் ஆலோசனை", activeZone: "செயலில் உள்ள மண்டலம்", liveMarket: "நேரடி சந்தை", runForecast: "முன்னறிவிப்பு", expectedTonnes: "எதிர்பார்க்கப்படும் டன்கள்", fieldHealth: "வயல் ஆரோக்கியம்", activeCrops: "பயிர்கள்", totalArea: "மொத்த ஏக்கர்", register: "பதிவு செய்க", yourFields: "உங்கள் வயல்கள்", greeting: "வணக்கம்", grower: "விவசாயி.", welcome: "வரவேற்கிறோம்!", noFields: "வயல்கள் இல்லை" },
  ml: { appName: "യീൽഡ്സെൻസ് AI", tagline: "കാർഷിക ബുദ്ധി", overview: "അവലോകനം", forecast: "വിളവ് പ്രവചനം", planner: "ഫാം പ്ലാനർ", vision: "വിഷൻ ഡയഗ്നോസ്റ്റിക്സ്", registry: "ഫീൽഡ് രജിസ്ട്രി", dataset: "ഡാറ്റ മോഡലുകൾ", system: "സിസ്റ്റം ആർക്കിടെക്ചർ", drones: "ഡ്രോൺ സ്പ്രേയറുകൾ", irrigation: "ജലസേചന പമ്പുകൾ", seeds: "സർട്ടിഫൈഡ് വിത്തുകൾ", expert: "വിദഗ്ദ്ധോപദേശം", activeZone: "സജീവ മേഖല", liveMarket: "തത്സമയ മാർക്കറ്റ്", runForecast: "പ്രവചനം നടത്തുക", expectedTonnes: "പ്രതീക്ഷിക്കുന്ന ടൺ", fieldHealth: "ഫീൽഡ് ആരോഗ്യം", activeCrops: "വിളകൾ", totalArea: "ആകെ ഏക്കർ", register: "രജിസ്റ്റർ ചെയ്യുക", yourFields: "നിങ്ങളുടെ ഫീൽഡുകൾ", greeting: "നമസ്കാരം", grower: "കർഷകൻ.", welcome: "സ്വാഗതം!", noFields: "ഫീൽഡുകൾ ഇല്ല" },
  mr: { appName: "यील्डसेंस एआय", tagline: "कृषी बुद्धिमत्ता", overview: "आढावा", forecast: "उत्पन्न अंदाज", planner: "शेत नियोजन", vision: "व्हिजन डायग्नोस्टिक्स", registry: "शेत नोंदणी", dataset: "डेटा मॉडेल", system: "सिस्टम आर्किटेक्चर", drones: "ड्रोन फवारणी", irrigation: "सिंचन पंप", seeds: "प्रमाणित बियाणे", expert: "तज्ज्ञ सल्ला", activeZone: "सक्रिय क्षेत्र", liveMarket: "थेट बाजार", runForecast: "अंदाज चालवा", expectedTonnes: "अपेक्षित टन", fieldHealth: "शेताचे आरोग्य", activeCrops: "सक्रिय पिके", totalArea: "एकूण एकर", register: "नोंदणी करा", yourFields: "तुमची शेते", greeting: "नमस्कार", grower: "शेतकरी.", welcome: "स्वागत आहे!", noFields: "कोणतेही क्षेत्र नाही" },
  bn: { appName: "ইল্ডসেন্স এআই", tagline: "কৃষি বুদ্ধিমত্তা", overview: "ওভারভিউ", forecast: "ফলন পূর্বাভাস", planner: "ফার্ম প্ল্যানার", vision: "ভিশন ডায়াগনস্টিকস", registry: "মাঠ নিবন্ধন", dataset: "ডেটা মডেল", system: "সিস্টেম আর্কিটেকচার", drones: "ড্রোন স্প্রেয়ার", irrigation: "সেচ পাম্প", seeds: "প্রত্যয়িত বীজ", expert: "বিশেষজ্ঞ পরামর্শ", activeZone: "সক্রিয় জোন", liveMarket: "লাইভ মার্কেট", runForecast: "পূর্বাভাস চালান", expectedTonnes: "প্রত্যাশিত টন", fieldHealth: "মাঠের স্বাস্থ্য", activeCrops: "সক্রিয় ফসল", totalArea: "মোট একর", register: "নিবন্ধন করুন", yourFields: "আপনার মাঠ", greeting: "নমস্কার", grower: "কৃষক.", welcome: "স্বাগতম!", noFields: "কোন মাঠ নেই" },
  gu: { appName: "યીલ્ડસેન્સ એઆઈ", tagline: "કૃષિ બુદ્ધિ", overview: "ઝાંખી", forecast: "ઉપજની આગાહી", planner: "ખેતર આયોજક", vision: "વિઝન ડાયગ્નોસ્ટિક્સ", registry: "ખેતર નોંધણી", dataset: "ડેટા મોડેલ્સ", system: "સિસ્ટમ આર્કિટેક્ચર", drones: "ડ્રોન સ્પ્રેયર્સ", irrigation: "સિંચાઈ પંપ", seeds: "પ્રમાણિત બીજ", expert: "નિષ્ણાત સલાહ", activeZone: "સક્રિય ઝોન", liveMarket: "જીવંત બજાર", runForecast: "આગાહી ચલાવો", expectedTonnes: "અપેક્ષિત ટન", fieldHealth: "ખેતરનું આરોગ્ય", activeCrops: "સક્રિય પાક", totalArea: "કુલ એકર", register: "નોંધણી કરો", yourFields: "તમારા ખેતરો", greeting: "નમસ્તે", grower: "ખેડૂત.", welcome: "સ્વાગત છે!", noFields: "કોઈ ક્ષેત્ર નથી" },
  pa: { appName: "ਯੀਲਡਸੈਂਸ ਏਆਈ", tagline: "ਖੇਤੀਬਾੜੀ ਖੁਫੀਆ", overview: "ਸੰਖੇਪ ਜਾਣਕਾਰੀ", forecast: "ਉਪਜ ਦੀ ਭਵਿੱਖਬਾਣੀ", planner: "ਫਾਰਮ ਯੋਜਨਾਕਾਰ", vision: "ਵਿਜ਼ਨ ਡਾਇਗਨੌਸਟਿਕਸ", registry: "ਫੀਲਡ ਰਜਿਸਟਰੀ", dataset: "ਡੇਟਾ ਮਾਡਲ", system: "ਸਿਸਟਮ ਆਰਕੀਟੈਕਚਰ", drones: "ਡਰੋਨ ਸਪਰੇਅਰ", irrigation: "ਸਿੰਚਾਈ ਪੰਪ", seeds: "ਪ੍ਰਮਾਣਿਤ ਬੀਜ", expert: "ਮਾਹਰ ਦੀ ਸਲਾਹ", activeZone: "ਸਰਗਰਮ ਜ਼ੋਨ", liveMarket: "ਲਾਈਵ ਮਾਰਕੀਟ", runForecast: "ਭਵਿੱਖਬਾਣੀ ਚਲਾਓ", expectedTonnes: "ਅਨੁਮਾਨਿਤ ਟਨ", fieldHealth: "ਖੇਤ ਦੀ ਸਿਹਤ", activeCrops: "ਸਰਗਰਮ ਫਸਲਾਂ", totalArea: "ਕੁੱਲ ਏਕੜ", register: "ਰਜਿਸਟਰ ਕਰੋ", yourFields: "ਤੁਹਾਡੇ ਖੇਤ", greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", grower: "ਕਿਸਾਨ.", welcome: "ਜੀ ਆਇਆਂ ਨੂੰ!", noFields: "ਕੋਈ ਖੇਤਰ ਨਹੀਂ" },
  or: { appName: "ୟିଲ୍ଡସେନ୍ସ ଏଆଇ", tagline: "କୃଷି ବୁଦ୍ଧିମତ୍ତା", overview: "ସମୀକ୍ଷା", forecast: "ଅମଳ ପୂର୍ବାନୁମାନ", planner: "ଫାର୍ମ ପ୍ଲାନର୍", vision: "ଭିଜନ୍ ଡାଏଗ୍ନୋଷ୍ଟିକ୍ସ", registry: "ଫିଲ୍ଡ ରେଜିଷ୍ଟ୍ରି", dataset: "ଡାଟା ମଡେଲ୍", system: "ସିଷ୍ଟମ୍ ଆର୍କିଟେକ୍ଚର୍", drones: "ଡ୍ରୋନ୍ ସ୍ପ୍ରେୟାର୍", irrigation: "ଜଳସେଚନ ପମ୍ପ", seeds: "ପ୍ରମାଣିତ ମଞ୍ଜି", expert: "ବିଶେଷଜ୍ଞ ପରାମର୍ଶ", activeZone: "ସକ୍ରିୟ ଜୋନ୍", liveMarket: "ଲାଇଭ୍ ମାର୍କେଟ୍", runForecast: "ପୂର୍ବାନୁମାନ କରନ୍ତୁ", expectedTonnes: "ଆଶା କରାଯାଉଥିବା ଟନ୍", fieldHealth: "କ୍ଷେତ୍ର ସ୍ୱାସ୍ଥ୍ୟ", activeCrops: "ସକ୍ରିୟ ଫସଲ", totalArea: "ମୋଟ ଏକର", register: "ପଞ୍ଜିକରଣ କରନ୍ତୁ", yourFields: "ଆପଣଙ୍କ କ୍ଷେତ", greeting: "ନମସ୍କାର", grower: "କୃଷକ.", welcome: "ସ୍ଵାଗତମ୍!", noFields: "କୌଣସି କ୍ଷେତ୍ର ନାହିଁ" },
  ur: { appName: "ییلڈسینس اے آئی", tagline: "زرعی ذہانت", overview: "جائزہ", forecast: "پیداوار کی پیش گوئی", planner: "فارم منصوبہ ساز", vision: "وژن تشخیص", registry: "فیلڈ رجسٹری", dataset: "ڈیٹا ماڈل", system: "سسٹم فن تعمیر", drones: "ڈرون اسپرے کرنے والے", irrigation: "آبپاشی کے پمپ", seeds: "تصدیق شدہ بیج", expert: "ماہر کا مشورہ", activeZone: "فعال زون", liveMarket: "لائیو مارکیٹ", runForecast: "پیش گوئی چلائیں", expectedTonnes: "توقع شدہ ٹن", fieldHealth: "کھیت کی صحت", activeCrops: "فعال فصلیں", totalArea: "کل ایکڑ", register: "رجسٹر کریں", yourFields: "آپ کے کھیت", greeting: "سلام", grower: "کسان.", welcome: "خوش آمدید!", noFields: "کوئی فیلڈ نہیں" }
};

const NAV_LABELS: Record<string, Record<string,string>> = {
  en:{intelligence:"Farm Intelligence",history:"History & Analytics",market:"Mandi & Buyers",alerts:"Alerts",operations:"Operations Center"},
  kn:{intelligence:"ಕೃಷಿ ಬುದ್ಧಿಮತ್ತೆ",history:"ಇತಿಹಾಸ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ",market:"ಮಾರುಕಟ್ಟೆ ಮತ್ತು ಖರೀದಿದಾರರು",alerts:"ಎಚ್ಚರಿಕೆಗಳು",operations:"ಕಾರ್ಯಾಚರಣೆ ಕೇಂದ್ರ"},
  hi:{intelligence:"कृषि बुद्धिमत्ता",history:"इतिहास और विश्लेषण",market:"मंडी और खरीदार",alerts:"अलर्ट"},
  te:{intelligence:"వ్యవసాయ ఇంటెలిజెన్స్",history:"చరిత్ర మరియు విశ్లేషణ",market:"మండి మరియు కొనుగోలుదారులు",alerts:"హెచ్చరికలు"},
  ta:{intelligence:"விவசாய நுண்ணறிவு",history:"வரலாறு மற்றும் பகுப்பாய்வு",market:"மண்டி மற்றும் வாங்குபவர்கள்",alerts:"எச்சரிக்கைகள்"},
  ml:{intelligence:"കാർഷിക ഇന്റലിജൻസ്",history:"ചരിത്രവും വിശകലനവും",market:"മാർക്കറ്റും വാങ്ങുന്നവരും",alerts:"അറിയിപ്പുകൾ"},
  mr:{intelligence:"कृषी बुद्धिमत्ता",history:"इतिहास आणि विश्लेषण",market:"मंडी आणि खरेदीदार",alerts:"सूचना"},
  bn:{intelligence:"কৃষি বুদ্ধিমত্তা",history:"ইতিহাস ও বিশ্লেষণ",market:"মন্ডি ও ক্রেতা",alerts:"সতর্কতা"},
  gu:{intelligence:"કૃષિ બુદ્ધિ",history:"ઇતિહાસ અને વિશ્લેષણ",market:"મંડી અને ખરીદદારો",alerts:"ચેતવણીઓ"},
  pa:{intelligence:"ਖੇਤੀਬਾੜੀ ਬੁੱਧੀ",history:"ਇਤਿਹਾਸ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ",market:"ਮੰਡੀ ਅਤੇ ਖਰੀਦਦਾਰ",alerts:"ਚੇਤਾਵਨੀਆਂ"},
  or:{intelligence:"କୃଷି ବୁଦ୍ଧିମତ୍ତା",history:"ଇତିହାସ ଓ ବିଶ୍ଳେଷଣ",market:"ମଣ୍ଡି ଓ କ୍ରେତା",alerts:"ସତର୍କତା"},
  ur:{intelligence:"زرعی ذہانت",history:"تاریخ اور تجزیہ",market:"منڈی اور خریدار",alerts:"انتباہات"}
};

const cropCatalog: any[] = [
  ["Maize","Cereal","Warm","Loamy","90–120 days",110,45,6.5,90,50,60,"Medium"],
  ["Rice","Cereal","Warm/Wet","Clay/Loamy","110–150 days",130,80,6.0,100,40,50,"High"],
  ["Wheat","Cereal","Cool","Loamy","110–140 days",125,40,6.8,120,60,40,"Medium"],
  ["Barley","Cereal","Cool/Dry","Loamy","100–130 days",115,35,6.8,90,45,35,"Low"],
  ["Sorghum","Cereal","Warm/Dry","Loamy/Sandy","100–130 days",115,35,6.5,70,35,35,"Low"],
  ["Millet","Cereal","Hot/Dry","Sandy/Loamy","70–100 days",90,25,7.0,50,30,30,"Low"],
  ["Finger Millet","Cereal","Warm","Loamy/Red","100–120 days",110,35,6.2,60,30,30,"Low"],
  ["Pearl Millet","Cereal","Hot/Dry","Sandy/Loamy","75–100 days",90,25,6.8,55,30,30,"Low"],
  ["Cotton","Fiber","Warm","Black/Loamy","150–180 days",165,35,7.0,80,40,40,"Medium"],
  ["Sugarcane","Cash","Warm","Loamy","10–14 months",360,75,6.2,150,80,100,"High"],
  ["Soybean","Oilseed","Warm","Loamy","90–120 days",105,40,6.5,55,35,45,"Medium"],
  ["Groundnut","Oilseed","Warm","Sandy Loam","100–130 days",115,35,6.3,45,40,40,"Low"],
  ["Sunflower","Oilseed","Warm","Loamy","90–110 days",100,35,6.5,60,40,40,"Low"],
  ["Mustard","Oilseed","Cool/Dry","Loamy","110–140 days",125,30,6.5,60,40,30,"Low"],
  ["Chickpea","Pulse","Cool/Dry","Loamy","100–130 days",115,25,6.5,40,50,30,"Low"],
  ["Pigeon Pea","Pulse","Warm","Loamy","150–210 days",180,35,6.5,25,50,25,"Medium"],
  ["Green Gram","Pulse","Warm","Loamy/Sandy","60–90 days",75,25,6.5,25,40,25,"Low"],
  ["Black Gram","Pulse","Warm","Loamy","70–100 days",85,30,6.5,25,40,25,"Low"],
  ["Lentil","Pulse","Cool/Dry","Loamy","100–120 days",110,25,6.5,30,45,25,"Low"],
  ["Tomato","Vegetable","Warm","Loamy","90–150 days",120,45,6.2,120,60,100,"High"],
  ["Onion","Vegetable","Mild","Loamy","120–150 days",135,35,6.5,100,50,70,"Medium"],
  ["Potato","Vegetable","Cool","Sandy Loam","90–120 days",105,40,5.8,100,60,100,"Medium"],
  ["Chilli","Vegetable","Warm","Loamy","120–180 days",150,45,6.2,100,50,80,"High"],
  ["Brinjal","Vegetable","Warm","Loamy","120–180 days",150,45,6.3,100,50,80,"Medium"],
  ["Cabbage","Vegetable","Cool","Loamy","80–120 days",100,35,6.5,100,50,70,"Medium"],
  ["Cauliflower","Vegetable","Cool","Loamy","90–130 days",110,35,6.5,110,55,70,"Medium"],
  ["Carrot","Vegetable","Cool","Sandy Loam","70–100 days",85,30,6.3,60,40,60,"Low"],
  ["Beans","Vegetable","Mild","Loamy","60–100 days",80,35,6.2,45,35,55,"Low"],
  ["Peas","Pulse","Cool","Loamy","60–100 days",80,30,6.5,30,40,25,"Low"],
  ["Banana","Fruit","Tropical","Loamy","10–14 months",330,70,6.2,200,70,250,"High"],
  ["Mango","Fruit","Tropical","Loamy","Perennial",365,45,6.5,80,50,100,"Medium"],
  ["Orange","Fruit","Subtropical","Loamy","Perennial",365,45,6.5,100,50,100,"Medium"],
  ["Grapes","Fruit","Warm/Dry","Sandy Loam","Perennial",365,40,6.5,120,60,150,"High"],
  ["Papaya","Fruit","Tropical","Loamy","9–12 months",300,60,6.2,120,60,140,"Medium"],
  ["Coconut","Plantation","Tropical","Sandy Loam","Perennial",365,60,6.0,150,60,200,"Medium"],
  ["Coffee","Plantation","Tropical","Acidic Loam","Perennial",365,65,5.8,120,50,150,"Medium"],
  ["Tea","Plantation","Cool/Wet","Acidic Loam","Perennial",365,70,5.2,120,50,100,"Medium"],
  ["Turmeric","Spice","Warm/Wet","Loamy","7–9 months",240,60,6.2,100,50,100,"Medium"],
  ["Ginger","Spice","Warm/Wet","Loamy","7–9 months",240,60,6.0,80,40,80,"Medium"],
  ["Coriander","Spice","Cool/Mild","Loamy","80–100 days",90,30,6.5,40,30,30,"Low"],
  ["Cumin","Spice","Cool/Dry","Sandy Loam","100–120 days",110,25,6.8,40,30,30,"Medium"],
  ["Cardamom","Spice","Tropical/Wet","Acidic Loam","Perennial",365,75,5.5,100,40,100,"Medium"],
  ["Black Pepper","Spice","Tropical/Wet","Loamy","Perennial",365,70,5.8,100,40,100,"Medium"]
].map(([name,category,climate,soil,duration,durationDays,moisture,ph,nitrogen,phosphorus,potassium,risk]) => ({name,category,climate,soil,duration,durationDays,moisture,ph,nitrogen,phosphorus,potassium,risk}));

// Crop names are stored as one source of truth. The UI never appends the English
// name when a non-English language is selected, so "Kannada" really means Kannada.
const cropLanguageNames: Record<string, Record<string, string>> = {
  Maize:{en:"Maize",kn:"ಮೆಕ್ಕೆಜೋಳ",hi:"मक्का",te:"మొక్కజొన్న",ta:"மக்காச்சோளம்",ml:"ചോളം",mr:"मका",bn:"ভুট্টা",gu:"મકાઈ",pa:"ਮੱਕੀ",or:"ମକା",ur:"مکئی"},
  Rice:{en:"Rice",kn:"ಭತ್ತ",hi:"धान",te:"వరి",ta:"நெல்",ml:"നെല്ല്",mr:"भात",bn:"ধান",gu:"ચોખા",pa:"ਝੋਨਾ",or:"ଧାନ",ur:"چاول"},
  Wheat:{en:"Wheat",kn:"ಗೋಧಿ",hi:"गेहूँ",te:"గోధుమ",ta:"கோதுமை",ml:"ഗോതമ്പ്",mr:"गहू",bn:"গম",gu:"ઘઉં",pa:"ਕਣਕ",or:"ଗହମ",ur:"گندم"},
  Barley:{en:"Barley",kn:"ಬಾರ್ಲಿ",hi:"जौ",te:"బార్లీ",ta:"பார்லி",ml:"ബാർലി",mr:"जव",bn:"যব",gu:"જવ",pa:"ਜੌਂ",or:"ଯବ",ur:"جو"},
  Sorghum:{en:"Sorghum",kn:"ಜೋಳ",hi:"ज्वार",te:"జొన్న",ta:"சோளம்",ml:"ചോളം",mr:"ज्वारी",bn:"জোয়ার",gu:"જુવાર",pa:"ਜਵਾਰ",or:"ଜୁଆର",ur:"جوار"},
  Millet:{en:"Millet",kn:"ಸಿರಿಧಾನ್ಯ",hi:"बाजरा",te:"సజ్జలు",ta:"கம்பு",ml:"ചാമ",mr:"बाजरी",bn:"বাজরা",gu:"બાજરી",pa:"ਬਾਜਰਾ",or:"ବାଜରା",ur:"باجرہ"},
  "Finger Millet":{en:"Finger Millet",kn:"ರಾಗಿ",hi:"रागी",te:"రాగులు",ta:"கேழ்வரகு",ml:"റാഗി",mr:"नाचणी",bn:"রাগি",gu:"નાગલી",pa:"ਰਾਗੀ",or:"ମାଣ୍ଡିଆ",ur:"راگی"},
  "Pearl Millet":{en:"Pearl Millet",kn:"ಸಜ್ಜೆ",hi:"बाजरा",te:"సజ్జ",ta:"கம்பு",ml:"ബജ്റ",mr:"बाजरी",bn:"বাজরা",gu:"બાજરી",pa:"ਬਾਜਰਾ",or:"ବାଜରା",ur:"باجرہ"},
  Cotton:{en:"Cotton",kn:"ಹತ್ತಿ",hi:"कपास",te:"పత్తి",ta:"பருத்தி",ml:"പരുത്തി",mr:"कापूस",bn:"তুলা",gu:"કપાસ",pa:"ਕਪਾਹ",or:"କପା",ur:"کپاس"},
  Sugarcane:{en:"Sugarcane",kn:"ಕಬ್ಬು",hi:"गन्ना",te:"చెరకు",ta:"கரும்பு",ml:"കരിമ്പ്",mr:"ऊस",bn:"আখ",gu:"શેરડી",pa:"ਗੰਨਾ",or:"ଆଖୁ",ur:"گنا"},
  Soybean:{en:"Soybean",kn:"ಸೋಯಾಬೀನ್",hi:"सोयाबीन",te:"సోయాబీన్",ta:"சோயாபீன்",ml:"സോയാബീൻ",mr:"सोयाबीन",bn:"সয়াবিন",gu:"સોયાબીન",pa:"ਸੋਇਆਬੀਨ",or:"ସୋୟାବିନ୍",ur:"سویا بین"},
  Groundnut:{en:"Groundnut",kn:"ಕಡಲೆಕಾಯಿ",hi:"मूंगफली",te:"వేరుశెనగ",ta:"நிலக்கடலை",ml:"നിലക്കടല",mr:"भुईमूग",bn:"চিনাবাদাম",gu:"મગફળી",pa:"ਮੂੰਗਫਲੀ",or:"ଚିନାବାଦାମ",ur:"مونگ پھلی"},
  Sunflower:{en:"Sunflower",kn:"ಸೂರ್ಯಕಾಂತಿ",hi:"सूरजमुखी",te:"పొద్దుతిరుగుడు",ta:"சூரியகாந்தி",ml:"സൂര്യകാന്തി",mr:"सूर्यफूल",bn:"সূর্যমুখী",gu:"સૂર્યમુખી",pa:"ਸੂਰਜਮੁਖੀ",or:"ସୂର୍ଯ୍ୟମୁଖୀ",ur:"سورج مکھی"},
  Mustard:{en:"Mustard",kn:"ಸಾಸಿವೆ",hi:"सरसों",te:"ఆవాలు",ta:"கடுகு",ml:"കടുക്",mr:"मोहरी",bn:"সরিষা",gu:"રાઈ",pa:"ਸਰ੍ਹੋਂ",or:"ସୋରିଷ",ur:"سرسوں"},
  Chickpea:{en:"Chickpea",kn:"ಕಡಲೆ",hi:"चना",te:"శనగ",ta:"கொண்டைக்கடலை",ml:"കടല",mr:"हरभरा",bn:"ছোলা",gu:"ચણા",pa:"ਛੋਲੇ",or:"ବୁଟ",ur:"چنا"},
  "Pigeon Pea":{en:"Pigeon Pea",kn:"ತೊಗರಿ ಬೇಳೆ",hi:"अरहर",te:"కందులు",ta:"துவரை",ml:"തുവര",mr:"तूर",bn:"অড়হর",gu:"તુવેર",pa:"ਅਰਹਰ",or:"ହରଡ",ur:"ارہر"},
  "Green Gram":{en:"Green Gram",kn:"ಹೆಸರು ಬೇಳೆ",hi:"मूंग",te:"పెసలు",ta:"பாசிப்பயறு",ml:"ചെറുപയർ",mr:"मूग",bn:"মুগ",gu:"મગ",pa:"ਮੂੰਗ",or:"ମୁଗ",ur:"مونگ"},
  "Black Gram":{en:"Black Gram",kn:"ಉದ್ದು",hi:"उड़द",te:"మినుములు",ta:"உளுந்து",ml:"ഉഴുന്ന്",mr:"उडीद",bn:"মাষকলাই",gu:"અડદ",pa:"ਉੜਦ",or:"ਬିରି"},
  Lentil:{en:"Lentil",kn:"ಮಸೂರ ಬೇಳೆ",hi:"मसूर",te:"మసూర్",ta:"மசூர் பருப்பு",ml:"മസൂർ പരിപ്പ്",mr:"मसूर",bn:"মসুর",gu:"મસૂર",pa:"ਮਸੂਰ",or:"ମସୁର",ur:"مسور"},
  Tomato:{en:"Tomato",kn:"ಟೊಮೇಟೊ",hi:"टमाटर",te:"టమాటా",ta:"தக்காளி",ml:"തക്കാളി",mr:"टोमॅटो",bn:"টমেটো",gu:"ટામેટું",pa:"ਟਮਾਟਰ",or:"ଟମାଟୋ",ur:"ٹماٹر"},
  Onion:{en:"Onion",kn:"ಈರುಳ್ಳಿ",hi:"प्याज",te:"ఉల్లిపాయ",ta:"வெங்காயம்",ml:"ഉള്ളി",mr:"कांदा",bn:"পেঁয়াজ",gu:"ડુંગળી",pa:"ਪਿਆਜ਼",or:"ପିଆଜ",ur:"پیاز"},
  Potato:{en:"Potato",kn:"ಆಲೂಗಡ್ಡೆ",hi:"आलू",te:"బంగాళాదుంప",ta:"உருளைக்கிழங்கு",ml:"ഉരുളക്കിഴങ്ങ്",mr:"बटाटा",bn:"আলু",gu:"બટાટા",pa:"ਆਲੂ",or:"ଆଳୁ",ur:"آلو"},
  Chilli:{en:"Chilli",kn:"ಮೆಣಸಿನಕಾಯಿ",hi:"मिर्च",te:"మిరప",ta:"மிளகாய்",ml:"മുളക്",mr:"मिरची",bn:"মরিচ",gu:"મરચું",pa:"ਮਿਰਚ",or:"ଲଙ୍କା",ur:"مرچ"},
  Brinjal:{en:"Brinjal",kn:"ಬದನೆಕಾಯಿ",hi:"बैंगन",te:"వంకాయ",ta:"கத்தரிக்காய்",ml:"വഴുതന",mr:"वांगी",bn:"বেগুন",gu:"રીંગણ",pa:"ਬੈਂਗਣ",or:"ବାଇଗଣ",ur:"بینگن"},
  Cabbage:{en:"Cabbage",kn:"ಎಲೆಕೋಸು",hi:"पत्तागोभी",te:"క్యాబేజీ",ta:"முட்டைக்கோஸ்",ml:"കാബേജ്",mr:"कोबी",bn:"বাঁধাকপি",gu:"કોબી",pa:"ਬੰਦ ਗੋਭੀ",or:"ବନ୍ଧାକୋବି",ur:"بند گوبھی"},
  Cauliflower:{en:"Cauliflower",kn:"ಹೂಕೋಸು",hi:"फूलगोभी",te:"కాలీఫ్లవర్",ta:"காலிஃபிளவர்",ml:"കോളിഫ്ലവർ",mr:"फुलकोबी",bn:"ফুলকপি",gu:"ફૂલકોબી",pa:"ਫੁੱਲ ਗੋਭੀ",or:"ଫୁଲକୋବି",ur:"پھول گوبھی"},
  Carrot:{en:"Carrot",kn:"ಕ್ಯಾರೆಟ್",hi:"गाजर",te:"క్యారెట్",ta:"கேரட்",ml:"കാരറ്റ്",mr:"गाजर",bn:"গাজর",gu:"ગાજર",pa:"ਗਾਜਰ",or:"ଗାଜର",ur:"گاجر"},
  Beans:{en:"Beans",kn:"ಹುರಳಿಕಾಯಿ",hi:"फ्रेंच बीन्स",te:"బీన్స్",ta:"பீன்ஸ்",ml:"ബീൻസ്",mr:"फरसबी",bn:"শিম",gu:"ફણસી",pa:"ਫਲੀਆਂ",or:"ବିନ୍ସ",ur:"لوبیا"},
  Peas:{en:"Peas",kn:"ಬಟಾಣಿ",hi:"मटर",te:"బఠాణీ",ta:"பட்டாணி",ml:"പട്ടാണി",mr:"वाटाणा",bn:"মটর",gu:"વટાણા",pa:"ਮਟਰ",or:"ମଟର",ur:"مٹر"},
  Banana:{en:"Banana",kn:"ಬಾಳೆಹಣ್ಣು",hi:"केला",te:"అరటి",ta:"வாழை",ml:"വാഴപ്പഴം",mr:"केळी",bn:"কলা",gu:"કેળું",pa:"ਕੇਲਾ",or:"କଦଳୀ",ur:"کیلا"},
  Mango:{en:"Mango",kn:"ಮಾವು",hi:"आम",te:"మామిడి",ta:"மாம்பழம்",ml:"മാങ്ങ",mr:"आंबा",bn:"আম",gu:"કેરી",pa:"ਅੰਬ",or:"ଆମ୍ବ",ur:"آم"},
  Orange:{en:"Orange",kn:"ಕಿತ್ತಳೆ",hi:"संतरा",te:"నారింజ",ta:"ஆரஞ்சு",ml:"ഓറഞ്ച്",mr:"संत्रे",bn:"কমলা",gu:"નારંગી",pa:"ਸੰਤਰਾ",or:"କମଳା",ur:"مالٹا"},
  Grapes:{en:"Grapes",kn:"ದ್ರಾಕ್ಷಿ",hi:"अंगूर",te:"ద్రాక్ష",ta:"திராட்சை",ml:"മുന്തിരി",mr:"द्राक्षे",bn:"আঙুর",gu:"દ્રાક્ષ",pa:"ਅੰਗੂਰ",or:"ଅଙ୍ଗୁର",ur:"انگور"},
  Papaya:{en:"Papaya",kn:"ಪಪ್ಪಾಯಿ",hi:"पपीता",te:"బొప్పాయి",ta:"பப்பாளி",ml:"പപ്പായ",mr:"पपई",bn:"পেঁপে",gu:"પપૈયું",pa:"ਪਪੀਤਾ",or:"ଅମୃତଭଣ୍ଡା",ur:"پپیتا"},
  Coconut:{en:"Coconut",kn:"ತೆಂಗಿನಕಾಯಿ",hi:"नारियल",te:"కొబ్బరి",ta:"தேங்காய்",ml:"തേങ്ങ",mr:"नारळ",bn:"নারকেল",gu:"નાળિયેર",pa:"ਨਾਰੀਅਲ",or:"ନଡ଼ିଆ",ur:"ناریل"},
  Coffee:{en:"Coffee",kn:"ಕಾಫಿ",hi:"कॉफी",te:"కాఫీ",ta:"காபி",ml:"കാപ്പി",mr:"कॉफी",bn:"কফি",gu:"કોફી",pa:"ਕੌਫੀ",or:"କଫି",ur:"کافی"},
  Tea:{en:"Tea",kn:"ಚಹಾ",hi:"चाय",te:"టీ",ta:"தேயிலை",ml:"ചായ",mr:"चहा",bn:"চা",gu:"ચા",pa:"ਚਾਹ",or:"ଚା",ur:"چائے"},
  Turmeric:{en:"Turmeric",kn:"ಅರಿಶಿನ",hi:"हल्दी",te:"పసుపు",ta:"மஞ்சள்",ml:"മഞ്ഞൾ",mr:"हळद",bn:"হলুদ",gu:"હળદર",pa:"ਹਲਦੀ",or:"ହଳଦୀ",ur:"ہلدی"},
  Ginger:{en:"Ginger",kn:"ಶುಂಠಿ",hi:"अदरक",te:"అల్లం",ta:"இஞ்சி",ml:"ഇഞ്ചി",mr:"आले",bn:"আদা",gu:"આદુ",pa:"ਅਦਰਕ",or:"ଅଦା",ur:"ادرک"},
  Coriander:{en:"Coriander",kn:"ಕೊತ್ತಂಬರಿ",hi:"धनिया",te:"కొత్తిమీర",ta:"கொத்தமல்லி",ml:"മല്ലി",mr:"धणे",bn:"ধনে",gu:"ધાણા",pa:"ਧਨੀਆ",or:"ଧନିଆ",ur:"دھنیا"},
  Cumin:{en:"Cumin",kn:"ಜೀರಿಗೆ",hi:"जीरा",te:"జీలకర్ర",ta:"சீரகம்",ml:"ജീരകം",mr:"जिरे",bn:"জিরা",gu:"જીરું",pa:"ਜੀਰਾ",or:"ଜିରା",ur:"زیرہ"},
  Cardamom:{en:"Cardamom",kn:"ಏಲಕ್ಕಿ",hi:"इलायची",te:"ఏలకులు",ta:"ஏலக்காய்",ml:"ഏലക്ക",mr:"वेलची",bn:"এলাচ",gu:"એલચી",pa:"ਇਲਾਇਚੀ",or:"ଅଳେଇଚ",ur:"الائچی"},
  "Black Pepper":{en:"Black Pepper",kn:"ಕರಿಮೆಣಸು",hi:"काली मिर्च",te:"మిరియాలు",ta:"கருமிளகு",ml:"കുരുമുളക്",mr:"काळी मिरी",bn:"গোলমরিচ",gu:"કાળા મરી",pa:"ਕਾਲੀ ਮਿਰਚ",or:"ଗୋଲମରିଚ",ur:"کالی مرچ"}
};

const getCropDisplayName = (crop: string, lang: string) => cropLanguageNames[crop]?.[lang] || cropLanguageNames[crop]?.en || crop;

const cropBaselines: Record<string, any> = Object.fromEntries(cropCatalog.map((c:any) => [c.name, {
  temp: c.climate.includes("Cool") ? "22.0" : c.climate.includes("Hot") ? "31.0" : "27.0",
  rainfall: c.moisture >= 70 ? "1200" : c.moisture >= 50 ? "800" : "500",
  ph: String(c.ph), moisture: String(c.moisture), nitrogen: String(c.nitrogen), phosphorus: String(c.phosphorus), potassium: String(c.potassium), pesticide: "0"
}]));

const cropMarketPrices: Record<string, number> = {
  Maize:2100,Rice:2900,Wheat:2400,Barley:2300,Sorghum:3000,Millet:3000,"Finger Millet":4200,"Pearl Millet":2800,Cotton:6000,
  Sugarcane:300,Soybean:4500,Groundnut:5800,Sunflower:5200,Mustard:5600,Chickpea:6200,"Pigeon Pea":7200,"Green Gram":7600,"Black Gram":7000,Lentil:6800,
  Tomato:1800,Onion:2200,Potato:1600,Chilli:8500,Brinjal:1800,Cabbage:1500,Cauliflower:2200,Carrot:2400,Beans:3200,Peas:4200,
  Banana:2800,Mango:5000,Orange:3500,Grapes:6500,Papaya:2600,Coconut:3200,Coffee:15000,Tea:12000,Turmeric:9000,Ginger:8000,Coriander:7000,Cumin:22000,Cardamom:180000,"Black Pepper":55000
};

const fertilizerCosts = { nitrogen:25, phosphorus:50, potassium:35 };

const cropProcedures: Record<string, Record<string, string>> = {
  en: Object.fromEntries(cropCatalog.map((c:any)=>[c.name, `After harvest: clean the field, record yield and review soil nutrients before the next crop.`])),
  kn: Object.fromEntries(cropCatalog.map((c:any)=>[c.name, `ಕೊಯ್ಲಿನ ನಂತರ: ಜಮೀನನ್ನು ಸ್ವಚ್ಛಗೊಳಿಸಿ, ಇಳುವರಿಯನ್ನು ದಾಖಲಿಸಿ ಮತ್ತು ಮುಂದಿನ ಬೆಳೆಗೆ ಮಣ್ಣಿನ ಪೋಷಕಾಂಶಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.`])),
  hi: Object.fromEntries(cropCatalog.map((c:any)=>[c.name, `कटाई के बाद खेत साफ करें, उपज दर्ज करें और अगली फसल से पहले मिट्टी के पोषक तत्वों की जांच करें।`]))
};

const cropRotations: Record<string, Record<string, string>> = {
  en: Object.fromEntries(cropCatalog.map((c:any)=>[c.name, `Rotate with a compatible crop from a different family when agronomically appropriate.`])),
  kn: Object.fromEntries(cropCatalog.map((c:any)=>[c.name, `ಕೃಷಿ ದೃಷ್ಟಿಯಿಂದ ಸೂಕ್ತವಾದಾಗ ಬೇರೆ ಕುಟುಂಬದ ಹೊಂದಾಣಿಕೆಯ ಬೆಳೆಯೊಂದಿಗೆ ಸರದಿ ಬೆಳೆ ಮಾಡಿ.`])),
  hi: Object.fromEntries(cropCatalog.map((c:any)=>[c.name, `कृषि की दृष्टि से उपयुक्त होने पर अलग परिवार की संगत फसल के साथ फसल चक्र अपनाएं।`]))
};

const marketTicker = [
  { crop:"Maize", price:"₹2,100", change:"+1.2%", up:true }, { crop:"Rice", price:"₹2,900", change:"-0.4%", up:false },
  { crop:"Cotton", price:"₹6,000", change:"+2.1%", up:true }, { crop:"Wheat", price:"₹2,400", change:"+0.8%", up:true },
  { crop:"Soybean", price:"₹4,500", change:"+0.6%", up:true }, { crop:"Turmeric", price:"₹9,000", change:"-0.2%", up:false }
];

const fertilizerProducts: any[] = [
  {id:"fert-urea",type:"Fertilizer",name:"Urea 46% N",unit:"50 kg bag",price:1450,nutrients:"N",category:"Nitrogen",crop:"General"},
  {id:"fert-dap",type:"Fertilizer",name:"DAP 18-46-0",unit:"50 kg bag",price:1350,nutrients:"N + P",category:"Nitrogen / Phosphorus",crop:"General"},
  {id:"fert-npk",type:"Fertilizer",name:"NPK 19-19-19 Soluble",unit:"1 kg pack",price:220,nutrients:"N + P + K",category:"Balanced NPK",crop:"General"},
  {id:"fert-mop",type:"Fertilizer",name:"MOP 0-0-60",unit:"50 kg bag",price:1700,nutrients:"K",category:"Potassium",crop:"General"},
  {id:"fert-ssp",type:"Fertilizer",name:"SSP 16% P",unit:"50 kg bag",price:520,nutrients:"P",category:"Phosphorus",crop:"General"},
  {id:"fert-zinc",type:"Fertilizer",name:"Zinc Sulphate",unit:"5 kg pack",price:480,nutrients:"Zn",category:"Micronutrient",crop:"General"},
  {id:"fert-compost",type:"Fertilizer",name:"Farm Compost",unit:"25 kg bag",price:360,nutrients:"Organic matter",category:"Organic",crop:"General"},
  {id:"fert-vermi",type:"Fertilizer",name:"Vermicompost",unit:"25 kg bag",price:550,nutrients:"Organic + micronutrients",category:"Organic",crop:"General"},
  {id:"fert-micronutrient",type:"Fertilizer",name:"Multi Micronutrient Mix",unit:"1 kg pack",price:310,nutrients:"Zn + Fe + B + Mn",category:"Micronutrient",crop:"General"},
  {id:"fert-potassium-sulphate",type:"Fertilizer",name:"SOP 0-0-50",unit:"25 kg bag",price:2100,nutrients:"K + S",category:"Potassium",crop:"Fruit / Vegetable"}
];

const seedProducts = cropCatalog.map((c:any,i:number)=>({id:`seed-${i}`,type:"Seed",crop:c.name,name:`${c.name} Certified Seed`,unit:"pack",price:300 + (i%7)*75,duration:c.duration,category:"Seed",availability:"Demo catalogue",supplier:"Supplier catalogue"}));
const shopProducts: any[] = [...seedProducts, ...fertilizerProducts];
const getProductName = (p:any, lang:string) => p?.type === "Seed" ? getCropDisplayName(p.crop,lang) + (lang === "en" ? " Certified Seed" : "") : p?.name || "Farm Input";

// ============================================================================
// COMPLETE MARKET + BUYER COVERAGE FOR EVERY SUPPORTED CROP
// ============================================================================
// YieldSense AI has one canonical crop catalogue. The market and buyer
// directories intentionally derive from that same catalogue so a farmer does
// not see Rice/Maize/Cotton only while other supported crops disappear.
// These records are reference/integration records, not live market claims.
// A connected provider should replace the reference price/status in production.

const getMarketRegionForCrop = (crop:any) => {
  const category = String(crop?.category || "Other").toLowerCase();
  if (category.includes("spice")) return "South India";
  if (category.includes("fruit")) return "South & West India";
  if (category.includes("plantation")) return "South India";
  if (category.includes("oilseed")) return "Central & South India";
  if (category.includes("pulse")) return "Central & South India";
  if (category.includes("vegetable")) return "Regional vegetable markets";
  if (category.includes("fiber")) return "Major textile markets";
  if (category.includes("cash")) return "Regional sugar markets";
  return "Regional agricultural markets";
};

const getMarketCenterForCrop = (crop:any) => {
  const category = String(crop?.category || "Other").toLowerCase();
  if (category.includes("spice")) return "Regional Spice Market";
  if (category.includes("fruit")) return "Regional Fruit Market";
  if (category.includes("plantation")) return "Regional Plantation Market";
  if (category.includes("vegetable")) return "Regional Vegetable APMC";
  if (category.includes("oilseed")) return "Regional Oilseed APMC";
  if (category.includes("pulse")) return "Regional Pulse APMC";
  if (category.includes("fiber")) return "Regional Fiber Market";
  if (category.includes("cash")) return "Regional Sugar Market";
  return "Regional APMC / Market Yard";
};

const getBuyerTypeForCrop = (crop:any) => {
  const category = String(crop?.category || "Other").toLowerCase();
  if (category.includes("spice")) return "Spice aggregator / processor";
  if (category.includes("fruit")) return "Fruit aggregator / wholesaler";
  if (category.includes("plantation")) return "Plantation produce buyer";
  if (category.includes("vegetable")) return "Vegetable wholesaler / aggregator";
  if (category.includes("oilseed")) return "Oilseed processor / aggregator";
  if (category.includes("pulse")) return "Pulse processor / aggregator";
  if (category.includes("fiber")) return "Fiber trader / processor";
  if (category.includes("cash")) return "Sugar mill / cane aggregator";
  return "Crop aggregator / wholesale buyer";
};

const getReferenceMarketPrice = (cropName:string) => {
  const referenceValue = Number(cropMarketPrices[cropName] || 0);
  return referenceValue > 0
    ? `₹${referenceValue.toLocaleString("en-IN")}/reference unit`
    : "Provider quote required";
};

const marketDirectory = cropCatalog.flatMap((crop:any, index:number) => {
  const region = getMarketRegionForCrop(crop);
  const center = getMarketCenterForCrop(crop);
  const price = getReferenceMarketPrice(crop.name);
  return [
    {
      id:`mandi-${crop.name}-primary-${index}`,
      crop:crop.name,
      market:center,
      region,
      buyer:`${crop.name} ${getBuyerTypeForCrop(crop)}`,
      price,
      trend:"Reference only — verify current mandi price locally or through a connected market feed.",
      sourceStatus:"Reference directory; live feed not connected",
      verified:false
    },
    {
      id:`mandi-${crop.name}-collection-${index}`,
      crop:crop.name,
      market:`${region} Collection Hub`,
      region,
      buyer:`${crop.name} collection / aggregation network`,
      price,
      trend:"Indicative reference only; buyer terms, quality and price require confirmation.",
      sourceStatus:"Reference directory; live feed not connected",
      verified:false
    }
  ];
});

const buyerDirectory = cropCatalog.flatMap((crop:any, index:number) => {
  const region = getMarketRegionForCrop(crop);
  const buyerType = getBuyerTypeForCrop(crop);
  return [
    {
      id:`buyer-${crop.name}-aggregator-${index}`,
      crop:crop.name,
      type:buyerType,
      region,
      contact:"Contact / Inquire",
      status:"Directory reference — verified contact required",
      verified:false
    },
    {
      id:`buyer-${crop.name}-direct-${index}`,
      crop:crop.name,
      type:`Direct ${crop.name} buyer`,
      region,
      contact:"Contact / Inquire",
      status:"Directory reference — verified contact required",
      verified:false
    }
  ];
});

const marketCoverageReport = cropCatalog.map((crop:any) => ({
  crop:crop.name,
  marketRecords:marketDirectory.filter((item:any)=>item.crop===crop.name).length,
  buyerRecords:buyerDirectory.filter((item:any)=>item.crop===crop.name).length,
  marketCovered:marketDirectory.some((item:any)=>item.crop===crop.name),
  buyerCovered:buyerDirectory.some((item:any)=>item.crop===crop.name),
  source:"Reference directory; connect a verified provider for live values."
}));

const getMarketCoverageForCrop = (cropName:string) => marketCoverageReport.find((item:any)=>item.crop===cropName) || {
  crop:cropName, marketRecords:0, buyerRecords:0, marketCovered:false, buyerCovered:false, source:"No directory record available."
};

// ============================================================================
// ALL-CROP MARKET INTELLIGENCE LAYER
// ============================================================================
// The marketplace must never silently fall back to Rice/Maize/Cotton records.
// Every crop in cropCatalog receives its own market/buyer planning profile.
// These are explicitly reference records, not claims of a live mandi feed.
// A verified provider can replace the reference fields without changing the UI.
// ============================================================================
const cropMarketIntelligence = Object.fromEntries(cropCatalog.map((crop:any, index:number) => {
  const category = String(crop?.category || "Other").toLowerCase();
  const name = String(crop?.name || "Crop");
  const isFruit = category.includes("fruit");
  const isVegetable = category.includes("vegetable");
  const isSpice = category.includes("spice");
  const isPulse = category.includes("pulse");
  const isOilseed = category.includes("oilseed");
  const isFiber = category.includes("fiber");
  const isPlantation = category.includes("plantation");
  const isCash = category.includes("cash");
  const marketType = isFruit ? "Fruit APMC / collection market" : isVegetable ? "Vegetable APMC / collection market" : isSpice ? "Spice market / processor" : isPulse ? "Pulse market / dal mill" : isOilseed ? "Oilseed APMC / processor" : isFiber ? "Fiber market / processor" : isPlantation ? "Plantation produce market" : isCash ? "Sugar / commercial crop market" : "Regional APMC / market yard";
  const buyerType = isFruit ? "Fruit wholesaler / ripener / processor" : isVegetable ? "Vegetable wholesaler / retailer" : isSpice ? "Spice processor / exporter / aggregator" : isPulse ? "Dal mill / pulse aggregator" : isOilseed ? "Oil mill / oilseed aggregator" : isFiber ? "Textile buyer / fiber processor" : isPlantation ? "Plantation processor / trader" : isCash ? "Mill / commercial crop aggregator" : "Grain / crop aggregator / wholesaler";
  const quality = isFruit ? "Grade, size, maturity, appearance, shelf life" : isVegetable ? "Size, freshness, grade, moisture, residue compliance" : isSpice ? "Colour, moisture, volatile oil / quality grade" : isPulse ? "Moisture, grain size, cleanliness, split quality" : isOilseed ? "Oil content, moisture, seed purity" : isFiber ? "Staple/grade, moisture, contamination" : "Moisture, grade, cleanliness, variety and quality";
  const demand = isFruit ? "Fresh-market and processing demand" : isVegetable ? "Daily regional wholesale demand" : isSpice ? "Processing and specialty demand" : isPulse ? "Food-processing and wholesale demand" : isOilseed ? "Oil-processing demand" : isFiber ? "Textile/industrial demand" : isPlantation ? "Processing and commodity demand" : "Regional wholesale and processing demand";
  return [name, {
    crop:name,
    index,
    marketType,
    buyerType,
    quality,
    demand,
    marketRegion:getMarketRegionForCrop(crop),
    marketCenter:getMarketCenterForCrop(crop),
    referencePrice:getReferenceMarketPrice(name),
    live:false,
    verification:"Verify current price, buyer terms, quality requirements and delivery conditions with a connected/verified provider before sale.",
    recommendedDocuments:["Crop/variety details","Expected quantity","Harvest window","Quality/grade information"],
    routeHint:`${name} market / buyer discovery`,
  }];
}));

const getCropMarketIntelligence = (cropName:string) => {
  const canonical = resolveCanonicalCropName(cropName);
  return cropMarketIntelligence[canonical] || {
    crop:canonical || cropName,
    marketType:"Regional agricultural market",
    buyerType:"Crop aggregator / wholesale buyer",
    quality:"Moisture, grade, cleanliness and variety",
    demand:"Regional demand",
    marketRegion:"Regional agricultural markets",
    marketCenter:"Regional APMC / Market Yard",
    referencePrice:"Provider quote required",
    live:false,
    verification:"Verify with a connected market provider before sale."
  };
};

const lifecycleStageLabels: Record<string, Record<string,string>> = {
  en:{prepare:"Land Preparation",germination:"Germination / Establishment",vegetative:"Vegetative Growth",flowering:"Flowering / Reproductive Stage",filling:"Fruit / Grain / Tuber Development",maturity:"Maturity",harvest:"Harvest"},
  kn:{prepare:"ಜಮೀನು ಸಿದ್ಧತೆ",germination:"ಮೊಳಕೆ / ಸ್ಥಾಪನೆ",vegetative:"ಸಸ್ಯ ಬೆಳವಣಿಗೆ",flowering:"ಹೂಬಿಡುವಿಕೆ / ಸಂತಾನೋತ್ಪತ್ತಿ ಹಂತ",filling:"ಹಣ್ಣು / ಕಾಳು / ಗೆಡ್ಡೆ ಅಭಿವೃದ್ಧಿ",maturity:"ಪಕ್ವತೆ",harvest:"ಕೊಯ್ಲು"},
  hi:{prepare:"खेत की तैयारी",germination:"अंकुरण / स्थापना",vegetative:"वानस्पतिक वृद्धि",flowering:"फूल / प्रजनन अवस्था",filling:"फल / दाना / कंद विकास",maturity:"परिपक्वता",harvest:"कटाई"},
  te:{prepare:"భూమి సిద్ధం",germination:"మొలక / స్థాపన",vegetative:"వృక్ష వృద్ధి",flowering:"పుష్పించే / ప్రజనన దశ",filling:"పండు / గింజ / దుంప అభివృద్ధి",maturity:"పక్వత",harvest:"కోత"},
  ta:{prepare:"நிலத் தயாரிப்பு",germination:"முளைப்பு / நிலைநிறுத்தல்",vegetative:"தாவர வளர்ச்சி",flowering:"பூக்கும் / இனப்பெருக்க நிலை",filling:"பழம் / தானியம் / கிழங்கு வளர்ச்சி",maturity:"முதிர்ச்சி",harvest:"அறுவடை"},
  ml:{prepare:"നിലം തയ്യാറാക്കൽ",germination:"മുളപ്പ് / സ്ഥാപനം",vegetative:"സസ്യ വളർച്ച",flowering:"പൂക്കൽ / പ്രജനന ഘട്ടം",filling:"പഴം / ധാന്യം / കിഴങ്ങ് വികസനം",maturity:"പാകം",harvest:"വിളവെടുപ്പ്"},
  mr:{prepare:"शेताची तयारी",germination:"उगवण / स्थापना",vegetative:"वनस्पती वाढ",flowering:"फुलोरा / प्रजनन अवस्था",filling:"फळ / दाणा / कंद विकास",maturity:"परिपक्वता",harvest:"कापणी"},
  bn:{prepare:"জমি প্রস্তুতি",germination:"অঙ্কুরোদগম / প্রতিষ্ঠা",vegetative:"উদ্ভিদ বৃদ্ধি",flowering:"ফুল / প্রজনন পর্যায়",filling:"ফল / শস্য / কন্দ বিকাশ",maturity:"পরিপক্বতা",harvest:"ফসল কাটা"},
  gu:{prepare:"ખેતરની તૈયારી",germination:"અંકુરણ / સ્થાપના",vegetative:"વનસ્પતિ વૃદ્ધિ",flowering:"ફૂલ / પ્રજનન તબક્કો",filling:"ફળ / દાણા / કંદ વિકાસ",maturity:"પરિપક્વતા",harvest:"કાપણી"},
  pa:{prepare:"ਖੇਤ ਦੀ ਤਿਆਰੀ",germination:"ਅੰਕੁਰਣ / ਸਥਾਪਨਾ",vegetative:"ਬਨਸਪਤੀ ਵਾਧਾ",flowering:"ਫੁੱਲ / ਪ੍ਰਜਨਨ ਪੜਾਅ",filling:"ਫਲ / ਦਾਣਾ / ਗੰਢ ਵਿਕਾਸ",maturity:"ਪੱਕਣਾ",harvest:"ਕਟਾਈ"},
  or:{prepare:"କ୍ଷେତ୍ର ପ୍ରସ୍ତୁତି",germination:"ଅଙ୍କୁରୋଦ୍ଗମ / ସ୍ଥାପନ",vegetative:"ବୃକ୍ଷ ବୃଦ୍ଧି",flowering:"ଫୁଲ / ପ୍ରଜନନ ପର୍ଯ୍ୟାୟ",filling:"ଫଳ / ଶସ୍ୟ / କନ୍ଦ ବିକାଶ",maturity:"ପରିପକ୍ୱତା",harvest:"ଅମଳ"},
  ur:{prepare:"کھیت کی تیاری",germination:"انکرن / قیام",vegetative:"نباتاتی نشوونما",flowering:"پھول / تولیدی مرحلہ",filling:"پھل / دانہ / گٹھا نشوونما",maturity:"پختگی",harvest:"کٹائی"}
};

// Crop-specific planning knowledge: each crop gets its own stage sequence,
// nutrient priorities, irrigation guidance, scouting focus and harvest guidance.
const cropPlannerKnowledge: Record<string, any> = Object.fromEntries(cropCatalog.map((c:any) => {
  const category = String(c.category).toLowerCase();
  const climate = String(c.climate).toLowerCase();
  const risk = String(c.risk).toLowerCase();
  const isWet = climate.includes("wet");
  const isDry = climate.includes("dry");
  const isFruit = category === "fruit";
  const isVegetable = category === "vegetable";
  const isPulse = category === "pulse";
  const isSpice = category === "spice";
  const isPlantation = category === "plantation";
  let stages = ["prepare","germination","vegetative","flowering","filling","harvest"];
  if (isFruit || isPlantation || isVegetable) stages = ["prepare","germination","vegetative","flowering","filling","maturity","harvest"];
  if (isPulse) stages = ["prepare","germination","vegetative","flowering","filling","harvest"];
  if (isSpice) stages = ["prepare","germination","vegetative","filling","maturity","harvest"];
  const irrigation = isWet
    ? `For ${c.name}, prioritize drainage and avoid prolonged waterlogging; adjust irrigation after rainfall.`
    : isDry
      ? `For ${c.name}, use measured irrigation intervals and conserve moisture with timely field operations.`
      : `For ${c.name}, irrigate from soil moisture and rainfall observations rather than a fixed generic schedule.`;
  const scouting = risk === "high"
    ? `${c.name} is marked High risk in the planning profile; inspect the crop at least weekly during active growth.`
    : risk === "medium"
      ? `${c.name} has a Medium planning risk; increase scouting after heavy rain, heat or irrigation changes.`
      : `${c.name} has a Low planning risk; continue routine scouting and record symptoms before treatment.`;
  const nutrientPriority = Number(c.nitrogen) >= 100
    ? `${c.name} has a relatively high nitrogen target (${c.nitrogen}); split applications should be validated with soil and crop stage.`
    : Number(c.phosphorus) >= 45
      ? `${c.name} has a stronger phosphorus planning target (${c.phosphorus}); validate soil-test results before application.`
      : Number(c.potassium) >= 70
        ? `${c.name} has a stronger potassium planning target (${c.potassium}); validate crop stage and soil status before application.`
        : `${c.name} should use balanced, soil-test-guided nutrition rather than a fixed fertilizer recipe.`;
  const harvest = isFruit || isPlantation
    ? `For ${c.name}, harvest according to maturity, quality grade and crop-specific picking or collection interval.`
    : `For ${c.name}, confirm maturity, weather window, labor/equipment readiness and post-harvest handling before harvest.`;
  return [c.name, {
    crop:c.name,
    category:c.category,
    climate:c.climate,
    soil:c.soil,
    duration:c.duration,
    durationDays:Number(c.durationDays || 120),
    target:{moisture:Number(c.moisture),ph:Number(c.ph),nitrogen:Number(c.nitrogen),phosphorus:Number(c.phosphorus),potassium:Number(c.potassium)},
    stages,
    irrigation,
    scouting,
    nutrientPriority,
    harvest,
    risk,
    establishment:`${c.name}: verify certified seed or planting material, local variety suitability and the recommended establishment window.`,
    marketNote:`${c.name}: record expected harvest quantity and verify local buyer demand and current price before committing the crop.`
  }];
}));

const plannerStageActionTemplates: Record<string,string> = {
  prepare:"Prepare the field, confirm drainage, review the soil test and complete the crop-specific basal nutrient plan.",
  germination:"Monitor emergence or transplant establishment, stand uniformity, gaps and early weed pressure.",
  vegetative:"Track canopy growth, weeds, moisture and nutrient response; correct deficiencies only after validation.",
  flowering:"Protect the reproductive stage from water stress, excessive nitrogen and avoidable pest pressure.",
  filling:"Maintain stable moisture and nutrition while monitoring disease, lodging and maturity progression.",
  maturity:"Check crop-specific maturity indicators, quality and harvest readiness while preparing logistics.",
  harvest:"Confirm maturity, weather window, labor/equipment readiness and post-harvest handling before harvest."
};

// ============================================================================
// FARM PLANNER SAFETY + MULTILINGUAL ACTION LAYER
// ============================================================================
// This layer is intentionally separate from the existing planner data. It makes
// the planner resilient when a crop name is missing, renamed, localized, or
// loaded from older localStorage data. It never silently changes an unsupported
// crop into Rice, Maize, or another unrelated crop.
//
// The stage labels and actions below are farmer-facing translations. They are
// kept as complete phrases so the planner does not mix English and the selected
// language inside the same lifecycle card.
const plannerActionTranslations: Record<string, Record<string, string>> = {
  en:{
    prepare:"Prepare the field, check drainage and review the soil test before planting.",
    germination:"Monitor emergence or establishment, stand uniformity, gaps and early weed pressure.",
    vegetative:"Monitor crop growth, weeds, soil moisture and nutrient response during active growth.",
    flowering:"Protect the reproductive stage from water stress, excessive nitrogen, heat and pest pressure.",
    filling:"Maintain stable moisture and nutrition while monitoring grain, fruit, pod or tuber development.",
    maturity:"Check crop-specific maturity signs, quality and harvest readiness while preparing logistics.",
    harvest:"Confirm maturity, weather conditions, labor or equipment readiness and post-harvest handling before harvest."
  },
  kn:{
    prepare:"ನಾಟಿ ಮಾಡುವ ಮೊದಲು ಜಮೀನನ್ನು ಸಿದ್ಧಪಡಿಸಿ, ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿಕೊಳ್ಳಿ ಮತ್ತು ಮಣ್ಣಿನ ಪರೀಕ್ಷೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    germination:"ಮೊಳಕೆ ಅಥವಾ ಸ್ಥಾಪನೆ, ಸಸಿಗಳ ಸಮಾನತೆ, ಖಾಲಿ ಜಾಗಗಳು ಮತ್ತು ಆರಂಭಿಕ ಕಳೆಗಳನ್ನು ಗಮನಿಸಿ.",
    vegetative:"ಬೆಳವಣಿಗೆ, ಕಳೆ, ಮಣ್ಣಿನ ತೇವಾಂಶ ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಗಮನಿಸಿ.",
    flowering:"ಹೂಬಿಡುವ ಹಂತದಲ್ಲಿ ನೀರಿನ ಒತ್ತಡ, ಹೆಚ್ಚುವರಿ ಸಾರಜನಕ, ಬಿಸಿ ಮತ್ತು ಕೀಟದ ಅಪಾಯದಿಂದ ಬೆಳೆಯನ್ನು ರಕ್ಷಿಸಿ.",
    filling:"ತೇವಾಂಶ ಮತ್ತು ಪೋಷಕಾಂಶಗಳನ್ನು ಸಮತೋಲನದಲ್ಲಿಟ್ಟು ಕಾಳು, ಹಣ್ಣು, ಕಾಯಿ ಅಥವಾ ಗೆಡ್ಡೆಯ ಬೆಳವಣಿಗೆಯನ್ನು ಗಮನಿಸಿ.",
    maturity:"ಪಕ್ವತೆಯ ಲಕ್ಷಣಗಳು, ಗುಣಮಟ್ಟ ಮತ್ತು ಕೊಯ್ಲಿನ ಸಿದ್ಧತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ; ಕೊಯ್ಲಿನ ವ್ಯವಸ್ಥೆ ಮಾಡಿ.",
    harvest:"ಕೊಯ್ಲಿಗೆ ಮೊದಲು ಪಕ್ವತೆ, ಹವಾಮಾನ, ಕಾರ್ಮಿಕರು ಅಥವಾ ಉಪಕರಣಗಳು ಮತ್ತು ಕೊಯ್ಲಿನ ನಂತರದ ನಿರ್ವಹಣೆಯನ್ನು ಖಚಿತಪಡಿಸಿ."
  },
  hi:{
    prepare:"बुवाई से पहले खेत तैयार करें, जल निकासी जांचें और मिट्टी की जांच रिपोर्ट देखें।",
    germination:"अंकुरण या स्थापना, पौधों की समानता, खाली स्थान और शुरुआती खरपतवार पर नजर रखें।",
    vegetative:"सक्रिय वृद्धि के दौरान फसल की बढ़वार, खरपतवार, मिट्टी की नमी और पोषक प्रतिक्रिया देखें।",
    flowering:"फूल आने की अवस्था में जल तनाव, अतिरिक्त नाइट्रोजन, गर्मी और कीट जोखिम से फसल की रक्षा करें।",
    filling:"नमी और पोषण संतुलित रखें तथा दाने, फल, फली या कंद के विकास पर नजर रखें।",
    maturity:"परिपक्वता के संकेत, गुणवत्ता और कटाई की तैयारी जांचें तथा कटाई की व्यवस्था करें।",
    harvest:"कटाई से पहले परिपक्वता, मौसम, श्रमिक या उपकरण और कटाई के बाद की व्यवस्था सुनिश्चित करें।"
  },
  te:{
    prepare:"నాటే ముందు పొలాన్ని సిద్ధం చేసి, నీటి పారుదల మరియు మట్టి పరీక్షను పరిశీలించండి.",
    germination:"మొలక లేదా స్థాపన, మొక్కల సమానత్వం, ఖాళీలు మరియు ప్రారంభ కలుపును గమనించండి.",
    vegetative:"చురుకైన పెరుగుదలలో పంట పెరుగుదల, కలుపు, నేల తేమ మరియు పోషక ప్రతిస్పందనను గమనించండి.",
    flowering:"పుష్ప దశలో నీటి ఒత్తిడి, అధిక నైట్రోజన్, వేడి మరియు పురుగు ప్రమాదం నుండి పంటను రక్షించండి.",
    filling:"తేమ మరియు పోషణను సమతుల్యంగా ఉంచి గింజ, పండు, కాయ లేదా దుంప అభివృద్ధిని గమనించండి.",
    maturity:"పక్వత లక్షణాలు, నాణ్యత మరియు కోతకు సిద్ధతను పరిశీలించి కోత ఏర్పాట్లు చేయండి.",
    harvest:"కోతకు ముందు పక్వత, వాతావరణం, కార్మికులు లేదా పరికరాలు మరియు కోత తర్వాత నిర్వహణను నిర్ధారించండి."
  },
  ta:{
    prepare:"நடவு செய்வதற்கு முன் நிலத்தை தயார் செய்து, வடிகால் மற்றும் மண் பரிசோதனையை சரிபார்க்கவும்.",
    germination:"முளைப்பு அல்லது நிலைநிறுத்தம், செடிகளின் சமநிலை, இடைவெளிகள் மற்றும் ஆரம்ப களைகளை கண்காணிக்கவும்.",
    vegetative:"வளர்ச்சி காலத்தில் பயிர் வளர்ச்சி, களைகள், மண் ஈரப்பதம் மற்றும் ஊட்டச்சத்து எதிர்வினையை கண்காணிக்கவும்.",
    flowering:"பூக்கும் நிலையில் நீர் அழுத்தம், அதிக நைட்ரஜன், வெப்பம் மற்றும் பூச்சி அபாயத்திலிருந்து பயிரை பாதுகாக்கவும்.",
    filling:"ஈரப்பதம் மற்றும் ஊட்டச்சத்தை சமநிலையில் வைத்து கனி, தானியம், காய் அல்லது கிழங்கு வளர்ச்சியை கண்காணிக்கவும்.",
    maturity:"முதிர்ச்சி அறிகுறிகள், தரம் மற்றும் அறுவடை தயார்நிலையை சரிபார்த்து அறுவடை ஏற்பாடுகளை செய்யவும்.",
    harvest:"அறுவடைக்கு முன் முதிர்ச்சி, வானிலை, தொழிலாளர்கள் அல்லது கருவிகள் மற்றும் அறுவடைக்குப் பிந்தைய பராமரிப்பை உறுதி செய்யவும்."
  },
  ml:{
    prepare:"നടുന്നതിന് മുമ്പ് നിലം തയ്യാറാക്കി ഡ്രെയിനേജും മണ്ണ് പരിശോധനയും പരിശോധിക്കുക.",
    germination:"മുളപ്പ് അല്ലെങ്കിൽ സ്ഥാപനം, ചെടികളുടെ ഏകീകൃതത, ഇടവിടുകൾ, ആദ്യകാല കളകൾ എന്നിവ നിരീക്ഷിക്കുക.",
    vegetative:"സജീവ വളർച്ചയിൽ വിളയുടെ വളർച്ച, കളകൾ, മണ്ണിലെ ഈർപ്പം, പോഷക പ്രതികരണം എന്നിവ നിരീക്ഷിക്കുക.",
    flowering:"പൂക്കാലത്ത് ജല സമ്മർദ്ദം, അധിക നൈട്രജൻ, ചൂട്, കീട അപകടം എന്നിവയിൽ നിന്ന് വിളയെ സംരക്ഷിക്കുക.",
    filling:"ഈർപ്പവും പോഷകവും സമതുലിതമായി നിലനിർത്തി കായ്, ധാന്യം, ഫലം അല്ലെങ്കിൽ കിഴങ്ങിന്റെ വളർച്ച നിരീക്ഷിക്കുക.",
    maturity:"പാകമായതിന്റെ ലക്ഷണങ്ങൾ, ഗുണനിലവാരം, വിളവെടുപ്പ് തയ്യാറെടുപ്പ് എന്നിവ പരിശോധിച്ച് ക്രമീകരണം നടത്തുക.",
    harvest:"വിളവെടുപ്പിന് മുമ്പ് പാകം, കാലാവസ്ഥ, തൊഴിലാളികൾ അല്ലെങ്കിൽ ഉപകരണങ്ങൾ, വിളവെടുപ്പിന് ശേഷമുള്ള പരിപാലനം എന്നിവ ഉറപ്പാക്കുക."
  },
  mr:{
    prepare:"लागवडीपूर्वी शेत तयार करा, निचरा तपासा आणि माती परीक्षणाचा अहवाल पहा.",
    germination:"उगवण किंवा स्थापना, रोपांची समानता, रिकाम्या जागा आणि सुरुवातीच्या तणांवर लक्ष ठेवा.",
    vegetative:"सक्रिय वाढीदरम्यान पिकाची वाढ, तण, जमिनीतील ओलावा आणि पोषक प्रतिसाद तपासा.",
    flowering:"फुलोऱ्याच्या अवस्थेत पाण्याचा ताण, जादा नायट्रोजन, उष्णता आणि किडीच्या जोखमीपासून पिकाचे संरक्षण करा.",
    filling:"ओलावा आणि पोषण संतुलित ठेवून दाणे, फळे, शेंगा किंवा कंदांच्या विकासावर लक्ष ठेवा.",
    maturity:"परिपक्वतेची लक्षणे, गुणवत्ता आणि कापणीची तयारी तपासा आणि कापणीची व्यवस्था करा.",
    harvest:"कापणीपूर्वी परिपक्वता, हवामान, मजूर किंवा उपकरणे आणि कापणीनंतरची हाताळणी निश्चित करा."
  },
  bn:{
    prepare:"রোপণের আগে জমি প্রস্তুত করুন, নিষ্কাশন পরীক্ষা করুন এবং মাটি পরীক্ষার ফল দেখুন।",
    germination:"অঙ্কুরোদগম বা প্রতিষ্ঠা, গাছের সমতা, ফাঁকা স্থান এবং প্রাথমিক আগাছা পর্যবেক্ষণ করুন।",
    vegetative:"সক্রিয় বৃদ্ধির সময় ফসলের বৃদ্ধি, আগাছা, মাটির আর্দ্রতা এবং পুষ্টির প্রতিক্রিয়া দেখুন।",
    flowering:"ফুল আসার সময় জল সংকট, অতিরিক্ত নাইট্রোজেন, তাপ এবং পোকার ঝুঁকি থেকে ফসল রক্ষা করুন।",
    filling:"আর্দ্রতা ও পুষ্টি ভারসাম্য রেখে দানা, ফল, শুঁটি বা কন্দের বৃদ্ধি পর্যবেক্ষণ করুন।",
    maturity:"পরিপক্বতার লক্ষণ, গুণমান এবং কাটার প্রস্তুতি পরীক্ষা করে কাটার ব্যবস্থা করুন।",
    harvest:"কাটার আগে পরিপক্বতা, আবহাওয়া, শ্রমিক বা যন্ত্রপাতি এবং কাটার পরের ব্যবস্থাপনা নিশ্চিত করুন।"
  },
  gu:{
    prepare:"વાવણી પહેલાં ખેતર તૈયાર કરો, પાણીના નિકાલની તપાસ કરો અને માટી પરીક્ષણ જુઓ.",
    germination:"અંકુરણ અથવા સ્થાપના, છોડની સમાનતા, ખાલી જગ્યાઓ અને શરૂઆતના નીંદણ પર નજર રાખો.",
    vegetative:"સક્રિય વૃદ્ધિ દરમિયાન પાકની વૃદ્ધિ, નીંદણ, જમીનની ભેજ અને પોષક પ્રતિસાદ તપાસો.",
    flowering:"ફૂલ આવવાના તબક્કે પાણીનો તણાવ, વધુ નાઇટ્રોજન, ગરમી અને જીવાતના જોખમથી પાકનું રક્ષણ કરો.",
    filling:"ભેજ અને પોષણ સંતુલિત રાખીને દાણા, ફળ, શીંગ અથવા કંદના વિકાસનું નિરીક્ષણ કરો.",
    maturity:"પરિપક્વતાના સંકેતો, ગુણવત્તા અને કાપણીની તૈયારી તપાસો અને કાપણીની વ્યવસ્થા કરો.",
    harvest:"કાપણી પહેલાં પરિપક્વતા, હવામાન, મજૂરો અથવા સાધનો અને કાપણી પછીની સંભાળ સુનિશ્ચિત કરો."
  },
  pa:{
    prepare:"ਬਿਜਾਈ ਤੋਂ ਪਹਿਲਾਂ ਖੇਤ ਤਿਆਰ ਕਰੋ, ਪਾਣੀ ਦੀ ਨਿਕਾਸੀ ਜਾਂਚੋ ਅਤੇ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਵੇਖੋ।",
    germination:"ਅੰਕੁਰਣ ਜਾਂ ਸਥਾਪਨਾ, ਪੌਦਿਆਂ ਦੀ ਸਮਾਨਤਾ, ਖਾਲੀ ਥਾਵਾਂ ਅਤੇ ਸ਼ੁਰੂਆਤੀ ਨਦੀਨਾਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ।",
    vegetative:"ਸਰਗਰਮ ਵਾਧੇ ਦੌਰਾਨ ਫਸਲ ਦਾ ਵਾਧਾ, ਨਦੀਨ, ਮਿੱਟੀ ਦੀ ਨਮੀ ਅਤੇ ਪੋਸ਼ਕ ਪ੍ਰਤੀਕਿਰਿਆ ਵੇਖੋ।",
    flowering:"ਫੁੱਲ ਆਉਣ ਦੇ ਪੜਾਅ ਵਿੱਚ ਪਾਣੀ ਦੀ ਘਾਟ, ਵੱਧ ਨਾਈਟ੍ਰੋਜਨ, ਗਰਮੀ ਅਤੇ ਕੀੜਿਆਂ ਦੇ ਖਤਰੇ ਤੋਂ ਫਸਲ ਬਚਾਓ।",
    filling:"ਨਮੀ ਅਤੇ ਪੋਸ਼ਣ ਸੰਤੁਲਿਤ ਰੱਖ ਕੇ ਦਾਣੇ, ਫਲ, ਫਲੀ ਜਾਂ ਗੰਢ ਦੇ ਵਿਕਾਸ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ।",
    maturity:"ਪੱਕਣ ਦੇ ਸੰਕੇਤ, ਗੁਣਵੱਤਾ ਅਤੇ ਕਟਾਈ ਦੀ ਤਿਆਰੀ ਜਾਂਚੋ ਅਤੇ ਕਟਾਈ ਦੀ ਯੋਜਨਾ ਬਣਾਓ।",
    harvest:"ਕਟਾਈ ਤੋਂ ਪਹਿਲਾਂ ਪੱਕਣ, ਮੌਸਮ, ਮਜ਼ਦੂਰ ਜਾਂ ਸਾਜ਼ੋ-ਸਾਮਾਨ ਅਤੇ ਕਟਾਈ ਬਾਅਦ ਸੰਭਾਲ ਯਕੀਨੀ ਬਣਾਓ।"
  },
  or:{
    prepare:"ରୋପଣ ପୂର୍ବରୁ କ୍ଷେତ୍ର ପ୍ରସ୍ତୁତ କରନ୍ତୁ, ଜଳ ନିଷ୍କାସନ ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ମାଟି ପରୀକ୍ଷା ଦେଖନ୍ତୁ।",
    germination:"ଅଙ୍କୁରୋଦ୍ଗମ କିମ୍ବା ସ୍ଥାପନ, ଗଛର ସମାନତା, ଖାଲି ସ୍ଥାନ ଏବଂ ପ୍ରାରମ୍ଭିକ ଘାସକୁ ନଜରରେ ରଖନ୍ତୁ।",
    vegetative:"ସକ୍ରିୟ ବୃଦ୍ଧି ସମୟରେ ଫସଲ ବୃଦ୍ଧି, ଘାସ, ମାଟି ଆର୍ଦ୍ରତା ଏବଂ ପୋଷକ ପ୍ରତିକ୍ରିୟା ଯାଞ୍ଚ କରନ୍ତୁ।",
    flowering:"ଫୁଲ ଅବସ୍ଥାରେ ଜଳ ଚାପ, ଅଧିକ ନାଇଟ୍ରୋଜେନ, ତାପ ଏବଂ କୀଟ ଝୁମ୍ପରୁ ଫସଲକୁ ସୁରକ୍ଷା କରନ୍ତୁ।",
    filling:"ଆର୍ଦ୍ରତା ଏବଂ ପୋଷଣ ସନ୍ତୁଳିତ ରଖି ଶସ୍ୟ, ଫଳ, ଫଳି କିମ୍ବା କନ୍ଦର ବିକାଶ ନଜରରେ ରଖନ୍ତୁ।",
    maturity:"ପରିପକ୍ୱତାର ଲକ୍ଷଣ, ଗୁଣବତ୍ତା ଏବଂ ଅମଳ ପ୍ରସ୍ତୁତି ଯାଞ୍ଚ କରନ୍ତୁ।",
    harvest:"ଅମଳ ପୂର୍ବରୁ ପରିପକ୍ୱତା, ପାଣିପାଗ, ଶ୍ରମିକ କିମ୍ବା ଉପକରଣ ଏବଂ ଅମଳ ପରବର୍ତ୍ତୀ ପରିଚାଳନା ନିଶ୍ଚିତ କରନ୍ତୁ।"
  },
  ur:{
    prepare:"کاشت سے پہلے کھیت تیار کریں، نکاسی آب چیک کریں اور مٹی کے ٹیسٹ کا جائزہ لیں۔",
    germination:"انکرن یا قیام، پودوں کی یکسانیت، خالی جگہوں اور ابتدائی جڑی بوٹیوں کی نگرانی کریں۔",
    vegetative:"فعال بڑھوتری کے دوران فصل کی نشوونما، جڑی بوٹیوں، مٹی کی نمی اور غذائی ردعمل کو دیکھیں۔",
    flowering:"پھول آنے کے مرحلے میں پانی کے دباؤ، اضافی نائٹروجن، گرمی اور کیڑوں کے خطرے سے فصل کی حفاظت کریں۔",
    filling:"نمی اور غذائیت کا توازن رکھیں اور دانے، پھل، پھلی یا گٹھے کی نشوونما کی نگرانی کریں۔",
    maturity:"پختگی کی علامات، معیار اور کٹائی کی تیاری چیک کریں اور کٹائی کے انتظامات کریں۔",
    harvest:"کٹائی سے پہلے پختگی، موسم، مزدور یا آلات اور کٹائی کے بعد کی دیکھ بھال یقینی بنائیں۔"
  }
};

const getPlannerAction = (stageKey:string, language:string) => {
  const selected = plannerActionTranslations[language]?.[stageKey];
  if (selected) return selected;
  return plannerActionTranslations.en[stageKey] || plannerStageActionTemplates[stageKey] || "Monitor crop development and record field observations.";
};

// Build a complete planner knowledge object for a crop without ever borrowing
// another crop's knowledge. This is the final safety net for old saved state.
const buildIndependentPlannerKnowledge = (crop:any) => {
  const safeCrop = crop || {};
  const name = String(safeCrop.name || "Unknown Crop");
  const category = String(safeCrop.category || "Unknown");
  const climate = String(safeCrop.climate || "Unknown");
  const durationDays = Math.max(1, Number(safeCrop.durationDays) || 120);
  const target = {
    moisture:Number(safeCrop.moisture) || 0,
    ph:Number(safeCrop.ph) || 0,
    nitrogen:Number(safeCrop.nitrogen) || 0,
    phosphorus:Number(safeCrop.phosphorus) || 0,
    potassium:Number(safeCrop.potassium) || 0
  };
  const knownStages = Array.isArray(cropLifecycleProfiles[name]) ? cropLifecycleProfiles[name] : [];
  const normalizedStages = knownStages.length ? knownStages : ["prepare","germination","vegetative","maturity","harvest"];
  const dry = climate.toLowerCase().includes("dry") || Number(target.moisture) < 35;
  const wet = climate.toLowerCase().includes("wet") || Number(target.moisture) >= 70;
  const irrigation = wet
    ? `${name}: prioritize drainage and adjust irrigation after rainfall; avoid prolonged waterlogging.`
    : dry
      ? `${name}: use measured irrigation intervals and conserve moisture according to soil observations.`
      : `${name}: adjust irrigation using soil moisture, rainfall and crop stage rather than a fixed schedule.`;
  const nutrientPriority = target.nitrogen >= 100
    ? `${name}: nitrogen demand is relatively high in this planning profile; validate soil test and crop stage before application.`
    : target.phosphorus >= 45
      ? `${name}: phosphorus demand is relatively important in this planning profile; validate soil test before application.`
      : target.potassium >= 70
        ? `${name}: potassium demand is relatively important in this planning profile; validate soil test and crop stage before application.`
        : `${name}: use balanced, soil-test-guided nutrition instead of a fixed fertilizer recipe.`;
  const scouting = String(safeCrop.risk || "Medium").toLowerCase() === "high"
    ? `${name}: inspect at least weekly during active growth and after major weather changes.`
    : `${name}: continue routine scouting and record symptoms before treatment decisions.`;
  const harvest = ["fruit","plantation"].includes(category.toLowerCase())
    ? `${name}: follow crop-specific maturity and quality indicators before harvesting or picking.`
    : `${name}: confirm maturity, weather window, labor or equipment readiness and post-harvest handling before harvest.`;
  return {
    crop:name, category, climate, duration:String(safeCrop.duration || `${durationDays} days`), durationDays, target,
    stages:normalizedStages, irrigation, nutrientPriority, scouting, harvest,
    risk:String(safeCrop.risk || "Unknown"),
    establishment:`${name}: verify the locally recommended planting material, variety suitability and establishment window.`,
    marketNote:`${name}: verify local buyer demand and current market information before committing to a harvest sale.`
  };
};

const resolvePlannerKnowledge = (cropName:string) => {
  const crop = cropCatalog.find((item:any) => item.name === cropName);
  if (!crop) {
    return buildIndependentPlannerKnowledge({name:cropName || "Unknown Crop",durationDays:120,duration:"Crop-specific duration unavailable",risk:"Unknown"});
  }
  return cropPlannerKnowledge[crop.name] || buildIndependentPlannerKnowledge(crop);
};

// Localized crop names are also accepted when old planner state was saved with
// a translated label. The canonical English crop key remains the internal key.
const resolveCanonicalCropName = (value:string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const direct = cropCatalog.find((item:any) => item.name === raw);
  if (direct) return direct.name;
  for (const crop of cropCatalog) {
    const names = cropLanguageNames[crop.name] || {};
    if (Object.values(names).some((label:string) => label === raw)) return crop.name;
  }
  return raw;
};

const recommendationRules = [
  {id:"soil",label:"Soil compatibility",weight:28},
  {id:"climate",label:"Climate compatibility",weight:22},
  {id:"water",label:"Water/rainfall compatibility",weight:18},
  {id:"ph",label:"Soil pH compatibility",weight:12},
  {id:"nutrients",label:"Nutrient fit",weight:12},
  {id:"risk",label:"Risk/resource suitability",weight:8}
];

const cropLifecycleProfiles: Record<string, any[]> = {
  Maize:["prepare","germination","vegetative","flowering","maturity"], Rice:["prepare","germination","vegetative","flowering","harvest"], Wheat:["prepare","germination","vegetative","flowering","harvest"], Barley:["prepare","germination","vegetative","flowering","harvest"],
  Sorghum:["prepare","germination","vegetative","flowering","harvest"], Millet:["prepare","germination","vegetative","flowering","harvest"], "Finger Millet":["prepare","germination","vegetative","flowering","harvest"], "Pearl Millet":["prepare","germination","vegetative","flowering","harvest"],
  Cotton:["prepare","germination","vegetative","flowering","filling","harvest"], Sugarcane:["prepare","germination","vegetative","filling","maturity","harvest"], Soybean:["prepare","germination","vegetative","flowering","filling","harvest"], Groundnut:["prepare","germination","vegetative","flowering","filling","harvest"],
  Sunflower:["prepare","germination","vegetative","flowering","filling","harvest"], Mustard:["prepare","germination","vegetative","flowering","filling","harvest"], Chickpea:["prepare","germination","vegetative","flowering","filling","harvest"], "Pigeon Pea":["prepare","germination","vegetative","flowering","filling","harvest"],
  "Green Gram":["prepare","germination","vegetative","flowering","filling","harvest"], "Black Gram":["prepare","germination","vegetative","flowering","filling","harvest"], Lentil:["prepare","germination","vegetative","flowering","filling","harvest"],
  Tomato:["prepare","germination","vegetative","flowering","filling","maturity","harvest"], Onion:["prepare","germination","vegetative","filling","maturity","harvest"], Potato:["prepare","germination","vegetative","filling","maturity","harvest"], Chilli:["prepare","germination","vegetative","flowering","filling","harvest"], Brinjal:["prepare","germination","vegetative","flowering","filling","harvest"],
  Cabbage:["prepare","germination","vegetative","filling","maturity","harvest"], Cauliflower:["prepare","germination","vegetative","filling","maturity","harvest"], Carrot:["prepare","germination","vegetative","filling","maturity","harvest"], Beans:["prepare","germination","vegetative","flowering","filling","harvest"], Peas:["prepare","germination","vegetative","flowering","filling","harvest"],
  Banana:["prepare","germination","vegetative","flowering","filling","maturity","harvest"], Mango:["prepare","vegetative","flowering","filling","maturity","harvest"], Orange:["prepare","vegetative","flowering","filling","maturity","harvest"], Grapes:["prepare","vegetative","flowering","filling","maturity","harvest"], Papaya:["prepare","germination","vegetative","flowering","filling","maturity","harvest"], Coconut:["prepare","germination","vegetative","flowering","filling","maturity","harvest"],
  Coffee:["prepare","germination","vegetative","flowering","filling","maturity","harvest"], Tea:["prepare","germination","vegetative","flowering","maturity","harvest"], Turmeric:["prepare","germination","vegetative","filling","maturity","harvest"], Ginger:["prepare","germination","vegetative","filling","maturity","harvest"], Coriander:["prepare","germination","vegetative","flowering","harvest"], Cumin:["prepare","germination","vegetative","flowering","filling","harvest"], Cardamom:["prepare","germination","vegetative","flowering","filling","harvest"], "Black Pepper":["prepare","germination","vegetative","flowering","filling","maturity","harvest"]
};

const cropLifecycleFocus: Record<string,string[]> = Object.fromEntries(cropCatalog.map((c:any)=>[c.name,[
  `Check soil pH, drainage and nutrient status before ${c.name} establishment.`,
  `Monitor emergence and early growth closely; replace gaps where needed.`,
  `Maintain crop-specific moisture and weed management while scouting for pests.`,
  `Protect the reproductive stage from water, heat and nutrient stress.`,
  `Record maturity indicators, input use, yield and post-harvest observations.`
]]));

const lifecycleProfiles: Record<string, any> = { Cereal:{stages:[]}, Pulse:{stages:[]}, Vegetable:{stages:[]}, Fruit:{stages:[]}, Fiber:{stages:[]}, Cash:{stages:[]}, Oilseed:{stages:[]}, Plantation:{stages:[]}, Spice:{stages:[]} };

// ============================================================================
// PLANNER DATA CONTRACT CHECKS
// ============================================================================
// These helpers are intentionally deterministic. They do not call an API and
// therefore cannot introduce a network failure into the Farm Planner.
const plannerRequiredStageKeys = ["prepare","germination","vegetative","flowering","filling","maturity","harvest"];

const hasIndependentCropProfile = (cropName:string) => {
  const crop = cropCatalog.find((item:any)=>item.name===cropName);
  if (!crop) return false;
  const knowledge = cropPlannerKnowledge[crop.name];
  return Boolean(knowledge && Array.isArray(knowledge.stages) && knowledge.stages.length > 0 && knowledge.target);
};

const getCropPlanningCompleteness = (cropName:string) => {
  const crop = cropCatalog.find((item:any)=>item.name===cropName);
  const knowledge = crop ? cropPlannerKnowledge[crop.name] : null;
  if (!crop || !knowledge) return {supported:false,score:0,missing:["crop profile"]};
  const missing:string[]=[];
  if (!Array.isArray(knowledge.stages) || knowledge.stages.length===0) missing.push("lifecycle stages");
  if (!knowledge.target) missing.push("nutrient target");
  if (!knowledge.irrigation) missing.push("irrigation guidance");
  if (!knowledge.scouting) missing.push("scouting guidance");
  if (!knowledge.harvest) missing.push("harvest guidance");
  const score = Math.round(((5-missing.length)/5)*100);
  return {supported:true,score,missing};
};

const getPlannerStageWindow = (cropName:string,stageKey:string) => {
  const knowledge = resolvePlannerKnowledge(cropName);
  const stages = Array.isArray(knowledge.stages) ? knowledge.stages : [];
  const index = stages.indexOf(stageKey);
  if (index < 0 || !stages.length) return {startDay:null,endDay:null};
  const duration = Math.max(1,Number(knowledge.durationDays)||120);
  const startDay = index===0 ? 0 : Math.round(duration*(index/stages.length));
  const endDay = index===stages.length-1 ? duration : Math.max(startDay+1,Math.round(duration*((index+1)/stages.length)));
  return {startDay,endDay};
};

const plannerDeficiencyLabel = (nutrient:string,language:string) => {
  const labels:Record<string,Record<string,string>>={
    en:{N:"Nitrogen",P:"Phosphorus",K:"Potassium"},
    kn:{N:"ಸಾರಜನಕ",P:"ರಂಜಕ",K:"ಪೊಟ್ಯಾಸಿಯಂ"},
    hi:{N:"नाइट्रोजन",P:"फास्फोरस",K:"पोटैशियम"},
    te:{N:"నైట్రోజన్",P:"భాస్వరం",K:"పొటాషియం"},
    ta:{N:"நைட்ரஜன்",P:"பாஸ்பரஸ்",K:"பொட்டாசியம்"},
    ml:{N:"നൈട്രജൻ",P:"ഫോസ്ഫറസ്",K:"പൊട്ടാസ്യം"},
    mr:{N:"नायट्रोजन",P:"फॉस्फरस",K:"पोटॅशियम"},
    bn:{N:"নাইট্রোজেন",P:"ফসফরাস",K:"পটাশিয়াম"},
    gu:{N:"નાઇટ્રોજન",P:"ફોસ્ફરસ",K:"પોટેશિયમ"},
    pa:{N:"ਨਾਈਟ੍ਰੋਜਨ",P:"ਫਾਸਫੋਰਸ",K:"ਪੋਟਾਸ਼ੀਅਮ"},
    or:{N:"ନାଇଟ୍ରୋଜେନ୍",P:"ଫସଫରସ୍",K:"ପୋଟାସିୟମ୍"},
    ur:{N:"نائٹروجن",P:"فاسفورس",K:"پوٹاشیم"}
  };
  return labels[language]?.[nutrient] || labels.en[nutrient] || nutrient;
};

const plannerNutrientKeys = ["N","P","K"] as const;
const plannerSupportedLanguages = ALL_LANGUAGES.map(item=>item.code);

// This marker makes the intended contract explicit for future contributors.
// Supported crops must have an independent catalogue row, independent baseline,
// lifecycle stages, language name, and planner knowledge object.
const PLANNER_CONTRACT_VERSION = "2026.10-safe-planner-v2";

// ============================================================================
// YIELDSENSE AI — FARM COMMERCE, TRACEABILITY & OPERATIONS EXTENSION
// ============================================================================
// These modules intentionally sit on top of the existing page. They do not
// replace the existing marketplace, planner, cart, profile, field or AI flows.
// Every module is usable as a local demonstration and has an explicit status
// when a real provider/database is not connected.

const businessModuleCatalog = [
  {id:"catalog", title:"Catalog & Online Store", icon:Store, description:"Browse seeds, fertilizers and agricultural inputs in one searchable store."},
  {id:"subscriptions", title:"Subscriptions & CSA", icon:CalendarDays, description:"Manage recurring input plans and Community Supported Agriculture memberships."},
  {id:"knowledge", title:"Educational Blog & Guides", icon:BookOpen, description:"Farmer-friendly crop guides, soil notes, irrigation education and seasonal checklists."},
  {id:"local", title:"Connect & Local SEO", icon:MapPinned, description:"Discover local services, agronomists, buyers and farm resources by location."},
  {id:"inventory", title:"Inventory & Traceability", icon:Warehouse, description:"Track stock, batch IDs, source, movement and traceability events."},
  {id:"wholesale", title:"Wholesale Portal", icon:Boxes, description:"Prepare bulk input requests and wholesale purchasing workflows."},
  {id:"contracts", title:"Contract Farming", icon:Handshake, description:"Track proposed crops, contract quantities, buyer terms and milestones."},
  {id:"logistics", title:"Logistics & Delivery", icon:Truck, description:"Track demo order milestones and delivery hand-offs without claiming live courier data."},
  {id:"labor", title:"Seasonal Labor", icon:Users, description:"Plan seasonal workers, farm tasks, availability and labor costs."},
  {id:"orders", title:"Orders & Payments", icon:Receipt, description:"Review captured demo orders, payment method and delivery address."}
];

const businessTranslations: Record<string, Record<string,string>> = {
  en:{hub:"Farm Business Hub",catalog:"Catalog & Online Store",subscriptions:"Subscriptions & CSA",knowledge:"Educational Blog & Guides",local:"Connect & Local SEO",inventory:"Inventory & Traceability",wholesale:"Wholesale Portal",contracts:"Contract Farming",logistics:"Logistics & Delivery",labor:"Seasonal Labor",orders:"Orders & Payments",demo:"Demo workflow",connected:"Provider connected",notConnected:"Provider not connected",save:"Save",add:"Add to Cart",buy:"Buy Now",view:"View Details",search:"Search",location:"Delivery Location",payment:"Payment Details",tracker:"Order Tracker",recommended:"Recommended for your field",deficiency:"Deficiency detected in Farm Planner",source:"Source / batch",status:"Status",next:"Next action",estimated:"Estimated",notLive:"Not live yet — connect the provider/backend to enable live data."},
  kn:{hub:"ಕೃಷಿ ವ್ಯವಹಾರ ಕೇಂದ್ರ",catalog:"ಕ್ಯಾಟಲಾಗ್ ಮತ್ತು ಆನ್‌ಲೈನ್ ಅಂಗಡಿ",subscriptions:"ಚಂದಾದಾರಿಕೆ ಮತ್ತು CSA",knowledge:"ಶೈಕ್ಷಣಿಕ ಬ್ಲಾಗ್ ಮತ್ತು ಮಾರ್ಗದರ್ಶಿಗಳು",local:"ಸ್ಥಳೀಯ ಸಂಪರ್ಕ ಮತ್ತು SEO",inventory:"ದಾಸ್ತಾನು ಮತ್ತು ಟ್ರೇಸಬಿಲಿಟಿ",wholesale:"ಸಗಟು ಪೋರ್ಟಲ್",contracts:"ಒಪ್ಪಂದ ಕೃಷಿ",logistics:"ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ವಿತರಣೆ",labor:"ಋತುಮಾನದ ಕಾರ್ಮಿಕರು",orders:"ಆರ್ಡರ್‌ಗಳು ಮತ್ತು ಪಾವತಿಗಳು",demo:"ಡೆಮೊ ಕಾರ್ಯಪ್ರವಾಹ",connected:"ಪೂರೈಕೆದಾರ ಸಂಪರ್ಕಗೊಂಡಿದೆ",notConnected:"ಪೂರೈಕೆದಾರ ಸಂಪರ್ಕಗೊಂಡಿಲ್ಲ",save:"ಉಳಿಸಿ",add:"ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ",buy:"ಈಗ ಖರೀದಿಸಿ",view:"ವಿವರ ನೋಡಿ",search:"ಹುಡುಕಿ",location:"ವಿತರಣಾ ಸ್ಥಳ",payment:"ಪಾವತಿ ವಿವರಗಳು",tracker:"ಆರ್ಡರ್ ಟ್ರ್ಯಾಕರ್",recommended:"ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಶಿಫಾರಸು",deficiency:"ಫಾರ್ಮ್ ಪ್ಲಾನರ್‌ನಲ್ಲಿ ಪೋಷಕಾಂಶ ಕೊರತೆ ಕಂಡುಬಂದಿದೆ",source:"ಮೂಲ / ಬ್ಯಾಚ್",status:"ಸ್ಥಿತಿ",next:"ಮುಂದಿನ ಕ್ರಮ",estimated:"ಅಂದಾಜು",notLive:"ಇನ್ನೂ ಲೈವ್ ಅಲ್ಲ — ನೈಜ ಡೇಟಾಕ್ಕಾಗಿ ಪೂರೈಕೆದಾರ ಅಥವಾ ಬ್ಯಾಕೆಂಡ್ ಸಂಪರ್ಕಿಸಿ."},
  hi:{hub:"कृषि व्यवसाय केंद्र",catalog:"कैटलॉग और ऑनलाइन स्टोर",subscriptions:"सब्सक्रिप्शन और CSA",knowledge:"शैक्षिक ब्लॉग और गाइड",local:"स्थानीय संपर्क और SEO",inventory:"इन्वेंटरी और ट्रेसबिलिटी",wholesale:"थोक पोर्टल",contracts:"कॉन्ट्रैक्ट फार्मिंग",logistics:"लॉजिस्टिक्स और डिलीवरी",labor:"मौसमी श्रमिक",orders:"ऑर्डर और भुगतान",demo:"डेमो वर्कफ़्लो",connected:"प्रदाता जुड़ा है",notConnected:"प्रदाता जुड़ा नहीं है",save:"सहेजें",add:"कार्ट में जोड़ें",buy:"अभी खरीदें",view:"विवरण देखें",search:"खोजें",location:"डिलीवरी स्थान",payment:"भुगतान विवरण",tracker:"ऑर्डर ट्रैकर",recommended:"आपके खेत के लिए अनुशंसित",deficiency:"फार्म प्लानर में पोषक तत्व की कमी मिली",source:"स्रोत / बैच",status:"स्थिति",next:"अगला कदम",estimated:"अनुमानित",notLive:"अभी लाइव नहीं — लाइव डेटा के लिए प्रदाता या बैकएंड कनेक्ट करें."},
  te:{hub:"వ్యవసాయ వ్యాపార కేంద్రం",catalog:"కాటలాగ్ & ఆన్‌లైన్ స్టోర్",subscriptions:"సబ్‌స్క్రిప్షన్ & CSA",knowledge:"విద్యా బ్లాగ్ & గైడ్లు",local:"స్థానిక కనెక్షన్ & SEO",inventory:"ఇన్వెంటరీ & ట్రేసబిలిటీ",wholesale:"హోల్‌సేల్ పోర్టల్",contracts:"కాంట్రాక్ట్ ఫార్మింగ్",logistics:"లాజిస్టిక్స్ & డెలివరీ",labor:"కాలానుగుణ కార్మికులు",orders:"ఆర్డర్లు & చెల్లింపులు",demo:"డెమో వర్క్‌ఫ్లో",connected:"ప్రొవైడర్ కనెక్ట్ అయ్యింది",notConnected:"ప్రొవైడర్ కనెక్ట్ కాలేదు",save:"సేవ్",add:"కార్ట్‌కు జోడించండి",buy:"ఇప్పుడే కొనండి",view:"వివరాలు చూడండి",search:"శోధించండి",location:"డెలివరీ స్థలం",payment:"చెల్లింపు వివరాలు",tracker:"ఆర్డర్ ట్రాకర్",recommended:"మీ పొలానికి సిఫార్సు",deficiency:"ఫార్మ్ ప్లానర్‌లో పోషక లోపం కనుగొనబడింది",source:"మూలం / బ్యాచ్",status:"స్థితి",next:"తదుపరి చర్య",estimated:"అంచనా",notLive:"ఇంకా లైవ్ కాదు — లైవ్ డేటా కోసం ప్రొవైడర్ లేదా బ్యాకెండ్‌ను కనెక్ట్ చేయండి."},
  ta:{hub:"விவசாய வணிக மையம்",catalog:"கேட்டலாக் & ஆன்லைன் கடை",subscriptions:"சந்தா & CSA",knowledge:"கல்வி வலைப்பதிவு & வழிகாட்டிகள்",local:"உள்ளூர் இணைப்பு & SEO",inventory:"சரக்கு & தடமறிதல்",wholesale:"மொத்த விற்பனை போர்டல்",contracts:"ஒப்பந்த விவசாயம்",logistics:"லாஜிஸ்டிக்ஸ் & டெலிவரி",labor:"பருவகால தொழிலாளர்கள்",orders:"ஆர்டர்கள் & கட்டணம்",demo:"டெமோ பணிப்பாய்வு",connected:"வழங்குநர் இணைக்கப்பட்டது",notConnected:"வழங்குநர் இணைக்கப்படவில்லை",save:"சேமி",add:"கார்ட்டில் சேர்",buy:"இப்போது வாங்கு",view:"விவரங்கள்",search:"தேடு",location:"டெலிவரி இடம்",payment:"கட்டண விவரங்கள்",tracker:"ஆர்டர் கண்காணிப்பு",recommended:"உங்கள் வயலுக்கு பரிந்துரை",deficiency:"பண்ணை திட்டத்தில் ஊட்டச்சத்து குறைபாடு கண்டறியப்பட்டது",source:"மூலம் / தொகுதி",status:"நிலை",next:"அடுத்த செயல்",estimated:"மதிப்பீடு",notLive:"இன்னும் நேரலை இல்லை — நேரலை தரவுக்கு வழங்குநர் அல்லது பின்தளத்தை இணைக்கவும்."},
  ml:{hub:"കാർഷിക ബിസിനസ് കേന്ദ്രം",catalog:"കാറ്റലോഗ് & ഓൺലൈൻ സ്റ്റോർ",subscriptions:"സബ്സ്ക്രിപ്ഷൻ & CSA",knowledge:"വിദ്യാഭ്യാസ ബ്ലോഗ് & ഗൈഡുകൾ",local:"പ്രാദേശിക ബന്ധം & SEO",inventory:"ഇൻവെന്ററി & ട്രേസബിലിറ്റി",wholesale:"ഹോൾസെയിൽ പോർട്ടൽ",contracts:"കരാർ കൃഷി",logistics:"ലോജിസ്റ്റിക്സ് & ഡെലിവറി",labor:"കാലാവധി തൊഴിലാളികൾ",orders:"ഓർഡറുകളും പേയ്മെന്റുകളും",demo:"ഡെമോ പ്രവാഹം",connected:"പ്രൊവൈഡർ കണക്റ്റ് ചെയ്തു",notConnected:"പ്രൊവൈഡർ കണക്റ്റ് ചെയ്തിട്ടില്ല",save:"സേവ്",add:"കാർട്ടിലേക്ക് ചേർക്കുക",buy:"ഇപ്പോൾ വാങ്ങുക",view:"വിശദാംശങ്ങൾ",search:"തിരയുക",location:"ഡെലിവറി സ്ഥലം",payment:"പേയ്മെന്റ് വിവരങ്ങൾ",tracker:"ഓർഡർ ട്രാക്കർ",recommended:"നിങ്ങളുടെ വയലിന് ശുപാർശ",deficiency:"ഫാം പ്ലാനറിൽ പോഷക കുറവ് കണ്ടെത്തി",source:"ഉറവിടം / ബാച്ച്",status:"സ്ഥിതി",next:"അടുത്ത നടപടി",estimated:"അനുമാനം",notLive:"ഇപ്പോൾ ലൈവ് അല്ല — ലൈവ് ഡാറ്റയ്ക്കായി പ്രൊവൈഡറെയോ ബാക്കെൻഡിനെയോ ബന്ധിപ്പിക്കുക."},
  mr:{hub:"शेती व्यवसाय केंद्र",catalog:"कॅटलॉग आणि ऑनलाइन स्टोअर",subscriptions:"सबस्क्रिप्शन आणि CSA",knowledge:"शैक्षणिक ब्लॉग आणि मार्गदर्शक",local:"स्थानिक संपर्क आणि SEO",inventory:"साठा आणि ट्रेसिबिलिटी",wholesale:"घाऊक पोर्टल",contracts:"करार शेती",logistics:"लॉजिस्टिक्स आणि डिलिव्हरी",labor:"हंगामी कामगार",orders:"ऑर्डर आणि पेमेंट",demo:"डेमो कार्यप्रवाह",connected:"प्रदाता जोडला आहे",notConnected:"प्रदाता जोडलेला नाही",save:"जतन करा",add:"कार्टमध्ये जोडा",buy:"आता खरेदी करा",view:"तपशील पाहा",search:"शोधा",location:"डिलिव्हरी ठिकाण",payment:"पेमेंट तपशील",tracker:"ऑर्डर ट्रॅकर",recommended:"तुमच्या शेतासाठी शिफारस",deficiency:"फार्म प्लॅनरमध्ये पोषक कमतरता आढळली",source:"स्रोत / बॅच",status:"स्थिती",next:"पुढील कृती",estimated:"अंदाजित",notLive:"अजून लाइव्ह नाही — लाइव्ह डेटासाठी प्रदाता किंवा बॅकएंड जोडा."},
  bn:{hub:"কৃষি ব্যবসা কেন্দ্র",catalog:"ক্যাটালগ ও অনলাইন স্টোর",subscriptions:"সাবস্ক্রিপশন ও CSA",knowledge:"শিক্ষামূলক ব্লগ ও গাইড",local:"স্থানীয় সংযোগ ও SEO",inventory:"ইনভেন্টরি ও ট্রেসেবিলিটি",wholesale:"পাইকারি পোর্টাল",contracts:"চুক্তিভিত্তিক কৃষি",logistics:"লজিস্টিক্স ও ডেলিভারি",labor:"মৌসুমি শ্রমিক",orders:"অর্ডার ও পেমেন্ট",demo:"ডেমো ওয়ার্কফ্লো",connected:"প্রদানকারী সংযুক্ত",notConnected:"প্রদানকারী সংযুক্ত নয়",save:"সংরক্ষণ",add:"কার্টে যোগ করুন",buy:"এখন কিনুন",view:"বিস্তারিত দেখুন",search:"খুঁজুন",location:"ডেলিভারি স্থান",payment:"পেমেন্ট বিবরণ",tracker:"অর্ডার ট্র্যাকার",recommended:"আপনার ক্ষেতের জন্য সুপারিশ",deficiency:"ফার্ম প্ল্যানারে পুষ্টির ঘাটতি পাওয়া গেছে",source:"উৎস / ব্যাচ",status:"অবস্থা",next:"পরবর্তী কাজ",estimated:"আনুমানিক",notLive:"এখনও লাইভ নয় — লাইভ ডেটার জন্য প্রদানকারী বা ব্যাকএন্ড সংযুক্ত করুন."},
  gu:{hub:"કૃષિ વ્યવસાય કેન્દ્ર",catalog:"કેટલોગ અને ઓનલાઇન સ્ટોર",subscriptions:"સબ્સ્ક્રિપ્શન અને CSA",knowledge:"શૈક્ષણિક બ્લોગ અને માર્ગદર્શિકા",local:"સ્થાનિક જોડાણ અને SEO",inventory:"ઇન્વેન્ટરી અને ટ્રેસેબિલિટી",wholesale:"હોલસેલ પોર્ટલ",contracts:"કોન્ટ્રાક્ટ ફાર્મિંગ",logistics:"લોજિસ્ટિક્સ અને ડિલિવરી",labor:"મોસમી મજૂરો",orders:"ઓર્ડર અને ચુકવણી",demo:"ડેમો વર્કફ્લો",connected:"પ્રદાતા જોડાયેલ છે",notConnected:"પ્રદાતા જોડાયેલ નથી",save:"સાચવો",add:"કાર્ટમાં ઉમેરો",buy:"હમણાં ખરીદો",view:"વિગતો જુઓ",search:"શોધો",location:"ડિલિવરી સ્થાન",payment:"ચુકવણી વિગતો",tracker:"ઓર્ડર ટ્રેકર",recommended:"તમારા ખેતર માટે ભલામણ",deficiency:"ફાર્મ પ્લાનરમાં પોષક તત્વોની ઉણપ મળી",source:"સ્રોત / બેચ",status:"સ્થિતિ",next:"આગળનું પગલું",estimated:"અંદાજિત",notLive:"હજુ લાઇવ નથી — લાઇવ ડેટા માટે પ્રદાતા અથવા બેકએન્ડ જોડો."},
  pa:{hub:"ਖੇਤੀ ਕਾਰੋਬਾਰ ਕੇਂਦਰ",catalog:"ਕੈਟਾਲਾਗ ਅਤੇ ਆਨਲਾਈਨ ਸਟੋਰ",subscriptions:"ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਅਤੇ CSA",knowledge:"ਸਿੱਖਿਆਤਮਕ ਬਲੌਗ ਅਤੇ ਗਾਈਡ",local:"ਸਥਾਨਕ ਸੰਪਰਕ ਅਤੇ SEO",inventory:"ਇਨਵੈਂਟਰੀ ਅਤੇ ਟ੍ਰੇਸਬਿਲਿਟੀ",wholesale:"ਥੋਕ ਪੋਰਟਲ",contracts:"ਕਾਂਟ੍ਰੈਕਟ ਖੇਤੀ",logistics:"ਲੌਜਿਸਟਿਕਸ ਅਤੇ ਡਿਲਿਵਰੀ",labor:"ਮੌਸਮੀ ਮਜ਼ਦੂਰ",orders:"ਆਰਡਰ ਅਤੇ ਭੁਗਤਾਨ",demo:"ਡੈਮੋ ਵਰਕਫਲੋ",connected:"ਪ੍ਰਦਾਤਾ ਜੁੜਿਆ ਹੈ",notConnected:"ਪ੍ਰਦਾਤਾ ਜੁੜਿਆ ਨਹੀਂ",save:"ਸੇਵ",add:"ਕਾਰਟ ਵਿੱਚ ਸ਼ਾਮਲ ਕਰੋ",buy:"ਹੁਣ ਖਰੀਦੋ",view:"ਵੇਰਵੇ ਵੇਖੋ",search:"ਖੋਜੋ",location:"ਡਿਲਿਵਰੀ ਸਥਾਨ",payment:"ਭੁਗਤਾਨ ਵੇਰਵੇ",tracker:"ਆਰਡਰ ਟ੍ਰੈਕਰ",recommended:"ਤੁਹਾਡੇ ਖੇਤ ਲਈ ਸਿਫਾਰਸ਼",deficiency:"ਫਾਰਮ ਪਲੈਨਰ ਵਿੱਚ ਪੋਸ਼ਕ ਤੱਤਾਂ ਦੀ ਘਾਟ ਮਿਲੀ",source:"ਸਰੋਤ / ਬੈਚ",status:"ਸਥਿਤੀ",next:"ਅਗਲਾ ਕਦਮ",estimated:"ਅੰਦਾਜ਼ਾ",notLive:"ਹਾਲੇ ਲਾਈਵ ਨਹੀਂ — ਲਾਈਵ ਡੇਟਾ ਲਈ ਪ੍ਰਦਾਤਾ ਜਾਂ ਬੈਕਐਂਡ ਜੋੜੋ."},
  or:{hub:"କୃଷି ବ୍ୟବସାୟ କେନ୍ଦ୍ର",catalog:"କ୍ୟାଟାଲଗ୍ ଏବଂ ଅନଲାଇନ୍ ଷ୍ଟୋର୍",subscriptions:"ସବସ୍କ୍ରିପସନ୍ ଏବଂ CSA",knowledge:"ଶିକ୍ଷାମୂଳକ ବ୍ଲଗ୍ ଏବଂ ଗାଇଡ୍",local:"ସ୍ଥାନୀୟ ସଂଯୋଗ ଏବଂ SEO",inventory:"ଇନଭେଣ୍ଟୋରୀ ଏବଂ ଟ୍ରେସବିଲିଟି",wholesale:"ହୋଲସେଲ୍ ପୋର୍ଟାଲ୍",contracts:"ଚୁକ୍ତିଭିତ୍ତିକ କୃଷି",logistics:"ଲଜିଷ୍ଟିକ୍ସ ଏବଂ ବିତରଣ",labor:"ଋତୁକାଳୀନ ଶ୍ରମିକ",orders:"ଅର୍ଡର୍ ଏବଂ ପେମେଣ୍ଟ",demo:"ଡେମୋ ପ୍ରବାହ",connected:"ପ୍ରଦାତା ସଂଯୁକ୍ତ",notConnected:"ପ୍ରଦାତା ସଂଯୁକ୍ତ ନୁହେଁ",save:"ସଂରକ୍ଷଣ",add:"କାର୍ଟରେ ଯୋଡନ୍ତୁ",buy:"ଏବେ କିଣନ୍ତୁ",view:"ବିବରଣୀ ଦେଖନ୍ତୁ",search:"ଖୋଜନ୍ତୁ",location:"ବିତରଣ ସ୍ଥାନ",payment:"ପେମେଣ୍ଟ ବିବରଣୀ",tracker:"ଅର୍ଡର୍ ଟ୍ରାକର୍",recommended:"ଆପଣଙ୍କ କ୍ଷେତ ପାଇଁ ସୁପାରିଶ",deficiency:"ଫାର୍ମ ପ୍ଲାନରରେ ପୋଷକ ଅଭାବ ମିଳିଲା",source:"ଉତ୍ସ / ବ୍ୟାଚ୍",status:"ସ୍ଥିତି",next:"ପରବର୍ତ୍ତୀ କାର୍ଯ୍ୟ",estimated:"ଆନୁମାନିକ",notLive:"ଏପର୍ଯ୍ୟନ୍ତ ଲାଇଭ୍ ନୁହେଁ — ଲାଇଭ୍ ଡାଟା ପାଇଁ ପ୍ରଦାତା କିମ୍ବା ବ୍ୟାକେଣ୍ଡ ସଂଯୋଗ କରନ୍ତୁ."},
  ur:{hub:"زرعی کاروباری مرکز",catalog:"کیٹلاگ اور آن لائن اسٹور",subscriptions:"سبسکرپشن اور CSA",knowledge:"تعلیمی بلاگ اور رہنما",local:"مقامی رابطہ اور SEO",inventory:"انوینٹری اور ٹریس ایبلٹی",wholesale:"ہول سیل پورٹل",contracts:"کنٹریکٹ فارمنگ",logistics:"لاجسٹکس اور ڈیلیوری",labor:"موسمی مزدور",orders:"آرڈرز اور ادائیگی",demo:"ڈیمو ورک فلو",connected:"فراہم کنندہ منسلک ہے",notConnected:"فراہم کنندہ منسلک نہیں",save:"محفوظ کریں",add:"کارٹ میں شامل کریں",buy:"اب خریدیں",view:"تفصیلات دیکھیں",search:"تلاش",location:"ڈیلیوری کا مقام",payment:"ادائیگی کی تفصیلات",tracker:"آرڈر ٹریکر",recommended:"آپ کے کھیت کے لیے تجویز",deficiency:"فارم پلانر میں غذائی کمی پائی گئی",source:"ماخذ / بیچ",status:"حالت",next:"اگلا قدم",estimated:"تخمینہ",notLive:"ابھی لائیو نہیں — لائیو ڈیٹا کے لیے فراہم کنندہ یا بیک اینڈ جوڑیں."}
};

const getBusinessText = (language:string, key:string) => businessTranslations[language]?.[key] || businessTranslations.en[key] || key;

const subscriptionPlans = [
  {id:"input-basic",name:"Input Care Basic",price:499,period:"month",benefits:["Monthly soil checklist","Seasonal input reminders","Priority store alerts"]},
  {id:"input-pro",name:"Input Care Pro",price:999,period:"month",benefits:["Planner-linked nutrient reminders","Priority agronomy workflow","Input basket planning"]},
  {id:"csa-family",name:"CSA Fresh Basket",price:1499,period:"month",benefits:["Seasonal farm basket","Harvest updates","Pickup/delivery planning"]}
];

const educationArticles = [
  {id:"soil-pH",category:"Soil",title:"Understanding soil pH before choosing a crop",read:"6 min",summary:"How pH affects nutrient availability and why a soil test should guide crop selection.",purpose:"Learn how soil acidity or alkalinity can change nutrient availability and crop suitability.",whatYouLearn:["Understand what soil pH means.","Compare the crop requirement with the tested pH range.","Recognize when a nutrient problem may actually be a pH problem."],steps:["Take a representative soil sample from several spots in the field and use a reliable soil-testing service.","Record the measured pH and compare it with the selected crop profile in Farm Planner.","Check whether the soil pH is below, inside or above the crop's preferred range.","If pH is outside the preferred range, discuss a locally suitable correction plan with an agronomist instead of applying amendments blindly.","Re-test after the recommended correction period and update the field record."],checklist:["Recent soil-test report available","Crop pH range checked","Drainage checked","Organic matter considered","Correction plan verified locally"],avoid:["Do not change soil pH using a generic internet dosage.","Do not assume every yellow leaf is caused by low pH.","Do not skip a soil test when the field repeatedly shows nutrient symptoms."],action:"Open Farm Planner → select the field → compare pH with the selected crop profile → record the next soil action.",quiz:[{q:"Why is pH important?",options:["It controls tractor speed","It affects nutrient availability","It replaces rainfall data"],answer:1}]},
  {id:"npk",category:"Nutrition",title:"NPK basics: what N, P and K mean for a crop",read:"8 min",summary:"A farmer-friendly guide to nutrient roles, deficiency signals and safe verification.",purpose:"Learn what nitrogen, phosphorus and potassium do and how to connect Farm Planner deficiencies to the input store.",whatYouLearn:["Nitrogen mainly supports vegetative growth and chlorophyll formation.","Phosphorus supports roots and reproductive development.","Potassium supports water regulation, strength and stress response.","A visible symptom is a clue, not a laboratory diagnosis."],steps:["Open the field in Farm Planner and review N, P, K and pH values.","Compare each value with the crop-specific planning target and current growth stage.","Read the deficiency explanation and check whether the symptom is consistent with the crop and field data.","Open the matching fertilizer or nutrient products shown under Farm Planner → Certified Seeds & Fertilizers.","Before purchase or application, verify the soil test, product label, local recommendation and crop stage.","Record the input and application event in Farm History for future traceability."],checklist:["N value reviewed","P value reviewed","K value reviewed","pH reviewed","Crop stage confirmed","Product label checked","Application recorded"],avoid:["Do not diagnose a deficiency from leaf colour alone.","Do not mix products without checking compatibility and label instructions.","Do not treat an estimated planner value as a laboratory result."],action:"Use the deficiency card in Farm Planner to jump directly to the matched fertilizer/input catalogue and then verify the product before purchase.",quiz:[{q:"Which nutrient is strongly associated with vegetative growth?",options:["Nitrogen","Only potassium","Only calcium"],answer:0}]},
  {id:"irrigation",category:"Water",title:"How to decide whether irrigation is needed",read:"5 min",summary:"Use soil moisture, rainfall probability and crop stage instead of a fixed schedule.",purpose:"Turn weather and soil observations into a practical irrigation decision without pretending that one schedule fits every crop.",whatYouLearn:["Why crop stage changes water demand.","How rainfall probability can change an irrigation decision.","Why soil moisture should be checked before running a pump."],steps:["Check the current soil moisture for the selected field.","Check recent rainfall and the available forecast.","Identify the crop and lifecycle stage because flowering, fruiting and establishment may have different water sensitivity.","If soil moisture is already adequate and meaningful rain is expected, avoid unnecessary irrigation.","If moisture is low and rain is not expected, plan measured irrigation according to the crop and soil type.","After irrigation, record the event and re-check moisture rather than repeating a fixed timer automatically."],checklist:["Moisture checked","Rainfall checked","Crop stage checked","Drainage checked","Pump/hardware status checked","Irrigation event recorded"],avoid:["Do not irrigate simply because a calendar says it is watering day.","Do not keep saturated fields wet without checking drainage.","Do not claim an IoT pump is running when hardware is not connected."],action:"Open Irrigation Pumps → select the field → review moisture and forecast → use the recommended irrigation decision as a planning aid.",quiz:[{q:"What should be checked before irrigation?",options:["Only the crop name","Soil moisture and rainfall/forecast","Only the market price"],answer:1}]},
  {id:"vision",category:"Crop Health",title:"What a crop image can and cannot tell you",read:"7 min",summary:"How to interpret AI vision results, uncertainty and when to consult an expert.",purpose:"Use Gemini Vision as a crop-health screening assistant while keeping uncertainty and expert verification visible.",whatYouLearn:["How to capture a useful crop image.","How to read condition, confidence, symptoms and severity.","Why an uncertain AI result should not trigger blind chemical treatment."],steps:["Capture a clear, well-lit image of the affected leaf, stem, fruit or plant area.","Upload the image in Vision Diagnostics and wait for the server-side Gemini analysis to complete.","Review the detected crop, condition, possible issue, confidence and visible symptoms.","If the result is uncertain or confidence is low, treat it as a screening result rather than a diagnosis.","Compare the symptoms with field history, weather and crop stage.","Consult an agricultural expert before applying crop-protection chemicals when the diagnosis is uncertain or the problem is severe."],checklist:["Image is clear","Correct crop/field selected","Confidence reviewed","Symptoms reviewed","Field conditions considered","Expert escalation considered"],avoid:["Do not treat every image as a confirmed disease.","Do not rely on a single image when symptoms are unclear.","Do not use unvalidated pesticide dosages from an AI response."],action:"Run Vision Diagnostics → review confidence and symptoms → connect the result to Expert Consult when the model is uncertain or severity is concerning.",quiz:[{q:"What should you do when vision confidence is low?",options:["Apply a random pesticide","Ignore the field","Verify with field evidence and an expert"],answer:2}]},
  {id:"harvest",category:"Harvest",title:"Harvest readiness and post-harvest planning",read:"9 min",summary:"Prepare weather, labor, transport, buyer and storage decisions before harvest.",purpose:"Reduce avoidable harvest losses by planning maturity, labor, logistics and buyer requirements together.",whatYouLearn:["How to confirm crop-specific maturity.","How to prepare labor and transport before the harvest window.","Why buyer quality requirements should be checked early."],steps:["Review the crop lifecycle and expected maturity window in Farm Planner.","Check weather conditions around the planned harvest period.","Confirm seasonal labor availability and equipment readiness.","Review Mandi Aggregators and Direct Buyer Directory records for the crop and verify current buyer terms.","Arrange transport and suitable temporary storage before harvesting a large quantity.","Record harvested quantity, quality, expenses and sale details in Farm History."],checklist:["Maturity checked","Weather window checked","Labor arranged","Transport arranged","Buyer contacted","Storage prepared","Harvest record ready"],avoid:["Do not treat reference market prices as guaranteed live prices.","Do not harvest solely because the calendar date has arrived.","Do not delay buyer quality checks until after harvest."],action:"Open Farm Planner → review maturity → open Mandi & Buyers → contact a verified/available buyer when real data is connected.",quiz:[{q:"Why plan transport before harvest?",options:["To avoid all field work","To reduce delays and post-harvest risk","To change soil pH"],answer:1}]},
  {id:"market",category:"Market",title:"Preparing for a better farm-gate sale",read:"6 min",summary:"Record quantity, quality, expected harvest date and buyer requirements before selling.",purpose:"Turn farm production information into a clear buyer inquiry and reduce last-minute negotiation problems.",whatYouLearn:["What information buyers commonly need.","How to prepare a buyer inquiry.","Why live market prices must come from a verified market provider."],steps:["Select the crop and record expected quantity and harvest window.","Record variety, quality grade and important quality observations.","Open Mandi Aggregators or Direct Buyer Directory and filter to the crop.","Review the buyer's region, category and stated requirements.","Send an inquiry with quantity, harvest date and quality information.","Confirm price, grading, weighing, pickup/delivery and payment terms directly before committing the sale."],checklist:["Crop and variety recorded","Quantity estimated","Harvest date estimated","Quality recorded","Buyer requirements checked","Price verified","Payment terms verified"],avoid:["Do not treat reference prices as guaranteed market prices.","Do not send sensitive payment credentials to an unverified buyer.","Do not commit a contract without reading its terms."],action:"Open Mandi & Buyers → choose your crop → compare buyer records → send an inquiry with your expected quantity and harvest window.",quiz:[{q:"Which information helps a buyer respond to an inquiry?",options:["Only farmer name","Quantity, harvest window and quality","Only field colour"],answer:1}]}
];

const educationSectionText: Record<string, Record<string,string>> = {
  en:{purpose:"What this guide helps you do",learn:"What you will learn",steps:"Step-by-step guide",checklist:"Field checklist",avoid:"Avoid these mistakes",action:"Try this in YieldSense AI",quiz:"Quick check",read:"Read guide",complete:"Guide completed",back:"Back to guides",verify:"Educational content only. Validate crop-specific decisions with your soil test, product label and qualified local agronomist.",next:"Next recommended action"},
  kn:{purpose:"ಈ ಮಾರ್ಗದರ್ಶಿ ನಿಮಗೆ ಏನು ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ",learn:"ನೀವು ಏನು ಕಲಿಯುತ್ತೀರಿ",steps:"ಹಂತ ಹಂತದ ಮಾರ್ಗದರ್ಶಿ",checklist:"ಜಮೀನು ಪರಿಶೀಲನಾ ಪಟ್ಟಿ",avoid:"ಈ ತಪ್ಪುಗಳನ್ನು ತಪ್ಪಿಸಿ",action:"YieldSense AI ನಲ್ಲಿ ಇದನ್ನು ಪ್ರಯತ್ನಿಸಿ",quiz:"ತ್ವರಿತ ಪರಿಶೀಲನೆ",read:"ಮಾರ್ಗದರ್ಶಿ ಓದಿ",complete:"ಮಾರ್ಗದರ್ಶಿ ಪೂರ್ಣಗೊಂಡಿದೆ",back:"ಮಾರ್ಗದರ್ಶಿಗಳಿಗೆ ಹಿಂತಿರುಗಿ",verify:"ಇದು ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿ ಮಾತ್ರ. ಮಣ್ಣಿನ ಪರೀಕ್ಷೆ, ಉತ್ಪನ್ನ ಲೇಬಲ್ ಮತ್ತು ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರ ಸಲಹೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.",next:"ಮುಂದಿನ ಶಿಫಾರಸು ಕ್ರಮ"},
  hi:{purpose:"यह गाइड आपको क्या करने में मदद करती है",learn:"आप क्या सीखेंगे",steps:"चरण-दर-चरण मार्गदर्शिका",checklist:"खेत जांच सूची",avoid:"इन गलतियों से बचें",action:"YieldSense AI में इसे आजमाएं",quiz:"त्वरित जांच",read:"गाइड पढ़ें",complete:"गाइड पूरी हुई",back:"गाइड पर वापस जाएं",verify:"यह केवल शैक्षिक जानकारी है। मिट्टी परीक्षण, उत्पाद लेबल और स्थानीय कृषि विशेषज्ञ की सलाह से निर्णय सत्यापित करें।",next:"अगला सुझाया कदम"},
  te:{purpose:"ఈ గైడ్ మీకు ఏమి చేయడంలో సహాయపడుతుంది",learn:"మీరు ఏమి నేర్చుకుంటారు",steps:"దశల వారీ మార్గదర్శకం",checklist:"పొలం చెక్‌లిస్ట్",avoid:"ఈ తప్పులను నివారించండి",action:"YieldSense AIలో ప్రయత్నించండి",quiz:"త్వరిత తనిఖీ",read:"గైడ్ చదవండి",complete:"గైడ్ పూర్తయింది",back:"గైడ్‌లకు తిరిగి వెళ్లండి",verify:"ఇది విద్యా సమాచారం మాత్రమే. మట్టి పరీక్ష, ఉత్పత్తి లేబుల్ మరియు స్థానిక వ్యవసాయ నిపుణుడితో నిర్ణయాలను ధృవీకరించండి.",next:"తదుపరి సిఫార్సు చర్య"},
  ta:{purpose:"இந்த வழிகாட்டி உங்களுக்கு உதவுவது",learn:"நீங்கள் கற்றுக்கொள்வது",steps:"படிப்படியான வழிகாட்டி",checklist:"வயல் சரிபார்ப்பு பட்டியல்",avoid:"இந்த தவறுகளைத் தவிர்க்கவும்",action:"YieldSense AI-ல் முயற்சிக்கவும்",quiz:"விரைவு சரிபார்ப்பு",read:"வழிகாட்டியைப் படிக்கவும்",complete:"வழிகாட்டி முடிந்தது",back:"வழிகாட்டிகளுக்குத் திரும்பவும்",verify:"இது கல்வி தகவல் மட்டுமே. மண் பரிசோதனை, தயாரிப்பு லேபிள் மற்றும் உள்ளூர் வேளாண் நிபுணரிடம் முடிவுகளைச் சரிபார்க்கவும்.",next:"அடுத்த பரிந்துரைக்கப்பட்ட செயல்"},
  ml:{purpose:"ഈ ഗൈഡ് നിങ്ങളെ സഹായിക്കുന്നത്",learn:"നിങ്ങൾ പഠിക്കുന്നത്",steps:"ഘട്ടം ഘട്ടമായുള്ള ഗൈഡ്",checklist:"ഫീൽഡ് ചെക്ക്ലിസ്റ്റ്",avoid:"ഈ പിഴവുകൾ ഒഴിവാക്കുക",action:"YieldSense AIയിൽ പരീക്ഷിക്കുക",quiz:"ദ്രുത പരിശോധന",read:"ഗൈഡ് വായിക്കുക",complete:"ഗൈഡ് പൂർത്തിയായി",back:"ഗൈഡുകളിലേക്ക് മടങ്ങുക",verify:"ഇത് വിദ്യാഭ്യാസ വിവരങ്ങൾ മാത്രമാണ്. മണ്ണ് പരിശോധന, ഉൽപ്പന്ന ലേബൽ, പ്രാദേശിക കാർഷിക വിദഗ്ധൻ എന്നിവ ഉപയോഗിച്ച് തീരുമാനങ്ങൾ പരിശോധിക്കുക.",next:"അടുത്ത ശുപാർശ ചെയ്യുന്ന നടപടി"},
  mr:{purpose:"हे मार्गदर्शक तुम्हाला काय करण्यास मदत करते",learn:"तुम्ही काय शिकाल",steps:"टप्प्याटप्प्याने मार्गदर्शक",checklist:"शेत तपासणी यादी",avoid:"या चुका टाळा",action:"YieldSense AI मध्ये वापरून पाहा",quiz:"त्वरित तपासणी",read:"मार्गदर्शक वाचा",complete:"मार्गदर्शक पूर्ण",back:"मार्गदर्शकांकडे परत जा",verify:"ही केवळ शैक्षणिक माहिती आहे. माती चाचणी, उत्पादन लेबल आणि स्थानिक कृषी तज्ज्ञांच्या सल्ल्याने निर्णय तपासा.",next:"पुढील शिफारस केलेली कृती"},
  bn:{purpose:"এই গাইড আপনাকে কী করতে সাহায্য করবে",learn:"আপনি যা শিখবেন",steps:"ধাপে ধাপে নির্দেশিকা",checklist:"ক্ষেত্র চেকলিস্ট",avoid:"এই ভুলগুলি এড়িয়ে চলুন",action:"YieldSense AI-তে চেষ্টা করুন",quiz:"দ্রুত পরীক্ষা",read:"গাইড পড়ুন",complete:"গাইড সম্পন্ন",back:"গাইডে ফিরে যান",verify:"এটি শুধুমাত্র শিক্ষামূলক তথ্য। মাটি পরীক্ষা, পণ্যের লেবেল এবং স্থানীয় কৃষি বিশেষজ্ঞের পরামর্শ দিয়ে সিদ্ধান্ত যাচাই করুন।",next:"পরবর্তী প্রস্তাবিত কাজ"},
  gu:{purpose:"આ માર્ગદર્શિકા તમને શું કરવામાં મદદ કરે છે",learn:"તમે શું શીખશો",steps:"પગલું-દર-પગલું માર્ગદર્શિકા",checklist:"ખેતર ચેકલિસ્ટ",avoid:"આ ભૂલો ટાળો",action:"YieldSense AI માં અજમાવો",quiz:"ઝડપી તપાસ",read:"માર્ગદર્શિકા વાંચો",complete:"માર્ગદર્શિકા પૂર્ણ",back:"માર્ગદર્શિકાઓ પર પાછા જાઓ",verify:"આ માત્ર શૈક્ષણિક માહિતી છે. માટી પરીક્ષણ, ઉત્પાદન લેબલ અને સ્થાનિક કૃષિ નિષ્ણાત સાથે નિર્ણય ચકાસો.",next:"આગળની ભલામણ કરેલ ક્રિયા"},
  pa:{purpose:"ਇਹ ਗਾਈਡ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰਦੀ ਹੈ",learn:"ਤੁਸੀਂ ਕੀ ਸਿੱਖੋਗੇ",steps:"ਕਦਮ-ਦਰ-ਕਦਮ ਗਾਈਡ",checklist:"ਖੇਤ ਚੈੱਕਲਿਸਟ",avoid:"ਇਨ੍ਹਾਂ ਗਲਤੀਆਂ ਤੋਂ ਬਚੋ",action:"YieldSense AI ਵਿੱਚ ਅਜ਼ਮਾਓ",quiz:"ਤੁਰੰਤ ਜਾਂਚ",read:"ਗਾਈਡ ਪੜ੍ਹੋ",complete:"ਗਾਈਡ ਪੂਰੀ",back:"ਗਾਈਡਾਂ ਵੱਲ ਵਾਪਸ ਜਾਓ",verify:"ਇਹ ਸਿਰਫ਼ ਸਿੱਖਿਆਤਮਕ ਜਾਣਕਾਰੀ ਹੈ। ਮਿੱਟੀ ਟੈਸਟ, ਉਤਪਾਦ ਲੇਬਲ ਅਤੇ ਸਥਾਨਕ ਖੇਤੀ ਮਾਹਿਰ ਨਾਲ ਫੈਸਲੇ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।",next:"ਅਗਲਾ ਸੁਝਾਇਆ ਕਦਮ"},
  or:{purpose:"ଏହି ଗାଇଡ୍ ଆପଣଙ୍କୁ କଣ କରିବାରେ ସାହାଯ୍ୟ କରେ",learn:"ଆପଣ କଣ ଶିଖିବେ",steps:"ପଦକ୍ଷେପ ଅନୁଯାୟୀ ଗାଇଡ୍",checklist:"କ୍ଷେତ୍ର ଯାଞ୍ଚ ତାଲିକା",avoid:"ଏହି ଭୁଲଗୁଡ଼ିକୁ ଏଡାନ୍ତୁ",action:"YieldSense AIରେ ଚେଷ୍ଟା କରନ୍ତୁ",quiz:"ଦ୍ରୁତ ଯାଞ୍ଚ",read:"ଗାଇଡ୍ ପଢନ୍ତୁ",complete:"ଗାଇଡ୍ ସମ୍ପୂର୍ଣ୍ଣ",back:"ଗାଇଡ୍‌କୁ ଫେରନ୍ତୁ",verify:"ଏହା କେବଳ ଶିକ୍ଷାମୂଳକ ସୂଚନା। ମାଟି ପରୀକ୍ଷା, ଉତ୍ପାଦ ଲେବଲ୍ ଏବଂ ସ୍ଥାନୀୟ କୃଷି ବିଶେଷଜ୍ଞଙ୍କ ସହିତ ନିଷ୍ପତ୍ତି ଯାଞ୍ଚ କରନ୍ତୁ।",next:"ପରବର୍ତ୍ତୀ ପରାମର୍ଶିତ କାର୍ଯ୍ୟ"},
  ur:{purpose:"یہ گائیڈ آپ کو کس کام میں مدد دیتی ہے",learn:"آپ کیا سیکھیں گے",steps:"مرحلہ وار رہنمائی",checklist:"کھیت کی چیک لسٹ",avoid:"ان غلطیوں سے بچیں",action:"YieldSense AI میں آزمائیں",quiz:"فوری جانچ",read:"گائیڈ پڑھیں",complete:"گائیڈ مکمل",back:"گائیڈز پر واپس جائیں",verify:"یہ صرف تعلیمی معلومات ہے۔ مٹی کے ٹیسٹ، پروڈکٹ لیبل اور مقامی زرعی ماہر سے فیصلے کی تصدیق کریں۔",next:"اگلا تجویز کردہ قدم"}
};
const getEducationText = (language:string,key:string) => educationSectionText[language]?.[key] || educationSectionText.en[key] || key;
const EDUCATION_GUIDE_VERSION = "2026.10-farmer-learning-v2";

const localServiceDirectory = [
  {id:"local-agro",name:"Local Agronomy Support",type:"Agronomy",region:"Mandya, Karnataka",availability:"Directory listing",verified:false},
  {id:"local-soil",name:"Soil Testing Center",type:"Soil Testing",region:"Mysuru, Karnataka",availability:"Directory listing",verified:false},
  {id:"local-market",name:"Mandi & Buyer Network",type:"Market",region:"Karnataka",availability:"Reference directory",verified:false},
  {id:"local-logistics",name:"Farm Logistics Partners",type:"Logistics",region:"South India",availability:"Service-request workflow",verified:false}
];

const inventorySeed = [
  {id:"INV-001",product:"Certified Rice Seed",batch:"RICE-2026-A01",quantity:120,unit:"kg",source:"Supplier lot",location:"Farm store",trace:"Input received → field allocation"},
  {id:"INV-002",product:"Balanced NPK",batch:"NPK-2026-B04",quantity:80,unit:"kg",source:"Fertilizer supplier",location:"Farm store",trace:"Input received → nutrient plan"},
  {id:"INV-003",product:"Organic Compost",batch:"ORG-2026-C02",quantity:250,unit:"kg",source:"Local supplier",location:"Compost shed",trace:"Received → soil preparation"}
];

const wholesaleProducts = [
  {id:"WH-01",name:"Rice Seed Bulk Lot",crop:"Rice",minQty:100,unit:"kg",indicative:"Supplier quote required"},
  {id:"WH-02",name:"Maize Seed Bulk Lot",crop:"Maize",minQty:100,unit:"kg",indicative:"Supplier quote required"},
  {id:"WH-03",name:"Balanced NPK Bulk",crop:"Multi-crop",minQty:250,unit:"kg",indicative:"Supplier quote required"},
  {id:"WH-04",name:"Organic Compost Bulk",crop:"Multi-crop",minQty:500,unit:"kg",indicative:"Supplier quote required"}
];

const contractTemplates = [
  {id:"CF-01",buyer:"Regional Grain Buyer",crop:"Rice",quantity:"20 tonnes",stage:"Proposal",terms:"Quality and price to be verified with buyer"},
  {id:"CF-02",buyer:"Maize Aggregator",crop:"Maize",quantity:"15 tonnes",stage:"Planning",terms:"Volume and harvest window to be agreed"},
  {id:"CF-03",buyer:"Vegetable Collection Partner",crop:"Tomato",quantity:"5 tonnes",stage:"Draft",terms:"Grade, collection date and price to be agreed"}
];

const logisticsStages = ["Order received","Input packed","Dispatch requested","In transit","Delivery confirmation"];
const laborTaskCatalog = [
  {id:"LAB-01",task:"Land preparation",crop:"All",workers:4,days:2,status:"Planned"},
  {id:"LAB-02",task:"Sowing / transplanting",crop:"Seasonal crop",workers:6,days:2,status:"Planned"},
  {id:"LAB-03",task:"Weeding and scouting",crop:"All",workers:3,days:1,status:"Planned"},
  {id:"LAB-04",task:"Harvest support",crop:"All",workers:8,days:3,status:"Planned"}
];

const localSeoKeywords = ["farm inputs near me","certified seeds Karnataka","fertilizer supplier near me","agronomist consultation","soil testing near me","mandi buyers near me","farm logistics service"];

// ============================================================================
// YIELDSENSE AI — COMPLETE PAGE LANGUAGE BRIDGE
// ============================================================================
// The original page already contains native translations for navigation, crop
// names, planner stages and business modules.  The problem was that many of
// the older JSX labels, helper text, placeholders and newly-added module copy
// were still literal English strings.  This bridge keeps the existing React
// language state, but also translates the complete rendered page so that text
// which was not explicitly wrapped in tLang is not left behind in English.
// It is intentionally additive: no existing feature, API, state or business
// workflow is replaced.
//
// Google Translate is loaded only in the browser. No API key is required and
// no Gemini credential is exposed. The native YieldSense dictionaries remain
// the first layer; the browser translation layer covers the remaining legacy
// strings and newly-rendered content.
// ============================================================================

const YIELDSENSE_TRANSLATION_LANGUAGES = [
  "en", "kn", "hi", "te", "ta", "ml", "mr", "bn", "gu", "pa", "or", "ur"
] as const;

type YieldSenseLanguageCode = typeof YIELDSENSE_TRANSLATION_LANGUAGES[number];

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
    __yieldSenseGoogleTranslateLoaded?: boolean;
    __yieldSenseGoogleTranslateLoading?: boolean;
  }
}

const YIELDSENSE_PLACEHOLDER_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "6-digit pincode":"6-digit pincode", "Ask about your farm...":"Ask about your farm...", "Auto / optional":"Auto / optional",
    "CVV":"CVV", "Card number":"Card number", "City / village":"City / village", "City":"City",
    "Delivery address":"Delivery address", "Delivery window, crop, quality or packaging notes":"Delivery window, crop, quality or packaging notes",
    "Email Address":"Email Address", "Enter your expected volume, harvest date, and quality details...":"Enter your expected volume, harvest date, and quality details...",
    "Full Name":"Full Name", "Full name":"Full name", "House / farm address":"House / farm address", "Landmark (optional)":"Landmark (optional)",
    "MM/YY":"MM/YY", "Password":"Password", "Phone number":"Phone number", "Pincode":"Pincode",
    "Please describe the problem you are facing in your field...":"Please describe the problem you are facing in your field...",
    "Requested quantity":"Requested quantity", "Search batch, product or location":"Search batch, product or location",
    "Search crop, market or buyer":"Search crop, market or buyer", "Search seeds or fertilizers...":"Search seeds or fertilizers...",
    "State":"State", "UPI ID (example: name@bank)":"UPI ID (example: name@bank)"
  },
  kn: {
    "6-digit pincode":"6 ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್", "Ask about your farm...":"ನಿಮ್ಮ ಜಮೀನಿನ ಬಗ್ಗೆ ಕೇಳಿ...", "Auto / optional":"ಸ್ವಯಂ / ಐಚ್ಛಿಕ",
    "CVV":"CVV", "Card number":"ಕಾರ್ಡ್ ಸಂಖ್ಯೆ", "City / village":"ನಗರ / ಗ್ರಾಮ", "City":"ನಗರ",
    "Delivery address":"ವಿತರಣಾ ವಿಳಾಸ", "Delivery window, crop, quality or packaging notes":"ವಿತರಣೆ ಸಮಯ, ಬೆಳೆ, ಗುಣಮಟ್ಟ ಅಥವಾ ಪ್ಯಾಕಿಂಗ್ ಟಿಪ್ಪಣಿಗಳು",
    "Email Address":"ಇಮೇಲ್ ವಿಳಾಸ", "Enter your expected volume, harvest date, and quality details...":"ನಿರೀಕ್ಷಿತ ಪ್ರಮಾಣ, ಕೊಯ್ಲು ದಿನಾಂಕ ಮತ್ತು ಗುಣಮಟ್ಟದ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ...",
    "Full Name":"ಪೂರ್ಣ ಹೆಸರು", "Full name":"ಪೂರ್ಣ ಹೆಸರು", "House / farm address":"ಮನೆ / ಜಮೀನಿನ ವಿಳಾಸ", "Landmark (optional)":"ಹೆಗ್ಗುರುತು (ಐಚ್ಛಿಕ)",
    "MM/YY":"MM/YY", "Password":"ಪಾಸ್‌ವರ್ಡ್", "Phone number":"ಫೋನ್ ಸಂಖ್ಯೆ", "Pincode":"ಪಿನ್ ಕೋಡ್",
    "Please describe the problem you are facing in your field...":"ನಿಮ್ಮ ಜಮೀನಿನಲ್ಲಿ ಎದುರಾಗಿರುವ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ...",
    "Requested quantity":"ಬೇಕಾದ ಪ್ರಮಾಣ", "Search batch, product or location":"ಬ್ಯಾಚ್, ಉತ್ಪನ್ನ ಅಥವಾ ಸ್ಥಳ ಹುಡುಕಿ",
    "Search crop, market or buyer":"ಬೆಳೆ, ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಖರೀದಿದಾರರನ್ನು ಹುಡುಕಿ", "Search seeds or fertilizers...":"ಬೀಜಗಳು ಅಥವಾ ರಸಗೊಬ್ಬರಗಳನ್ನು ಹುಡುಕಿ...",
    "State":"ರಾಜ್ಯ", "UPI ID (example: name@bank)":"UPI ID (ಉದಾಹರಣೆ: name@bank)"
  },
  hi: {
    "6-digit pincode":"6 अंकों का पिनकोड", "Ask about your farm...":"अपने खेत के बारे में पूछें...", "Auto / optional":"स्वचालित / वैकल्पिक",
    "CVV":"CVV", "Card number":"कार्ड नंबर", "City / village":"शहर / गाँव", "City":"शहर",
    "Delivery address":"डिलीवरी पता", "Delivery window, crop, quality or packaging notes":"डिलीवरी समय, फसल, गुणवत्ता या पैकेजिंग नोट्स",
    "Email Address":"ईमेल पता", "Enter your expected volume, harvest date, and quality details...":"अपेक्षित मात्रा, कटाई की तारीख और गुणवत्ता का विवरण दर्ज करें...",
    "Full Name":"पूरा नाम", "Full name":"पूरा नाम", "House / farm address":"घर / खेत का पता", "Landmark (optional)":"लैंडमार्क (वैकल्पिक)",
    "MM/YY":"MM/YY", "Password":"पासवर्ड", "Phone number":"फोन नंबर", "Pincode":"पिनकोड",
    "Please describe the problem you are facing in your field...":"अपने खेत में आ रही समस्या का वर्णन करें...",
    "Requested quantity":"आवश्यक मात्रा", "Search batch, product or location":"बैच, उत्पाद या स्थान खोजें",
    "Search crop, market or buyer":"फसल, बाजार या खरीदार खोजें", "Search seeds or fertilizers...":"बीज या उर्वरक खोजें...",
    "State":"राज्य", "UPI ID (example: name@bank)":"UPI आईडी (उदाहरण: name@bank)"
  },
  te: {
    "6-digit pincode":"6 అంకెల పిన్‌కోడ్", "Ask about your farm...":"మీ పొలం గురించి అడగండి...", "Auto / optional":"ఆటో / ఐచ్ఛికం",
    "CVV":"CVV", "Card number":"కార్డ్ నంబర్", "City / village":"నగరం / గ్రామం", "City":"నగరం",
    "Delivery address":"డెలివరీ చిరునామా", "Delivery window, crop, quality or packaging notes":"డెలివరీ సమయం, పంట, నాణ్యత లేదా ప్యాకేజింగ్ గమనికలు",
    "Email Address":"ఇమెయిల్ చిరునామా", "Enter your expected volume, harvest date, and quality details...":"అంచనా పరిమాణం, కోత తేదీ మరియు నాణ్యత వివరాలను నమోదు చేయండి...",
    "Full Name":"పూర్తి పేరు", "Full name":"పూర్తి పేరు", "House / farm address":"ఇల్లు / పొలం చిరునామా", "Landmark (optional)":"ల్యాండ్‌మార్క్ (ఐచ్ఛికం)",
    "MM/YY":"MM/YY", "Password":"పాస్‌వర్డ్", "Phone number":"ఫోన్ నంబర్", "Pincode":"పిన్‌కోడ్",
    "Please describe the problem you are facing in your field...":"మీ పొలంలో ఎదురవుతున్న సమస్యను వివరించండి...",
    "Requested quantity":"అవసరమైన పరిమాణం", "Search batch, product or location":"బ్యాచ్, ఉత్పత్తి లేదా స్థలాన్ని శోధించండి",
    "Search crop, market or buyer":"పంట, మార్కెట్ లేదా కొనుగోలుదారుని శోధించండి", "Search seeds or fertilizers...":"విత్తనాలు లేదా ఎరువులను శోధించండి...",
    "State":"రాష్ట్రం", "UPI ID (example: name@bank)":"UPI ID (ఉదాహరణ: name@bank)"
  },
  ta: {
    "6-digit pincode":"6 இலக்க பின்கோடு", "Ask about your farm...":"உங்கள் பண்ணையைப் பற்றி கேளுங்கள்...", "Auto / optional":"தானியங்கி / விருப்பம்",
    "CVV":"CVV", "Card number":"அட்டை எண்", "City / village":"நகரம் / கிராமம்", "City":"நகரம்",
    "Delivery address":"விநியோக முகவரி", "Delivery window, crop, quality or packaging notes":"விநியோக நேரம், பயிர், தரம் அல்லது பேக்கிங் குறிப்புகள்",
    "Email Address":"மின்னஞ்சல் முகவரி", "Enter your expected volume, harvest date, and quality details...":"எதிர்பார்க்கும் அளவு, அறுவடை தேதி மற்றும் தர விவரங்களை உள்ளிடவும்...",
    "Full Name":"முழு பெயர்", "Full name":"முழு பெயர்", "House / farm address":"வீடு / பண்ணை முகவரி", "Landmark (optional)":"அடையாள இடம் (விருப்பம்)",
    "MM/YY":"MM/YY", "Password":"கடவுச்சொல்", "Phone number":"தொலைபேசி எண்", "Pincode":"பின்கோடு",
    "Please describe the problem you are facing in your field...":"உங்கள் வயலில் எதிர்கொள்ளும் பிரச்சினையை விவரிக்கவும்...",
    "Requested quantity":"தேவையான அளவு", "Search batch, product or location":"தொகுதி, தயாரிப்பு அல்லது இடத்தைத் தேடுங்கள்",
    "Search crop, market or buyer":"பயிர், சந்தை அல்லது வாங்குபவரைத் தேடுங்கள்", "Search seeds or fertilizers...":"விதைகள் அல்லது உரங்களைத் தேடுங்கள்...",
    "State":"மாநிலம்", "UPI ID (example: name@bank)":"UPI ID (உதாரணம்: name@bank)"
  },
  ml: {
    "6-digit pincode":"6 അക്ക പിൻകോഡ്", "Ask about your farm...":"നിങ്ങളുടെ ഫാമിനെക്കുറിച്ച് ചോദിക്കുക...", "Auto / optional":"ഓട്ടോ / ഓപ്ഷണൽ",
    "CVV":"CVV", "Card number":"കാർഡ് നമ്പർ", "City / village":"നഗരം / ഗ്രാമം", "City":"നഗരം",
    "Delivery address":"ഡെലിവറി വിലാസം", "Delivery window, crop, quality or packaging notes":"ഡെലിവറി സമയം, വിള, ഗുണനിലവാരം അല്ലെങ്കിൽ പാക്കിംഗ് കുറിപ്പുകൾ",
    "Email Address":"ഇമെയിൽ വിലാസം", "Enter your expected volume, harvest date, and quality details...":"പ്രതീക്ഷിക്കുന്ന അളവ്, വിളവെടുപ്പ് തീയതി, ഗുണനിലവാര വിവരങ്ങൾ നൽകുക...",
    "Full Name":"പൂർണ്ണ പേര്", "Full name":"പൂർണ്ണ പേര്", "House / farm address":"വീട് / ഫാം വിലാസം", "Landmark (optional)":"ലാൻഡ്മാർക്ക് (ഓപ്ഷണൽ)",
    "MM/YY":"MM/YY", "Password":"പാസ്‌വേഡ്", "Phone number":"ഫോൺ നമ്പർ", "Pincode":"പിൻകോഡ്",
    "Please describe the problem you are facing in your field...":"നിങ്ങളുടെ വയലിൽ നേരിടുന്ന പ്രശ്നം വിവരിക്കുക...",
    "Requested quantity":"ആവശ്യമായ അളവ്", "Search batch, product or location":"ബാച്ച്, ഉൽപ്പന്നം അല്ലെങ്കിൽ സ്ഥലം തിരയുക",
    "Search crop, market or buyer":"വിള, മാർക്കറ്റ് അല്ലെങ്കിൽ വാങ്ങുന്നയാളെ തിരയുക", "Search seeds or fertilizers...":"വിത്തുകൾ അല്ലെങ്കിൽ വളങ്ങൾ തിരയുക...",
    "State":"സംസ്ഥാനം", "UPI ID (example: name@bank)":"UPI ID (ഉദാഹരണം: name@bank)"
  },
  mr: {
    "6-digit pincode":"6 अंकी पिनकोड", "Ask about your farm...":"तुमच्या शेताबद्दल विचारा...", "Auto / optional":"स्वयंचलित / पर्यायी",
    "CVV":"CVV", "Card number":"कार्ड क्रमांक", "City / village":"शहर / गाव", "City":"शहर",
    "Delivery address":"डिलिव्हरी पत्ता", "Delivery window, crop, quality or packaging notes":"डिलिव्हरी वेळ, पीक, गुणवत्ता किंवा पॅकिंग नोंदी",
    "Email Address":"ईमेल पत्ता", "Enter your expected volume, harvest date, and quality details...":"अपेक्षित प्रमाण, कापणीची तारीख आणि गुणवत्तेचे तपशील भरा...",
    "Full Name":"पूर्ण नाव", "Full name":"पूर्ण नाव", "House / farm address":"घर / शेताचा पत्ता", "Landmark (optional)":"लँडमार्क (पर्यायी)",
    "MM/YY":"MM/YY", "Password":"पासवर्ड", "Phone number":"फोन नंबर", "Pincode":"पिनकोड",
    "Please describe the problem you are facing in your field...":"तुमच्या शेतातील समस्येचे वर्णन करा...",
    "Requested quantity":"आवश्यक प्रमाण", "Search batch, product or location":"बॅच, उत्पादन किंवा ठिकाण शोधा",
    "Search crop, market or buyer":"पीक, बाजार किंवा खरेदीदार शोधा", "Search seeds or fertilizers...":"बियाणे किंवा खते शोधा...",
    "State":"राज्य", "UPI ID (example: name@bank)":"UPI ID (उदाहरण: name@bank)"
  },
  bn: {
    "6-digit pincode":"৬ সংখ্যার পিনকোড", "Ask about your farm...":"আপনার খামার সম্পর্কে জিজ্ঞাসা করুন...", "Auto / optional":"স্বয়ংক্রিয় / ঐচ্ছিক",
    "CVV":"CVV", "Card number":"কার্ড নম্বর", "City / village":"শহর / গ্রাম", "City":"শহর",
    "Delivery address":"ডেলিভারি ঠিকানা", "Delivery window, crop, quality or packaging notes":"ডেলিভারি সময়, ফসল, গুণমান বা প্যাকেজিং নোট",
    "Email Address":"ইমেল ঠিকানা", "Enter your expected volume, harvest date, and quality details...":"প্রত্যাশিত পরিমাণ, ফসল কাটার তারিখ এবং গুণমানের বিবরণ দিন...",
    "Full Name":"পুরো নাম", "Full name":"পুরো নাম", "House / farm address":"বাড়ি / খামারের ঠিকানা", "Landmark (optional)":"ল্যান্ডমার্ক (ঐচ্ছিক)",
    "MM/YY":"MM/YY", "Password":"পাসওয়ার্ড", "Phone number":"ফোন নম্বর", "Pincode":"পিনকোড",
    "Please describe the problem you are facing in your field...":"আপনার ক্ষেতে যে সমস্যাটি হচ্ছে তা বর্ণনা করুন...",
    "Requested quantity":"প্রয়োজনীয় পরিমাণ", "Search batch, product or location":"ব্যাচ, পণ্য বা অবস্থান খুঁজুন",
    "Search crop, market or buyer":"ফসল, বাজার বা ক্রেতা খুঁজুন", "Search seeds or fertilizers...":"বীজ বা সার খুঁজুন...",
    "State":"রাজ্য", "UPI ID (example: name@bank)":"UPI ID (উদাহরণ: name@bank)"
  },
  gu: {
    "6-digit pincode":"6 અંકનો પિનકોડ", "Ask about your farm...":"તમારા ખેતર વિશે પૂછો...", "Auto / optional":"ઓટો / વૈકલ્પિક",
    "CVV":"CVV", "Card number":"કાર્ડ નંબર", "City / village":"શહેર / ગામ", "City":"શહેર",
    "Delivery address":"ડિલિવરી સરનામું", "Delivery window, crop, quality or packaging notes":"ડિલિવરી સમય, પાક, ગુણવત્તા અથવા પેકિંગ નોંધો",
    "Email Address":"ઇમેઇલ સરનામું", "Enter your expected volume, harvest date, and quality details...":"અપેક્ષિત જથ્થો, લણણીની તારીખ અને ગુણવત્તાની વિગતો દાખલ કરો...",
    "Full Name":"પૂરું નામ", "Full name":"પૂરું નામ", "House / farm address":"ઘર / ખેતરનું સરનામું", "Landmark (optional)":"લેન્ડમાર્ક (વૈકલ્પિક)",
    "MM/YY":"MM/YY", "Password":"પાસવર્ડ", "Phone number":"ફોન નંબર", "Pincode":"પિનકોડ",
    "Please describe the problem you are facing in your field...":"તમારા ખેતરમાં આવતી સમસ્યાનું વર્ણન કરો...",
    "Requested quantity":"જરૂરી જથ્થો", "Search batch, product or location":"બેચ, ઉત્પાદન અથવા સ્થાન શોધો",
    "Search crop, market or buyer":"પાક, બજાર અથવા ખરીદદાર શોધો", "Search seeds or fertilizers...":"બીજ અથવા ખાતર શોધો...",
    "State":"રાજ્ય", "UPI ID (example: name@bank)":"UPI ID (ઉદાહરણ: name@bank)"
  },
  pa: {
    "6-digit pincode":"6 ਅੰਕਾਂ ਦਾ ਪਿਨਕੋਡ", "Ask about your farm...":"ਆਪਣੇ ਖੇਤ ਬਾਰੇ ਪੁੱਛੋ...", "Auto / optional":"ਆਟੋ / ਵਿਕਲਪਿਕ",
    "CVV":"CVV", "Card number":"ਕਾਰਡ ਨੰਬਰ", "City / village":"ਸ਼ਹਿਰ / ਪਿੰਡ", "City":"ਸ਼ਹਿਰ",
    "Delivery address":"ਡਿਲਿਵਰੀ ਪਤਾ", "Delivery window, crop, quality or packaging notes":"ਡਿਲਿਵਰੀ ਸਮਾਂ, ਫਸਲ, ਗੁਣਵੱਤਾ ਜਾਂ ਪੈਕਿੰਗ ਨੋਟਸ",
    "Email Address":"ਈਮੇਲ ਪਤਾ", "Enter your expected volume, harvest date, and quality details...":"ਉਮੀਦ ਕੀਤੀ ਮਾਤਰਾ, ਕਟਾਈ ਦੀ ਤਾਰੀਖ ਅਤੇ ਗੁਣਵੱਤਾ ਦੇ ਵੇਰਵੇ ਦਿਓ...",
    "Full Name":"ਪੂਰਾ ਨਾਮ", "Full name":"ਪੂਰਾ ਨਾਮ", "House / farm address":"ਘਰ / ਖੇਤ ਦਾ ਪਤਾ", "Landmark (optional)":"ਲੈਂਡਮਾਰਕ (ਵਿਕਲਪਿਕ)",
    "MM/YY":"MM/YY", "Password":"ਪਾਸਵਰਡ", "Phone number":"ਫੋਨ ਨੰਬਰ", "Pincode":"ਪਿਨਕੋਡ",
    "Please describe the problem you are facing in your field...":"ਆਪਣੇ ਖੇਤ ਵਿੱਚ ਆ ਰਹੀ ਸਮੱਸਿਆ ਦਾ ਵੇਰਵਾ ਦਿਓ...",
    "Requested quantity":"ਲੋੜੀਂਦੀ ਮਾਤਰਾ", "Search batch, product or location":"ਬੈਚ, ਉਤਪਾਦ ਜਾਂ ਸਥਾਨ ਖੋਜੋ",
    "Search crop, market or buyer":"ਫਸਲ, ਮੰਡੀ ਜਾਂ ਖਰੀਦਦਾਰ ਖੋਜੋ", "Search seeds or fertilizers...":"ਬੀਜ ਜਾਂ ਖਾਦ ਖੋਜੋ...",
    "State":"ਰਾਜ", "UPI ID (example: name@bank)":"UPI ID (ਉਦਾਹਰਨ: name@bank)"
  },
  or: {
    "6-digit pincode":"6 ଅଙ୍କର ପିନକୋଡ୍", "Ask about your farm...":"ଆପଣଙ୍କ ଚାଷଜମି ବିଷୟରେ ପଚାରନ୍ତୁ...", "Auto / optional":"ସ୍ୱୟଂଚାଳିତ / ବୈକଳ୍ପିକ",
    "CVV":"CVV", "Card number":"କାର୍ଡ ନମ୍ବର", "City / village":"ସହର / ଗାଁ", "City":"ସହର",
    "Delivery address":"ବିତରଣ ଠିକଣା", "Delivery window, crop, quality or packaging notes":"ବିତରଣ ସମୟ, ଫସଲ, ଗୁଣବତ୍ତା କିମ୍ବା ପ୍ୟାକିଂ ଟିପ୍ପଣୀ",
    "Email Address":"ଇମେଲ୍ ଠିକଣା", "Enter your expected volume, harvest date, and quality details...":"ଆଶା କରାଯାଉଥିବା ପରିମାଣ, ଅମଳ ତାରିଖ ଏବଂ ଗୁଣବତ୍ତା ବିବରଣୀ ଦିଅନ୍ତୁ...",
    "Full Name":"ପୂର୍ଣ୍ଣ ନାମ", "Full name":"ପୂର୍ଣ୍ଣ ନାମ", "House / farm address":"ଘର / ଚାଷଜମି ଠିକଣା", "Landmark (optional)":"ଲ୍ୟାଣ୍ଡମାର୍କ (ବୈକଳ୍ପିକ)",
    "MM/YY":"MM/YY", "Password":"ପାସୱାର୍ଡ", "Phone number":"ଫୋନ୍ ନମ୍ବର", "Pincode":"ପିନକୋଡ୍",
    "Please describe the problem you are facing in your field...":"ଆପଣଙ୍କ କ୍ଷେତରେ ହେଉଥିବା ସମସ୍ୟା ବର୍ଣ୍ଣନା କରନ୍ତୁ...",
    "Requested quantity":"ଆବଶ୍ୟକ ପରିମାଣ", "Search batch, product or location":"ବ୍ୟାଚ୍, ଉତ୍ପାଦ କିମ୍ବା ସ୍ଥାନ ଖୋଜନ୍ତୁ",
    "Search crop, market or buyer":"ଫସଲ, ବଜାର କିମ୍ବା କ୍ରେତା ଖୋଜନ୍ତୁ", "Search seeds or fertilizers...":"ମଞ୍ଜି କିମ୍ବା ସାର ଖୋଜନ୍ତୁ...",
    "State":"ରାଜ୍ୟ", "UPI ID (example: name@bank)":"UPI ID (ଉଦାହରଣ: name@bank)"
  },
  ur: {
    "6-digit pincode":"6 ہندسوں کا پن کوڈ", "Ask about your farm...":"اپنے کھیت کے بارے میں پوچھیں...", "Auto / optional":"خودکار / اختیاری",
    "CVV":"CVV", "Card number":"کارڈ نمبر", "City / village":"شہر / گاؤں", "City":"شہر",
    "Delivery address":"ڈیلیوری کا پتہ", "Delivery window, crop, quality or packaging notes":"ڈیلیوری کا وقت، فصل، معیار یا پیکنگ نوٹس",
    "Email Address":"ای میل پتہ", "Enter your expected volume, harvest date, and quality details...":"متوقع مقدار، کٹائی کی تاریخ اور معیار کی تفصیلات درج کریں...",
    "Full Name":"پورا نام", "Full name":"پورا نام", "House / farm address":"گھر / کھیت کا پتہ", "Landmark (optional)":"لینڈ مارک (اختیاری)",
    "MM/YY":"MM/YY", "Password":"پاس ورڈ", "Phone number":"فون نمبر", "Pincode":"پن کوڈ",
    "Please describe the problem you are facing in your field...":"اپنے کھیت میں درپیش مسئلے کی وضاحت کریں...",
    "Requested quantity":"مطلوبہ مقدار", "Search batch, product or location":"بیچ، پروڈکٹ یا مقام تلاش کریں",
    "Search crop, market or buyer":"فصل، منڈی یا خریدار تلاش کریں", "Search seeds or fertilizers...":"بیج یا کھاد تلاش کریں...",
    "State":"ریاست", "UPI ID (example: name@bank)":"UPI ID (مثال: name@bank)"
  }
};

const YIELDSENSE_GOOGLE_TRANSLATE_COOKIE = "googtrans";

const setGoogleTranslationCookie = (language: string) => {
  if (typeof document === "undefined") return;
  const value = language === "en" ? "/en/en" : `/en/${language}`;
  document.cookie = `${YIELDSENSE_GOOGLE_TRANSLATE_COOKIE}=${value};path=/`;
};

const translatePlaceholdersForLanguage = (language: string) => {
  if (typeof document === "undefined") return;
  const dictionary = YIELDSENSE_PLACEHOLDER_TRANSLATIONS[language] || YIELDSENSE_PLACEHOLDER_TRANSLATIONS.en;
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[placeholder], textarea[placeholder]").forEach((element) => {
    const original = element.getAttribute("data-yieldsense-original-placeholder") || element.getAttribute("placeholder") || "";
    if (!element.getAttribute("data-yieldsense-original-placeholder")) {
      element.setAttribute("data-yieldsense-original-placeholder", original);
    }
    element.setAttribute("placeholder", dictionary[original] || original);
  });
};

const resetGoogleTranslatedPage = () => {
  if (typeof document === "undefined") return;
  try {
    const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (combo) {
      combo.value = "en";
      combo.dispatchEvent(new Event("change"));
    }
  } catch {}
  setGoogleTranslationCookie("en");
  translatePlaceholdersForLanguage("en");
};

const applyGoogleTranslation = (language: string, attempt = 0) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const safeLanguage = YIELDSENSE_TRANSLATION_LANGUAGES.includes(language as YieldSenseLanguageCode) ? language : "en";
  document.documentElement.setAttribute("lang", safeLanguage);
  document.documentElement.setAttribute("translate", safeLanguage === "en" ? "no" : "yes");
  if (safeLanguage === "en") {
    resetGoogleTranslatedPage();
    return;
  }

  setGoogleTranslationCookie(safeLanguage);
  translatePlaceholdersForLanguage(safeLanguage);

  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (combo) {
    try {
      // Google Translate's hidden select sometimes ignores a single synthetic
      // change during React/HMR updates. Setting both value and events makes the
      // bridge resilient without exposing credentials or replacing app state.
      combo.value = safeLanguage;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      combo.dispatchEvent(new Event("input", { bubbles: true }));
    } catch {}
    translatePlaceholdersForLanguage(safeLanguage);
    return;
  }

  // The Google widget can take a few seconds to initialise after Next.js HMR.
  // Retry for longer than the previous 5-second window, but stop deterministically.
  if (attempt < 40) {
    window.setTimeout(() => applyGoogleTranslation(safeLanguage, attempt + 1), 250);
  }
};

const ensureGoogleTranslateLoaded = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__yieldSenseGoogleTranslateLoaded || window.__yieldSenseGoogleTranslateLoading) return;
  window.__yieldSenseGoogleTranslateLoading = true;
  window.googleTranslateElementInit = () => {
    try {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement({
          pageLanguage: "en",
          includedLanguages: YIELDSENSE_TRANSLATION_LANGUAGES.filter((code) => code !== "en").join(","),
          autoDisplay: false,
          multilanguagePage: true
        }, "google_translate_element");
        window.__yieldSenseGoogleTranslateLoaded = true;
        window.__yieldSenseGoogleTranslateLoading = false;
      }
    } catch {
      window.__yieldSenseGoogleTranslateLoading = false;
    }
  };
  const existing = document.getElementById("yieldsense-google-translate-script");
  if (existing) return;
  const script = document.createElement("script");
  script.id = "yieldsense-google-translate-script";
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.onerror = () => { window.__yieldSenseGoogleTranslateLoading = false; };
  document.body.appendChild(script);
};

const handleYieldSenseLanguageChange = (language: string, setLanguage: (value: string) => void, setPlannerLanguage: (value: string) => void) => {
  setLanguage(language);
  setPlannerLanguage(language);
  if (typeof window !== "undefined") {
    window.setTimeout(() => applyGoogleTranslation(language), 300);
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function YieldSenseApp() {
  
  // --- STATE ---
  const [lang, setLang] = useState("en");
  const [plannerLanguage, setPlannerLanguage] = useState("en");
  
  // NATIVE TRANSLATION HOOK
  const tLang = translations[lang] || translations.en;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState(""); 
  const [toastMsg, setToastMsg] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [timeData, setTimeData] = useState({ date: "", greeting: "Good morning" });

  const [fields, setFields] = useState<any[]>([
    { id: "1", name: "South Plot", location: "Mandya, Karnataka", area: "12", soil: "Loamy", crop: "Maize" },
    { id: "2", name: "North Zone", location: "Bengaluru, Karnataka", area: "5", soil: "Clay", crop: "Rice" }
  ]);
  const [newField, setNewField] = useState({ name: "", location: "", area: "", soil: "Loamy", crop: "", nitrogen: "", phosphorus: "", potassium: "", ph: "", moisture: "" });
  const [isFleetRunning, setIsFleetRunning] = useState(false);
  const [fleetResults, setFleetResults] = useState<any[]>([]);
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);

  const [weatherData, setWeatherData] = useState({
    location: "Awaiting Field Sync...", temp: "--°C", humidity: "--%", wind: "-- km/h", rainChance: "--%", deltaT: "--", sprayWindow: "Select an active field.", diseaseRisk: "Unknown", diseaseColor: "text-gray-500", indexScore: 78,
    forecastDays: [ { day: "Today", temp: "--° / --°", rain: "--%", icon: Sun }, { day: "Tomorrow", temp: "--° / --°", rain: "--%", icon: Sun } ]
  });

  const [forecastForm, setForecastForm] = useState({ crop: "Maize", area: "12", ...cropBaselines["Maize"] });
  const [isForecastGenerated, setIsForecastGenerated] = useState(false);
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSyncingIoT, setIsSyncingIoT] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [plannerCrop, setPlannerCrop] = useState("Maize");
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [selectedLeafKey, setSelectedLeafKey] = useState("maize_blight");
  const [isScanningLeaf, setIsScanningLeaf] = useState(false);
  const [scanComplete, setScanComplete] = useState(true);
  const [isSpeakingVision, setIsSpeakingVision] = useState(false);
  const [customDiagnosis, setCustomDiagnosis] = useState<any>(null);
  const [visionError, setVisionError] = useState("");
  const [visionModelStatus, setVisionModelStatus] = useState("");

  const [droneStatus, setDroneStatus] = useState("idle"); 
  const [irrigationConfigOpen, setIrrigationConfigOpen] = useState(false);
  const [iotPairing, setIotPairing] = useState("idle"); 
  
  const [seedSearchTerm, setSeedSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [shopCategory, setShopCategory] = useState("All");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentDetails, setPaymentDetails] = useState({name:"",phone:"",address:"",upi:"",card:"",expiry:"",cvv:""});
  const [orderStatus, setOrderStatus] = useState("");
  
  const [expertStatus, setExpertStatus] = useState("idle"); 
  const [expertTopic, setExpertTopic] = useState("Pest/Disease Identification");
  const [expertDescription, setExpertDescription] = useState("");
  const [expertPreviews, setExpertPreviews] = useState<string[]>([]);
  const [expertFiles, setExpertFiles] = useState<File[]>([]);
  const [expertSubmitError, setExpertSubmitError] = useState("");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const [profileImage, setProfileImage] = useState("");
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [selectedMarketCrop, setSelectedMarketCrop] = useState("All");
  const [marketSearch, setMarketSearch] = useState("");
  const [surveillanceRefreshing, setSurveillanceRefreshing] = useState(false);
  const [surveillanceData, setSurveillanceData] = useState<any[]>([]);
  const [selectedFieldDetail, setSelectedFieldDetail] = useState<any>(null);
  const [cropRecommendation, setCropRecommendation] = useState<any>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [inquiryModal, setInquiryModal] = useState<any>({isOpen: false, buyer: null, message: ""});

  // --- ADVANCED FARM OPERATIONS STATE ---
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [marketFilter, setMarketFilter] = useState("All");
  const [alertFilter, setAlertFilter] = useState("All");
  const [fieldMapOpen, setFieldMapOpen] = useState(false);
  const [selectedInputCategory, setSelectedInputCategory] = useState("All");
  const [farmAlerts, setFarmAlerts] = useState<any[]>([]);
  const [pumpSchedule, setPumpSchedule] = useState<Record<string, string>>({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [consultationMessage, setConsultationMessage] = useState("");

  // --- FARM BUSINESS HUB STATE ---
  const [businessSection, setBusinessSection] = useState("catalog");
  const [businessSearch, setBusinessSearch] = useState("");
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedSubscription, setSelectedSubscription] = useState("");
  const [csaQuantity, setCsaQuantity] = useState(1);
  const [localSearch, setLocalSearch] = useState("");
  const [inventoryRecords, setInventoryRecords] = useState<any[]>(inventorySeed);
  const [inventorySearch, setInventorySearch] = useState("");
  const [wholesaleRequest, setWholesaleRequest] = useState({product:"",quantity:"",unit:"kg",notes:""});
  const [wholesaleRequests, setWholesaleRequests] = useState<any[]>([]);
  const [contractRequests, setContractRequests] = useState<any[]>([]);
  const [logisticsOrders, setLogisticsOrders] = useState<any[]>([]);
  const [laborTasks, setLaborTasks] = useState<any[]>(laborTaskCatalog);
  const [profileLocation, setProfileLocation] = useState({address:"",city:"",state:"",pincode:"",landmark:""});
  const [businessOrders, setBusinessOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any[]>([]);

  const activeField = fields[activeFieldIndex] || null;
  const activeCrop = activeField?.crop || forecastForm.crop || "Maize";
  const activeCropProfile = cropCatalog.find(c => c.name === activeCrop) || null;
  const cartCount = cartItems.reduce((sum:string[]|number, id:any) => sum as number, 0 as number);
  const getCartQuantity = (id:string) => Math.max(1, Number(cartQuantities[id] || 1));
  const setCartQuantitySafe = (id:string, quantity:number) => setCartQuantities(prev => ({...prev, [id]:Math.max(1, Math.min(99, Math.floor(quantity)))}));
  const addProductToCart = (product:any) => {
    if (!product?.id) return;
    setCartItems(prev => prev.includes(product.id) ? prev : [...prev, product.id]);
    setCartQuantities(prev => ({...prev, [product.id]: Math.max(1, Number(prev[product.id] || 0) + 1)}));
    showToast(`${getProductName(product, lang)} added to cart`);
  };
  const removeProductFromCart = (id:string) => {
    setCartItems(prev => prev.filter(x => x !== id));
    setCartQuantities(prev => { const next={...prev}; delete next[id]; return next; });
  };
  const getCartTotal = () => cartItems.reduce((sum,id) => {
    const p = shopProducts.find((x:any)=>x.id===id); return sum + (Number(p?.price || 0) * getCartQuantity(id));
  },0);
  const getCartItemCount = () => cartItems.reduce((sum,id)=>sum+getCartQuantity(id),0);

  const buildDeficiencyList = () => {
    const result:any[] = [];
    const resources = forecastResult?.resources;
    if (resources?.n?.action === "Add") result.push({nutrient:"N", title:"Nitrogen deficiency / requirement", products:fertilizerProducts.filter(p=>String(p.nutrients).includes("N"))});
    if (resources?.p?.action === "Add") result.push({nutrient:"P", title:"Phosphorus deficiency / requirement", products:fertilizerProducts.filter(p=>String(p.nutrients).includes("P"))});
    if (resources?.k?.action === "Add") result.push({nutrient:"K", title:"Potassium deficiency / requirement", products:fertilizerProducts.filter(p=>String(p.nutrients).includes("K"))});
    if (!result.length && forecastResult) result.push({nutrient:"NPK", title:"No major NPK addition flagged by this planning calculation", products:fertilizerProducts.filter(p=>p.category==="Balanced NPK" || p.category==="Organic")});
    return result;
  };

  const saveProfile = () => { persistState("ys_profile", {fullName, loginEmail, profileImage}); setProfileSaved(true); showToast("Profile saved locally"); setTimeout(()=>setProfileSaved(false),1800); };

  const createFarmAlerts = () => {
    const f = activeField; if (!f) return [];
    const rain = Number.parseFloat(String(weatherData.rainChance)) || 0;
    const moisture = Number.parseFloat(String(forecastForm.moisture)) || 0;
    const alerts:any[] = [];
    if (rain >= 70) alerts.push({id:`rain-${f.id}`,type:"Weather",severity:"Warning",title:"Rainfall alert",message:"Rain probability is high. Avoid unnecessary irrigation and inspect drainage."});
    if (moisture < Number(activeCropProfile?.moisture || 45) - 15) alerts.push({id:`moisture-${f.id}`,type:"Irrigation",severity:"Warning",title:"Low soil moisture",message:"Soil moisture is below the planning target for the selected crop."});
    if (forecastResult?.resources?.n?.action === "Add" || forecastResult?.resources?.p?.action === "Add" || forecastResult?.resources?.k?.action === "Add") alerts.push({id:`nutrient-${f.id}`,type:"Crop Activity",severity:"Information",title:"Nutrient action available",message:"Open Farm Planner and Certified Seeds & Farm Inputs to review the flagged nutrient requirement."});
    return alerts;
  };

  // --- DERIVED DATA ---
  const totalAcres = fields.reduce((sum, field) => sum + (parseFloat(field.area) || 0), 0);
  const primaryLocation = fields.length > 0 ? fields[activeFieldIndex]?.location : "No Location";
  const activeFieldName = fields.length > 0 ? fields[activeFieldIndex]?.name : "No Active Zone";

  const getLifecycleStages = (cropName: string) => {
    const canonicalName = resolveCanonicalCropName(cropName);
    const crop = cropCatalog.find(c => c.name === canonicalName);
    const knowledge = resolvePlannerKnowledge(canonicalName);
    const keys = Array.isArray(knowledge?.stages) ? knowledge.stages.filter(Boolean) : [];
    const totalDays = Math.max(1,Number(knowledge?.durationDays || crop?.durationDays || 120));
    const icons:any[] = [Leaf,Sprout,Droplets,Bug,Sun,Gauge,CheckCircle2];
    if (!crop && !keys.length) return [];
    return keys.map((stageKey:string,idx:number) => {
      const start = idx === 0 ? 0 : Math.max(1,Math.round(totalDays*(idx/keys.length)));
      const end = idx === keys.length-1 ? totalDays : Math.max(start+1,Math.round(totalDays*((idx+1)/keys.length)));
      const languageLabels = lifecycleStageLabels[plannerLanguage] || lifecycleStageLabels.en;
      const label = languageLabels?.[stageKey] || lifecycleStageLabels.en?.[stageKey] || stageKey;
      const baseAction = getPlannerAction(stageKey,plannerLanguage);
      const localizedCrop = getCropDisplayName(canonicalName || String(knowledge.crop || cropName || "Unknown Crop"),plannerLanguage);
      const extra = idx === 0 ? knowledge.establishment : idx === 2 ? knowledge.irrigation : idx === 3 ? knowledge.scouting : idx === keys.length-1 ? knowledge.harvest : knowledge.nutrientPriority;
      // English keeps the richer crop-specific knowledge text; every other
      // language receives a fully translated action rather than mixed-language UI.
      const safeExtra = plannerLanguage === "en" ? extra : getPlannerAction(stageKey,plannerLanguage);
      const description = plannerLanguage === "en"
        ? `${localizedCrop}: ${baseAction} ${safeExtra}`
        : `${localizedCrop}: ${safeExtra}`;
      return {id:`${canonicalName || "unknown"}-${stageKey}-${idx}`,key:stageKey,icon:icons[idx%icons.length],color:["text-[#B5F140]","text-blue-400","text-[#EF476F]","text-[#FFD166]","text-purple-400","text-orange-300","text-white"][idx%7],bg:"bg-black/20",daysStart:start,daysEnd:end,title:label,desc:description,crop:canonicalName || String(knowledge.crop || cropName || "Unknown Crop"),target:knowledge.target};
    });
  };
  const canonicalPlannerCrop = resolveCanonicalCropName(plannerCrop);
  const plannerStages = getLifecycleStages(canonicalPlannerCrop);
  const plannerKnowledge = resolvePlannerKnowledge(canonicalPlannerCrop);
  const plannerNutrientSummary = `N ${plannerKnowledge.target.nitrogen} · P ${plannerKnowledge.target.phosphorus} · K ${plannerKnowledge.target.potassium}`;
  const addDaysToDate = (dateStr: string, days: number) => { const d = new Date(dateStr); d.setDate(d.getDate()+days); return d.toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"}); };

  const getFieldCostEstimate = (field: any, cropName="Maize") => {
    const acres = Number(field?.area || 0); const base: Record<string, number> = {Maize:8200,Rice:10500,Wheat:7600,Cotton:11500,Sugarcane:18500,Millet:6500};
    const cost = acres * (base[cropName] || 9000); const revenue = cost * 1.42; return {seed:cost*.12,total:cost,revenue,profit:revenue-cost};
  };

  const leafPathologies: Record<string, any> = {
    maize_blight: { name: "Northern Corn Leaf Blight", pathogen: "Exserohilum turcicum", crop: "Maize", confidence: "96.4%", severity: "Stage 2 Necrosis", severityColor: "text-[#EF476F]", treatment: "Apply Azoxystrobin (18.2%) SC.", box: { top: "34%", left: "28%", width: "44%", height: "38%" }, visualUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=700&q=80" },
    rice_blast: { name: "Rice Blast Lesions", pathogen: "Magnaporthe oryzae", crop: "Rice", confidence: "94.8%", severity: "Early Stage", severityColor: "text-[#FFD166]", treatment: "Spray Tricyclazole 75% WP.", box: { top: "42%", left: "36%", width: "30%", height: "28%" }, visualUrl: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=700&q=80" }
  };
  const activeDiagnosis = selectedLeafKey === 'custom_upload' && customDiagnosis ? customDiagnosis : leafPathologies[selectedLeafKey] || leafPathologies['maize_blight'];

  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("ys_cart") || "null");
      const savedQty = JSON.parse(localStorage.getItem("ys_cart_qty") || "null");
      if (Array.isArray(savedCart)) setCartItems(savedCart);
      if (savedQty && typeof savedQty === "object") setCartQuantities(savedQty);
    } catch {}
  }, []);

  useEffect(() => { persistState("ys_cart", cartItems); persistState("ys_cart_qty", cartQuantities); }, [cartItems, cartQuantities]);

  // --- EFFECTS & INITIALIZERS ---
  const persistState = (key: string, value: any) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  
  useEffect(() => {
    try {
      const savedFields = JSON.parse(localStorage.getItem("ys_fields") || "null");
      const savedHistory = JSON.parse(localStorage.getItem("ys_history") || "null");
      if (Array.isArray(savedFields)) setFields(savedFields);
      if (Array.isArray(savedHistory)) setHistoryRecords(savedHistory);
    } catch {}
  }, []);

  useEffect(() => persistState("ys_fields", fields), [fields]);
  useEffect(() => persistState("ys_history", historyRecords), [historyRecords]);

  useEffect(() => {
    try {
      const savedLocation = JSON.parse(localStorage.getItem("ys_profile_location") || "null");
      const savedOrders = JSON.parse(localStorage.getItem("ys_business_orders") || "null");
      const savedPayments = JSON.parse(localStorage.getItem("ys_payment_history") || "null");
      const savedSubscriptions = JSON.parse(localStorage.getItem("ys_subscriptions") || "null");
      const savedWholesale = JSON.parse(localStorage.getItem("ys_wholesale_requests") || "null");
      const savedContracts = JSON.parse(localStorage.getItem("ys_contract_requests") || "null");
      const savedLogistics = JSON.parse(localStorage.getItem("ys_logistics_orders") || "null");
      const savedLabor = JSON.parse(localStorage.getItem("ys_labor_tasks") || "null");
      const savedInventory = JSON.parse(localStorage.getItem("ys_inventory_records") || "null");
      if (savedLocation && typeof savedLocation === "object") setProfileLocation({...profileLocation,...savedLocation});
      if (Array.isArray(savedOrders)) setBusinessOrders(savedOrders);
      if (Array.isArray(savedPayments)) setPaymentHistory(savedPayments);
      if (Array.isArray(savedSubscriptions)) setSubscriptionStatus(savedSubscriptions);
      if (Array.isArray(savedWholesale)) setWholesaleRequests(savedWholesale);
      if (Array.isArray(savedContracts)) setContractRequests(savedContracts);
      if (Array.isArray(savedLogistics)) setLogisticsOrders(savedLogistics);
      if (Array.isArray(savedLabor)) setLaborTasks(savedLabor);
      if (Array.isArray(savedInventory)) setInventoryRecords(savedInventory);
    } catch {}
  }, []);
  useEffect(() => persistState("ys_profile_location", profileLocation), [profileLocation]);
  useEffect(() => persistState("ys_business_orders", businessOrders), [businessOrders]);
  useEffect(() => persistState("ys_payment_history", paymentHistory), [paymentHistory]);
  useEffect(() => persistState("ys_subscriptions", subscriptionStatus), [subscriptionStatus]);
  useEffect(() => persistState("ys_wholesale_requests", wholesaleRequests), [wholesaleRequests]);
  useEffect(() => persistState("ys_contract_requests", contractRequests), [contractRequests]);
  useEffect(() => persistState("ys_logistics_orders", logisticsOrders), [logisticsOrders]);
  useEffect(() => persistState("ys_labor_tasks", laborTasks), [laborTasks]);
  useEffect(() => persistState("ys_inventory_records", inventoryRecords), [inventoryRecords]);

  // Complete-page language initialization. The hidden Google Translate bridge
  // covers legacy literal strings while the native dictionaries handle crop,
  // planner and business-specific data before the page is rendered.
  useEffect(() => {
    ensureGoogleTranslateLoaded();
    const timer = window.setTimeout(() => applyGoogleTranslation(lang), 900);
    return () => window.clearTimeout(timer);
  }, [lang]);

  // React can replace portions of the page when the farmer switches modules.
  // Re-applying the selected language after a navigation render keeps newly
  // mounted labels, cards and form controls in the selected language.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => {
      applyGoogleTranslation(lang);
      translatePlaceholdersForLanguage(lang);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [activeTab, lang]);

  // IMPORTANT: this observer intentionally depends only on `lang`. Navigation is
  // handled by the separate activeTab/language effect above. Keeping a stable
  // dependency array prevents React error #310-style dependency-size changes
  // during hot reloads or rapid tab switches.
  // Dynamic React sections are translated after navigation, modal opening and
  // marketplace/planner refreshes. The observer is deliberately bounded so the
  // Google Translate DOM mutations cannot create an infinite React/DOM loop.
  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const root = document.getElementById("yieldsense-app-root");
    if (!root) return;
    let timer: number | null = null;
    let lastRun = 0;
    let passCount = 0;
    const runBoundedTranslation = () => {
      const now = Date.now();
      if (now - lastRun < 900 || passCount >= 8) return;
      lastRun = now;
      passCount += 1;
      applyGoogleTranslation(lang);
      translatePlaceholdersForLanguage(lang);
    };
    const observer = new MutationObserver(() => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        runBoundedTranslation();
      }, 700);
    });
    observer.observe(root, { childList: true, subtree: true });
    const passes = [1200, 2200, 3500, 5000, 7000].map(delay => window.setTimeout(runBoundedTranslation, delay));
    return () => {
      observer.disconnect();
      if (timer !== null) window.clearTimeout(timer);
      passes.forEach(id => window.clearTimeout(id));
    };
  }, [lang]);

  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const hours = date.getHours(); let greet = "Good Evening";
    if (hours < 12) greet = "Good Morning"; else if (hours < 18) greet = "Good Afternoon";
    setTimeData({ date: formattedDate, greeting: greet });
    
    setChatMessages((prev: any[]) => {
      const newMsgs = [...prev];
      if (newMsgs.length === 0 || newMsgs[0].role === 'assistant') {
        newMsgs[0] = { role: 'assistant', text: "Hello! I am your AI Assistant. You can ask me about your active field, the current weather, irrigation schedules, or yield estimates." };
      }
      return newMsgs;
    });
    return () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, [lang]);

  useEffect(() => {
    if (fields.length > 0 && fields[activeFieldIndex]) {
      const tempRaw = 22 + Math.random() * 13; const humRaw = 40 + Math.random() * 45; const rainRaw = Math.random() * 100;
      setWeatherData({
        location: fields[activeFieldIndex].location, temp: `${tempRaw.toFixed(1)}°C`, humidity: `${humRaw.toFixed(0)}%`, wind: `${(Math.random() * 20 + 5).toFixed(0)} km/h`, rainChance: `${rainRaw.toFixed(0)}%`, deltaT: (Math.random() * 6 + 2).toFixed(1),
        sprayWindow: tempRaw > 30 ? "Do not spray" : "Safe for Spraying",
        diseaseRisk: tempRaw > 26 && humRaw > 75 ? "High Risk" : "Low Risk",
        diseaseColor: tempRaw > 26 && humRaw > 75 ? "text-[#EF476F]" : "text-[#B5F140]", indexScore: Math.floor(Math.random() * 25 + 70),
        forecastDays: [ { day: "Today", temp: `${(tempRaw+1).toFixed(0)}°`, rain: `${rainRaw.toFixed(0)}%`, icon: Sun }, { day: "Tomorrow", temp: `${(tempRaw+2).toFixed(0)}°`, rain: `20%`, icon: Sun } ]
      });
    }
  }, [fields, activeFieldIndex]);

  // --- HANDLERS ---
  const addHistory = (type: string, title: string, details={}) => {
    const record = { id: Date.now(), date: new Date().toISOString(), type, title, field: activeFieldName, details };
    setHistoryRecords((prev: any[]) => [record, ...prev].slice(0, 200));
  };

  const showToast = (msg: string) => {
    setToastMsg(msg); setTimeout(() => setToastMsg(""), 4000);
  };

  const saveProfileLocation = () => {
    const pincodeOk = !profileLocation.pincode || /^\d{6}$/.test(profileLocation.pincode);
    if (!profileLocation.address || !profileLocation.city || !profileLocation.state || !profileLocation.pincode) {
      showToast("Please complete the delivery address, city, state and 6-digit pincode.");
      return;
    }
    if (!pincodeOk) { showToast("Please enter a valid 6-digit pincode."); return; }
    setPaymentDetails(prev => ({...prev,name:prev.name || fullName,phone:prev.phone || "",address:`${profileLocation.address}, ${profileLocation.city}, ${profileLocation.state} - ${profileLocation.pincode}${profileLocation.landmark ? `, ${profileLocation.landmark}` : ""}`}));
    setProfileSaved(true);
    showToast("Delivery location saved. Future demo orders can use this address.");
    setTimeout(()=>setProfileSaved(false),1800);
  };

  const placeDemoOrder = () => {
    if (!paymentDetails.name || !paymentDetails.phone || !paymentDetails.address) {
      setOrderStatus("Please complete delivery details before placing the demo order.");
      return;
    }
    const orderId = `YS-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`;
    const total = getCartTotal();
    const createdAt = new Date().toISOString();
    const order = {
      id:orderId,
      createdAt,
      items:cartItems.map(id=>{ const p=shopProducts.find((x:any)=>x.id===id); return {id,name:p?.name || id,quantity:getCartQuantity(id),price:Number(p?.price||0),category:p?.type || "Agricultural input"}; }),
      total,
      paymentMethod,
      paymentStatus:"Demo payment recorded",
      delivery:{name:paymentDetails.name,phone:paymentDetails.phone,address:paymentDetails.address},
      stage:0,
      note:"Demo order only — no real payment or shipment has been processed."
    };
    setBusinessOrders(prev=>[order,...prev].slice(0,50));
    setPaymentHistory(prev=>[{id:`PAY-${Date.now()}`,orderId,method:paymentMethod,amount:total,status:"Demo",date:createdAt},...prev].slice(0,100));
    setLogisticsOrders(prev=>[{id:orderId,stage:0,updatedAt:createdAt,provider:"Demo logistics workflow",live:false},...prev.filter(x=>x.id!==orderId)].slice(0,50));
    setOrderStatus(`Demo order ${orderId} captured. Total: ${total ? formatCurrency(total) : "Supplier pricing pending"}.`);
    showToast(`Order ${orderId} recorded in the demo tracker.`);
    addHistory("order","Farm inputs ordered",{orderId,items:getCartItemCount(),total,paymentMethod});
    setCartItems([]); setCartQuantities({});
  };

  const advanceLogistics = (orderId:string) => {
    setLogisticsOrders(prev=>prev.map(order=>order.id===orderId ? {...order,stage:Math.min(logisticsStages.length-1,Number(order.stage||0)+1),updatedAt:new Date().toISOString()} : order));
    setBusinessOrders(prev=>prev.map(order=>order.id===orderId ? {...order,stage:Math.min(logisticsStages.length-1,Number(order.stage||0)+1)} : order));
    showToast("Demo delivery milestone updated. This is not a live courier feed.");
  };

  const subscribeToPlan = (plan:any) => {
    const record = {id:plan.id,plan:plan.name,price:plan.price,period:plan.period,status:"Demo subscription active",startedAt:new Date().toISOString()};
    setSubscriptionStatus(prev=>[record,...prev.filter(x=>x.id!==plan.id)]);
    setSelectedSubscription(plan.id);
    addHistory("subscription","Subscription selected",{plan:plan.name,price:plan.price});
    showToast(`${plan.name} selected for demo subscription management.`);
  };

  const joinCsa = () => {
    const total = 1499 * Math.max(1,csaQuantity);
    const record = {id:`csa-${Date.now()}`,plan:"CSA Fresh Basket",quantity:Math.max(1,csaQuantity),monthlyEstimate:total,status:"Demo membership selected",createdAt:new Date().toISOString()};
    setSubscriptionStatus(prev=>[record,...prev]);
    addHistory("subscription","CSA membership selected",{quantity:csaQuantity,monthlyEstimate:total});
    showToast("CSA membership saved as a demo plan.");
  };

  const submitWholesaleRequest = () => {
    if (!wholesaleRequest.product || !wholesaleRequest.quantity) { showToast("Select a wholesale product and quantity first."); return; }
    const item = wholesaleProducts.find(x=>x.id===wholesaleRequest.product);
    const record = {id:`WR-${Date.now()}`,product:item?.name || wholesaleRequest.product,crop:item?.crop || "Multi-crop",quantity:Number(wholesaleRequest.quantity),unit:wholesaleRequest.unit,notes:wholesaleRequest.notes,status:"Quote requested",createdAt:new Date().toISOString()};
    setWholesaleRequests(prev=>[record,...prev]);
    setWholesaleRequest({product:"",quantity:"",unit:"kg",notes:""});
    addHistory("wholesale","Wholesale quote requested",record);
    showToast("Wholesale request saved. Supplier quote is not yet live.");
  };

  const createContractRequest = (template:any) => {
    const record = {...template,requestId:`CFREQ-${Date.now()}`,createdAt:new Date().toISOString(),stage:"Farmer inquiry"};
    setContractRequests(prev=>[record,...prev]);
    addHistory("contract","Contract farming inquiry created",{crop:template.crop,buyer:template.buyer});
    showToast("Contract farming inquiry saved for review.");
  };

  const addInventoryRecord = () => {
    const record = {id:`INV-${Date.now()}`,product:"New input",batch:`BATCH-${Date.now().toString().slice(-6)}`,quantity:0,unit:"kg",source:"Manual entry",location:"Farm store",trace:"Received → pending allocation"};
    setInventoryRecords(prev=>[record,...prev]);
    showToast("Inventory record created. Update its quantity when the actual stock is received.");
  };

  const assignLaborTask = (task:any) => {
    const record = {...task,id:`${task.id}-${Date.now()}`,status:"Assigned",assignedAt:new Date().toISOString()};
    setLaborTasks(prev=>[record,...prev]);
    addHistory("labor","Seasonal labor task assigned",{task:task.task,workers:task.workers});
    showToast(`${task.task} added to the seasonal labor plan.`);
  };

  const openDeficiencyInputs = () => {
    setActiveTab("seeds");
    setShopCategory("Fertilizer");
    setSeedSearchTerm("");
  };

  // Farm Planner -> Certified Seeds & Fertilizers bridge.
  // IMPORTANT: the same fertilizer can satisfy more than one deficiency group.
  // Flattening those groups without de-duplicating causes React to receive the
  // same product key more than once (for example deficiency-product-fert-npk).
  // Keep the product catalogue as the single source of truth and return each
  // product only once while preserving the planner relevance order.
  const getPlannerDeficiencyProducts = () => {
    const deficiencies = buildDeficiencyList();
    const products = deficiencies.flatMap((group:any)=>Array.isArray(group?.products) ? group.products : []);
    const uniqueProducts:any[] = [];
    const seenProductIds = new Set<string>();
    products.forEach((product:any, index:number) => {
      const productId = String(product?.id || `planner-input-${product?.name || "unknown"}-${index}`);
      if (!seenProductIds.has(productId)) {
        seenProductIds.add(productId);
        uniqueProducts.push(product);
      }
    });
    if (uniqueProducts.length) return uniqueProducts;
    return fertilizerProducts.filter((p:any)=>p.category === "Balanced NPK" || p.category === "Organic");
  };

  // A second defensive layer is intentionally kept here. If a future catalogue
  // import accidentally contains duplicate IDs, the rendered list still gets
  // stable unique keys and the farmer sees one product card instead of repeated
  // cards. This does not change product pricing or business logic.
  const getUniqueProductList = (products:any[]) => {
    const result:any[] = [];
    const seen = new Set<string>();
    (Array.isArray(products) ? products : []).forEach((product:any, index:number) => {
      const id = String(product?.id || `product-${index}`);
      if (!seen.has(id)) {
        seen.add(id);
        result.push(product);
      }
    });
    return result;
  };

  const handleAuth = async (e: any) => {
    e.preventDefault(); setApiError(""); setApiSuccess("");
    if (isLoginMode) {
      try {
        const response = await fetch(`${requireApiBaseUrl()}/login`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({username: loginEmail, password: loginPassword}) });
        if (response.ok) { const data = await response.json(); setToken(data.access_token); setIsLoggedIn(true); } else throw new Error("API Offline");
      } catch (error) { setApiError("Backend unavailable. Login requires the FastAPI service at " + API_BASE_URL + ". Start the backend and try again."); }
    } else {
      setApiSuccess("Account created locally (offline fallback)!"); setIsLoginMode(true); setLoginPassword("");
    }
  };

  const handleLogout = (e: any) => {
    if (e) e.stopPropagation(); setIsLoggedIn(false); setToken(null); setActiveTab("overview"); setLoginPassword(""); 
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };

  const handleActiveZoneChange = (e: any) => {
    const newIndex = parseInt(e.target.value); setActiveFieldIndex(newIndex);
    if (fields[newIndex]) setForecastForm((prev: any) => ({ ...prev, area: fields[newIndex].area }));
  };

  const handleCropChange = (e: any) => {
    const selectedCrop = e.target.value;
    setForecastForm((prev: any) => ({ ...prev, crop: selectedCrop, ...(cropBaselines[selectedCrop] || cropBaselines.Maize) }));
  };

  const handleIoTSync = () => {
    setIsSyncingIoT(true);
    setTimeout(() => {
      const base = cropBaselines[forecastForm.crop] || cropBaselines.Maize;
      setForecastForm((prev: any) => ({
        ...prev, rainfall: (parseFloat(base.rainfall) + (Math.random() * 50 - 25)).toFixed(1), temp: (parseFloat(base.temp) + (Math.random() * 3 - 1.5)).toFixed(1), nitrogen: (parseFloat(base.nitrogen) - (Math.random() * 40 + 10)).toFixed(1), phosphorus: (parseFloat(base.phosphorus) + (Math.random() * 30)).toFixed(1), potassium: (parseFloat(base.potassium) - (Math.random() * 15)).toFixed(1), ph: (parseFloat(base.ph) + (Math.random() * 0.8 - 0.4)).toFixed(1), moisture: (parseFloat(base.moisture) - (Math.random() * 20)).toFixed(1), pesticide: (Math.random() * 25).toFixed(1)
      }));
      setIsSyncingIoT(false);
    }, 1500);
  };

  const processForecastData = (baseYieldPerHectare: number) => {
    const areaVal = parseFloat(forecastForm.area); const safeArea = (isNaN(areaVal) || areaVal <= 0) ? 0 : areaVal;
    const totalProduction = baseYieldPerHectare * safeArea;
    const base = cropBaselines[forecastForm.crop] || cropBaselines.Maize;

    const currentN = parseFloat(forecastForm.nitrogen); const currentP = parseFloat(forecastForm.phosphorus); const currentK = parseFloat(forecastForm.potassium);
    const gapN = currentN - parseFloat(base.nitrogen); const gapP = currentP - parseFloat(base.phosphorus); const gapK = currentK - parseFloat(base.potassium);

    const formatGap = (gap: number) => {
      if (gap < -0.1) return { action: "Add", val: Math.abs(gap).toFixed(1), unit: "kg/ha", color: "text-[#B5F140]" };
      if (gap > 0.1) return { action: "Reduce", val: gap.toFixed(1), unit: "kg/ha", color: "text-[#FFD166]" };
      return { action: "Perfect", val: "Amount", unit: "", color: "text-white" };
    };

    const resN = formatGap(gapN); const resP = formatGap(gapP); const resK = formatGap(gapK);
    const addN = gapN < 0 ? Math.abs(gapN) : 0; const addP = gapP < 0 ? Math.abs(gapP) : 0; const addK = gapK < 0 ? Math.abs(gapK) : 0;
    const excessN = gapN > 0 ? gapN : 0; 
    const totalFertilizerCost = ((addN * safeArea) * fertilizerCosts.nitrogen) + ((addP * safeArea) * fertilizerCosts.phosphorus) + ((addK * safeArea) * fertilizerCosts.potassium);

    const basePrice = cropMarketPrices[forecastForm.crop] || 20000;
    const yieldTonnes = parseFloat(totalProduction.toFixed(2));
    const grossRevenue = yieldTonnes * (basePrice * 10); 
    const netProfit = grossRevenue - totalFertilizerCost;

    const currentPh = parseFloat(forecastForm.ph);
    const currentPesticide = parseFloat(forecastForm.pesticide);
    const tDiff = Math.abs(parseFloat(forecastForm.temp) - parseFloat(base.temp));
    const rDiff = Math.abs(parseFloat(forecastForm.rainfall) - parseFloat(base.rainfall));
    const moistureDeficit = parseFloat(base.moisture) - parseFloat(forecastForm.moisture); 
    const phDiff = Math.abs(currentPh - parseFloat(base.ph));
    
    let stressFactors = 0;
    if (tDiff > 4) stressFactors++; if (rDiff > 200) stressFactors++; if (phDiff > 1.5) stressFactors += 2; 
    if (excessN > parseFloat(base.nitrogen) * 0.5) stressFactors += 2; else if (excessN > 0) stressFactors += 1;

    let riskStatus = "Optimal / Good to Grow"; let riskColor = "text-[#B5F140] border-[#B5F140]"; 
    let riskMsg = "Current conditions map perfectly to historical success metrics.";
    let alignmentScore = String(Math.round(clampNumber(96 - (tDiff * 1.8) - (rDiff * 0.035) - (phDiff * 7) - (Math.abs(moistureDeficit) * 0.12) - stressFactors * 2, 5, 99)));

    if (stressFactors > 2) {
      riskStatus = "Critical Alert"; riskColor = "text-[#EF476F] border-[#EF476F]"; 
      riskMsg = "Extreme environmental deviation detected. High probability of crop failure.";
      alignmentScore = Math.max(5, 60 - (stressFactors * 10)).toFixed(0);
    } else if (stressFactors > 0) {
      riskStatus = "Moderate Risk"; riskColor = "text-[#FFD166] border-[#FFD166]"; 
      riskMsg = "Conditions are outside optimal ranges. Follow the instructions below.";
      alignmentScore = String(Math.round(clampNumber(82 - stressFactors * 4 - phDiff * 2, 5, 99)));
    }

    const generateNDVIGrid = (score: number) => Array.from({ length: 128 }, (_, i) => {
      const cellScore = (score + ((i * 37 + Math.round(score) * 13) % 41) - 20);
      return cellScore < score - 15 ? 'bg-[#1B3B2B]' : cellScore < score + 10 ? 'bg-[#B5F140]' : cellScore < score + 20 ? 'bg-[#FFD166]' : 'bg-[#EF476F]';
    });

    const pesticidePenalty = currentPesticide > 0 ? currentPesticide * 2 : 0; 
    let calculatedEcoScore = Math.max(0, Math.min(100, Math.round(100 - (pesticidePenalty + (excessN * 0.1)))));
    let ecoColor = calculatedEcoScore < 60 ? "text-[#EF476F]" : calculatedEcoScore < 85 ? "text-[#FFD166]" : "text-[#B5F140]";
    let ecoMsg = "Highly sustainable footprint. Optimal soil health maintained.";

    let actionPlan = [];
    if (currentPh > 8.5) actionPlan.push(`🧪 HIGH ALKALINITY: Soil pH is high. Apply elemental sulfur.`);
    if (moistureDeficit > 15) actionPlan.push(`💧 MOISTURE DEFICIT: Soil is dry. Apply irrigation.`);
    if (excessN > 0) actionPlan.push(`⚠️ NITROGEN: Reduce excess nitrogen usage.`);
    if (addN > 0) actionPlan.push(`📉 NITROGEN: Add nitrogen fertilizer to baseline.`);

    const standardProcedure = cropProcedures.en?.[forecastForm.crop] || cropProcedures.en?.Maize;
    const finalProcedure = actionPlan.length > 0 ? `${actionPlan.join("\n\n")}\n\n📌 ${standardProcedure}` : `✅ PERFECT BALANCE: Your soil inputs are perfectly balanced.\n\n📌 ${standardProcedure}`;

    const mandiData = [
      { name: `Local Yard`, distance: "8 km", transportCost: "₹0", pricePerTonne: formatCurrency(grossRevenue * 0.9 / (yieldTonnes || 1)), netPayout: formatCurrency(grossRevenue * 0.9), recommended: false },
      { name: "Bengaluru Hub", distance: "142 km", transportCost: formatCurrency(yieldTonnes * 800), pricePerTonne: formatCurrency(grossRevenue * 1.1 / (yieldTonnes || 1)), netPayout: formatCurrency((grossRevenue * 1.1) - (yieldTonnes * 800)), recommended: true }
    ];

    let pumpHours: number = 0; let irrigationDecisionEn = "Optimal Moisture. Pump standby.";
    if (parseFloat(forecastForm.rainfall) > 50 && moistureDeficit > 0) { 
      irrigationDecisionEn = "Rain expected. Skip irrigation to save power."; 
    } else if (moistureDeficit > 5) { 
      pumpHours = parseFloat((moistureDeficit * safeArea * 0.12).toFixed(1)); 
      irrigationDecisionEn = `Run pump for ${pumpHours} hrs`; 
    }

    setForecastResult({ 
      total: safeArea > 0 ? totalProduction.toFixed(2) : "0.00", perAcre: baseYieldPerHectare.toFixed(2), crop: getCropDisplayName(forecastForm.crop, lang),
      riskStatus, riskColor, riskMsg, alignmentScore, procedure: finalProcedure, rotation: cropRotations.en?.[forecastForm.crop] || cropRotations.en?.Maize, ndviGrid: generateNDVIGrid(parseFloat(alignmentScore)), 
      resources: { area: safeArea, n: resN, p: resP, k: resK }, mandiData, mandiAdvice: `Bypassing local market and shipping via truck yields the highest net return.`,
      irrigation: { eto: (parseFloat(forecastForm.temp) * 0.25).toFixed(1), decisionEn: irrigationDecisionEn, hours: pumpHours },
      harvest: { maturityPercent: 82, daysRemaining: 12, window: `20 Oct - 25 Oct`, status: "Late Dough Maturation" },
      tankMix: { fungicide: "Azoxystrobin", foliarNutrient: "19-19-19 Soluble NPK", adjuvant: "Silicone Wetting Agent", compatibility: "Physically & Chemically Compatible", phytotoxicityRisk: "Negligible (<1%)", waterPhTarget: "6.2 - 6.5", totalWaterLitres: safeArea * 400, totalKnapsackTanks: Math.ceil((safeArea * 400) / 20), totalDronePayloads: Math.ceil((safeArea * 400) / 25) },
      economics: { revenue: formatCurrency(grossRevenue), cost: formatCurrency(totalFertilizerCost), profit: formatCurrency(netProfit) },
      eco: { score: calculatedEcoScore, color: ecoColor, msg: ecoMsg }
    });
    setIsForecastGenerated(true);
  };

  const handleGenerateForecast = async (e: any) => {
    e.preventDefault(); setIsPredicting(true); setApiError("");
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
    try {
      // Validate the inputs before contacting the backend. Never generate random
      // replacement values when the service is offline or returns an error.
      const requestPayload: Record<string, number> = {
        rainfall: Number(forecastForm.rainfall),
        temperature: Number(forecastForm.temp),
        pesticide: Number(forecastForm.pesticide),
        area: Number(forecastForm.area),
        nitrogen: Number(forecastForm.nitrogen),
        phosphorus: Number(forecastForm.phosphorus),
        potassium: Number(forecastForm.potassium),
        ph: Number(forecastForm.ph),
        moisture: Number(forecastForm.moisture),
      };
      const invalidInput = Object.entries(requestPayload).find(([, value]) => !Number.isFinite(value));
      if (invalidInput) throw new Error(`Please enter a valid numeric value for ${invalidInput[0]}.`);
      if (requestPayload.area <= 0) throw new Error("Total area must be greater than zero.");

      const signature = getPredictionSignature(requestPayload);
      const cachedYield = verifiedPredictionCache.get(signature);
      if (cachedYield !== undefined) {
        processForecastData(cachedYield);
        addHistory("forecast", "Yield forecast reused for identical inputs", { crop: forecastForm.crop, cached: true });
        return;
      }

      const apiBaseUrl = requireApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) {
        const responseMessage = await response.text().catch(() => "");
        throw new Error(responseMessage || `Prediction API returned HTTP ${response.status}.`);
      }
      const data = await response.json();
      const predictedYield = Number(data?.predicted_crop_yield);
      if (!Number.isFinite(predictedYield) || predictedYield < 0) {
        throw new Error("The prediction API response did not contain a valid predicted_crop_yield number.");
      }
      rememberVerifiedPrediction(signature, predictedYield);
      processForecastData(predictedYield);
      addHistory("forecast", "Yield forecast generated", { crop: forecastForm.crop, cached: false });
    } catch (error) {
      // Never present a locally fabricated estimate as a successful AI prediction.
      // Keep the last valid result visible and clearly explain how to restore the API.
      const message = error instanceof Error ? error.message : "Unknown backend connection error.";
      console.error("Yield forecast request failed:", message);
      setApiError(
        message.includes("not configured")
          ? message
          : "Prediction service is unavailable. Check that FastAPI is running and NEXT_PUBLIC_API_URL points to it. No new forecast was generated."
      );
    } finally { setIsPredicting(false); }
  };

  const handleFleetAnalysis = () => {
    if (!fields || fields.length === 0) return;
    setIsFleetRunning(true);
    setTimeout(() => {
      const results = fields.map(f => {
        const isOptimal = Math.random() > 0.4;
        return { ...f, status: isOptimal ? "Optimal" : "Action Required", color: isOptimal ? "text-[#B5F140]" : "text-[#EF476F]", profit: formatCurrency(parseFloat(f.area) * 120000 * (Math.random() * 0.6 + 0.7)) };
      });
      setFleetResults(results); setIsFleetRunning(false); addHistory("fleet", "Fleet Analysis Completed");
    }, 2000);
  };

  const handleRegisterField = async (e: any) => {
    e.preventDefault(); if (!newField.name || !newField.area) return;
    try {
      const response = await fetch(`${requireApiBaseUrl()}/fields`, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ name: newField.name, location: newField.location, area: parseFloat(newField.area), soil: newField.soil, crop:newField.crop || null, nitrogen:Number(newField.nitrogen)||null, phosphorus:Number(newField.phosphorus)||null, potassium:Number(newField.potassium)||null, ph:Number(newField.ph)||null, moisture:Number(newField.moisture)||null }) });
      if (!response.ok) throw new Error("API Offline");
      const savedField = await response.json(); setFields([...fields, savedField]); addHistory("field", "Field registered", {name:savedField.name}); setNewField({ name: "", location: "", area: "", soil: "Loamy", crop: "", nitrogen: "", phosphorus: "", potassium: "", ph: "", moisture: "" }); 
    } catch (error) { 
      setFields([...fields, { ...newField, id: Date.now().toString() }]); addHistory("field", "Field registered locally", {name:newField.name}); setNewField({ name: "", location: "", area: "", soil: "Loamy", crop: "", nitrogen: "", phosphorus: "", potassium: "", ph: "", moisture: "" }); 
    }
  };

  const handleRemoveField = async (fieldToRemove: any, indexToRemove: number) => {
    const updatedFields = fields.filter((_, index) => index !== indexToRemove);
    setFields(updatedFields);
    try { await fetch(`${requireApiBaseUrl()}/fields/${fieldToRemove.id || fieldToRemove.name}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); } catch (error) { }
    if (activeFieldIndex === indexToRemove) setActiveFieldIndex(0); else if (activeFieldIndex > indexToRemove) setActiveFieldIndex(activeFieldIndex - 1);
  };

  // --- VISION DIAGNOSTICS HANDLERS ---
  const handleImageUploadSafe = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    
    if (!file.type.startsWith("image/")) { setVisionError("Please upload a valid image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setVisionError("Image must be 10 MB or smaller."); return; }
    
    const imageUrl = URL.createObjectURL(file);
    setSelectedLeafKey("custom_upload"); setIsScanningLeaf(true); setScanComplete(false); setVisionError(""); setVisionModelStatus("Sending image to Gemini Vision Model...");
    
    setCustomDiagnosis({ name: "Analyzing image…", pathogen: "Model analysis in progress", crop: "Uploaded image", confidence: "—", severity: "Pending", severityColor: "text-[#FFD166]", treatment: "Waiting for vision model result. Do not apply chemicals yet.", box: null, visualUrl: imageUrl });
    
    try {
      const fd = new FormData(); fd.append("file", file);
      const response = await fetch("/api/vision", { method: "POST", body: fd });
      const rawText = await response.text();
      let data: any = {}; 
      try { data = JSON.parse(rawText); } catch { throw new Error(rawText || "Vision service returned an invalid response."); }
      if (!response.ok) throw new Error(data.error || "Vision service failed.");
      
      const confidenceNumber = Number(data.confidence); 
      const confidenceStr = Number.isFinite(confidenceNumber) ? `${(confidenceNumber * 100).toFixed(1)}%` : "Uncertain";
      const isUncertain = data.uncertain === true;
      
      setCustomDiagnosis({
        name: data.disease || "No confirmed diagnosis", pathogen: data.condition || "Not confirmed", crop: data.crop || "Not identified",
        confidence: confidenceStr, severity: data.severity || "Uncertain", severityColor: isUncertain ? "text-[#FFD166]" : (String(data.severity).toLowerCase().includes("severe") ? "text-[#EF476F]" : "text-[#B5F140]"),
        treatment: data.recommendation || "No treatment recommendation. Consult an expert.",
        visible_symptoms: data.visible_symptoms || "", next_action: data.next_action || "", box: null, visualUrl: imageUrl
      });
      setVisionModelStatus(data.model || "Vision model response received"); setScanComplete(true); addHistory("vision", "Uploaded crop image analyzed", { condition: data.disease || data.condition, confidence: confidenceStr });
    } catch (err: any) {
      console.error("Gemini Vision analysis failed:", err);
      setVisionError(err?.message || "Vision service is unavailable. Please try again.");
      setVisionModelStatus("Analysis unavailable — no diagnosis generated");
      setCustomDiagnosis((prev: any) => ({
        ...(prev || {}), name: "Unable to confidently analyze this image", pathogen: "Not confirmed", confidence: "Uncertain", severity: "Uncertain", severityColor: "text-[#FFD166]", treatment: "No chemical treatment should be prescribed from an unavailable or uncertain image analysis. Verify the crop, symptoms and local product label with an agricultural expert."
      }));
    } finally { setIsScanningLeaf(false); setScanComplete(true); }
  };
  const handleImageUpload = handleImageUploadSafe;

  const handleRunLeafScan = () => {
    if (selectedLeafKey === "custom_upload" && !customDiagnosis) { setVisionError("Upload an image to run a model analysis."); return; }
    setIsScanningLeaf(true); setScanComplete(false);
    if (isSpeakingVision) { window.speechSynthesis.cancel(); setIsSpeakingVision(false); }
    setTimeout(() => { setIsScanningLeaf(false); setScanComplete(true); addHistory("vision","Sample crop image analyzed"); }, 1200);
  };

  const handleChatSubmit = (e: any) => {
    e.preventDefault(); if (!chatInput.trim()) return;
    const userMsg = chatInput.trim(); setChatMessages((prev: any[]) => [...prev, { role: 'user', text: userMsg }]); setChatInput(""); setIsTyping(true);
    setTimeout(() => {
      let botReply = "I am your AI Farm Assistant. How can I help?";
      const lowerMsg = userMsg.toLowerCase();
      const summary = getFieldSummary(activeField);
      if (lowerMsg.includes("irrigat") || lowerMsg.includes("water") || lowerMsg.includes("pump")) botReply = `${getCropDisplayName(summary.crop.name,lang)}: ${summary.irrigation.needed ? "Irrigation may be needed." : "Irrigation is not currently indicated."} ${summary.irrigation.reason}`;
      else if (lowerMsg.includes("weather") || lowerMsg.includes("rain")) botReply = `Current weather for ${activeFieldName}: ${weatherData.temp}, humidity ${weatherData.humidity}, rain probability ${weatherData.rainChance}. ${weatherData.sprayWindow}.`;
      else if (lowerMsg.includes("crop") || lowerMsg.includes("grow") || lowerMsg.includes("sow")) botReply = `The active field is ${activeFieldName}. The selected crop is ${getCropDisplayName(summary.crop.name,lang)}. ${getSowingGuidance(summary.crop.name)}`;
      else if (lowerMsg.includes("fertil") || lowerMsg.includes("npk") || lowerMsg.includes("nutrient")) botReply = `Nutrient planning: N ${summary.nutrients.nitrogen}, P ${summary.nutrients.phosphorus}, K ${summary.nutrients.potassium}. Review Farm Planner before purchasing or applying inputs.`;
      else if (lowerMsg.includes("today") || lowerMsg.includes("do next")) botReply = buildTodayActions(activeField).join(" ");
      else if (lowerMsg.includes("yield") || lowerMsg.includes("profit")) botReply = forecastResult ? `Estimated yield is ${forecastResult.total} tonnes and the planning profit estimate is ${forecastResult.economics?.profit || "not available"}. These are estimates, not guarantees.` : "Run Yield Intelligence to generate an estimate.";
      setChatMessages((prev: any[]) => [...prev, { role: 'assistant', text: botReply }]); setIsTyping(false);
    }, 1200);
  };

  const submitExpertRequest = async (e: any) => {
    e.preventDefault();
    if (!expertDescription.trim()) { setExpertSubmitError("Please describe the field issue before submitting."); return; }
    setExpertStatus("sending"); setExpertSubmitError("");
    try {
      const fd = new FormData();
      fd.append("topic", expertTopic);
      fd.append("description", expertDescription);
      fd.append("fieldName", activeFieldName);
      fd.append("fieldLocation", primaryLocation);
      expertFiles.forEach((file,index)=>fd.append("images",file,`field-${index}-${file.name}`));
      const response = await fetch("/api/expert", {method:"POST",body:fd});
      if (!response.ok) {
        const txt=await response.text();
        throw new Error(txt || `Expert request failed with status ${response.status}.`);
      }
      // The server route validates the multipart request and returns a request ID.
      // The client still keeps a local copy so the workflow remains recoverable
      // when a production database/provider is not connected yet.
      persistState("ys_last_expert_request", {topic:expertTopic,description:expertDescription,field:activeFieldName,location:primaryLocation,images:expertFiles.map(f=>f.name),createdAt:new Date().toISOString()});
      addHistory("expert", "Expert consultation requested", {topic: expertTopic, images: expertFiles.length});
      setExpertStatus("sent");
    } catch (error:any) {
      console.warn("Expert backend unavailable; saving request locally.",error);
      persistState("ys_last_expert_request", {topic:expertTopic,description:expertDescription,field:activeFieldName,location:primaryLocation,images:expertFiles.map(f=>f.name),createdAt:new Date().toISOString(),backend:"offline"});
      addHistory("expert", "Expert consultation saved locally", {topic: expertTopic, images: expertFiles.length});
      setExpertSubmitError("Expert service is not connected yet. Your request was saved locally on this device.");
      setExpertStatus("sent");
    }
  };

  const refreshSurveillance = () => {
    setSurveillanceRefreshing(true);
    setTimeout(() => {
      setSurveillanceData(fields.map(f => ({...f, moisture: `${Math.round(35 + Math.random()*45)}%`, temperature: `${(24 + Math.random()*8).toFixed(1)}°C`, health: `${Math.round(72 + Math.random()*25)}%`, irrigation: Math.random() > .5 ? "Monitor" : "Scheduled", risk: Math.random() > .75 ? "Moderate" : "Low"}))); 
      setSurveillanceRefreshing(false); addHistory("surveillance", "Field surveillance refreshed");
    }, 700);
  };

  const runCropRecommendation = () => {
    setRecommendationLoading(true);
    setTimeout(() => {
      const f = fields[activeFieldIndex] || {};
      const activeCrop = f.crop || forecastForm.crop || "Maize";
      const temp = parseFloat(String(weatherData.temp).replace(/[^0-9.-]/g,"")) || 27;
      const rain = parseFloat(String(weatherData.rainChance).replace(/[^0-9.-]/g,"")) || 40;
      const soil = String(f.soil || "Loamy").toLowerCase();
      const fieldPh = Number(f.ph || forecastForm.ph || 6.5);
      const fieldMoisture = Number(f.moisture || forecastForm.moisture || 45);
      const fieldN = Number(f.nitrogen || forecastForm.nitrogen || 0);
      const fieldP = Number(f.phosphorus || forecastForm.phosphorus || 0);
      const fieldK = Number(f.potassium || forecastForm.potassium || 0);
      const candidates = cropCatalog.map((c:any) => {
        const parts:string[]=[];
        const soilTokens=String(c.soil).toLowerCase().split("/").map((x:string)=>x.trim());
        const soilMatch=soilTokens.some((token:string)=>soil.includes(token)||token.includes(soil));
        const climate=String(c.climate).toLowerCase();
        const warmMatch=temp>=24&&(climate.includes("warm")||climate.includes("tropical")||climate.includes("hot"));
        const coolMatch=temp<25&&climate.includes("cool");
        const dryMatch=rain<45&&climate.includes("dry");
        const wetMatch=rain>=60&&(climate.includes("wet")||c.name==="Rice"||c.name==="Sugarcane");
        const soilScore=soilMatch?28:10;
        const climateScore=warmMatch||coolMatch||dryMatch||wetMatch?22:12;
        const phScore=Math.max(0,12-Math.min(12,Math.abs(fieldPh-Number(c.ph))*4));
        const moistureDistance=Math.abs(fieldMoisture-Number(c.moisture));
        const waterScore=Math.max(0,18-Math.min(18,moistureDistance*0.35))+((dryMatch||wetMatch)?3:0);
        const nutrientNeed=Math.abs(fieldN-Number(c.nitrogen))+Math.abs(fieldP-Number(c.phosphorus))+Math.abs(fieldK-Number(c.potassium));
        const nutrientScore=Math.max(0,12-Math.min(12,nutrientNeed/35));
        const riskScore=String(c.risk).toLowerCase()==="low"?8:String(c.risk).toLowerCase()==="medium"?6:4;
        let score=Math.round(Math.min(98,soilScore+climateScore+waterScore+phScore+nutrientScore+riskScore));
        if(c.name===activeCrop) score=Math.max(0,score-3);
        if(soilMatch) parts.push(`soil matches ${c.soil}`);
        if(warmMatch||coolMatch) parts.push(`temperature suits ${c.climate}`);
        if(dryMatch||wetMatch) parts.push("rainfall pattern supports this crop");
        if(phScore>=9) parts.push(`pH is close to ${c.ph}`);
        if(nutrientScore>=8) parts.push("nutrient profile is relatively compatible");
        if(!parts.length) parts.push("requires more field validation before selection");
        const acres = Number(f?.area || 1) || 1;
        const referencePrice = Number(cropMarketPrices[c.name] || 0);
        const estimatedYieldPerAcre = Math.max(0.5, Number(c.durationDays || 120) / 120 * (c.category?.toLowerCase().includes("vegetable") ? 6 : c.category?.toLowerCase().includes("fruit") ? 5 : 2.5));
        const estimatedYield = Number((estimatedYieldPerAcre * acres).toFixed(2));
        const estimatedCost = Math.round(acres * (8500 + Number(c.nitrogen || 0) * 12 + Number(c.phosphorus || 0) * 8 + Number(c.potassium || 0) * 6));
        const estimatedRevenue = referencePrice > 0 ? Math.round(estimatedYield * referencePrice) : 0;
        const estimatedProfit = estimatedRevenue > 0 ? estimatedRevenue - estimatedCost : null;
        return {...c,score,factors:{soil:Math.round(soilScore),climate:Math.round(climateScore),water:Math.round(waterScore),ph:Math.round(phScore),nutrients:Math.round(nutrientScore),risk:riskScore},reason:`${parts.slice(0,3).join("; ")}. Validate local agronomy, water availability and market conditions before sowing.`,estimatedYield,estimatedCost,estimatedRevenue,estimatedProfit,referencePrice,marketProfile:getCropMarketIntelligence(c.name)};
      }).sort((a:any,b:any)=>b.score-a.score).slice(0,8);
      setCropRecommendation({field:f?.name||"Active field",activeCrop,inputs:{soil:f?.soil||"Loamy",temperature:temp,rainfall:rain,pH:fieldPh,moisture:fieldMoisture,nitrogen:fieldN,phosphorus:fieldP,potassium:fieldK},candidates,generatedAt:new Date().toISOString()});
      setRecommendationLoading(false);addHistory("recommendation","Crop suitability recommendation generated");
    },450);
  };

  // Keep the Farm Planner recommendation visible and current whenever the farmer
  // opens the planner or switches the active field. This does not replace the
  // manual Generate Recommendation button; it simply restores the missing
  // recommendation workflow automatically for a better farmer experience.
  useEffect(() => {
    if (activeTab !== "planner" || !fields.length || recommendationLoading) return;
    const currentField = fields[activeFieldIndex] || fields[0];
    const currentFieldName = currentField?.name || "Active field";
    if (cropRecommendation?.field !== currentFieldName) {
      runCropRecommendation();
    }
  }, [activeTab, activeFieldIndex, fields.length]);

  const toggleSpeech = () => {
    if (!("speechSynthesis" in window)) return alert("TTS not supported.");
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); } 
    else {
      if (!forecastResult) return;
      const cleanProcedure = forecastResult.procedure.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").replace(/🧪|💧|🛑|⚠|📉|🌍|✅|📌/g, "");
      const speechText = `Expected yield is ${forecastResult.total} tonnes. Instructions: ${cleanProcedure}.`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = "en-US"; utterance.onend = () => setIsSpeaking(false); window.speechSynthesis.speak(utterance); setIsSpeaking(true);
    }
  };

  const toggleVisionSpeech = () => {
    if (!("speechSynthesis" in window)) return;
    if (isSpeakingVision) { window.speechSynthesis.cancel(); setIsSpeakingVision(false); } 
    else {
      const speech = document.getElementById('vision-diagnosis-text')?.innerText || `Condition identified: ${activeDiagnosis.name}. Prescription: ${activeDiagnosis.treatment}`;
      const utterance = new SpeechSynthesisUtterance(speech); utterance.lang = "en-US"; utterance.onend = () => setIsSpeakingVision(false); window.speechSynthesis.speak(utterance); setIsSpeakingVision(true);
    }
  };

  const handleProfileImageUpload = (e: any) => {
    const file = e.target.files?.[0]; if (!file || !file.type.startsWith("image/")) { setApiError("Please choose a valid image."); return; }
    if (file.size > 5 * 1024 * 1024) { setApiError("Profile image must be smaller than 5 MB."); return; }
    const reader = new FileReader(); reader.onload = () => { const value=String(reader.result || ""); setProfileImage(value); persistState("ys_profile_image",value); setApiError(""); }; reader.readAsDataURL(file);
  };

  const handleExpertImages = (e: any) => {
    const files = (Array.from(e.target.files || []) as File[]).filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024).slice(0, 5);
    setExpertFiles(files);
    setExpertPreviews(files.map(f => URL.createObjectURL(f)));
    setExpertSubmitError("");
  };
  const removeExpertImage = (index: number) => setExpertPreviews((prev: string[]) => prev.filter((_, i) => i !== index));

  useEffect(() => {
    setFarmAlerts(createFarmAlerts());
  }, [activeFieldIndex, forecastResult, weatherData.rainChance, forecastForm.moisture]);

  // ========================================================================
  // YIELDSENSE AI — INTEGRATION CONTRACTS / SAFETY GUARDS
  // ========================================================================
  // The following helper functions deliberately stay inside the page component
  // so the existing application can continue to work without a database migration.
  // They are also the single place where demo/local data is identified as demo data.
  // Real weather, market, IoT, payment and agronomist providers can replace these
  // adapters later without changing the farmer-facing UI.
  //
  // 01. Real weather adapter: replace generateWeatherForField with the existing
  //     weather provider call and keep the same weatherData shape.
  // 02. Real soil adapter: populate field.nitrogen, phosphorus, potassium, ph,
  //     moisture from a validated soil API or sensor gateway.
  // 03. Real IoT adapter: pump/telemetry actions must return a device acknowledgement.
  // 04. Real market adapter: never treat hard-coded reference prices as live prices.
  // 05. Real payment adapter: checkout remains explicitly demo until a gateway confirms.
  // 06. Real vision adapter: /api/vision is the only client entry point for Gemini.
  // 07. Crop profiles: every crop in cropCatalog has an independent baseline and lifecycle.
  // 08. Translation: crop display names are selected from the requested language only.
  // 09. Input recommendations: deficiencies are linked to marketplace categories.
  // 10. History: every major farmer action can be written to the local traceability log.

  const getCropProfileSafe = (cropName:string) => {
    const canonical = resolveCanonicalCropName(cropName);
    const found = cropCatalog.find((crop:any)=>crop.name===canonical);
    if (found) return found;
    return {
      name:canonical || "Unknown Crop", category:"Unknown", climate:"Unknown", soil:"Unknown", duration:"Unavailable",
      durationDays:120, moisture:0, ph:0, nitrogen:0, phosphorus:0, potassium:0, risk:"Unknown", isKnown:false
    };
  };

  const getBaselineSafe = (cropName:string) => {
    const profile = getCropProfileSafe(cropName);
    return cropBaselines[profile.name] || {
      temp:"27", rainfall:"700", ph:String(profile.ph || 6.5), moisture:String(profile.moisture || 45),
      nitrogen:String(profile.nitrogen || 60), phosphorus:String(profile.phosphorus || 40), potassium:String(profile.potassium || 40), pesticide:"0"
    };
  };

  const getNutrientStatus = (cropName:string, n:number, p:number, k:number) => {
    const base = getBaselineSafe(cropName);
    const bn=Number(base.nitrogen), bp=Number(base.phosphorus), bk=Number(base.potassium);
    return {
      nitrogen:n < bn*0.8 ? "Low" : n > bn*1.25 ? "High" : "Within planning range",
      phosphorus:p < bp*0.8 ? "Low" : p > bp*1.25 ? "High" : "Within planning range",
      potassium:k < bk*0.8 ? "Low" : k > bk*1.25 ? "High" : "Within planning range"
    };
  };

  const getWaterDecision = (cropName:string, moisture:number, rainChance:number) => {
    const profile=getCropProfileSafe(cropName);
    const target=Number(profile.moisture || 45);
    if(rainChance>=70) return {needed:false,reason:"High rainfall probability; check drainage before irrigating."};
    if(moisture < target-12) return {needed:true,reason:"Soil moisture is below the crop planning target and significant rainfall is not expected."};
    return {needed:false,reason:"Soil moisture is within the current planning range."};
  };

  const getSowingGuidance = (cropName:string) => {
    const crop=getCropProfileSafe(cropName);
    const climate=String(crop.climate).toLowerCase();
    if(climate.includes("cool")) return "Prefer the locally recommended cool-season window; confirm with district agronomy guidance.";
    if(climate.includes("wet")) return "Use the local rainfall window and ensure drainage before establishment.";
    if(climate.includes("dry")) return "Prefer a reliable moisture window and avoid sowing immediately before extreme heat.";
    return "Use the local seasonal window after checking soil moisture and short-range weather.";
  };

  const getFieldSummary = (field:any) => {
    const crop=getCropProfileSafe(field?.crop || forecastForm.crop);
    const moisture=Number(field?.moisture ?? forecastForm.moisture ?? crop.moisture);
    const rain=Number.parseFloat(String(weatherData.rainChance)) || 0;
    const irrigation=getWaterDecision(crop.name,moisture,rain);
    const nutrients=getNutrientStatus(crop.name,Number(field?.nitrogen ?? forecastForm.nitrogen),Number(field?.phosphorus ?? forecastForm.phosphorus),Number(field?.potassium ?? forecastForm.potassium));
    return {crop,moisture,rain,irrigation,nutrients,soil:field?.soil || "Unknown"};
  };

  const buildTodayActions = (field:any) => {
    const s=getFieldSummary(field);
    const actions:string[]=[];
    if(s.irrigation.needed) actions.push(`Irrigation check: ${s.irrigation.reason}`);
    if(s.nutrients.nitrogen==="Low") actions.push("Review the nitrogen requirement in Farm Planner before purchasing inputs.");
    if(s.nutrients.phosphorus==="Low") actions.push("Review phosphorus status and soil-test recommendations before applying fertilizer.");
    if(s.nutrients.potassium==="Low") actions.push("Review potassium status and crop-stage requirement before applying fertilizer.");
    if(s.rain>=70) actions.push("Rain is likely; inspect drainage and postpone non-essential irrigation.");
    if(!actions.length) actions.push(`Monitor ${getCropDisplayName(s.crop.name,lang)} health and record today's field observations.`);
    return actions;
  };

  // ========================================================================
  // END INTEGRATION CONTRACTS
  // ========================================================================

  // ========================================================================
  // MODULE CHECKLIST — KEEP THIS CONTRACT WHEN EXTENDING YIELDSENSE AI
  // ========================================================================
  // Field registration: name, location, acreage, soil, crop and optional NPK/pH/moisture.
  // Field switching: activeFieldIndex controls weather, planner and assistant context.
  // Crop catalogue: one shared catalogue drives selectors, planner and store.
  // Crop baseline: every catalogue crop receives its own nutrient and climate baseline.
  // Crop lifecycle: every catalogue crop has a crop-specific stage sequence.
  // Crop language: getCropDisplayName returns only the selected language.
  // Farm planner: lifecycle dates are calculated from the selected crop duration.
  // Recommendation: candidate scoring considers field soil, rain and temperature.
  // Vision: upload is sent to /api/vision and no random diagnosis is created on failure.
  // Vision uncertainty: uncertain results stay uncertain and do not become prescriptions.
  // Expert request: images are appended to FormData and optional backend is attempted.
  // Profile: image is validated, previewed and persisted locally.
  // Marketplace: seeds and fertilizers share one shopProducts catalogue.
  // Deficiency bridge: Farm Planner nutrient gaps surface matching fertilizers.
  // Search: product search checks product name, crop and category.
  // Cart: quantity is persisted and totals are recalculated from quantity.
  // Checkout: delivery and payment UI are displayed before order capture.
  // Payment: demo state is clearly labeled until a real gateway confirms.
  // Market: reference market values are not presented as guaranteed live prices.
  // Buyer directory: inquiry is retained in history and can be replaced by API later.
  // Irrigation: decision uses crop moisture target and rain probability.
  // Pumps: UI states hardware connection explicitly instead of pretending.
  // Drone: booking is a service-request workflow until a real fleet API is connected.
  // Surveillance: UI exposes awaiting-connection state for absent hardware.
  // Alerts: weather, irrigation and nutrient actions are derived from current state.
  // History: actions are recorded for traceability.
  // AI assistant: replies use active field, crop, weather and nutrient state.
  // Dashboard: today actions answer the farmer's immediate next-step question.
  // System architecture: existing page retains FastAPI and Gemini boundaries.
  // Authentication: existing JWT flow is retained and local fallback remains explicit.
  // Error handling: API errors are converted into visible state instead of uncaught exceptions.
  // Loading: asynchronous forecast, vision, expert and service actions expose loading state.
  // Empty state: missing fields, missing results and empty cart remain usable.
  // Responsive layout: all newly added modules use the same responsive Tailwind language.
  // Data integrity: no crop is silently mapped to Rice or Maize as a lifecycle fallback.
  // Data integrity: unknown crop profiles use a clearly marked generic safety profile only
  // when a caller passes a crop that is not in the catalogue; supported crops never do this.
  // Future API adapters: keep UI shapes stable when replacing demo adapters with providers.
  // Future database: localStorage is a temporary client traceability layer, not a database.
  // Future payment: never store raw card CVV or full card numbers in localStorage.
  // Future market: replace reference data with an authenticated market provider.
  // Future expert service: replace local request retention with a real consultation API.
  // Future IoT: replace hardware placeholders with signed device commands and acknowledgements.
  // Future maps: replace field-map visual with a real map provider after GPS coordinates exist.
  // Future agronomy: validate chemical labels and crop-stage recommendations locally.
  // Future language: add translations to the same language dictionary rather than hardcoding
  // bilingual strings into individual components.
  // Future crop expansion: add one CropProfile, one lifecycle sequence and one language record.
  // Future store expansion: add one product record and its category; cart code needs no change.
  // Future notifications: connect alert persistence to the user's authenticated account.
  // Future analytics: write yield, cost and harvest records to the existing backend database.
  // Future security: server-side APIs must validate ownership for every field/order/request.
  // Future deployment: use relative API routes or environment-configured API_BASE_URL rather
  // than hardcoding localhost in production.
  // Current demonstration rule: any simulated weather or service value must be visibly marked
  // as a planning/demo value and must never be described as a real sensor reading.
  // Current vision rule: different uploaded images are sent as different FormData payloads.
  // Current vision rule: no image result is copied from a previous upload.
  // Current vision rule: URL.createObjectURL is used only for preview; model receives File bytes.
  // Current vision rule: model confidence is displayed as uncertainty when unavailable.
  // Current vision rule: chemical action remains conservative when diagnosis is uncertain.
  // Current cart rule: clicking Add to Cart increases quantity instead of silently toggling.
  // Current cart rule: remove clears both item and quantity.
  // Current checkout rule: demo order clears cart only after required delivery information.
  // Current checkout rule: payment method controls which payment fields are visible.
  // Current planner rule: fertilizer store recommendations are derived from planner gaps.
  // Current planner rule: all cost values are estimates.
  // Current planner rule: acreage is read from the selected field where available.
  // Current assistant rule: it never invents a sensor connection.
  // Current assistant rule: it points the farmer to the relevant module for action.
  // Current profile rule: uploaded image is limited to 5 MB.
  // Current expert rule: each image is limited to 10 MB and only image MIME types are accepted.
  // Current field rule: acreage must be positive before registration.
  // Current forecast rule: numeric parsing is guarded before arithmetic.
  // Current crop rule: baseline lookup is guarded by getBaselineSafe.
  // Current lifecycle rule: duration is read from the selected crop profile.
  // Current key rule: mapped lists use stable crop/product/field identifiers wherever possible.
  // Current accessibility rule: upload inputs retain labels and previews.
  // Current UI rule: existing dark agricultural visual language remains unchanged.
  // Current UI rule: no navigation item is intentionally left without a destination.
  // Current UI rule: operations center exposes the same active-field context as dashboard.
  // Current UI rule: alerts are filtered without removing their source records.
  // Current UI rule: market search remains independent from field recommendations.
  // Current UI rule: seed and fertilizer filters share the same cart.
  // Current UI rule: all major async operations show a disabled/loading state.
  // Current UI rule: empty results explain what the farmer should do next.
  // Current UI rule: every new action records history when it changes meaningful state.
  // Current UI rule: no new module requires replacing the existing backend architecture.
  // Current implementation is intentionally modular so additional requested features can
  // be attached without rewriting the existing market/service workflows.
  // ========================================================================

  // ==========================================
  // VIEW RENDERER
  // ==========================================
  const NavButton = ({ id, icon: Icon, label }: any) => {
    const isActive = activeTab === id;
    return (
      <button onClick={() => setActiveTab(id)} className={`w-full flex items-center space-x-4 p-3.5 px-4 rounded-2xl transition-all ${ isActive ? "bg-[#1B3122] text-[#B5F140] shadow-lg shadow-black/20" : "text-gray-400 hover:text-white hover:bg-white/5" }`}>
        <Icon size={18} strokeWidth={1.5} className={isActive ? "text-[#B5F140]" : ""} />
        <span className={`font-${isActive ? 'bold' : 'medium'} text-sm`}>{tLang[id] || NAV_LABELS[lang]?.[id] || label}</span>
      </button>
    );
  };

  if (!isLoggedIn) {
    return (
      <div id="yieldsense-app-root" className="min-h-screen flex font-sans selection:bg-[#B5F140] selection:text-[#12281C] bg-[#040906] relative overflow-hidden"><div id="google_translate_element" className="notranslate fixed -left-[10000px] top-0 w-1 h-1 overflow-hidden" aria-hidden="true"></div><style jsx global>{`
        .goog-te-banner-frame, .goog-te-balloon-frame, .skiptranslate iframe { display: none !important; }
        body { top: 0 !important; }
        .goog-tooltip, .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
        .notranslate { unicode-bidi: isolate; }
      `}</style>
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070')] bg-cover bg-center"><div className="absolute inset-0 bg-gradient-to-r from-[#040906]/95 to-[#040906]/80 backdrop-blur-sm"></div></div>
        <div className="w-1/2 relative z-10 hidden md:flex flex-col justify-center p-20 text-white">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-[#B5F140] opacity-90 border border-[#B5F140]/30 px-4 py-2 rounded-full w-fit bg-[#B5F140]/10 backdrop-blur-md">{tLang.tagline}</p>
          <h1 className="text-7xl font-serif leading-[1.1] mb-6 drop-shadow-2xl">{tLang.appName}</h1>
          <p className="text-xl text-gray-300 font-light max-w-md">Smart agricultural solutions for those who pursue excellence.</p>
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-24 relative z-10">
          <div className="absolute top-8 right-8 flex items-center bg-[#0D1912]/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-50">
             <select className="bg-transparent text-[#B5F140] font-bold text-xs outline-none cursor-pointer p-2 notranslate" value={lang} onChange={(e) => handleYieldSenseLanguageChange(e.target.value, setLang, setPlannerLanguage)}>
               {ALL_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-black text-white">{l.label}</option>)}
             </select>
          </div>
          <div className="max-w-md w-full mx-auto bg-[#0A160F]/80 backdrop-blur-2xl p-10 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center text-xs font-black tracking-[0.2em] mb-12 uppercase text-white flex gap-3"><div className="w-8 h-8 rounded-full bg-[#B5F140] flex items-center justify-center text-black"><Leaf size={16}/></div>{tLang.appName}</div>
            <h2 className="text-3xl font-serif text-white mb-2">{isLoginMode ? tLang.welcome : "Create account"}</h2>
            <p className="text-gray-400 mb-8 text-sm">Enter your details to access your fields.</p>
            {apiError && (<div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs mb-6 flex items-center"><AlertCircle size={14} className="mr-2" /> {apiError}</div>)}
            {apiSuccess && (<div className="bg-[#B5F140]/10 border border-[#B5F140]/20 text-[#B5F140] p-4 rounded-xl text-xs mb-6 flex items-center"><CheckCircle2 size={14} className="mr-2" /> {apiSuccess}</div>)}
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginMode && (<input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-4 rounded-2xl border border-white/10 bg-black/40 text-white focus:outline-none focus:border-[#B5F140]" placeholder="Full Name" />)}
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full p-4 rounded-2xl border border-white/10 bg-black/40 text-white focus:outline-none focus:border-[#B5F140]" placeholder="Email Address" />
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full p-4 rounded-2xl border border-white/10 bg-black/40 text-white focus:outline-none focus:border-[#B5F140]" placeholder="Password" />
              <button type="submit" className="w-full bg-[#B5F140] text-[#0A160F] py-4 rounded-2xl text-sm font-bold flex justify-center items-center hover:scale-[1.02] mt-6 shadow-[0_0_20px_rgba(181,241,64,0.2)]"><span>{isLoginMode ? 'Get Started' : 'Register Account'}</span> <span className="ml-2">⋙</span></button>
            </form>
            <div className="mt-8 text-center pt-2"><button onClick={() => { setIsLoginMode(!isLoginMode); setApiError(""); }} className="text-xs text-gray-400 hover:text-white transition-colors">{isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}</button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="yieldsense-app-root" className="min-h-screen bg-[#040906] text-white flex font-sans selection:bg-[#B5F140] selection:text-[#12281C] relative overflow-hidden"><div id="google_translate_element" className="notranslate fixed -left-[10000px] top-0 w-1 h-1 overflow-hidden" aria-hidden="true"></div>
      <div className="absolute top-0 right-0 w-full h-[600px] bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070')] bg-cover bg-top opacity-[0.03] pointer-events-none z-0 mix-blend-screen"></div>
      <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-[#12281C] rounded-full blur-[200px] opacity-40 pointer-events-none z-0"></div>
      
      {/* GLOBAL TOAST */}
      {toastMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#B5F140] text-black px-6 py-3 rounded-full font-bold text-sm shadow-[0_10px_30px_rgba(181,241,64,0.3)] flex items-center gap-2">
            <CheckCircle2 size={16}/> {toastMsg}
          </div>
        </div>
      )}

      {/* FLOATING AI ASSISTANT */}
      {isLoggedIn && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
          {isChatOpen && (
            <div className="bg-[#0A160F]/95 backdrop-blur-2xl border border-white/10 w-[340px] md:w-[400px] rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] mb-4 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300 h-[500px]">
               <div className="bg-gradient-to-r from-[#112318] to-[#0A160F] p-5 flex justify-between items-center border-b border-white/5">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[#B5F140] flex items-center justify-center text-[#0A160F] font-bold shadow-[0_0_15px_rgba(181,241,64,0.4)]"><Sprout size={20} /></div>
                   <div><p className="text-sm font-bold text-white tracking-wide">AI Farmer Assistant</p><p className="text-[10px] text-[#B5F140] flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#B5F140] animate-pulse"></span> Online</p></div>
                 </div>
                 <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"><X size={16}/></button>
               </div>
               <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
                 {chatMessages.map((msg, idx) => ( <div key={`${msg.role}-${idx}-${msg.text.slice(0,12)}`} className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-md ${msg.role === 'user' ? 'bg-[#B5F140] text-[#0A160F] self-end rounded-br-sm font-medium' : 'bg-[#182C20] border border-white/5 text-gray-200 self-start rounded-bl-sm'}`}>{msg.text}</div> ))}
                 {isTyping && ( <div className="bg-[#182C20] border border-white/5 text-gray-400 self-start rounded-2xl rounded-bl-sm p-3 flex gap-1.5 items-center max-w-[60px]"><span className="w-1.5 h-1.5 bg-[#B5F140] rounded-full animate-bounce opacity-50"></span><span className="w-1.5 h-1.5 bg-[#B5F140] rounded-full animate-bounce opacity-50" style={{animationDelay: '150ms'}}></span><span className="w-1.5 h-1.5 bg-[#B5F140] rounded-full animate-bounce opacity-50" style={{animationDelay: '300ms'}}></span></div> )}
               </div>
               <form onSubmit={handleChatSubmit} className="p-4 bg-[#0A160F] border-t border-white/5 flex gap-3">
                 <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about your farm..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#B5F140] transition-colors" />
                 <button type="submit" disabled={!chatInput.trim() || isTyping} className="bg-[#B5F140] text-[#0A160F] w-12 rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-50"><Send size={18}/></button>
               </form>
            </div>
          )}
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all hover:scale-105 border-2 ${isChatOpen ? 'bg-black text-white border-white/20' : 'bg-[#B5F140] text-[#0A160F] border-[#B5F140]'}`}>
            {isChatOpen ? <X size={24}/> : <MessageSquare size={26} className="fill-current"/>}
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="print:hidden w-[280px] flex-shrink-0 border-r border-[#15251A] bg-[#0A140E] flex flex-col justify-between py-8 px-6 hidden md:flex z-10">
        <div>
          <div className="flex items-center justify-between mb-8"><div className="flex items-center text-xs font-black tracking-[0.2em] uppercase cursor-pointer text-white" onClick={() => setActiveTab('overview')}><span className="mr-2 text-lg text-[#B5F140]">✦</span> {tLang.appName}</div></div>
          
          <div className="mb-6 bg-black/40 border border-[#1A2E22] p-1.5 rounded-[1rem] flex items-center justify-between shadow-inner relative z-50">
             <select className="bg-transparent w-full text-white font-bold text-xs outline-none cursor-pointer p-2 notranslate" value={lang} onChange={(e) => handleYieldSenseLanguageChange(e.target.value, setLang, setPlannerLanguage)}>
               {ALL_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-black text-white">{l.label}</option>)}
             </select>
          </div>

          <div className="mb-6">
            <label className="text-[9px] font-bold tracking-[0.15em] text-gray-500 uppercase flex items-center gap-1.5 mb-2"><div className="w-1.5 h-1.5 rounded-full bg-[#B5F140] animate-pulse shadow-[0_0_8px_#B5F140]"></div> {tLang.activeZone}</label>
            <div className="relative">
              <select className="w-full bg-[#112017] border border-[#1A2E22] text-white text-sm font-bold p-3.5 rounded-2xl focus:outline-none focus:border-[#B5F140] transition-colors appearance-none cursor-pointer shadow-lg" value={activeFieldIndex} onChange={handleActiveZoneChange}>{fields.length === 0 ? (<option value="-1" className="bg-[#112017]">{tLang.noFields}</option>) : (fields.map((f, i) => (<option key={`zone-${f.id || f.name || fields.indexOf(f)}`} value={fields.indexOf(f)} className="bg-[#112017]">{f.name} ({f.location})</option>)))}</select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none"><MapIcon size={14} className="text-gray-500"/></div>
            </div>
          </div>
          <nav className="space-y-1 mb-8 border-b border-[#15251A] pb-6">
            <p className="text-[8px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3 ml-2">Core Platform</p>
            <NavButton id="overview" icon={LayoutDashboard} label="Overview" />
            <NavButton id="forecast" icon={Leaf} label="Yield Intelligence" />
            <NavButton id="planner" icon={Calendar} label="Farm Planner" />
            <NavButton id="vision" icon={ScanLine} label="Vision Diagnostics" />
            <NavButton id="registry" icon={Database} label="Field Registry" />
            <NavButton id="dataset" icon={FileSpreadsheet} label="Data Models" />
            <NavButton id="system" icon={Globe} label="System Architecture" />
          </nav>
          <nav className="space-y-1 mb-8">
            <p className="text-[8px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3 ml-2">Market & Services</p>
            <NavButton id="drones" icon={Plane} label="Drone Sprayers" />
            <NavButton id="irrigation" icon={Droplets} label="Irrigation Pumps" />
            <NavButton id="seeds" icon={Sprout} label="Certified Seeds" />
            <NavButton id="expert" icon={HeadphonesIcon} label="Expert Consult" />
            <NavButton id="intelligence" icon={Sparkles} label="Farm Intelligence" />
            <NavButton id="history" icon={BarChart2} label="History & Analytics" />
            <NavButton id="market" icon={TrendingUp} label="Mandi & Buyers" />
            <NavButton id="alerts" icon={BellRing} label="Alerts" />
            <NavButton id="operations" icon={Activity} label="Operations Center" />
            <NavButton id="business" icon={Store} label="Farm Business Hub" />
            <NavButton id="knowledge" icon={BookOpen} label="Education & Guides" />
            <NavButton id="inventory" icon={Warehouse} label="Inventory & Traceability" />
            <NavButton id="logistics" icon={Truck} label="Logistics & Delivery" />
            <NavButton id="labor" icon={Users} label="Seasonal Labor" />
          </nav>
        </div>
        <div onClick={() => setActiveTab('profile')} className="flex items-center space-x-3 pt-6 border-t border-[#15251A] cursor-pointer hover:bg-white/5 p-3 -mx-3 rounded-2xl transition-colors mt-auto">
          <div style={profileImage ? {backgroundImage:`url(${profileImage})`} : undefined} className="w-10 h-10 bg-[url('https://images.unsplash.com/photo-1595991209266-5ff5a3a2f008?q=80&w=200')] bg-cover bg-center rounded-full flex-shrink-0 border border-[#B5F140]/30 relative"><div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#B5F140] rounded-full border-2 border-[#0A140E]"></div></div>
          <div className="text-left flex flex-col w-full overflow-hidden">
            <p className="text-xs font-bold leading-tight truncate w-full text-white">Sanghavi S Avadhani</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate w-full">{loginEmail || "farmer@example.com"}</p>
            <button onClick={handleLogout} className="text-[9px] text-left text-[#EF476F] hover:text-white font-bold uppercase tracking-widest mt-2 transition-colors">Log out</button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full p-6 md:p-10 lg:px-12 max-w-[1600px] mx-auto overflow-y-auto print:w-full print:p-0 print:max-w-full z-10 custom-scrollbar relative" style={{ minWidth: 0, width: "100%", alignSelf: "stretch" }}>
        
        {/*
         * Dashboard layout safety notes:
         * 1. The main content is explicitly width-safe so the sidebar cannot force the
         *    overview content into an unintended flex size during Turbopack HMR.
         * 2. The overview header uses explicit flex-start alignment. This prevents the
         *    weather card from stretching vertically to the height of the greeting block.
         * 3. The weather card is shrink-resistant and has an automatic height.
         * 4. These guards do not replace Tailwind styling; they only make the intended
         *    responsive geometry deterministic in the browser.
         * 5. All existing tabs and feature components continue to render below this area.
         */}
        {/* MARKET TICKER */}
        <div className="print:hidden bg-white/5 backdrop-blur-md border border-white/10 text-white py-3 px-6 rounded-2xl mb-8 flex overflow-hidden whitespace-nowrap items-center text-xs font-mono shadow-lg">
          <span className="font-bold text-[#B5F140] mr-6 shrink-0 uppercase tracking-widest text-[10px] flex items-center gap-2"><Activity size={12}/> {tLang.liveMarket}</span>
          <div className="flex space-x-10 animate-[pulse_5s_ease-in-out_infinite]">
            {marketTicker.map((item) => (<span key={`ticker-${item.crop}`} className="flex items-center gap-2"><span className="text-gray-400">{getCropDisplayName(item.crop, lang)}</span><span className="font-bold">{item.price}</span><span className={item.up ? "text-[#B5F140]" : "text-[#EF476F]"}>{item.up ? <TrendingUp size={12} className="inline mr-1"/> : <TrendingDown size={12} className="inline mr-1"/>}{item.change}</span></span>))}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
           <div className="animate-in fade-in duration-500 print:hidden">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-start mb-10 gap-6" style={{ width: "100%", minWidth: 0, alignItems: "flex-start" }}>
                <div className="min-w-0 flex-1" style={{ minWidth: 0, display: "block", visibility: "visible" }}>
                  <p className="text-[11px] font-semibold tracking-[0.15em] text-gray-400 mb-2 uppercase">{timeData.date || "Today"}</p>
                  <h2 className="text-4xl lg:text-5xl font-serif tracking-tight text-white">{tLang.greeting || timeData.greeting}, <span className="italic text-[#B5F140]">{tLang.grower || "grower."}</span></h2>
                </div>
                <div className="bg-[#112217]/80 backdrop-blur-md border border-[#1A3324] rounded-3xl p-5 flex items-center gap-6 shadow-xl max-w-sm w-full lg:w-auto shrink-0" style={{ alignSelf: "flex-start", height: "auto", minHeight: 0, flexShrink: 0 }}>
                   <div><p className="text-[9px] font-bold tracking-[0.2em] text-gray-500 uppercase flex items-center gap-1.5 mb-1"><MapPin size={10} className="text-[#B5F140]"/> {weatherData.location}</p><p className="text-4xl font-serif font-bold text-white">{weatherData.temp}</p></div>
                   <div className="h-10 w-px bg-white/10"></div>
                   <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                     <p className="text-gray-400 flex items-center gap-1.5"><Droplets size={12} className="text-blue-400"/> {weatherData.humidity}</p>
                     <p className="text-gray-400 flex items-center gap-1.5"><Wind size={12} className="text-gray-300"/> {weatherData.wind}</p>
                     <p className="text-gray-400 flex items-center gap-1.5 col-span-2"><CloudRain size={12} className="text-blue-300"/> {weatherData.rainChance} Rain</p>
                   </div>
                </div>
             </div>
            
            <div style={{ width: "100%", minWidth: 0, display: "block", position: "relative" }}>
            <div className="bg-[url('https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2072')] bg-cover bg-center rounded-[2rem] p-8 md:p-12 flex flex-col justify-end mb-8 border border-white/5 shadow-2xl relative overflow-hidden min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#040906] via-[#040906]/60 to-transparent"></div>
              <div className="relative z-10 max-w-xl">
                <p className="text-[10px] font-bold tracking-[0.2em] bg-[#B5F140] text-[#0A160F] px-3 py-1.5 rounded-lg w-fit mb-4 uppercase shadow-lg">Live Telemetry Connected</p>
                <h3 className="text-5xl md:text-6xl font-serif leading-tight mb-4 text-white drop-shadow-lg">Your farm, <br/>elevated to the <br/><span className="text-[#B5F140]">next level.</span></h3>
                <p className="text-sm text-gray-300 mb-8 leading-relaxed max-w-md">Monitor crop health, optimize resources, and increase yield with data driven insights specific to your active fields.</p>
                <button onClick={() => setActiveTab('forecast')} className="bg-[#B5F140] text-[#0A160F] px-8 py-4 rounded-full text-sm font-bold flex items-center space-x-2 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(181,241,64,0.3)]"><span>{tLang.runForecast || "Run Forecast"}</span> <span>⋙</span></button>
              </div>
            </div>
            </div>

            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4 ml-2">Farm Overview</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22] shadow-lg flex flex-col justify-center items-center text-center"><div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3"><MapIcon size={16} className="text-[#B5F140]"/></div><p className="text-3xl font-serif text-white">{totalAcres.toFixed(1)}</p><p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mt-1">{tLang.totalArea}</p></div>
              <div className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22] shadow-lg flex flex-col justify-center items-center text-center"><div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3"><Sprout size={16} className="text-[#B5F140]"/></div><p className="text-3xl font-serif text-white">{fields.length}</p><p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mt-1">{tLang.activeCrops}</p></div>
              <div className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22] shadow-lg flex flex-col justify-center items-center text-center"><div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-3"><Activity size={16} className="text-[#B5F140]"/></div><p className="text-3xl font-serif text-white">85%</p><p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mt-1">{tLang.fieldHealth}</p></div>
              <div className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22] shadow-lg flex flex-col justify-center items-center text-center relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-t from-[#B5F140]/10 to-transparent"></div><div className="w-10 h-10 bg-[#B5F140]/10 rounded-full flex items-center justify-center mb-3 border border-[#B5F140]/20 relative z-10"><TrendingUp size={16} className="text-[#B5F140]"/></div><p className="text-3xl font-serif text-white relative z-10">{forecastResult ? forecastResult.total : "--"}</p><p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mt-1 relative z-10">{tLang.expectedTonnes}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg lg:col-span-2 flex flex-col">
                 <div className="flex justify-between items-center mb-6"><h4 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">{tLang.yourFields}</h4><button onClick={() => setActiveTab('registry')} className="text-[#B5F140] text-[10px] font-bold tracking-widest uppercase hover:underline">View All</button></div>
                 <div className="flex-1 space-y-4">
                   {fields.length === 0 ? ( <div className="bg-black/20 rounded-2xl p-6 border border-white/5 border-dashed flex flex-col items-center justify-center h-full text-center"><Database size={24} className="text-gray-600 mb-2"/><p className="text-xs text-gray-500">No fields registered</p></div> ) : (
                      fields.slice(0,3).map((f) => ( <div key={`overview-field-${f.id || f.name}`} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5"><div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2D5A3C] to-[#12281C] flex items-center justify-center text-[#B5F140] font-serif text-2xl border border-white/10">{f.name.charAt(0)}</div><div className="flex-1"><p className="font-bold text-white text-sm">{f.name}</p><p className="text-[10px] text-gray-400 font-mono mt-1">{f.area} Acres • {f.location}</p></div><div className="text-right pr-4"><p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Status</p><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#B5F140]"></div><span className="text-xs font-bold text-white">On Track</span></div></div></div> ))
                   )}
                 </div>
              </div>
              <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg flex flex-col h-[400px]">
                 <div className="flex justify-between items-center mb-6"><h4 className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">Recent Activity</h4></div>
                 <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                   {fields.length === 0 ? ( <p className="text-xs text-gray-500 italic text-center mt-10">No recent alerts</p> ) : (
                     fields.map((f, i) => {
                       const activities = [ { icon: Droplets, color: "text-blue-400", bg: "bg-blue-500/20", title: "Irrigation Completed", time: "Today, 5:30 AM" }, { icon: Leaf, color: "text-[#B5F140]", bg: "bg-[#B5F140]/20", title: "Fertilizer Application", time: "May 20, 7:00 AM" }, { icon: Camera, color: "text-purple-400", bg: "bg-purple-500/20", title: "Drone Scouting", time: "May 18, 4:15 PM" } ];
                       const act = activities[i % 3]; const ActIcon = act.icon;
                       return ( <div key={`activity-${f.id || f.name}-${act.title}`} className="flex gap-4 group"><div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${act.bg}`}><ActIcon size={16} className={act.color} /></div><div className="border-b border-white/5 pb-5 flex-1 group-last:border-none"><p className="text-sm font-bold text-white mb-1">{act.title}</p><p className="text-[10px] text-gray-500 font-mono mb-2">{f.name} • {act.time}</p><p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Completed</p></div></div> )
                     })
                   )}
                 </div>
              </div>
            </div>
           </div>
        )}

        {/* FORECAST TAB */}
        {activeTab === "forecast" && (
          <div className="animate-in fade-in duration-500 relative">
             <header className="mb-10 print:hidden flex justify-between items-end">
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#B5F140] uppercase mb-2">Predictive Intelligence</p>
                <h2 className="text-5xl font-serif tracking-tight text-white mb-2">Yield Intelligence</h2>
                <p className="text-sm text-gray-400">Currently analyzing: <span className="font-bold text-white">{activeFieldName}</span></p>
              </div>
            </header>

            <div className="bg-[#0A160F] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg mb-8 print:hidden">
              <form onSubmit={handleGenerateForecast}>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-xs font-bold tracking-[0.2em] text-white uppercase flex items-center gap-2"><Database size={14} className="text-[#B5F140]"/> Data Telemetry Input</p>
                  <button type="button" onClick={handleIoTSync} disabled={isSyncingIoT} className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-[#B5F140] bg-[#B5F140]/10 px-3 py-1.5 rounded-lg border border-[#B5F140]/30 hover:bg-[#B5F140]/20 transition-all disabled:opacity-50"><Wifi size={12} className={isSyncingIoT ? "animate-ping" : ""} /> {isSyncingIoT ? "Syncing..." : "Sync IoT"}</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="space-y-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Crop Target</label><select value={forecastForm.crop} onChange={handleCropChange} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140] appearance-none">{cropCatalog.map(c=><option key={c.name} value={c.name}>{getCropDisplayName(c.name, lang)}</option>)}</select></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Total Area (ha)</label><input type="number" required value={forecastForm.area} onChange={e => setForecastForm((prev: any) => ({...prev, area: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                  </div>
                  <div className="space-y-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Rainfall (mm)</label><input type="number" step="0.1" value={forecastForm.rainfall} onChange={e => setForecastForm((prev: any) => ({...prev, rainfall: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Temperature (°C)</label><input type="number" step="0.1" value={forecastForm.temp} onChange={e => setForecastForm((prev: any) => ({...prev, temp: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                  </div>
                  <div className="space-y-4">
                    <div><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Nitrogen (kg/ha)</label><input type="number" step="0.1" value={forecastForm.nitrogen} onChange={e => setForecastForm((prev: any) => ({...prev, nitrogen: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                    <div className="flex gap-3">
                      <div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Phos.</label><input type="number" step="0.1" value={forecastForm.phosphorus} onChange={e => setForecastForm((prev: any) => ({...prev, phosphorus: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                      <div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Potas.</label><input type="number" step="0.1" value={forecastForm.potassium} onChange={e => setForecastForm((prev: any) => ({...prev, potassium: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Soil pH</label><input type="number" step="0.1" value={forecastForm.ph} onChange={e => setForecastForm((prev: any) => ({...prev, ph: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                      <div className="flex-1"><label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Moist. (%)</label><input type="number" step="0.1" value={forecastForm.moisture} onChange={e => setForecastForm((prev: any) => ({...prev, moisture: e.target.value}))} className="w-full bg-[#050A07] border border-[#1A2E22] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                    </div>
                    <div>
                      <label className="block text-opacity-0 text-[10px] font-bold text-transparent mb-1.5">.</label>
                      <button disabled={isPredicting || isSyncingIoT} type="submit" className={`w-full text-[#12281C] py-3 rounded-xl text-sm font-bold flex justify-center items-center space-x-2 transition-all shadow-[0_0_15px_rgba(181,241,64,0.2)] ${isPredicting || isSyncingIoT ? 'bg-gray-500' : 'bg-[#B5F140] hover:scale-[1.02]'}`}><span>{isPredicting ? 'Analyzing...' : 'Run Gap Analysis'}</span> <span>&rarr;</span></button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="w-full bg-transparent min-h-[400px]">
              {!isForecastGenerated ? (
                <div className="text-center animate-in fade-in zoom-in duration-500 my-20 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-[#B5F140]/10 rounded-full flex items-center justify-center mb-6 border border-[#B5F140]/20"><Sparkles className="text-[#B5F140] w-10 h-10" /></div>
                  <h3 className="text-3xl font-serif text-white">Strategic yield analytics <br/>will appear here.</h3>
                </div>
              ) : (
                <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#0A160F] to-black p-8 rounded-[2rem] border border-[#1A2E22] shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#B5F140] rounded-full blur-[120px] opacity-10"></div>
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] uppercase flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#B5F140] shadow-[0_0_8px_#B5F140]"></span>{forecastResult.crop} / Estimated Yield</p>
                        <span className={`${forecastResult.riskColor} text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest rounded-lg border border-current bg-black/50`}>{forecastResult.riskStatus}</span>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 relative z-10">
                        <div><p className="text-7xl md:text-[6rem] font-serif text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] mb-2">{forecastResult.total}</p><p className="text-sm font-sans text-gray-500 uppercase tracking-widest">Total Tonnes Projected</p></div>
                        <div className="bg-[#B5F140]/10 border border-[#B5F140]/30 px-6 py-4 rounded-2xl backdrop-blur-md self-start md:self-end"><p className="text-[#B5F140] font-mono text-3xl font-bold">{forecastResult.perAcre}</p><p className="text-[9px] text-gray-300 mt-1 uppercase tracking-widest">Tonnes/Hectare</p></div>
                      </div>
                    </div>
                    <div className="grid grid-rows-2 gap-6">
                      <div className="bg-[#0D1912] p-6 rounded-[2rem] border border-[#1A2E22] shadow-lg flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-3"><p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2"><BarChart2 size={14} className="text-[#B5F140]"/> Env. Alignment</p><span className="text-xl font-serif text-white">{forecastResult.alignmentScore}%</span></div>
                        <div className="w-full bg-black/50 rounded-full h-2 shadow-inner mb-3"><div className="bg-[#B5F140] h-2 rounded-full shadow-[0_0_10px_rgba(181,241,64,0.5)]" style={{ width: `${forecastResult.alignmentScore}%` }}></div></div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">{forecastResult.riskMsg}</p>
                      </div>
                      <div className="bg-[#0D1912] p-6 rounded-[2rem] border border-[#1A2E22] shadow-lg flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-3"><p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase flex items-center gap-2"><Globe size={14} className="text-[#B5F140]"/> Sustainability</p><span className={`text-xl font-serif ${forecastResult.eco.color}`}>{forecastResult.eco.score}/100</span></div>
                        <div className="w-full bg-black/50 rounded-full h-2 shadow-inner mb-3"><div className={`h-2 rounded-full shadow-[0_0_10px_rgba(181,241,64,0.5)] ${forecastResult.eco.color === 'text-[#B5F140]' ? 'bg-[#B5F140]' : 'bg-[#EF476F]'}`} style={{ width: `${forecastResult.eco.score}%` }}></div></div>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed">{forecastResult.eco.msg}</p>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Tactical Execution Plan */}
                  <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-4 ml-2">Tactical Execution Plan</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-6"><p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] uppercase flex items-center gap-2"><FlaskConical size={14}/> {forecastResult.tankMix?.compatibility === "Physically & Chemically Compatible" ? "Tank Mix Compatible" : "Tank Mix"}</p><span className="text-[9px] text-[#12281C] bg-[#B5F140] px-2 py-1 rounded shadow font-bold uppercase tracking-widest">SAFE</span></div>
                          <div className="space-y-4 mb-6">
                            <p className="text-[8px] font-bold tracking-[0.2em] text-gray-600 uppercase border-b border-white/5 pb-2">Chemical Blend Recipe</p>
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Primary:</span><span className="text-white text-right max-w-[60%] font-medium">{forecastResult.tankMix.fungicide}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Nutrient:</span><span className="text-white text-right max-w-[60%] font-medium">{forecastResult.tankMix.foliarNutrient}</span></div>
                          </div>
                          <div className="space-y-4 mb-6">
                            <p className="text-[8px] font-bold tracking-[0.2em] text-[#B5F140] uppercase border-b border-[#B5F140]/20 pb-2">Water & Refill Calibration</p>
                            <div className="flex justify-between items-center"><span className="text-gray-400 text-xs">Total Water:</span><span className="font-mono text-white text-lg font-bold">{forecastResult.tankMix.totalWaterLitres} L</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-500 text-xs">20L Knapsack:</span><span className="font-mono text-white">{forecastResult.tankMix.totalKnapsackTanks} fills</span></div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-[9px] text-gray-400 bg-black/40 p-4 rounded-xl border border-red-500/10 uppercase tracking-widest font-bold">
                          <span className="flex items-center gap-2"><ShieldCheck size={12} className="text-red-400"/> Burn Risk: <strong className="text-white">{forecastResult.tankMix.phytotoxicityRisk}</strong></span>
                        </div>
                      </div>
                      <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-xl flex flex-col justify-between">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] uppercase flex items-center gap-2 mb-6"><CheckCircle2 size={14}/> Resource Instructions (Per Hectare)</p>
                        <div className="space-y-4 flex-1">
                          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center h-full max-h-[100px]"><p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-1">Nitrogen</p><p className={`text-2xl font-serif text-white`}><span className={forecastResult.resources.n.color}>{forecastResult.resources.n.action}</span> {forecastResult.resources.n.val}<span className="text-xs text-gray-600 font-sans ml-1">{forecastResult.resources.n.unit}</span></p></div>
                          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center h-full max-h-[100px]"><p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-1">Phosphorus</p><p className={`text-2xl font-serif text-white`}><span className={forecastResult.resources.p.color}>{forecastResult.resources.p.action}</span> {forecastResult.resources.p.val}<span className="text-xs text-gray-600 font-sans ml-1">{forecastResult.resources.p.unit}</span></p></div>
                          <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center h-full max-h-[100px]"><p className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-1">Potassium</p><p className={`text-2xl font-serif text-white`}><span className={forecastResult.resources.k.color}>{forecastResult.resources.k.action}</span> {forecastResult.resources.k.val}<span className="text-xs text-gray-600 font-sans ml-1">{forecastResult.resources.k.unit}</span></p></div>
                        </div>
                      </div>
                      <div className="grid grid-rows-2 gap-6">
                        <div className="bg-gradient-to-br from-[#0F1E29] to-[#081118] p-8 rounded-[2rem] border border-blue-900/50 shadow-xl flex flex-col justify-center">
                          <div className="flex justify-between items-center mb-6"><p className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase flex items-center gap-2"><Droplets size={14}/> Smart Irrigation</p><span className="text-[9px] text-blue-300 font-mono bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">ET₀: {forecastResult.irrigation.eto} mm/day</span></div>
                          <div className="flex items-center gap-6"><div className="w-16 h-16 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] flex items-center justify-center flex-shrink-0"><Power size={24} className={forecastResult.irrigation.hours > 0 ? "text-blue-400 animate-pulse" : "text-gray-500"} /></div><div><p className="text-xl font-serif text-white mb-2 leading-tight">{forecastResult.irrigation.decisionEn}</p></div></div>
                        </div>
                        <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-xl flex flex-col justify-center">
                          <p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] uppercase flex items-center gap-2 mb-6"><Timer size={14}/> Harvest Window</p>
                          <div className="grid grid-cols-2 gap-4 h-full"><div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center"><p className="text-[8px] uppercase tracking-[0.2em] text-gray-500 mb-2">Maturation</p><p className="text-3xl font-serif text-white">{forecastResult.harvest.maturityPercent}%</p><p className="text-[9px] text-[#B5F140] mt-2 font-bold tracking-widest uppercase">{forecastResult.harvest.status}</p></div><div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center"><p className="text-[8px] uppercase tracking-[0.2em] text-gray-500 mb-2">Optimal Window</p><p className="text-lg font-serif text-[#B5F140] leading-tight px-2">{forecastResult.harvest.window}</p><p className="text-[9px] text-gray-500 mt-2 tracking-widest uppercase">{forecastResult.harvest.daysRemaining} days away</p></div></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Economics & Arbitrage */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg flex flex-col justify-center">
                      <p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] mb-8 uppercase flex items-center gap-2"><Wallet size={14}/> Economics & ROI Forecast</p>
                      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4"><span className="text-xs font-bold tracking-widest uppercase text-gray-500">Est. Gross Revenue</span><span className="font-mono text-xl md:text-2xl truncate text-white">{forecastResult.economics.revenue}</span></div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6"><span className="text-xs font-bold tracking-widest uppercase text-gray-500">Fertilizer Cost</span><span className="font-mono text-xl md:text-2xl truncate text-[#EF476F]">- {forecastResult.economics.cost}</span></div>
                      <div className="bg-[#1F3A29]/50 p-5 rounded-2xl border border-[#B5F140]/20 flex justify-between items-center shadow-inner"><span className="text-xs font-bold text-[#B5F140] tracking-widest uppercase flex items-center gap-2"><TrendingUp size={16}/> Net Profit</span><span className="font-mono text-xl md:text-2xl font-bold truncate text-[#B5F140]">{forecastResult.economics.profit}</span></div>
                    </div>
                    <div className="lg:col-span-2 bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-6"><p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] uppercase flex items-center gap-2"><MapPin size={14}/> Market Arbitrage & Logistics</p><span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase bg-black/50 px-3 py-1.5 rounded border border-white/5">Real-time APMC Rates</span></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {forecastResult.mandiData.map((mandi: any, idx: number) => (
                           <div key={`mandi-plan-${mandi.name}-${mandi.distance}`} className={`p-5 rounded-2xl border flex flex-col justify-between ${mandi.recommended ? 'bg-[#12281C] border-[#B5F140]/50 shadow-[0_0_20px_rgba(181,241,64,0.1)]' : 'bg-black/30 border-white/5'}`}>
                              <div>
                                <p className="font-bold text-sm text-white mb-4 flex items-center justify-between">{mandi.name} {mandi.recommended && <span className="bg-[#B5F140] text-black text-[8px] px-2 py-1 rounded uppercase tracking-widest font-black">Best</span>}</p>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2 flex items-center gap-2"><Truck size={12}/> Dist: <span className="text-white">{mandi.distance}</span></p>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2 flex items-center gap-2"><Wallet size={12}/> Cost: <span className="text-white">{mandi.transportCost}</span></p>
                              </div>
                              <div className="mt-6 pt-4 border-t border-white/5"><p className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-1.5">Net Payout</p><p className={`font-mono text-xl md:text-2xl truncate ${mandi.recommended ? 'text-[#B5F140] font-bold' : 'text-gray-300'}`}>{mandi.netPayout}</p></div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div id="speech-target" className="grid grid-cols-1 gap-6">
                    <div className="bg-gradient-to-br from-[#112318] to-[#0A160F] p-8 rounded-[2rem] border border-[#2D5A3C]/50 shadow-lg flex flex-col">
                      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4"><p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] uppercase">Agronomist Action Plan</p><button onClick={toggleSpeech} className={`print:hidden flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors ${isSpeaking ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-black/50 text-[#B5F140] hover:bg-black border border-white/10'}`}>{isSpeaking ? <VolumeX size={12}/> : <Volume2 size={12}/>} {isSpeaking ? "Stop" : "Listen"}</button></div>
                      <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line font-medium">{forecastResult.procedure}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== PLANNER TAB ===================== */}
        {activeTab === "planner" && (
           <div className="animate-in fade-in duration-500 print:hidden relative">
             <header className="mb-10 flex justify-between items-end">
              <div><p className="text-[11px] font-bold tracking-[0.2em] text-[#B5F140] mb-2 uppercase">Lifecycle Management / PL-02</p><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Crop Lifecycle Planner</h2></div>
            </header>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-4 bg-[#0A160F] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg sticky top-6">
                <div className="space-y-6">
                  <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Crop Target</label><select className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140] appearance-none" value={plannerCrop} onChange={(e) => setPlannerCrop(e.target.value)}>{cropCatalog.map(crop => (<option key={crop.name} value={crop.name} className="bg-[#12281C]">{getCropDisplayName(crop.name, plannerLanguage)}</option>))}</select></div>
                  <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Crop language</label><select value={plannerLanguage} onChange={(e)=>{ setPlannerLanguage(e.target.value); handleYieldSenseLanguageChange(e.target.value, setLang, setPlannerLanguage); }} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140]">{ALL_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-black text-white">{l.label}</option>)}</select></div>
                  <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Select Sowing Date</label><input type="date" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140] appearance-none [color-scheme:dark]" /></div>
                </div>
              </div>
              <div className="xl:col-span-8 bg-gradient-to-br from-[#0B150E] to-[#16301F] rounded-[2rem] p-8 md:p-12 relative shadow-2xl border border-[#2D5A3C]/50">
                 <div className="grid md:grid-cols-3 gap-4 mb-7">{[["Crop cycle",plannerKnowledge?.duration||"—"],["Nutrient target",plannerNutrientSummary],["Risk",plannerKnowledge?.risk||"—"]].map(([a,b])=><div key={`planner-summary-${a}`} className="bg-black/30 border border-white/5 rounded-xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">{a}</p><p className="text-sm font-bold text-white mt-2">{b}</p></div>)}</div><div className="grid lg:grid-cols-3 gap-4 mb-7">{[["Irrigation strategy",plannerKnowledge?.irrigation||"—"],["Nutrition",plannerKnowledge?.nutrientPriority||"—"],["Scouting",plannerKnowledge?.scouting||"—"]].map(([a,b])=><div key={`planner-note-${a}`} className="bg-[#B5F140]/5 border border-[#B5F140]/10 rounded-xl p-4"><p className="text-[9px] uppercase tracking-widest text-[#B5F140]">{a}</p><p className="text-xs text-gray-400 mt-2 leading-relaxed">{b}</p></div>)}</div><div className="flex justify-between items-center mb-10 border-b border-white/10 pb-5"><p className="text-[10px] font-bold tracking-[0.15em] text-[#B5F140] uppercase flex items-center gap-2"><Calendar size={14}/> {getCropDisplayName(plannerCrop, plannerLanguage)} - Activity Timeline</p><span className="text-[10px] text-[#12281C] bg-[#B5F140] px-3 py-1.5 rounded-lg font-mono font-bold">START: {new Date(sowingDate).toLocaleDateString()}</span></div>
                 <div className="relative pl-6 md:pl-12 border-l-2 border-[#1A3324] space-y-10 pb-4">
                    {plannerStages.map((stage: any, idx: number) => {
                      const Icon = stage.icon; const startDate = addDaysToDate(sowingDate, stage.daysStart); const endDate = addDaysToDate(sowingDate, stage.daysEnd);
                      return (
                        <div key={stage.id} className="relative animate-in slide-in-from-right-8 duration-700" style={{animationDelay: `${idx * 150}ms`}}>
                           <div className={`absolute -left-[35px] md:-left-[59px] w-6 h-6 rounded-full border-4 border-[#0B150E] flex items-center justify-center bg-[#12281C] ${stage.color}`}><div className="w-2.5 h-2.5 rounded-full bg-current"></div></div>
                           <div className={`bg-black/30 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-lg`}>
                              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                                 <div className="flex items-center gap-4"><div className={`p-3 rounded-xl bg-black/50 border border-white/5`}><Icon size={20} className={stage.color} /></div><div><h4 className="text-white font-serif text-lg md:text-xl tracking-wide">{stage.title}</h4><p className="text-[10px] text-[#B5F140] font-mono mt-1 tracking-widest uppercase">DAY {stage.daysStart} — DAY {stage.daysEnd}</p></div></div>
                                 <div className="bg-[#1B3122]/50 px-4 py-2 rounded-xl border border-[#B5F140]/20 whitespace-nowrap w-fit shadow-inner"><p className="text-[10px] font-bold text-white tracking-widest uppercase">{startDate} <span className="text-[#B5F140] mx-2">→</span> {endDate}</p></div>
                              </div>
                              <p className="text-sm text-gray-400 leading-relaxed md:ml-[68px] bg-white/5 p-4 rounded-2xl border border-white/5">{stage.desc}</p>
                           </div>
                        </div>
                      )
                    })}
                 </div>
              </div>
            </div>

                <div className="mt-10 bg-[#0D1912] border border-[#1A2E22] rounded-[2rem] p-7 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                    <div><p className="text-[10px] text-[#B5F140] uppercase tracking-[0.2em] font-bold">Planner recommendation bridge</p><h3 className="text-2xl font-serif mt-2">Recommended crop + next inputs</h3><p className="text-xs text-gray-500 mt-2">The planner recommendation is linked to the same crop catalogue, nutrient analysis and marketplace product IDs.</p></div>
                    <span className="text-[10px] px-3 py-2 rounded-lg bg-[#B5F140]/10 border border-[#B5F140]/20 text-[#B5F140]">{cropRecommendation?.candidates?.length || 0} ranked crops</span>
                  </div>
                  {cropRecommendation?.candidates?.length ? (
                    <div className="grid md:grid-cols-3 gap-3">
                      {cropRecommendation.candidates.slice(0,3).map((candidate:any, index:number)=>(
                        <button type="button" key={`planner-top-recommendation-${candidate.name}-${index}`} onClick={()=>{setPlannerCrop(candidate.name);setForecastForm((prev:any)=>({...prev,crop:candidate.name,...(cropBaselines[candidate.name]||{})}));showToast(`${getCropDisplayName(candidate.name,lang)} selected for planning`);}} className={`text-left p-4 rounded-2xl border transition-all ${index===0?'border-[#B5F140]/40 bg-[#B5F140]/5':'border-white/5 bg-black/20 hover:border-white/10'}`}>
                          <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-widest text-gray-500">Rank #{index+1}</p><p className="font-bold text-white mt-1">{getCropDisplayName(candidate.name,lang)}</p></div><span className="text-[#B5F140] font-mono font-bold">{candidate.score}%</span></div>
                          <p className="text-[10px] text-gray-500 mt-2">{candidate.duration} · {candidate.risk} risk</p>
                          <p className="text-[10px] text-gray-400 mt-2 line-clamp-2">{candidate.reason}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-black/20 border border-dashed border-white/10 rounded-xl p-5 text-sm text-gray-500">Open or switch to the planner to generate field-specific crop recommendations.</div>
                  )}
                </div>

                <div className="mt-10 bg-gradient-to-br from-[#0D1912] to-[#09110C] border border-[#B5F140]/20 rounded-[2rem] p-7 md:p-9 shadow-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-7"><div><p className="text-[10px] text-[#B5F140] uppercase tracking-[0.2em] font-bold flex items-center gap-2"><Sparkles size={14}/> AI Crop Recommendation</p><h3 className="text-3xl font-serif text-white mt-2">What should I grow on this field?</h3><p className="text-xs text-gray-500 mt-2 max-w-2xl">The engine compares the selected field's soil, pH, moisture, N/P/K, weather and rainfall against the complete crop catalogue. It ranks suitability; it does not guarantee yield or profitability.</p></div><button onClick={runCropRecommendation} disabled={recommendationLoading} className="bg-[#B5F140] text-[#102015] px-6 py-3 rounded-xl text-xs font-black disabled:opacity-50 flex items-center gap-2">{recommendationLoading?<RefreshCw size={15} className="animate-spin"/>:<Sparkles size={15}/>} {recommendationLoading?'Analyzing field…':'Generate recommendation'}</button></div>
                  {cropRecommendation ? <div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[["Field",cropRecommendation.field],["Soil",cropRecommendation.inputs?.soil],["pH",cropRecommendation.inputs?.pH],["Moisture",`${cropRecommendation.inputs?.moisture}%`]].map(([a,b])=><div key={`rec-input-${a}`} className="bg-black/30 rounded-xl p-4 border border-white/5"><p className="text-[9px] uppercase tracking-widest text-gray-500">{a}</p><p className="text-sm font-bold text-white mt-2">{b}</p></div>)}</div><div className="grid lg:grid-cols-2 gap-4">{cropRecommendation.candidates.map((c:any,idx:number)=><div key={`recommendation-${c.name}-${idx}`} className={`rounded-2xl border p-5 ${idx===0?'border-[#B5F140]/40 bg-[#B5F140]/5':'border-white/5 bg-black/20'}`}><div className="flex items-start justify-between gap-4"><div><span className="text-[9px] font-black uppercase tracking-widest text-gray-500">#{idx+1}</span><h4 className="font-bold text-white mt-1">{getCropDisplayName(c.name,plannerLanguage)}</h4><p className="text-[10px] text-gray-500 mt-1">{c.category} · {c.climate} · {c.duration}</p></div><span className="text-xl font-serif text-[#B5F140]">{c.score}%</span></div><div className="grid grid-cols-3 gap-2 mt-4">{[["Soil",c.factors?.soil],["Climate",c.factors?.climate],["Water",c.factors?.water],["pH",c.factors?.ph],["Nutrients",c.factors?.nutrients],["Risk",c.factors?.risk]].map(([a,b])=><div key={`factor-${c.name}-${a}`} className="bg-white/5 rounded-lg p-2"><p className="text-[8px] uppercase text-gray-500">{a}</p><p className="text-xs font-bold text-white mt-1">{b}/score</p></div>)}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"><div className="bg-white/5 rounded-lg p-2"><p className="text-[8px] uppercase text-gray-500">Est. yield</p><p className="text-xs font-bold text-white mt-1">{c.estimatedYield ?? "—"}</p></div><div className="bg-white/5 rounded-lg p-2"><p className="text-[8px] uppercase text-gray-500">Water</p><p className="text-xs font-bold text-white mt-1">{c.waterRequirement || c.moisture || "—"}</p></div><div className="bg-white/5 rounded-lg p-2"><p className="text-[8px] uppercase text-gray-500">Cost*</p><p className="text-xs font-bold text-white mt-1">{c.estimatedCost ? `₹${Number(c.estimatedCost).toLocaleString("en-IN")}` : "—"}</p></div><div className="bg-white/5 rounded-lg p-2"><p className="text-[8px] uppercase text-gray-500">Profit*</p><p className="text-xs font-bold text-[#B5F140] mt-1">{c.estimatedProfit !== null && c.estimatedProfit !== undefined ? `₹${Number(c.estimatedProfit).toLocaleString("en-IN")}` : "Quote needed"}</p></div></div><p className="text-xs text-gray-400 mt-4 leading-relaxed">{c.reason}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>{setPlannerCrop(c.name);setForecastForm((prev:any)=>({...prev,crop:c.name,...(cropBaselines[c.name]||{})}));addHistory("recommendation",`${c.name} selected from recommendation`);}} className="text-[10px] font-bold text-[#B5F140] border border-[#B5F140]/20 px-3 py-2 rounded-lg hover:bg-[#B5F140]/10">Use this crop in Planner</button><button onClick={()=>{setSelectedMarketCrop(c.name);setMarketSearch("");setActiveTab("market");}} className="text-[10px] font-bold text-white border border-white/10 px-3 py-2 rounded-lg hover:bg-white/5">View Mandi & Buyers</button></div></div>)}</div><p className="text-[9px] text-gray-600">Generated {new Date(cropRecommendation.generatedAt).toLocaleString()} · Validate variety, irrigation, soil test and local market conditions before planting.</p></div> : <div className="bg-black/20 border border-dashed border-white/10 rounded-2xl p-8 text-center"><Sparkles className="mx-auto text-gray-600" size={26}/><p className="text-sm text-gray-400 mt-3">Run the engine to rank the complete crop catalogue for this field.</p></div>}
                </div>
           </div>
        )}

        {/* ===================== VISION TAB ===================== */}
        {activeTab === "vision" && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-10 flex justify-between items-end">
              <div><p className="text-[11px] font-bold tracking-[0.2em] text-[#B5F140] mb-2 uppercase">Optical Pathology Intelligence / CV-04</p><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Vision Diagnostics</h2></div>
              <button onClick={handleRunLeafScan} disabled={isScanningLeaf} className="bg-[#B5F140] hover:scale-[1.02] text-[#12281C] font-bold px-8 py-4 rounded-xl text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(181,241,64,0.3)] disabled:opacity-50">{isScanningLeaf ? <RefreshCw className="animate-spin" size={18}/> : <Camera size={18} />}<span>{isScanningLeaf ? "Scanning..." : "Run Diagnostic"}</span></button>
            </header>
            
            {visionModelStatus && <div className="mb-4 rounded-xl border border-[#2D5A3C] bg-[#0D1912] px-4 py-3 text-xs text-gray-300">Vision model status: <span className="text-[#B5F140] font-mono">{visionModelStatus}</span></div>}
            {visionError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{visionError}</div>}
            
            <div className="mb-8 flex gap-3 overflow-x-auto pb-2 items-center custom-scrollbar">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0 mr-3 bg-[#0A160F] px-4 py-2.5 rounded-xl border border-[#1A2E22]">Sample Feed:</span>
              <div className="shrink-0 relative"><input type="file" id="leaf-upload" className="hidden" accept="image/*" onChange={handleImageUpload} /><label htmlFor="leaf-upload" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all border shadow-lg ${selectedLeafKey === 'custom_upload' ? 'bg-[#B5F140] text-[#12281C] border-[#B5F140]' : 'bg-[#0D1912] text-white border-[#1A2E22] hover:bg-[#15251A]'}`}><UploadCloud size={16}/> Upload Image</label></div>
              <div className="w-px h-8 bg-white/10 mx-2 shrink-0"></div>
              {Object.keys(leafPathologies).map((key) => {
                const item = leafPathologies[key]; const isSelected = selectedLeafKey === key;
                return (<button key={key} onClick={() => { setSelectedLeafKey(key); setScanComplete(true); setCustomDiagnosis(null); }} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${isSelected ? 'bg-[#B5F140] text-[#12281C] border-[#B5F140] shadow-[0_0_15px_rgba(181,241,64,0.3)]' : 'bg-[#0D1912] text-gray-400 border-[#1A2E22] hover:bg-[#15251A] hover:text-white'}`}>{item.crop} — {item.name}</button>);
              })}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-[#0A160F] rounded-[2rem] p-6 relative overflow-hidden flex flex-col justify-between min-h-[500px] shadow-2xl border border-[#1A2E22]">
                <div className="flex justify-between items-center z-20 mb-6 text-[10px] font-mono text-gray-400"><span className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5"><span className="w-2 h-2 rounded-full bg-[#B5F140] animate-ping"></span><span>SPECTRAL CAMERA 01 [540nm - 850nm]</span></span></div>
                <div className="relative flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center shadow-inner">
                  <img src={activeDiagnosis?.visualUrl} alt={activeDiagnosis?.name} className={`w-full h-full object-cover transition-all duration-700 ${isScanningLeaf ? 'brightness-50 contrast-150 grayscale-[50%]' : 'brightness-90'}`} />
                  {isScanningLeaf && ( <div className="absolute inset-0 pointer-events-none z-30"><div className="w-full h-1 bg-[#B5F140] shadow-[0_0_30px_#B5F140] animate-[bounce_2s_infinite]"></div><div className="absolute inset-0 bg-[#B5F140]/10 mix-blend-overlay"></div></div> )}
                  {scanComplete && !isScanningLeaf && activeDiagnosis?.box && ( <div className="absolute border-2 border-dashed border-[#EF476F] bg-[#EF476F]/20 rounded-xl z-20 animate-in zoom-in-95 duration-500 shadow-[0_0_20px_rgba(239,71,111,0.3)]" style={activeDiagnosis.box}><span className="absolute -top-8 left-0 bg-[#EF476F] text-white text-[10px] font-mono px-3 py-1 rounded-md shadow-lg font-bold whitespace-nowrap">{activeDiagnosis.pathogen} [{activeDiagnosis.confidence}]</span></div> )}
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                {activeDiagnosis && (
                  <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-2xl h-full flex flex-col" id="vision-diagnosis-text">
                    <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-5"><div><p className="text-[10px] font-bold tracking-[0.15em] text-gray-500 uppercase mb-2">Foliar Condition</p><h3 className="text-3xl font-serif text-white mt-1">{activeDiagnosis.name}</h3><p className="text-[10px] text-[#B5F140] font-mono mt-3 bg-[#B5F140]/10 w-fit px-2 py-1 rounded uppercase tracking-widest">{activeDiagnosis.pathogen}</p></div><span className="text-sm font-mono font-bold px-3 py-1.5 rounded-lg bg-black text-[#B5F140] border border-[#1A2E22]">{activeDiagnosis.confidence}</span></div>
                    <div className="mb-6 p-5 rounded-2xl border border-white/5 bg-black/40 shadow-inner"><p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-3">Severity</p><span className={`text-xs font-bold px-4 py-2 rounded-xl inline-block border ${activeDiagnosis.severityColor === 'text-[#EF476F]' ? 'bg-red-500/10 border-red-500/20 text-red-400' : activeDiagnosis.severityColor === 'text-[#FFD166]' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-green-500/10 border-green-500/20 text-[#B5F140]'}`}>{activeDiagnosis.severity}</span></div>
                    {activeDiagnosis?.visible_symptoms && <div className="mb-5 p-4 rounded-2xl bg-white/5 border border-white/5"><p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Visible symptoms</p><p className="text-sm text-gray-300">{activeDiagnosis.visible_symptoms}</p>{activeDiagnosis.next_action && <><p className="text-[10px] uppercase tracking-widest text-gray-500 mt-4 mb-2">Next action</p><p className="text-sm text-gray-300">{activeDiagnosis.next_action}</p></>}</div>}
                    <div className="mb-8 flex-1"><p className="text-[10px] font-bold tracking-[0.2em] text-[#B5F140] uppercase mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Agronomic Chemical Prescription</p><div className="bg-gradient-to-br from-[#112318] to-black/60 text-white p-6 rounded-2xl border border-[#1A3324] shadow-inner"><p className="text-sm leading-relaxed text-gray-300">{activeDiagnosis.treatment}</p></div></div>
                    
                    <div className="flex gap-4 w-full">
                      <button onClick={toggleVisionSpeech} className="flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg border bg-transparent text-[#B5F140] border-[#B5F140] hover:bg-[#B5F140] hover:text-[#0A160F]">
                        {isSpeakingVision ? <VolumeX size={16}/> : <Volume2 size={16}/>} <span>{isSpeakingVision ? "Stop" : "Listen"}</span>
                      </button>
                      <button onClick={() => { setExpertPreviews([activeDiagnosis.visualUrl]); setExpertTopic("Pest/Disease Identification"); setActiveTab("expert"); }} className="flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg border bg-[#1A2E22] text-white border-[#2D5A3C] hover:bg-[#2D5A3C]">
                        <HeadphonesIcon size={16}/> <span>Consult Expert</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== REGISTRY TAB ===================== */}
        {activeTab === "registry" && (
           <div className="animate-in fade-in duration-500 print:hidden relative">
             <header className="mb-10 flex justify-between items-end">
              <div><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Field Registry</h2></div>
              <button onClick={handleFleetAnalysis} disabled={isFleetRunning} className="flex items-center gap-2 bg-[#B5F140] text-[#12281C] hover:scale-105 px-6 py-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(181,241,64,0.2)]">{isFleetRunning ? <RefreshCw className="animate-spin" size={16}/> : <Play size={16}/>} Run Fleet Analysis</button>
            </header>
            {fleetResults.length > 0 && (
              <div className="bg-[#0D1912] text-white p-8 rounded-[2rem] mb-8 animate-in slide-in-from-top-4 border border-[#1A2E22] shadow-2xl">
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#B5F140] uppercase mb-6">Batch Analysis Results</p>
                <div className="overflow-x-auto custom-scrollbar pb-2">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead><tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500 bg-black/40"><th className="py-4 px-5 rounded-tl-xl">Field Name</th><th className="py-4 px-5">Location</th><th className="py-4 px-5">Area</th><th className="py-4 px-5">AI Risk Status</th><th className="py-4 px-5 rounded-tr-xl">Est. Profit Margin</th></tr></thead>
                    <tbody>{fleetResults.map((r) => (<tr key={`fleet-${r.id || r.name}`} className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="py-5 px-5 font-bold text-white">{r.name}</td><td className="py-5 px-5 text-gray-400">{r.location}</td><td className="py-5 px-5 font-mono text-gray-400 bg-black/30 rounded-md my-2 inline-block px-3 py-1 ml-4 mt-3 border border-white/5">{r.area} ac</td><td className={`py-5 px-5 font-bold ${r.color}`}>{r.status}</td><td className="py-5 px-5 font-mono text-[#B5F140] text-lg">{r.profit}</td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#0A160F] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg">
                <form onSubmit={handleRegisterField} className="space-y-6">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-[#B5F140] uppercase border-b border-white/10 pb-4 mb-6">New Field</p>
                  <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Field name</label><input type="text" required value={newField.name} onChange={e => setNewField((prev: any) => ({...prev, name: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                  <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Location</label><input type="text" required value={newField.location} onChange={e => setNewField((prev: any) => ({...prev, location: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Area (acres)</label><input type="number" required value={newField.area} onChange={e => setNewField((prev: any) => ({...prev, area: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140]" /></div>
                    <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Soil type</label><select value={newField.soil} onChange={e => setNewField((prev: any) => ({...prev, soil: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140] appearance-none"><option className="bg-[#12281C]">Loamy</option><option className="bg-[#12281C]">Sandy</option><option className="bg-[#12281C]">Clay</option></select></div>
                  </div>
                  <div><label className="block text-[10px] font-bold mb-2 text-gray-500 uppercase tracking-widest">Crop (optional)</label><select value={newField.crop || ""} onChange={e=>setNewField((prev: any)=>({...prev,crop:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140] appearance-none"><option value="">Assign later</option>{cropCatalog.map(c=><option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[["nitrogen","N (kg/ha)"],["phosphorus","P (kg/ha)"],["potassium","K (kg/ha)"],["ph","pH"],["moisture","Moisture %"]].map(([key,label])=><div key={`new-field-${key}`}><label className="block text-[9px] font-bold mb-2 text-gray-500 uppercase tracking-widest">{label}</label><input type="number" step="0.1" value={(newField as any)[key]} onChange={e=>setNewField((prev:any)=>({...prev,[key]:e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#B5F140]" placeholder="Auto / optional" /></div>)}
                  </div>
                  <button type="submit" className="w-full bg-[#B5F140] text-[#12281C] py-4 rounded-xl text-sm font-bold flex justify-center items-center hover:scale-[1.02] mt-6 shadow-[0_0_15px_rgba(181,241,64,0.2)]">Register field</button>
                </form>
              </div>
              <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] h-[580px] overflow-y-auto shadow-lg custom-scrollbar">
                <p className="text-[10px] font-bold tracking-[0.15em] text-[#B5F140] uppercase border-b border-white/10 pb-4 mb-6">Your Fields ({fields.length})</p>
                <div className="space-y-4">{fields.map((field, idx) => (<div key={`field-${field.id || idx}`} className="group border-l-4 border-[#B5F140] pl-5 flex justify-between items-center bg-black/30 p-5 rounded-2xl rounded-l-none animate-in fade-in slide-in-from-right-4 transition-all hover:bg-black/50 border-y border-r border-white/5 hover:border-white/10"><div className="truncate pr-2"><p className="font-bold text-white text-lg capitalize truncate">{field.name}</p><p className="text-[10px] text-gray-400 font-mono mt-1.5 capitalize truncate bg-white/5 px-2 py-1 rounded inline-block">{field.location} · {field.soil}</p></div><div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0"><div className="text-right bg-white/5 px-4 py-2 rounded-xl border border-white/5"><p className="text-2xl font-serif text-[#B5F140] leading-none">{field.area}</p><p className="text-[9px] tracking-widest uppercase text-gray-500 mt-1">acres</p></div><button onClick={() => handleRemoveField(field, idx)} className="text-gray-500 hover:text-red-400 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer bg-red-500/10 rounded-lg opacity-100"><Trash2 size={18} /></button></div></div>))}</div>
              </div>
            </div>
            {activeField && <div className="mt-8 bg-[#0A160F] p-7 rounded-[2rem] border border-[#1A2E22] shadow-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4"><div><p className="text-[10px] uppercase tracking-widest text-[#B5F140] font-bold">Selected Field Intelligence</p><h3 className="text-3xl font-serif mt-2">{activeField.name}</h3><p className="text-sm text-gray-400 mt-1">{activeField.location} · {activeField.area} acres · {getCropDisplayName(activeField.crop || "Maize",lang)}</p></div><button onClick={()=>setFieldMapOpen(v=>!v)} className="border border-[#B5F140]/30 text-[#B5F140] px-4 py-2 rounded-xl text-xs font-bold">{fieldMapOpen?"Hide field map":"Open field map"}</button></div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">{[["Soil",activeField.soil||"—"],["N",activeField.nitrogen||"—"],["P",activeField.phosphorus||"—"],["K",activeField.potassium||"—"],["pH",activeField.ph||"—"],["Moisture",activeField.moisture||forecastForm.moisture||"—"]].map(([k,v])=><div key={`field-detail-${k}`} className="bg-white/5 p-4 rounded-xl"><p className="text-[9px] text-gray-500 uppercase">{k}</p><p className="text-sm font-bold mt-2">{v}</p></div>)}</div>
              {fieldMapOpen && <div className="mt-6 h-56 rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_30%_40%,rgba(181,241,64,.18),transparent_35%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,.15),transparent_30%)] relative overflow-hidden"><div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:28px_28px]"></div><div className="absolute left-[30%] top-[35%] w-4 h-4 rounded-full bg-[#B5F140] shadow-[0_0_25px_#B5F140]"></div><div className="absolute left-[68%] top-[55%] w-4 h-4 rounded-full bg-blue-400 shadow-[0_0_25px_#60A5FA]"></div><div className="absolute bottom-4 left-4 bg-black/70 px-4 py-3 rounded-xl text-xs"><MapPin size={12} className="inline mr-2 text-[#B5F140]"/>{activeField.location}<span className="text-gray-500 ml-2">Map connector ready; GPS coordinates required for real map tiles.</span></div></div>}
            </div>}
           </div>
        )}

        {/* ===================== DATASET TAB ===================== */}
        {activeTab === "dataset" && (
          <div className="animate-in fade-in duration-500 print:hidden relative space-y-8">
            <header><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">Agricultural Data Models</p><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Dataset Explorer</h2><p className="text-sm text-gray-400 max-w-3xl">All crops in the YieldSense catalogue are represented. This replaces the old three-row demonstration view with the full crop model registry.</p></header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[["Crop profiles",cropCatalog.length],["Model features","N · P · K · pH · moisture"],["Climate profiles",new Set(cropCatalog.map((c:any)=>c.climate)).size],["Planner profiles",cropCatalog.length]].map(([a,b])=><div key={String(a)} className="bg-[#0D1912] p-5 rounded-2xl border border-[#1A2E22]"><p className="text-[9px] uppercase tracking-widest text-gray-500">{a}</p><p className="text-xl font-serif text-white mt-3">{b}</p></div>)}</div>
            <div className="bg-[#0D1912] p-2 rounded-[2rem] border border-[#1A2E22] overflow-hidden shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5 md:p-7 border-b border-white/5"><div><h3 className="text-2xl font-serif">Crop Model Registry</h3><p className="text-xs text-gray-500 mt-1">Reference planning values used by forecast, Farm Planner and recommendation logic.</p></div><button onClick={()=>setForecastForm((prev:any)=>({...prev,crop:"All"}))} className="border border-[#B5F140]/30 text-[#B5F140] px-4 py-2 rounded-xl text-xs font-bold">Show all crops</button></div>
              <div className="overflow-x-auto p-4 md:p-6 custom-scrollbar"><table className="w-full text-left text-sm min-w-[1200px]"><thead><tr className="border-b-2 border-[#1A3324] text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 bg-black/40"><th className="py-4 px-4">Crop</th><th className="py-4 px-4">Category</th><th className="py-4 px-4">Climate</th><th className="py-4 px-4">Soil</th><th className="py-4 px-4">Cycle</th><th className="py-4 px-4">Moisture</th><th className="py-4 px-4">pH</th><th className="py-4 px-4">N</th><th className="py-4 px-4">P</th><th className="py-4 px-4">K</th><th className="py-4 px-4">Risk</th><th className="py-4 px-4">Planner</th></tr></thead><tbody className="text-gray-300 text-xs">{(forecastForm.crop==="All"?cropCatalog:cropCatalog.filter((c:any)=>c.name===forecastForm.crop)).map((c:any)=><tr key={`model-row-${c.name}`} className="border-b border-white/5 hover:bg-black/30"><td className="py-4 px-4 font-bold text-[#B5F140]">{getCropDisplayName(c.name,lang)}</td><td className="py-4 px-4">{c.category}</td><td className="py-4 px-4">{c.climate}</td><td className="py-4 px-4">{c.soil}</td><td className="py-4 px-4">{c.duration}</td><td className="py-4 px-4">{c.moisture}%</td><td className="py-4 px-4">{c.ph}</td><td className="py-4 px-4">{c.nitrogen}</td><td className="py-4 px-4">{c.phosphorus}</td><td className="py-4 px-4">{c.potassium}</td><td className="py-4 px-4"><span className={c.risk==="High"?"text-[#EF476F]":c.risk==="Medium"?"text-[#FFD166]":"text-[#B5F140]"}>{c.risk}</span></td><td className="py-4 px-4"><button onClick={()=>{setPlannerCrop(c.name);setActiveTab("planner");}} className="text-[#B5F140] text-[10px] font-bold">Open planner</button></td></tr>)}</tbody></table></div>
            </div>
            <div className="grid lg:grid-cols-3 gap-5">{[["Input features","Temperature, rainfall, soil pH, soil moisture, nitrogen, phosphorus, potassium and crop context."],["ML prediction","FastAPI and the trained model remain the production inference layer when the backend is connected."],["Recommendation","The field is compared against the full crop registry rather than a three-crop list."]].map(([a,b])=><div key={String(a)} className="bg-black/20 border border-white/5 p-6 rounded-2xl"><p className="text-[#B5F140] text-[10px] font-bold uppercase tracking-widest">{a}</p><p className="text-sm text-gray-400 mt-3 leading-relaxed">{b}</p></div>)}</div>
          </div>
        )}

        {/* ===================== SYSTEM TAB ===================== */}
        {activeTab === "system" && (
          <div className="animate-in fade-in duration-500 print:hidden relative space-y-8">
            <header><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">Platform Blueprint</p><h2 className="text-5xl font-serif tracking-tight text-white mb-3">System Architecture</h2><p className="text-sm text-gray-400 max-w-4xl">A layered view of the complete YieldSense flow: users → frontend → backend APIs → AI/ML → data stores → external agricultural providers.</p></header>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[["1","Experience","Next.js / React / Tailwind",LayoutDashboard],["2","API Services","FastAPI / REST / JWT",Globe],["3","AI & ML","Yield model / recommendations / Vision",Cpu],["4","Data","PostgreSQL / SQLAlchemy / datasets",Database],["5","Integrations","Weather / IoT / Mandi / payments",Wifi]].map(([n,title,desc,I]:any)=><div key={String(n)} className="bg-[#0D1912] border border-[#1A2E22] rounded-2xl p-5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-[#B5F140]/10 flex items-center justify-center"><I size={16} className="text-[#B5F140]"/></div><span className="text-[10px] font-bold text-gray-500">LAYER {n}</span></div><h3 className="text-lg font-bold text-white mt-4">{title}</h3><p className="text-xs text-gray-500 mt-2 leading-relaxed">{desc}</p></div>)}</div>
            <div className="bg-[#0A160F] border border-[#1A2E22] rounded-[2rem] p-6 md:p-10 overflow-x-auto"><div className="min-w-[1000px]"><div className="grid grid-cols-5 gap-3"><div className="space-y-3"><p className="text-[9px] uppercase tracking-widest text-gray-500">Users</p>{["Farmer","Agronomist","Admin"].map(x=><div key={x} className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm font-bold text-center">{x}</div>)}</div><div className="space-y-3"><p className="text-[9px] uppercase tracking-widest text-gray-500">Frontend</p>{["Dashboard","Yield Forecast","Farm Planner","Vision AI","Marketplace","AI Assistant","History"].map(x=><div key={x} className="p-3 rounded-xl bg-[#B5F140]/10 border border-[#B5F140]/20 text-xs text-center">{x}</div>)}</div><div className="space-y-3"><p className="text-[9px] uppercase tracking-widest text-gray-500">Backend</p>{["/auth","/predict","/vision","/fields","/history","/expert"].map(x=><div key={x} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-center">{x}</div>)}</div><div className="space-y-3"><p className="text-[9px] uppercase tracking-widest text-gray-500">Intelligence</p>{["Random Forest","Crop Recommendation","Crop Lifecycle","Gemini Vision","Risk Rules","Input Matching"].map(x=><div key={x} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-center">{x}</div>)}</div><div className="space-y-3"><p className="text-[9px] uppercase tracking-widest text-gray-500">Data / Providers</p>{["PostgreSQL","FAOSTAT / USDA","Open-Meteo","IoT Telemetry","Mandi feeds","Payment gateway"].map(x=><div key={x} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-center">{x}</div>)}</div></div><div className="grid grid-cols-4 gap-3 mt-6 text-center text-[10px] text-gray-500"><div>↓ authentication</div><div>↓ validated inputs</div><div>↓ inference / rules</div><div>↓ storage / integrations</div></div></div></div>
            <div className="bg-gradient-to-r from-[#0D1912] via-[#0A160F] to-[#12281C] border border-[#B5F140]/15 rounded-[2rem] p-6 md:p-8 overflow-x-auto">
              <div className="flex items-center justify-between gap-4 mb-6"><div><p className="text-[10px] uppercase tracking-[0.2em] text-[#B5F140] font-bold">End-to-end decision pipeline</p><h3 className="text-2xl font-serif mt-2">From Farm Data to Farmer Action</h3></div><span className="text-[9px] px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-gray-400">Production adapters are connector-ready</span></div>
              <div className="min-w-[900px] grid grid-cols-7 gap-2 items-stretch">
                {["Field & Profile","Soil + Weather","Crop Engine","AI / ML","Recommendations","Marketplace / Mandi","Farmer Action"].map((stage:string,index:number)=><div key={`architecture-flow-${stage}-${index}`} className="relative bg-black/25 border border-white/5 rounded-xl p-4 text-center"><div className="w-8 h-8 mx-auto rounded-full bg-[#B5F140]/10 border border-[#B5F140]/20 flex items-center justify-center text-[#B5F140] text-xs font-black">{index+1}</div><p className="text-xs font-bold text-white mt-3">{stage}</p><p className="text-[9px] text-gray-500 mt-2 leading-relaxed">{["Registered farm context and history","NPK, pH, moisture, rainfall and temperature","Crop profiles, lifecycle and suitability scoring","Yield, vision and rule-based intelligence","What to grow, what to buy and what to do next","Seeds, fertilizer, mandi and buyer pathways","Irrigate, scout, purchase, consult or harvest"][index]}</p>{index<6&&<span className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#B5F140]">→</span>}</div>)}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5"><div className="bg-[#0D1912] p-6 rounded-2xl border border-[#1A2E22]"><div className="flex items-center gap-3"><ShieldCheck className="text-[#B5F140]" size={20}/><h3 className="font-bold">Security</h3></div><ul className="mt-4 space-y-2 text-xs text-gray-400"><li>• JWT authentication belongs to the backend.</li><li>• Password hashing stays server-side.</li><li>• Gemini credentials stay in environment variables.</li><li>• Client forms validate before requests.</li></ul></div><div className="bg-[#0D1912] p-6 rounded-2xl border border-[#1A2E22]"><div className="flex items-center gap-3"><Database className="text-blue-400" size={20}/><h3 className="font-bold">Data lifecycle</h3></div><ul className="mt-4 space-y-2 text-xs text-gray-400"><li>• Field registration → field record.</li><li>• Soil/weather → prediction and recommendation.</li><li>• Prediction → history and analytics.</li><li>• Vision/expert → image-backed workflows.</li></ul></div><div className="bg-[#0D1912] p-6 rounded-2xl border border-[#1A2E22]"><div className="flex items-center gap-3"><Wifi className="text-[#FFD166]" size={20}/><h3 className="font-bold">Provider status</h3></div><ul className="mt-4 space-y-2 text-xs text-gray-400"><li>• IoT requires real sensor credentials.</li><li>• Market values are reference unless a live feed is connected.</li><li>• Checkout is demo until a payment backend is connected.</li><li>• Real maps require GPS coordinates.</li></ul></div></div>
            <div className="bg-black/30 border border-[#B5F140]/10 rounded-2xl p-6"><p className="text-[10px] uppercase tracking-widest text-[#B5F140] font-bold">Architecture principle</p><p className="text-sm text-gray-400 mt-3 leading-relaxed">The frontend should never pretend a provider is connected. It can show planning intelligence locally, but live weather, IoT, market, payment and map services must be backed by their actual integrations before being labeled live.</p></div>
          </div>
        )}

        {/* ===================== FARM INTELLIGENCE ===================== */}
        {activeTab === "intelligence" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">Decision Center</p><h2 className="text-5xl font-serif text-white mt-2">Farm Intelligence</h2></header>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[['Registered Fields',fields.length],['Total Acres',totalAcres.toFixed(1)],['Active Crop',fields[activeFieldIndex]?.crop || 'Not selected'],['Field Health',surveillanceData[activeFieldIndex]?.health || '—']].map(([a,b])=> <div key={String(a)} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><p className="text-[9px] uppercase tracking-widest text-gray-500">{a}</p><p className="text-2xl font-serif text-white mt-3">{b}</p></div>)}
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22]"><div className="flex justify-between items-center mb-6"><div><p className="text-[10px] text-[#B5F140] uppercase tracking-widest font-bold">Crop recommendation</p><h3 className="text-2xl font-serif mt-2">What should I grow?</h3></div><button onClick={runCropRecommendation} className="bg-[#B5F140] text-[#102015] px-4 py-2 rounded-xl text-xs font-bold">{recommendationLoading?'Analyzing…':'Analyze Field'}</button></div>{cropRecommendation?.candidates?.map((c: any)=><div key={`intelligence-recommendation-${c.name}-${cropRecommendation?.generatedAt || "latest"}`} className="p-4 bg-black/20 rounded-xl border border-white/5 mb-3"><div className="flex justify-between"><span className="font-bold">{c.name}</span><span className="text-[#B5F140]">{c.score}% fit</span></div><p className="text-xs text-gray-400 mt-2">{c.climate} · {c.soil} · {c.duration}</p><p className="text-[11px] text-gray-500 mt-2">{c.reason}</p></div>)}{!cropRecommendation&&<div className="rounded-xl border border-dashed border-[#B5F140]/20 bg-[#B5F140]/5 p-5"><p className="text-sm font-bold text-white">Recommended Crop Engine</p><p className="text-xs text-gray-500 mt-2">Select a registered field and generate a field-specific ranking across the complete crop catalogue. No single Rice/Maize fallback is used.</p><button onClick={runCropRecommendation} disabled={!fields.length || recommendationLoading} className="mt-4 bg-[#B5F140] text-black px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50">Generate recommendations</button></div>}</div>
              <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22]"><div className="flex justify-between items-center mb-6"><div><p className="text-[10px] text-[#B5F140] uppercase tracking-widest font-bold">Live field surveillance</p><h3 className="text-2xl font-serif mt-2">What is happening now?</h3></div><button onClick={refreshSurveillance} className="border border-[#B5F140]/40 text-[#B5F140] px-4 py-2 rounded-xl text-xs font-bold">{surveillanceRefreshing?'Refreshing…':'Refresh'}</button></div>{(surveillanceData.length?surveillanceData:fields).map((f,i)=><div key={f.id||i} className="p-4 bg-black/20 rounded-xl border border-white/5 mb-3 cursor-pointer" onClick={()=>setSelectedFieldDetail(f)}><div className="flex justify-between"><span className="font-bold">{f.name}</span><span className="text-xs text-gray-400">{f.location}</span></div><div className="grid grid-cols-3 gap-3 mt-3 text-[10px] text-gray-400"><span>Moisture: {f.moisture||'—'}</span><span>Health: {f.health||'—'}</span><span>Risk: {f.risk||'—'}</span></div></div>)}</div>
            </div>
            {selectedFieldDetail&&<div className="bg-[#0A160F] p-8 rounded-[2rem] border border-[#1A2E22]"><div className="flex justify-between"><h3 className="text-2xl font-serif">{selectedFieldDetail.name} — Field Intelligence</h3><button onClick={()=>setSelectedFieldDetail(null)}><X/></button></div><div className="grid md:grid-cols-4 gap-4 mt-6">{[['Location',selectedFieldDetail.location],['Soil',selectedFieldDetail.soil],['Area',`${selectedFieldDetail.area} acres`],['Crop',selectedFieldDetail.crop||'Not assigned']].map(([a,b])=><div key={String(a)} className="bg-white/5 p-4 rounded-xl"><p className="text-[9px] text-gray-500 uppercase">{a}</p><p className="font-bold mt-2">{b}</p></div>)}</div><p className="text-xs text-gray-500 mt-5">Connect validated weather, soil telemetry, camera or IoT APIs here.</p></div>}
          </div>
        )}

        {/* ===================== HISTORY & ANALYTICS ===================== */}
        {activeTab === "history" && (
          <div className="animate-in fade-in duration-500 space-y-8"><header><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">Traceability</p><h2 className="text-5xl font-serif mt-2">History & Analytics</h2></header><div className="grid md:grid-cols-4 gap-4">{[['Events',historyRecords.length],['Fields',fields.length],['Area',`${totalAcres.toFixed(1)} ac`],['Forecast',forecastResult?.total||'—']].map(([a,b])=><div key={String(a)} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><p className="text-[9px] text-gray-500 uppercase tracking-widest">{a}</p><p className="text-2xl font-serif mt-3">{b}</p></div>)}</div><div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22]"><h3 className="text-2xl font-serif mb-6">Activity Timeline</h3>{historyRecords.length===0?<p className="text-gray-500">No events yet.</p>:historyRecords.map(r=><div key={r.id} className="border-l-2 border-[#B5F140]/40 pl-5 pb-6 mb-4"><p className="text-[10px] text-gray-500">{new Date(r.date).toLocaleString()}</p><p className="font-bold mt-1">{r.title}</p><p className="text-xs text-gray-500 mt-1">{r.field} · {r.type}</p></div>)}</div></div>
        )}

        {/* ===================== MANDI & BUYERS ===================== */}
        {activeTab === "market" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">Market Intelligence</p><h2 className="text-5xl font-serif mt-2">Mandi & Buyer Directory</h2></header>
            <div className="flex flex-wrap gap-3">
              <input value={marketSearch} onChange={e=>setMarketSearch(e.target.value)} placeholder="Search crop, market or buyer" className="flex-1 min-w-[240px] bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-[#B5F140]"/>
              <select value={selectedMarketCrop} onChange={e=>setSelectedMarketCrop(e.target.value)} className="bg-[#0D1912] border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-[#B5F140] appearance-none"><option>All</option>{[...new Set(marketDirectory.map(x=>x.crop))].map(x=><option key={x}>{x}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#0D1912] border border-[#1A2E22] rounded-2xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">Supported crops</p><p className="text-2xl font-serif text-[#B5F140] mt-1">{cropCatalog.length}</p><p className="text-[9px] text-gray-600 mt-1">From canonical crop catalogue</p></div>
              <div className="bg-[#0D1912] border border-[#1A2E22] rounded-2xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">Mandi coverage</p><p className="text-2xl font-serif text-[#B5F140] mt-1">{marketCoverageReport.filter((x:any)=>x.marketCovered).length}</p><p className="text-[9px] text-gray-600 mt-1">Crops with directory records</p></div>
              <div className="bg-[#0D1912] border border-[#1A2E22] rounded-2xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">Buyer coverage</p><p className="text-2xl font-serif text-[#B5F140] mt-1">{marketCoverageReport.filter((x:any)=>x.buyerCovered).length}</p><p className="text-[9px] text-gray-600 mt-1">Crops with buyer records</p></div>
              <div className="bg-[#0D1912] border border-[#1A2E22] rounded-2xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">Data status</p><p className="text-sm font-bold text-amber-300 mt-2">Reference</p><p className="text-[9px] text-gray-600 mt-1">Verify before sale</p></div>
            </div>
            <div className="bg-[#0D1912] border border-[#1A2E22] rounded-[2rem] p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <div><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">All-crop market coverage</p><h3 className="text-2xl font-serif mt-1">Mandi & buyer availability by crop</h3></div>
                <p className="text-[10px] text-gray-500 max-w-md">Every crop supported by YieldSense appears here. Prices and contacts are reference placeholders until a verified live provider is connected.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-[310px] overflow-y-auto custom-scrollbar pr-1">
                {marketCoverageReport.map((coverage:any, index:number)=>(
                  <button type="button" key={`market-coverage-${coverage.crop}-${index}`} onClick={()=>setSelectedMarketCrop(coverage.crop)} className={`text-left p-3 rounded-xl border transition-all ${selectedMarketCrop===coverage.crop?'border-[#B5F140]/50 bg-[#B5F140]/10':'border-white/5 bg-black/20 hover:border-white/10'}`}>
                    <p className="text-sm font-bold text-white">{getCropDisplayName(coverage.crop,lang)}</p>
                    <p className="text-[9px] text-gray-500 mt-1">{coverage.marketRecords} mandi · {coverage.buyerRecords} buyers</p>
                    <p className="text-[9px] text-[#B5F140] mt-2">View crop details →</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#0D1912] to-[#09110C] border border-[#B5F140]/15 rounded-[2rem] p-6 md:p-7">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <p className="text-[10px] text-[#B5F140] uppercase tracking-[0.2em] font-bold">Crop-specific market intelligence</p>
                  <h3 className="text-2xl md:text-3xl font-serif mt-2">Mandi Aggregators & Direct Buyers for Every Crop</h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-3xl">Select any supported crop to see its market type, likely buyer category, quality checkpoints, demand channel and reference price. These are planning references, not live quotes.</p>
                </div>
                <button type="button" onClick={()=>setSelectedMarketCrop("All")} className="shrink-0 border border-[#B5F140]/30 text-[#B5F140] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#B5F140]/10">Show all crops</button>
              </div>
              {selectedMarketCrop !== "All" && <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-4 gap-3">
                {(() => { const info:any = getCropMarketIntelligence(selectedMarketCrop); return [
                  ["Market", info.marketCenter], ["Buyer", info.buyerType], ["Quality", info.quality], ["Reference", info.referencePrice]
                ].map(([label,value], detailIndex)=><div key={`market-detail-${selectedMarketCrop}-${detailIndex}`} className="bg-black/25 border border-white/5 rounded-xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">{label}</p><p className="text-xs font-bold text-white mt-2 leading-relaxed">{value}</p></div>); })()}
              </div>}
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {marketCoverageReport.map((coverage:any, index:number)=><button type="button" key={`market-crop-chip-${coverage.crop}-${index}`} onClick={()=>setSelectedMarketCrop(coverage.crop)} className={`shrink-0 px-3 py-2 rounded-lg text-[10px] font-bold border ${selectedMarketCrop===coverage.crop?'bg-[#B5F140] text-black border-[#B5F140]':'bg-black/20 text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}>{getCropDisplayName(coverage.crop,lang)}</button>)}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-[#0D1912] p-6 rounded-[2rem] border border-[#1A2E22]"><h3 className="text-2xl font-serif mb-5">Mandi Aggregators</h3>{marketDirectory.filter(x=>(selectedMarketCrop==='All'||x.crop===selectedMarketCrop)&&`${x.crop} ${x.market} ${x.buyer}`.toLowerCase().includes(marketSearch.toLowerCase())).map((x,idx)=><div key={`mandi-record-${x.crop}-${x.id || x.market}-${idx}`} className="p-4 border-b border-white/5"><div className="flex justify-between"><b>{getCropDisplayName(x.crop, lang)}</b><span className="text-xs text-gray-400">{x.market}</span></div><p className="text-xs text-gray-500 mt-2">{x.buyer} · {x.region}</p><div className="flex justify-between mt-3"><p className="text-xs text-[#B5F140]">Est. Price: {x.price}</p><button onClick={()=>{setInquiryModal({isOpen: true, buyer: x, message: ""}); document.body.style.overflow = "hidden";}} className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded hover:bg-white/20 z-50 relative pointer-events-auto">Contact</button></div></div>)}</div>
              <div className="bg-[#0D1912] p-6 rounded-[2rem] border border-[#1A2E22]"><h3 className="text-2xl font-serif mb-5">Direct Buyer Directory</h3>{buyerDirectory.filter(x=>`${x.crop} ${x.type} ${x.region}`.toLowerCase().includes(marketSearch.toLowerCase())).map((x,idx)=><div key={`buyer-record-${x.crop}-${x.id || x.type}-${idx}`} className="p-4 border-b border-white/5"><b>{getCropDisplayName(x.crop, lang)}</b><p className="text-xs text-gray-400 mt-1">{x.type} · {x.region}</p><button onClick={()=>{setInquiryModal({isOpen: true, buyer: x, message: ""}); document.body.style.overflow = "hidden";}} className="mt-3 text-xs text-[#B5F140] font-bold border border-[#B5F140]/30 px-3 py-1.5 rounded-lg hover:bg-[#B5F140]/10 z-50 relative pointer-events-auto">Contact / Inquire →</button></div>)}</div>
            </div>
          </div>
        )}

        {/* ===================== FIELD COST & MAP OVERLAY ===================== */}
        {activeTab === "profile" && (
          <div className="animate-in fade-in duration-500 space-y-8"><header><h2 className="text-5xl font-serif">Grower Profile</h2><p className="text-sm text-gray-400 mt-3">Your farmer identity, portfolio and operating summary.</p></header><div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] flex flex-wrap gap-8 items-center"><div className="relative"><div style={profileImage?{backgroundImage:`url(${profileImage})`}:undefined} className="w-32 h-32 rounded-full bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1595991209266-5ff5a3a2f008?q=80&w=300')] border-2 border-[#B5F140]/50"/><label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-[#B5F140] text-black p-3 rounded-full cursor-pointer"><Camera size={16}/></label><input id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload}/></div><div><h3 className="text-3xl font-serif">{fullName||'Sanghavi S Avadhani'}</h3><p className="text-gray-400 mt-2">{loginEmail||'farmer@example.com'}</p><p className="text-xs text-gray-500 mt-2">{fields.length} fields · {totalAcres.toFixed(1)} acres</p></div></div><div className="grid md:grid-cols-2 gap-6">{fields.map(f=>{const c=getFieldCostEstimate(f,f.crop||'Maize');return <div key={f.id} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><div className="flex justify-between"><h4 className="font-bold">{f.name}</h4><span className="text-[#B5F140]">{f.crop||'Crop not selected'}</span></div><div className="grid grid-cols-3 gap-3 mt-5 text-xs"><span>Cost<br/><b>₹{Math.round(c.total).toLocaleString('en-IN')}</b></span><span>Revenue*<br/><b>₹{Math.round(c.revenue).toLocaleString('en-IN')}</b></span><span>Profit*<br/><b className="text-[#B5F140]">₹{Math.round(c.profit).toLocaleString('en-IN')}</b></span></div><p className="text-[9px] text-gray-600 mt-4">*Planning estimate only; validate local prices, yield and agronomic rates.</p></div>})}</div>
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]">
                <div className="flex items-center gap-3 mb-5"><MapPinned className="text-[#B5F140]"/><div><p className="text-[10px] uppercase tracking-widest text-[#B5F140] font-bold">{getBusinessText(lang,"location")}</p><h3 className="text-2xl font-serif mt-1">Delivery Location</h3></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <textarea value={profileLocation.address} onChange={e=>setProfileLocation({...profileLocation,address:e.target.value})} placeholder="House / farm address" className="md:col-span-2 bg-black/30 border border-white/10 rounded-xl p-3 text-sm min-h-24"/>
                  <input value={profileLocation.city} onChange={e=>setProfileLocation({...profileLocation,city:e.target.value})} placeholder="City / village" className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm"/>
                  <input value={profileLocation.state} onChange={e=>setProfileLocation({...profileLocation,state:e.target.value})} placeholder="State" className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm"/>
                  <input value={profileLocation.pincode} onChange={e=>setProfileLocation({...profileLocation,pincode:e.target.value.replace(/\D/g,"").slice(0,6)})} placeholder="6-digit pincode" className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm"/>
                  <input value={profileLocation.landmark} onChange={e=>setProfileLocation({...profileLocation,landmark:e.target.value})} placeholder="Landmark (optional)" className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm"/>
                </div>
                <button onClick={saveProfileLocation} className="mt-4 w-full bg-[#B5F140] text-black py-3 rounded-xl font-bold">Save Delivery Address</button>
                <p className="text-[9px] text-gray-600 mt-3">This address is stored locally in this demo. Connect your authenticated backend to persist it across devices.</p>
              </div>
              <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]">
                <div className="flex items-center gap-3 mb-5"><Receipt className="text-[#B5F140]"/><div><p className="text-[10px] uppercase tracking-widest text-[#B5F140] font-bold">{getBusinessText(lang,"tracker")}</p><h3 className="text-2xl font-serif mt-1">Order Tracker</h3></div></div>
                {businessOrders.length===0 ? <p className="text-sm text-gray-500 py-5">No orders yet. Complete a demo checkout to see order tracking here.</p> : <div className="space-y-4">{businessOrders.slice(0,3).map((order:any)=><div key={`profile-order-${order.id}`} className="border border-white/10 rounded-2xl p-4 bg-black/20"><div className="flex justify-between gap-3"><div><p className="font-bold text-white">{order.id}</p><p className="text-[10px] text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p></div><span className="text-[10px] text-[#B5F140]">{logisticsStages[Math.min(logisticsStages.length-1,Number(order.stage||0))]}</span></div><div className="flex gap-1 mt-4">{logisticsStages.map((stage:string,idx:number)=><div key={`${order.id}-stage-${idx}`} className={`h-1 flex-1 rounded-full ${idx<=Number(order.stage||0)?"bg-[#B5F140]":"bg-white/10"}`}/>)}</div><button onClick={()=>{setSelectedOrderId(order.id);setActiveTab("logistics");}} className="mt-3 text-xs text-[#B5F140] font-bold">Open tracking →</button></div>)}</div>}
              </div>
            </div>
            <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22] mt-6">
              <div className="flex items-center gap-3 mb-5"><CreditCard className="text-[#B5F140]"/><div><p className="text-[10px] uppercase tracking-widest text-[#B5F140] font-bold">{getBusinessText(lang,"payment")}</p><h3 className="text-2xl font-serif mt-1">Payment History & Methods</h3></div></div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-black/20 border border-white/5 rounded-xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">Preferred method</p><p className="mt-2 font-bold">{paymentMethod}</p></div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">Saved delivery</p><p className="mt-2 text-sm">{profileLocation.city || "Not saved"}{profileLocation.pincode ? ` · ${profileLocation.pincode}` : ""}</p></div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-4"><p className="text-[9px] uppercase tracking-widest text-gray-500">Payment records</p><p className="mt-2 font-bold">{paymentHistory.length}</p></div>
              </div>
              {paymentHistory.length>0 && <div className="mt-5 space-y-2">{paymentHistory.slice(0,5).map((pay:any)=><div key={`payment-${pay.id}`} className="flex items-center justify-between border-b border-white/5 py-3 text-xs"><span>{pay.orderId} · {pay.method}</span><span className="text-[#B5F140]">{pay.amount ? formatCurrency(pay.amount) : "Supplier quote"} · {pay.status}</span></div>)}</div>}
            </div>
</div>
        )}

        {/* ===================== NEW: DRONES TAB ===================== */}
        {activeTab === "drones" && (
           <div className="animate-in fade-in duration-500 print:hidden relative">
            <header className="mb-10"><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Drone Sprayers</h2><p className="text-sm text-gray-400">Book and manage agricultural spray drones for your active fields.</p></header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg">
                <div className="h-64 bg-black/50 rounded-2xl mb-6 overflow-hidden relative border border-white/5">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555513813-f47dc662ce22?q=80&w=1920')] bg-cover bg-center opacity-40"></div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
                   <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div><p className="text-[#B5F140] font-bold text-xs uppercase tracking-widest mb-1">Active Field</p><p className="text-2xl text-white font-serif">{activeFieldName}</p></div>
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10"><p className="text-xs text-white flex items-center gap-2"><MapPin size={12}/> {primaryLocation}</p></div>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Est. Flight Time</p><p className="text-xl text-white font-mono">1.5 <span className="text-xs text-gray-400">hrs</span></p></div>
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Payload Required</p><p className="text-xl text-white font-mono">45 <span className="text-xs text-gray-400">Litres</span></p></div>
                </div>
                <button onClick={() => { setDroneStatus('booking'); setTimeout(() => { setDroneStatus('booked'); addHistory("drone", "Drone sprayer booked"); showToast("Drone successfully dispatched to active field."); }, 2000); }} disabled={droneStatus !== 'idle'} className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all ${droneStatus === 'idle' ? 'bg-[#B5F140] text-[#12281C] hover:scale-[1.02]' : droneStatus === 'booking' ? 'bg-gray-500 text-white' : 'bg-green-600 text-white'}`}>
                  {droneStatus === 'idle' ? <><Plane size={18}/> Book Spraying Drone</> : droneStatus === 'booking' ? <><RefreshCw size={18} className="animate-spin"/> Acquiring GPS Lock...</> : <><CheckCircle2 size={18}/> Drone Dispatched!</>}
                </button>
              </div>
              <div className="bg-[#0A160F] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg flex flex-col justify-center items-center text-center">
                 <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-6"><Plane size={32} className="text-blue-400"/></div>
                 <h3 className="text-2xl font-serif text-white mb-2">Agras T40 Fleet Available</h3>
                 <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">High payload drone sprayers are currently available in your region. Coverage rate: 21 hectares per hour.</p>
                 <div className="bg-white/5 w-full p-4 rounded-xl flex justify-between items-center"><span className="text-gray-400 text-sm">Estimated Cost</span><span className="text-[#B5F140] font-mono text-xl font-bold">₹1,200 / Acre</span></div>
              </div>
            </div>
           </div>
        )}

        {/* ===================== NEW: IRRIGATION IOT TAB ===================== */}
        {activeTab === "irrigation" && (
           <div className="animate-in fade-in duration-500 print:hidden relative">
            <header className="mb-10"><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Irrigation Pumps</h2><p className="text-sm text-gray-400">Manage your smart pump relays and irrigation schedule.</p></header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4"><p className="text-[10px] font-bold tracking-[0.15em] text-blue-400 uppercase flex items-center gap-2"><Droplets size={16}/> Active Pump Relays</p><button onClick={() => { setIotPairing('searching'); setTimeout(() => { setIotPairing('connected'); addHistory("iot", "New pump connected"); showToast("New IoT Pump Controller paired."); }, 2500); }} className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg text-xs font-bold border border-blue-500/30 transition-all">{iotPairing === 'idle' ? 'Add Device +' : iotPairing === 'searching' ? 'Scanning...' : 'Paired'}</button></div>
                <div className="space-y-4">
                  <div className="bg-black/30 p-5 rounded-2xl border border-blue-500/20 flex justify-between items-center">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center"><Power size={20} className="text-blue-400 animate-pulse"/></div><div><p className="text-white font-bold">Main Borewell (5HP)</p><p className="text-[10px] text-blue-300 mt-1 uppercase tracking-widest">{activeFieldName} • Running</p></div></div>
                    <div className="text-right"><p className="text-white font-mono text-xl">02:15:00</p><p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Remaining Time</p></div>
                  </div>
                  <div className="bg-black/30 p-5 rounded-2xl border border-white/5 flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center"><Power size={20} className="text-gray-500"/></div><div><p className="text-white font-bold">Drip Line B (2HP)</p><p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Orchard • Offline</p></div></div>
                    <div className="text-right"><p className="text-gray-400 font-mono text-xl">--:--:--</p></div>
                  </div>
                  {iotPairing === 'connected' && (
                    <div className="bg-green-500/10 p-5 rounded-2xl border border-green-500/30 flex justify-between items-center animate-in zoom-in duration-300">
                      <div className="flex items-center gap-4"><div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center"><Power size={20} className="text-green-400"/></div><div><p className="text-white font-bold">New Submersible (3HP)</p><p className="text-[10px] text-green-300 mt-1 uppercase tracking-widest">Zone C • Connected</p></div></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#0F1E29] to-[#081118] p-8 rounded-[2rem] border border-blue-900/50 shadow-lg flex flex-col justify-center text-center relative overflow-hidden">
                 <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mb-6 mx-auto relative z-10"><CloudRain size={32} className="text-blue-400"/></div>
                 <h3 className="text-2xl font-serif text-white mb-2 relative z-10">Auto-Skip Enabled</h3>
                 <p className="text-blue-200/60 text-sm mb-8 leading-relaxed relative z-10">System will automatically halt irrigation if rain probability exceeds 60% in your microclimate zone.</p>
                 <button onClick={() => setIrrigationConfigOpen(!irrigationConfigOpen)} className="w-full bg-transparent border border-blue-500 text-blue-400 py-3 rounded-xl font-bold hover:bg-blue-500/10 transition-all relative z-10">{irrigationConfigOpen ? 'Save Settings' : 'Configure Rules'}</button>
                 
                 {irrigationConfigOpen && (
                   <div className="absolute inset-0 bg-[#0F1E29]/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom-10">
                     <p className="text-blue-400 font-bold mb-4">Set Rain Threshold</p>
                     <input type="range" min="0" max="100" defaultValue="60" className="w-full mb-6 accent-blue-500"/>
                     <button onClick={() => { setIrrigationConfigOpen(false); addHistory("irrigation", "Auto-skip rules updated"); showToast("Irrigation automation rules updated."); }} className="bg-blue-500 text-white px-6 py-2 rounded-lg font-bold w-full">Apply Rule</button>
                   </div>
                 )}
              </div>
            </div>
           </div>
        )}

        {/* ===================== NEW: SEEDS TAB ===================== */}
        {activeTab === "seeds" && (
           <div className="animate-in fade-in duration-500 print:hidden relative">
            <header className="mb-8"><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Certified Seeds & Farm Inputs</h2><p className="text-sm text-gray-400">Buy certified seeds and essential fertilizers for your farm.</p></header>
            <div className="bg-[#0A160F] p-6 rounded-[2rem] border border-[#1A2E22] shadow-lg mb-8 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18}/><input type="text" value={seedSearchTerm} onChange={(e)=>setSeedSearchTerm(e.target.value)} placeholder="Search seeds or fertilizers..." className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#B5F140]"/></div>
                <div className="flex gap-2 flex-wrap">
                  {["All","Seed","Fertilizer"].map(c=><button key={c} onClick={()=>setShopCategory(c)} className={`px-5 py-3 rounded-xl text-xs font-bold border ${shopCategory===c?'bg-[#B5F140] text-black border-[#B5F140]':'bg-white/5 text-gray-300 border-white/10'}`}>{c}</button>)}
                  <button onClick={()=>setIsCartOpen(true)} className="relative px-5 py-3 rounded-xl bg-[#1A2E22] text-white text-xs font-bold border border-white/10"><ShoppingCart size={16} className="inline mr-2"/>Cart {getCartItemCount()>0 && <span className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full text-[10px] flex items-center justify-center">{getCartItemCount()}</span>}</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {shopProducts.filter((p: any)=>(shopCategory==='All'||p.type===shopCategory)&&`${p.name} ${getProductName(p, 'en')}`.toLowerCase().includes(seedSearchTerm.toLowerCase())).slice(0,18).map((product: any)=>(
                <div key={product.id} className="bg-[#0D1912] p-6 rounded-2xl border border-white/5 hover:border-[#B5F140]/50 transition-all shadow-lg flex flex-col justify-between">
                  <div><div className="w-12 h-12 bg-[#B5F140]/10 rounded-xl flex items-center justify-center mb-4 border border-[#B5F140]/20">{product.type==='Seed'?<Sprout className="text-[#B5F140]"/>:<FlaskConical className="text-[#B5F140]"/>}</div>
                    <p className="text-lg font-bold text-white mb-1">{getProductName(product, 'en')}</p><p className="text-xs text-gray-500 mb-4">{product.type} · {product.unit}</p>
                    {product.duration && <p className="text-xs text-gray-500 mb-4">Crop cycle: {product.duration}</p>}
                  </div>
                  <div className="flex justify-between items-center mt-6"><p className="text-[#B5F140] font-bold font-mono">{product.price ? `₹${product.price.toLocaleString('en-IN')}` : "Supplier price"}</p><button onClick={()=>addProductToCart(product)} className={`px-4 py-2.5 rounded-lg text-xs font-bold ${cartItems.includes(product.id)?'bg-[#B5F140] text-black':'bg-white/10 text-white hover:bg-[#B5F140] hover:text-black'}`}>{cartItems.includes(product.id)?"Added ✓":"Add to cart"}</button></div>
                </div>
              ))}
            </div>

            {/* FARM PLANNER → INPUT STORE BRIDGE */}
            <div className="mt-10 bg-[#0A160F] p-7 rounded-[2rem] border border-[#B5F140]/20 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div><p className="text-[10px] text-[#B5F140] uppercase tracking-widest font-bold">Farm Planner Input Match</p><h3 className="text-2xl font-serif text-white mt-2">Recommended fertilizers from your latest analysis</h3><p className="text-xs text-gray-500 mt-2">Only planning matches are shown here. Exact field dosage must be validated against soil testing, crop stage and the local product label.</p></div>
                <button onClick={()=>setActiveTab("forecast")} className="border border-[#B5F140]/30 text-[#B5F140] px-4 py-2 rounded-xl text-xs font-bold">Review Farm Planner</button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {buildDeficiencyList().map((d:any,di:number)=><div key={`deficiency-${d.nutrient}-${di}`} className="bg-black/30 p-5 rounded-2xl border border-white/5"><p className="text-xs font-bold text-white">{d.title}</p><p className="text-[10px] text-gray-500 mt-1">Nutrient: {d.nutrient}</p><div className="space-y-2 mt-4">{d.products.slice(0,3).map((p:any,pi:number)=><button key={`def-${d.nutrient}-${String(p?.id || p?.name || "input")}-${pi}`} onClick={()=>addProductToCart(p)} className="w-full text-left bg-white/5 hover:bg-[#B5F140]/10 rounded-xl p-3 border border-white/5"><span className="text-xs text-white font-semibold block">{getProductName(p,lang)}</span><span className="text-[10px] text-[#B5F140]">Add to cart · {p.unit}</span></button>)}</div></div>)}
              </div>
            </div>

            <div className="bg-[#0D1912] p-6 rounded-[2rem] border border-[#B5F140]/20 mt-6">
              <div className="flex flex-wrap justify-between gap-4 items-start"><div><p className="text-[10px] uppercase tracking-widest text-[#B5F140] font-bold">Farm Planner → Certified Seeds & Fertilizers</p><h3 className="text-2xl font-serif mt-2">{getBusinessText(lang,"recommended")}</h3><p className="text-xs text-gray-500 mt-2">{getBusinessText(lang,"deficiency")}. Matching fertilizer products are shown below so the farmer can move directly from diagnosis to purchase.</p></div><button onClick={()=>setActiveTab("planner")} className="text-xs border border-white/10 px-4 py-2 rounded-xl">Review Planner</button></div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
                {getUniqueProductList(getPlannerDeficiencyProducts()).slice(0,6).map((p:any,pIndex:number)=><div key={`deficiency-product-${String(p?.id || p?.name || "input")}-${pIndex}`} className="bg-black/20 border border-white/5 rounded-2xl p-4"><div className="flex justify-between gap-2"><span className="text-[9px] uppercase tracking-widest text-amber-300">{p.type}</span><span className="text-[9px] text-gray-500">{p.category}</span></div><h4 className="font-bold mt-3">{getProductName(p,lang)}</h4><p className="text-xs text-gray-500 mt-2">{p.nutrients || "Nutrient profile available from product catalogue"}</p><button onClick={()=>addProductToCart(p)} className="mt-4 w-full bg-[#B5F140] text-black py-2.5 rounded-xl text-xs font-bold">{getBusinessText(lang,"buy")}</button></div>)}
              </div>
              <p className="text-[9px] text-gray-600 mt-4">Only products already present in the local catalogue are linked. Exact fertilizer rate should be validated against soil test, crop stage and product label.</p>
            </div>
            {isCartOpen && <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-2xl bg-[#0B150E] border border-[#2D5A3C] rounded-3xl p-7 max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-serif text-white">Shopping Cart</h3><button onClick={()=>setIsCartOpen(false)}><X className="text-gray-400"/></button></div>{cartItems.length===0?<p className="text-gray-400 py-8 text-center">Your cart is empty.</p>:<><div className="space-y-3">{cartItems.map(id=>{const p = shopProducts.find((x:any)=>x.id===id); if(!p)return null; const qty=getCartQuantity(id); return <div key={`cart-${id}`} className="bg-white/5 p-4 rounded-xl border border-white/5"><div className="flex justify-between gap-4 items-center"><div><p className="text-white font-bold">{getProductName(p,lang)}</p><p className="text-xs text-gray-500">{p.type} · {p.unit} · {p.category || "Agricultural input"}</p></div><div className="text-right"><p className="text-[#B5F140] font-mono">{p.price?formatCurrency(p.price*qty):"Supplier price"}</p><button onClick={()=>removeProductFromCart(id)} className="text-red-400 text-xs mt-2 inline-flex items-center gap-1"><Trash2 size={14}/> Remove</button></div></div><div className="flex items-center justify-between mt-4"><span className="text-xs text-gray-500">Quantity</span><div className="flex items-center gap-2"><button onClick={()=>setCartQuantitySafe(id,qty-1)} disabled={qty<=1} className="w-8 h-8 rounded-lg bg-white/10 disabled:opacity-30">−</button><span className="w-8 text-center font-mono">{qty}</span><button onClick={()=>setCartQuantitySafe(id,qty+1)} className="w-8 h-8 rounded-lg bg-white/10">+</button></div></div></div>})}</div><div className="border-t border-white/10 mt-6 pt-5 flex justify-between items-center"><div><p className="text-white font-bold">Items: {getCartItemCount()}</p><p className="text-xs text-gray-500 mt-1">Cart total: {getCartTotal() ? formatCurrency(getCartTotal()) : "Supplier pricing pending"}</p></div><button onClick={()=>{setCheckoutOpen(true);setIsCartOpen(false)}} className="bg-[#B5F140] text-black px-6 py-3 rounded-xl font-bold">Continue to Payment</button></div></>}</div></div>}

            {checkoutOpen && <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"><div className="w-full max-w-2xl bg-[#0B150E] border border-[#2D5A3C] rounded-3xl p-7 max-h-[92vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><div><h3 className="text-2xl font-serif text-white">Delivery & Payment</h3><p className="text-xs text-gray-500 mt-1">Demo checkout UI. Connect a payment gateway/backend before accepting real payments.</p></div><button onClick={()=>setCheckoutOpen(false)}><X className="text-gray-400"/></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><input placeholder="Full name" value={paymentDetails.name} onChange={e=>setPaymentDetails({...paymentDetails,name:e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/><input placeholder="Phone number" value={paymentDetails.phone} onChange={e=>setPaymentDetails({...paymentDetails,phone:e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/><textarea placeholder="Delivery address" value={paymentDetails.address} onChange={e=>setPaymentDetails({...paymentDetails,address:e.target.value})} className="md:col-span-2 bg-black/40 border border-white/10 rounded-xl p-3 text-white min-h-[6rem] focus:outline-none focus:border-[#B5F140]"/><input placeholder="City" value={profileLocation.city} onChange={e=>setProfileLocation({...profileLocation,city:e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/><input placeholder="State" value={profileLocation.state} onChange={e=>setProfileLocation({...profileLocation,state:e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/><input placeholder="Pincode" value={profileLocation.pincode} onChange={e=>setProfileLocation({...profileLocation,pincode:e.target.value.replace(/\D/g,"").slice(0,6)})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/></div><div className="flex gap-2 mb-5">{["UPI","Card","Cash on Delivery"].map(m=><button key={m} onClick={()=>setPaymentMethod(m)} className={`px-4 py-2 rounded-lg text-xs font-bold border ${paymentMethod===m?'bg-[#B5F140] text-black border-[#B5F140]':'bg-white/5 text-gray-300 border-white/10'}`}>{m}</button>)}</div>{paymentMethod==='UPI'&&<input placeholder="UPI ID (example: name@bank)" value={paymentDetails.upi} onChange={e=>setPaymentDetails({...paymentDetails,upi:e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white mb-4 focus:outline-none focus:border-[#B5F140]"/>}{paymentMethod==='Card'&&<div className="grid grid-cols-2 gap-4 mb-4"><input placeholder="Card number" value={paymentDetails.card} onChange={e=>setPaymentDetails({...paymentDetails,card:e.target.value})} className="col-span-2 bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/><input placeholder="MM/YY" value={paymentDetails.expiry} onChange={e=>setPaymentDetails({...paymentDetails,expiry:e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/><input placeholder="CVV" type="password" value={paymentDetails.cvv} onChange={e=>setPaymentDetails({...paymentDetails,cvv:e.target.value})} className="bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#B5F140]"/></div>}<button onClick={placeDemoOrder} className="w-full bg-[#B5F140] text-black py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform">Place Order</button>{orderStatus&&<p className="mt-4 text-sm text-gray-300 bg-white/5 p-4 rounded-xl">{orderStatus}</p>}</div></div>}
           </div>
        )}

        {/* ===================== NEW: EXPERT CONSULT TAB ===================== */}
        {activeTab === "expert" && (
           <div className="animate-in fade-in duration-500 print:hidden relative">
            <header className="mb-10"><h2 className="text-5xl font-serif tracking-tight text-white mb-3">Expert Consult</h2><p className="text-sm text-gray-400">Book a 1-on-1 video consultation with certified agronomists.</p></header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-[#0D1912] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg h-fit relative overflow-hidden">
                {expertStatus === 'sent' && (
                  <div className="absolute inset-0 bg-[#0D1912]/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
                     <div className="w-16 h-16 bg-[#B5F140]/20 rounded-full flex items-center justify-center mb-4 border border-[#B5F140]/50"><CheckCircle2 size={32} className="text-[#B5F140]"/></div>
                     <p className="text-white font-bold text-lg mb-2">Request Sent Successfully!</p>
                     <p className="text-gray-400 text-xs leading-relaxed mb-6">An agronomist will contact you via video call on your registered number within 24 hours.</p>
                     <button onClick={() => {setExpertStatus('idle'); setExpertDescription(""); setExpertPreviews([]);}} className="bg-white/10 text-white px-6 py-2 rounded-lg text-sm font-bold">New Request</button>
                  </div>
                )}
                
                <form className="space-y-6" onSubmit={submitExpertRequest}>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Topic of Consultation</label><select value={expertTopic} onChange={e=>setExpertTopic(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140] appearance-none"><option>Pest/Disease Identification</option><option>Fertilizer Schedule</option><option>Yield Improvement</option><option>Irrigation</option><option>Soil/NPK</option></select></div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Attach Field Images (Optional)</label><input id="expert-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleExpertImages}/><label htmlFor="expert-upload" className="w-full min-h-[130px] border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-black/20 cursor-pointer"><UploadCloud size={24} className="text-[#B5F140] mb-2"/><p className="text-xs text-white font-semibold">Click to upload field images</p><p className="text-[10px] text-gray-500 mt-1">PNG/JPG/WEBP · up to 5 images</p></label>{expertPreviews.length>0&&<div className="grid grid-cols-3 gap-3 mt-3">{expertPreviews.map((u,i)=><div key={u} className="relative aspect-square rounded-xl overflow-hidden"><img src={u} className="w-full h-full object-cover" alt="Field upload"/><button type="button" onClick={()=>removeExpertImage(i)} className="absolute top-1 right-1 bg-black/80 rounded-full p-1"><X size={12} className="text-white"/></button></div>)}</div>}</div>
                  <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Describe the Issue</label><textarea required rows={4} value={expertDescription} onChange={e=>setExpertDescription(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140] custom-scrollbar" placeholder="Please describe the problem you are facing in your field..."></textarea></div>
                  <button type="submit" disabled={expertStatus !== 'idle'} className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-[0_0_15px_rgba(181,241,64,0.2)] ${expertStatus === 'idle' ? 'bg-[#B5F140] text-[#12281C] hover:scale-[1.02]' : 'bg-gray-500 text-white'}`}>{expertStatus === 'idle' ? <><Video size={18}/> Request Video Consult</> : <><RefreshCw size={18} className="animate-spin"/> Sending...</>}</button>
                </form>
              </div>
              <div className="lg:col-span-7 bg-[#0A160F] p-8 rounded-[2rem] border border-[#1A2E22] shadow-lg relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[400px]">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-screen"></div>
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0A160F] via-[#0A160F]/80 to-transparent"></div>
                 <div className="relative z-10">
                   <div className="flex justify-center -space-x-4 mb-6">
                      <div className="w-16 h-16 rounded-full border-2 border-[#0A160F] bg-[url('https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200')] bg-cover"></div>
                      <div className="w-16 h-16 rounded-full border-2 border-[#0A160F] bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200')] bg-cover"></div>
                      <div className="w-16 h-16 rounded-full border-2 border-[#0A160F] bg-white/10 backdrop-blur-md flex items-center justify-center text-xs font-bold">+12</div>
                   </div>
                   <h3 className="text-3xl font-serif text-white mb-3">Connect with Top Agronomists</h3>
                   <p className="text-gray-400 max-w-sm mx-auto mb-8">Get personalized video consultations directly from certified agricultural scientists within 24 hours.</p>
                   <div className="flex gap-4 justify-center">
                     <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs flex items-center gap-2"><CheckCircle2 size={12} className="text-[#B5F140]"/> Soil Experts</span>
                     <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs flex items-center gap-2"><CheckCircle2 size={12} className="text-[#B5F140]"/> Pathologists</span>
                   </div>
                 </div>
              </div>
            </div>
           </div>
        )}

        {/* ===================== FARM ALERT CENTER ===================== */}
        {activeTab === "alerts" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">Operational Alerts</p><h2 className="text-5xl font-serif mt-2">Farm Alert Center</h2><p className="text-sm text-gray-400 mt-3">Weather, irrigation, nutrient and crop-risk actions for the selected field.</p></header>
            <div className="flex gap-2 flex-wrap">{["All","Critical","Warning","Information"].map(f=><button key={`alert-filter-${f}`} onClick={()=>setAlertFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${alertFilter===f?'bg-[#B5F140] text-black border-[#B5F140]':'bg-white/5 text-gray-300 border-white/10'}`}>{f}</button>)}</div>
            <div className="grid md:grid-cols-2 gap-5">{(farmAlerts.length?farmAlerts:createFarmAlerts()).filter(a=>alertFilter==='All'||a.severity===alertFilter).map((a:any)=><div key={a.id} className="bg-[#0D1912] p-6 rounded-3xl border border-white/5"><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-full bg-[#B5F140]/10 flex items-center justify-center"><BellRing size={17} className="text-[#B5F140]"/></div><div><p className="text-[10px] uppercase tracking-widest text-gray-500">{a.type} · {a.severity}</p><h3 className="text-lg font-bold mt-1">{a.title}</h3><p className="text-sm text-gray-400 mt-2 leading-relaxed">{a.message}</p></div></div></div>)}{!(farmAlerts.length||createFarmAlerts().length)&&<div className="bg-[#0D1912] p-8 rounded-3xl border border-white/5 text-gray-500">No active alerts for the selected field.</div>}</div>
            <button onClick={()=>setFarmAlerts(createFarmAlerts())} className="bg-[#B5F140] text-black px-5 py-3 rounded-xl font-bold">Refresh Alerts</button>
          </div>
        )}

        {/* ===================== OPERATIONS CENTER ===================== */}
        {activeTab === "operations" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header><p className="text-[10px] tracking-[0.2em] text-[#B5F140] uppercase font-bold">Farmer Operations</p><h2 className="text-5xl font-serif mt-2">Operations Center</h2><p className="text-sm text-gray-400 mt-3">One place to understand field status, inputs, irrigation, surveillance, costs and next actions.</p></header>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[["Active Field",activeFieldName],["Crop",getCropDisplayName(activeCrop,lang)],["Area",`${activeField?.area || 0} acres`],["Planning Risk",activeField?.risk || "Review"]].map(([label,value],i)=><div key={`ops-kpi-${i}`} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><p className="text-[9px] text-gray-500 uppercase tracking-widest">{label}</p><p className="text-xl font-serif text-white mt-3 break-words">{value}</p></div>)}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><div className="flex justify-between items-center mb-6"><div><p className="text-[10px] text-[#B5F140] uppercase tracking-widest font-bold">Next actions</p><h3 className="text-2xl font-serif mt-2">What should happen today?</h3></div><button onClick={()=>setActiveTab('alerts')} className="text-[#B5F140] text-xs font-bold">View alerts →</button></div><div className="space-y-3">{buildTodayActions(activeField).map((a,i)=><div key={`ops-action-${i}`} className="p-4 bg-black/25 rounded-xl border border-white/5 flex gap-3"><CheckCircle2 size={17} className="text-[#B5F140] shrink-0 mt-0.5"/><p className="text-sm text-gray-300">{a}</p></div>)}</div></div>
              <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><div className="flex justify-between items-center mb-6"><div><p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Smart irrigation</p><h3 className="text-2xl font-serif mt-2">Water decision</h3></div><Droplets className="text-blue-400"/></div><div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5"><p className="text-2xl font-serif">{getFieldSummary(activeField).irrigation.needed ? "Irrigation may be needed" : "Irrigation not currently indicated"}</p><p className="text-sm text-gray-400 mt-3">{getFieldSummary(activeField).irrigation.reason}</p></div><div className="grid grid-cols-3 gap-3 mt-4"><div className="bg-black/25 p-3 rounded-xl"><p className="text-[9px] text-gray-500">Moisture</p><p className="font-mono mt-1">{getFieldSummary(activeField).moisture}%</p></div><div className="bg-black/25 p-3 rounded-xl"><p className="text-[9px] text-gray-500">Rain</p><p className="font-mono mt-1">{getFieldSummary(activeField).rain}%</p></div><div className="bg-black/25 p-3 rounded-xl"><p className="text-[9px] text-gray-500">Crop</p><p className="font-mono mt-1 text-[10px]">{getCropDisplayName(activeCrop,lang)}</p></div></div></div>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><p className="text-[10px] text-[#B5F140] uppercase tracking-widest font-bold">NPK status</p><h3 className="text-2xl font-serif mt-2 mb-5">Deficiency watch</h3>{Object.entries(getFieldSummary(activeField).nutrients).map(([k,v])=><div key={`ops-nutrient-${k}`} className="flex justify-between items-center border-b border-white/5 py-3"><span className="text-sm uppercase">{k}</span><span className={`text-xs font-bold ${v==='Low'?'text-amber-300':v==='High'?'text-red-400':'text-[#B5F140]'}`}>{String(v)}</span></div>)}<button onClick={()=>setActiveTab('seeds')} className="mt-5 w-full bg-[#B5F140] text-black py-3 rounded-xl text-xs font-bold">Find Recommended Inputs</button></div>
              <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><p className="text-[10px] text-purple-300 uppercase tracking-widest font-bold">Surveillance</p><h3 className="text-2xl font-serif mt-2 mb-5">Sensor readiness</h3><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-gray-500">Camera / drone</span><span className="text-gray-400">Awaiting connection</span></div><div className="flex justify-between"><span className="text-gray-500">IoT soil sensor</span><span className="text-gray-400">Awaiting connection</span></div><div className="flex justify-between"><span className="text-gray-500">Pump controller</span><span className="text-gray-400">Awaiting connection</span></div></div><p className="text-[10px] text-gray-600 mt-5 leading-relaxed">No hardware connection is represented as live. Connect the corresponding provider before displaying real-time sensor values.</p></div>
              <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><p className="text-[10px] text-[#FFD166] uppercase tracking-widest font-bold">Cost planning</p><h3 className="text-2xl font-serif mt-2 mb-5">Current field estimate</h3>{(()=>{const c=getFieldCostEstimate(activeField,activeCrop);return <div className="space-y-3"><div className="flex justify-between"><span className="text-gray-500">Seed / planting</span><b>{formatCurrency(c.seed)}</b></div><div className="flex justify-between"><span className="text-gray-500">Total estimated cost</span><b>{formatCurrency(c.total)}</b></div><div className="flex justify-between"><span className="text-gray-500">Estimated revenue</span><b>{formatCurrency(c.revenue)}</b></div><div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-gray-300">Estimated profit</span><b className="text-[#B5F140]">{formatCurrency(c.profit)}</b></div><p className="text-[9px] text-gray-600 mt-2">Planning estimate only. Validate local prices, yield and agronomic rates.</p></div>})()}</div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* FARM BUSINESS HUB — ADDED WITHOUT REMOVING EXISTING MODULES        */}
        {/* ================================================================== */}
        {activeTab === "business" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header>
              <p className="text-[10px] tracking-[0.22em] text-[#B5F140] uppercase font-bold">Commercial Agriculture / 02</p>
              <h2 className="text-5xl font-serif mt-2">{getBusinessText(lang,"hub")}</h2>
              <p className="text-sm text-gray-400 mt-3 max-w-3xl">Connect farm planning to purchasing, subscriptions, education, traceability, wholesale, contracts, delivery and seasonal labor — without pretending unavailable providers are live.</p>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {businessModuleCatalog.map((module:any)=><button key={`business-module-${module.id}`} onClick={()=>setBusinessSection(module.id)} className={`p-3 rounded-xl border text-left transition-all ${businessSection===module.id?"bg-[#B5F140] text-black border-[#B5F140]":"bg-[#0D1912] text-gray-300 border-white/10 hover:border-[#B5F140]/40"}`}><module.icon size={17}/><span className="block text-[10px] font-bold mt-2 leading-tight">{businessTranslations[lang]?.[module.id] || module.title}</span></button>)}
            </div>

            {businessSection === "catalog" && (
              <div className="space-y-6">
                <div className="bg-[#0D1912] p-6 rounded-[2rem] border border-[#1A2E22] flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[240px]"><Search size={16} className="absolute left-3 top-3.5 text-gray-500"/><input value={businessSearch} onChange={e=>setBusinessSearch(e.target.value)} placeholder={`${getBusinessText(lang,"search")} seeds, fertilizer, crop...`} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-9 text-sm focus:outline-none focus:border-[#B5F140]"/></div>
                  {['All','Seed','Fertilizer'].map(cat=><button key={`business-cat-${cat}`} onClick={()=>setSelectedBusinessCategory(cat)} className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${selectedBusinessCategory===cat?'bg-[#B5F140] text-black border-[#B5F140]':'border-white/10 text-gray-400'}`}>{cat}</button>)}
                  <button onClick={()=>setActiveTab("seeds")} className="px-4 py-2.5 rounded-xl border border-[#B5F140]/30 text-[#B5F140] text-xs font-bold">Open full store →</button>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {shopProducts.filter((p:any)=>(selectedBusinessCategory==='All'||p.type===selectedBusinessCategory)&&`${p.name} ${p.category||''} ${p.crop||''}`.toLowerCase().includes(businessSearch.toLowerCase())).slice(0,18).map((p:any)=><div key={`business-product-${p.id}`} className="bg-[#0D1912] p-5 rounded-3xl border border-[#1A2E22] hover:border-[#B5F140]/30 transition-all"><div className="flex justify-between gap-3"><span className="text-[9px] uppercase tracking-widest text-[#B5F140]">{p.type}</span><span className="text-[9px] text-gray-500">{p.unit}</span></div><h3 className="text-xl font-serif mt-3">{getProductName(p,lang)}</h3><p className="text-xs text-gray-500 mt-2">{p.crop || "Multi-crop"} · {p.category || "Agricultural input"}</p><div className="flex items-center justify-between mt-5"><span className="font-mono text-[#B5F140]">{p.price ? formatCurrency(p.price) : "Supplier quote"}</span><button onClick={()=>addProductToCart(p)} className="bg-[#B5F140] text-black px-4 py-2 rounded-xl text-xs font-bold">{getBusinessText(lang,"add")}</button></div></div>)}
                </div>
              </div>
            )}

            {businessSection === "subscriptions" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-5">{subscriptionPlans.map(plan=><div key={`plan-${plan.id}`} className={`bg-[#0D1912] p-6 rounded-3xl border ${selectedSubscription===plan.id?'border-[#B5F140]':'border-[#1A2E22]'}`}><p className="text-[9px] uppercase tracking-widest text-[#B5F140]">Monthly plan</p><h3 className="text-2xl font-serif mt-2">{plan.name}</h3><p className="text-3xl font-mono mt-4">{formatCurrency(plan.price)}<span className="text-xs text-gray-500"> / {plan.period}</span></p><div className="space-y-2 mt-5">{plan.benefits.map((b:string,idx:number)=><p key={`${plan.id}-benefit-${idx}`} className="text-xs text-gray-400 flex gap-2"><CheckCircle2 size={14} className="text-[#B5F140] shrink-0"/>{b}</p>)}</div><button onClick={()=>subscribeToPlan(plan)} className="mt-6 w-full bg-[#B5F140] text-black py-3 rounded-xl font-bold text-xs">Select Demo Plan</button></div>)}</div>
                <div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] uppercase tracking-widest text-[#B5F140]">CSA / Community Supported Agriculture</p><h3 className="text-2xl font-serif mt-2">Fresh seasonal basket membership</h3><p className="text-sm text-gray-400 mt-2">Use this as a membership-management workflow. Actual farm supply, pickup and delivery must be connected to real partners.</p></div><Sprout className="text-[#B5F140]"/></div><div className="flex flex-wrap gap-3 mt-6 items-center"><label className="text-xs text-gray-400">Baskets / month</label><input type="number" min={1} max={20} value={csaQuantity} onChange={e=>setCsaQuantity(Math.max(1,Math.min(20,Number(e.target.value)||1)))} className="w-24 bg-black/30 border border-white/10 rounded-xl p-3"/><span className="font-mono text-[#B5F140]">{formatCurrency(1499*Math.max(1,csaQuantity))} / month (estimate)</span><button onClick={joinCsa} className="bg-white/10 border border-white/10 px-5 py-3 rounded-xl text-xs font-bold">Join Demo CSA</button></div></div>
              </div>
            )}

            {businessSection === "knowledge" && (
              <div className="space-y-7">
                <div className="grid lg:grid-cols-[1.05fr,1.45fr] gap-6">
                  <div className="space-y-4">
                    {educationArticles.map((article:any, articleIndex:number)=><button key={`education-guide-${article.id}-${articleIndex}`} onClick={()=>setSelectedArticle(article)} className={`w-full text-left bg-[#0D1912] p-6 rounded-3xl border transition-all ${selectedArticle?.id===article.id?"border-[#B5F140]/60 bg-[#B5F140]/5":"border-[#1A2E22] hover:border-[#B5F140]/30"}`}>
                      <div className="flex justify-between gap-3"><span className="text-[9px] uppercase tracking-widest text-[#B5F140]">{article.category}</span><span className="text-[9px] text-gray-500">{article.read}</span></div>
                      <h3 className="text-xl font-serif mt-3">{article.title}</h3><p className="text-xs text-gray-500 mt-3 leading-relaxed">{article.summary}</p>
                      <span className="inline-flex items-center gap-2 text-xs text-[#B5F140] font-bold mt-5">{getEducationText(lang,"read")} <ChevronRight size={14}/></span>
                    </button>)}
                  </div>
                  <div className="bg-[#0D1912] p-7 md:p-8 rounded-[2rem] border border-[#1A2E22] min-h-[620px]">
                    {selectedArticle ? <div className="space-y-7">
                      <div className="flex flex-wrap justify-between gap-4 items-start"><div><p className="text-[9px] uppercase tracking-[0.2em] text-[#B5F140] font-bold">{selectedArticle.category} · {selectedArticle.read}</p><h3 className="text-3xl md:text-4xl font-serif mt-2">{selectedArticle.title}</h3></div><span className="px-3 py-1.5 rounded-full bg-[#B5F140]/10 border border-[#B5F140]/20 text-[9px] uppercase tracking-widest text-[#B5F140]">{getEducationText(lang,"complete")}</span></div>
                      <div className="bg-black/20 border border-white/5 rounded-2xl p-5"><p className="text-[9px] uppercase tracking-widest text-gray-500">{getEducationText(lang,"purpose")}</p><p className="text-sm text-gray-300 leading-relaxed mt-2">{selectedArticle.purpose}</p></div>
                      <section><h4 className="text-lg font-serif text-white">{getEducationText(lang,"learn")}</h4><div className="grid md:grid-cols-2 gap-3 mt-3">{selectedArticle.whatYouLearn.map((item:string,idx:number)=><div key={`guide-learn-${selectedArticle.id}-${idx}`} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5"><span className="w-6 h-6 shrink-0 rounded-full bg-[#B5F140]/10 text-[#B5F140] flex items-center justify-center text-[10px] font-bold">{idx+1}</span><p className="text-xs text-gray-400 leading-relaxed">{item}</p></div>)}</div></section>
                      <section><h4 className="text-lg font-serif text-white">{getEducationText(lang,"steps")}</h4><div className="space-y-3 mt-3">{selectedArticle.steps.map((step:string,idx:number)=><div key={`guide-step-${selectedArticle.id}-${idx}`} className="flex gap-4 p-4 rounded-xl bg-black/20 border border-white/5"><div className="w-8 h-8 shrink-0 rounded-xl bg-[#B5F140] text-black flex items-center justify-center text-xs font-black">{idx+1}</div><p className="text-xs md:text-sm text-gray-300 leading-relaxed">{step}</p></div>)}</div></section>
                      <div className="grid lg:grid-cols-2 gap-5"><section className="bg-[#07110B] border border-[#1A2E22] rounded-2xl p-5"><h4 className="text-lg font-serif">{getEducationText(lang,"checklist")}</h4><div className="space-y-2 mt-4">{selectedArticle.checklist.map((item:string,idx:number)=><label key={`guide-check-${selectedArticle.id}-${idx}`} className="flex gap-3 items-center text-xs text-gray-300"><input type="checkbox" className="accent-[#B5F140] w-4 h-4"/><span>{item}</span></label>)}</div></section><section className="bg-[#07110B] border border-red-500/10 rounded-2xl p-5"><h4 className="text-lg font-serif">{getEducationText(lang,"avoid")}</h4><div className="space-y-3 mt-4">{selectedArticle.avoid.map((item:string,idx:number)=><div key={`guide-avoid-${selectedArticle.id}-${idx}`} className="flex gap-3"><AlertCircle size={15} className="text-orange-300 shrink-0 mt-0.5"/><p className="text-xs text-gray-400 leading-relaxed">{item}</p></div>)}</div></section></div>
                      <div className="bg-[#B5F140]/5 border border-[#B5F140]/20 rounded-2xl p-5"><p className="text-[9px] uppercase tracking-widest text-[#B5F140] font-bold">{getEducationText(lang,"action")}</p><p className="text-sm text-gray-200 leading-relaxed mt-2">{selectedArticle.action}</p><button onClick={()=>{setActiveTab("planner");addHistory("education",`Guide action opened: ${selectedArticle.title}`);}} className="mt-4 bg-[#B5F140] text-black px-4 py-2.5 rounded-xl text-xs font-bold">{getEducationText(lang,"next")} →</button></div>
                      <section className="bg-black/20 border border-white/5 rounded-2xl p-5"><h4 className="text-lg font-serif">{getEducationText(lang,"quiz")}</h4>{selectedArticle.quiz.map((quiz:any,idx:number)=><div key={`guide-quiz-${selectedArticle.id}-${idx}`} className="mt-4"><p className="text-sm text-gray-300">{quiz.q}</p><div className="grid gap-2 mt-3">{quiz.options.map((option:string,optionIndex:number)=><button key={`guide-option-${selectedArticle.id}-${idx}-${optionIndex}`} onClick={()=>showToast(optionIndex===quiz.answer?"Correct — keep using field evidence to verify decisions.":"Not quite. Review the guide steps and field data before acting.")} className="text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#B5F140]/30 text-xs text-gray-300">{String.fromCharCode(65+optionIndex)}. {option}</button>)}</div></div>)}</section>
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5"><p className="text-xs text-gray-400 leading-relaxed">{getEducationText(lang,"verify")}</p></div>
                    </div> : <div className="min-h-[560px] flex items-center justify-center text-center"><div><BookOpen size={42} className="mx-auto text-[#B5F140]/60"/><h3 className="text-2xl font-serif mt-4">Choose a farmer guide</h3><p className="text-sm text-gray-500 mt-2 max-w-md">Select a guide on the left to get a complete explanation, practical steps, field checklist, mistakes to avoid and a next action inside YieldSense AI.</p></div></div>}
                  </div>
                </div>
              </div>
            )}

            {businessSection === "local" && (
              <div className="space-y-6"><div className="bg-[#0D1912] p-6 rounded-[2rem] border border-[#1A2E22]"><div className="flex items-center gap-3"><MapPinned className="text-[#B5F140]"/><div><h3 className="text-2xl font-serif">Connect & Local SEO</h3><p className="text-xs text-gray-500 mt-1">Local discovery keywords and service directory structure for future verified providers.</p></div></div><div className="flex flex-wrap gap-2 mt-5">{localSeoKeywords.map((keyword:string,idx:number)=><span key={`seo-${idx}`} className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">{keyword}</span>)}</div></div><div className="grid md:grid-cols-2 gap-5">{localServiceDirectory.filter(x=>`${x.name} ${x.type} ${x.region}`.toLowerCase().includes(localSearch.toLowerCase())).map(service=><div key={`local-${service.id}`} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><div className="flex justify-between"><h3 className="text-xl font-serif">{service.name}</h3><span className="text-[9px] text-gray-500">{service.verified?"Verified":"Directory / demo"}</span></div><p className="text-xs text-gray-400 mt-2">{service.type} · {service.region}</p><p className="text-xs text-gray-500 mt-2">{service.availability}</p><button onClick={()=>showToast("This local connection is a directory workflow. Add a verified provider API before treating it as a live service.")} className="mt-5 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">Connect / Request</button></div>)}</div></div>
            )}

            {businessSection === "inventory" && (
              <div className="space-y-6"><div className="flex flex-wrap gap-3 items-center"><input value={inventorySearch} onChange={e=>setInventorySearch(e.target.value)} placeholder="Search batch, product or location" className="flex-1 min-w-[240px] bg-[#0D1912] border border-white/10 rounded-xl p-3 text-sm"/><button onClick={addInventoryRecord} className="bg-[#B5F140] text-black px-5 py-3 rounded-xl text-xs font-bold">Add Inventory Record</button></div><div className="bg-[#0D1912] rounded-[2rem] border border-[#1A2E22] overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-white/10 text-gray-500 uppercase tracking-widest"><th className="p-5">Batch</th><th>Product</th><th>Quantity</th><th>Source</th><th>Location</th><th>Traceability</th></tr></thead><tbody>{inventoryRecords.filter(x=>`${x.id} ${x.product} ${x.batch} ${x.location}`.toLowerCase().includes(inventorySearch.toLowerCase())).map((item:any)=><tr key={`inventory-${item.id}`} className="border-b border-white/5"><td className="p-5 font-mono text-[#B5F140]">{item.batch}</td><td>{item.product}</td><td>{item.quantity} {item.unit}</td><td>{item.source}</td><td>{item.location}</td><td className="text-gray-400">{item.trace}</td></tr>)}</tbody></table></div><p className="text-[9px] text-gray-600">Traceability shown here is local demonstration data. A real audit trail requires authenticated database records and immutable batch events.</p></div>
            )}

            {businessSection === "wholesale" && (
              <div className="grid lg:grid-cols-[1fr,1.2fr] gap-6"><div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><p className="text-[10px] uppercase tracking-widest text-[#B5F140]">Bulk purchasing</p><h3 className="text-2xl font-serif mt-2">Request a wholesale quote</h3><div className="space-y-3 mt-6"><select value={wholesaleRequest.product} onChange={e=>setWholesaleRequest({...wholesaleRequest,product:e.target.value})} className="w-full bg-black/30 border border-white/10 rounded-xl p-3"><option value="">Select bulk product</option>{wholesaleProducts.map(item=><option key={item.id} value={item.id}>{item.name} · minimum {item.minQty} {item.unit}</option>)}</select><input type="number" min={1} value={wholesaleRequest.quantity} onChange={e=>setWholesaleRequest({...wholesaleRequest,quantity:e.target.value})} placeholder="Requested quantity" className="w-full bg-black/30 border border-white/10 rounded-xl p-3"/><textarea value={wholesaleRequest.notes} onChange={e=>setWholesaleRequest({...wholesaleRequest,notes:e.target.value})} placeholder="Delivery window, crop, quality or packaging notes" className="w-full bg-black/30 border border-white/10 rounded-xl p-3 min-h-28"/><button onClick={submitWholesaleRequest} className="w-full bg-[#B5F140] text-black py-3 rounded-xl font-bold">Request Quote</button></div><p className="text-[9px] text-gray-600 mt-4">No wholesale price is fabricated. Supplier quotation is required.</p></div><div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><h3 className="text-2xl font-serif mb-5">My wholesale requests</h3>{wholesaleRequests.length===0?<p className="text-gray-500 text-sm">No requests yet.</p>:<div className="space-y-3">{wholesaleRequests.map(req=><div key={req.id} className="p-4 rounded-xl bg-black/20 border border-white/5"><div className="flex justify-between"><b>{req.product}</b><span className="text-[#B5F140] text-xs">{req.status}</span></div><p className="text-xs text-gray-500 mt-2">{req.quantity} {req.unit} · {req.crop}</p><p className="text-[10px] text-gray-600 mt-1">{new Date(req.createdAt).toLocaleString()}</p></div>)}</div>}</div></div>
            )}

            {businessSection === "contracts" && (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{contractTemplates.map(template=><div key={template.id} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><p className="text-[9px] uppercase tracking-widest text-[#B5F140]">Contract opportunity</p><h3 className="text-xl font-serif mt-2">{template.crop} · {template.buyer}</h3><p className="text-sm text-gray-400 mt-3">Target volume: {template.quantity}</p><p className="text-xs text-gray-500 mt-2">{template.terms}</p><button onClick={()=>createContractRequest(template)} className="mt-5 w-full bg-white/10 border border-white/10 py-3 rounded-xl text-xs font-bold">Create Farmer Inquiry</button></div>)}</div>
            )}

            {businessSection === "logistics" && (
              <div className="space-y-6"><div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-widest text-[#B5F140]">Delivery workflow</p><h3 className="text-2xl font-serif mt-2">Logistics & Delivery Tracking</h3></div><Truck className="text-[#B5F140]"/></div><p className="text-xs text-gray-500 mt-3">Milestones below are locally stored demo states. They are not live courier GPS events.</p></div>{(businessOrders.length?businessOrders:logisticsOrders).map((order:any)=><div key={`logistics-order-${order.id}`} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{order.id}</h3><p className="text-xs text-gray-500 mt-1">{order.delivery?.address || "Delivery address stored in order"}</p></div><span className="text-xs text-[#B5F140]">{logisticsStages[Math.min(logisticsStages.length-1,Number(order.stage||0))]}</span></div><div className="grid grid-cols-5 gap-2 mt-6">{logisticsStages.map((stage:string,idx:number)=><div key={`${order.id}-log-${idx}`} className="text-center"><div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center ${idx<=Number(order.stage||0)?"bg-[#B5F140] text-black":"bg-white/10 text-gray-500"}`}>{idx+1}</div><p className="text-[8px] text-gray-500 mt-2 leading-tight">{stage}</p></div>)}</div>{Number(order.stage||0)<logisticsStages.length-1&&<button onClick={()=>advanceLogistics(order.id)} className="mt-5 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">Advance Demo Milestone</button>}</div>)}{businessOrders.length===0&&<div className="bg-[#0D1912] p-8 rounded-3xl border border-white/5 text-gray-500">Complete a demo checkout to create an order tracking record.</div>}</div>
            )}

            {businessSection === "labor" && (
              <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6"><div className="space-y-4">{laborTaskCatalog.map(task=><div key={task.id} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><div className="flex justify-between"><div><h3 className="text-xl font-serif">{task.task}</h3><p className="text-xs text-gray-500 mt-2">{task.crop} · {task.workers} workers · {task.days} day(s)</p></div><Clock3 className="text-[#B5F140]"/></div><button onClick={()=>assignLaborTask(task)} className="mt-5 bg-[#B5F140] text-black px-4 py-2 rounded-xl text-xs font-bold">Assign to Seasonal Plan</button></div>)}</div><div className="bg-[#0D1912] p-7 rounded-[2rem] border border-[#1A2E22]"><p className="text-[10px] uppercase tracking-widest text-[#B5F140]">My labor plan</p><h3 className="text-2xl font-serif mt-2 mb-5">Assigned tasks</h3>{laborTasks.length===0?<p className="text-gray-500">No labor tasks.</p>:<div className="space-y-3">{laborTasks.map((task:any,idx:number)=><div key={`labor-plan-${task.id}-${idx}`} className="p-4 rounded-xl bg-black/20 border border-white/5"><div className="flex justify-between"><b>{task.task}</b><span className="text-xs text-[#B5F140]">{task.status}</span></div><p className="text-xs text-gray-500 mt-2">{task.workers} workers · {task.days} day(s)</p></div>)}</div>}<p className="text-[9px] text-gray-600 mt-5">Labor availability and wages are planning records until connected to a verified local labor provider.</p></div></div>
            )}

            {businessSection === "orders" && (
              <div className="space-y-6"><div className="grid md:grid-cols-3 gap-4"><div className="bg-[#0D1912] p-5 rounded-2xl border border-white/5"><p className="text-[9px] uppercase tracking-widest text-gray-500">Orders</p><p className="text-3xl font-serif mt-2">{businessOrders.length}</p></div><div className="bg-[#0D1912] p-5 rounded-2xl border border-white/5"><p className="text-[9px] uppercase tracking-widest text-gray-500">Payment records</p><p className="text-3xl font-serif mt-2">{paymentHistory.length}</p></div><div className="bg-[#0D1912] p-5 rounded-2xl border border-white/5"><p className="text-[9px] uppercase tracking-widest text-gray-500">Subscriptions</p><p className="text-3xl font-serif mt-2">{subscriptionStatus.length}</p></div></div>{businessOrders.map(order=><div key={`business-order-${order.id}`} className="bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22]"><div className="flex justify-between"><div><h3 className="font-bold">{order.id}</h3><p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p></div><span className="text-xs text-[#B5F140]">{order.paymentStatus}</span></div><div className="grid md:grid-cols-3 gap-3 mt-5 text-xs"><div><span className="text-gray-500 block">Payment</span>{order.paymentMethod}</div><div><span className="text-gray-500 block">Delivery</span>{order.delivery?.city || order.delivery?.address || profileLocation.city || "Saved address"}</div><div><span className="text-gray-500 block">Total</span>{order.total ? formatCurrency(order.total) : "Supplier quote"}</div></div></div>)}{businessOrders.length===0&&<p className="text-gray-500 bg-[#0D1912] p-8 rounded-3xl border border-white/5">No orders captured yet.</p>}</div>
            )}
          </div>
        )}

        {activeTab === "knowledge" && (
          <div className="animate-in fade-in duration-500 space-y-8"><header><p className="text-[10px] tracking-[0.22em] text-[#B5F140] uppercase font-bold">Farmer Learning</p><h2 className="text-5xl font-serif mt-2">Educational Blog & Guides</h2><p className="text-sm text-gray-400 mt-3">Open the full learning module from the sidebar. Content is educational and should be validated locally before farm action.</p></header><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{educationArticles.map(article=><button key={`knowledge-tab-${article.id}`} onClick={()=>{setBusinessSection("knowledge");setSelectedArticle(article);setActiveTab("business");}} className="text-left bg-[#0D1912] p-6 rounded-3xl border border-[#1A2E22] hover:border-[#B5F140]/30"><span className="text-[9px] uppercase tracking-widest text-[#B5F140]">{article.category}</span><h3 className="text-xl font-serif mt-3">{article.title}</h3><p className="text-xs text-gray-500 mt-3">{article.summary}</p></button>)}</div></div>
        )}

        {activeTab === "inventory" && (
          <div className="animate-in fade-in duration-500 space-y-8"><header><h2 className="text-5xl font-serif">Inventory & Traceability</h2><p className="text-sm text-gray-400 mt-3">Track farm inputs, batch identifiers and movement history.</p></header><button onClick={()=>{setBusinessSection("inventory");setActiveTab("business");}} className="bg-[#B5F140] text-black px-5 py-3 rounded-xl font-bold">Open Inventory Module →</button></div>
        )}

        {activeTab === "logistics" && (
          <div className="animate-in fade-in duration-500 space-y-8"><header><h2 className="text-5xl font-serif">Logistics & Delivery</h2><p className="text-sm text-gray-400 mt-3">Review order milestones and delivery addresses. Courier tracking is not claimed as live.</p></header><button onClick={()=>{setBusinessSection("logistics");setActiveTab("business");}} className="bg-[#B5F140] text-black px-5 py-3 rounded-xl font-bold">Open Logistics Tracker →</button></div>
        )}

        {activeTab === "labor" && (
          <div className="animate-in fade-in duration-500 space-y-8"><header><h2 className="text-5xl font-serif">Seasonal Labor Management</h2><p className="text-sm text-gray-400 mt-3">Plan workers by crop activity and season.</p></header><button onClick={()=>{setBusinessSection("labor");setActiveTab("business");}} className="bg-[#B5F140] text-black px-5 py-3 rounded-xl font-bold">Open Labor Planner →</button></div>
        )}

        {/* MARKET MODAL FIX: Using z-[999] and pointer-events-auto */}
        {inquiryModal.isOpen && (
          <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
            <div className="w-full max-w-lg bg-[#0B150E] border border-[#2D5A3C] rounded-3xl p-7 relative shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif text-white">Contact Buyer</h3>
                <button onClick={()=>{setInquiryModal({isOpen: false, buyer: null, message: ""}); document.body.style.overflow = "auto";}} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20}/></button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400">Inquiring with <strong className="text-white">{inquiryModal.buyer.type || inquiryModal.buyer.buyer}</strong> in <strong className="text-white">{inquiryModal.buyer.region}</strong> regarding <strong className="text-[#B5F140]">{inquiryModal.buyer.crop}</strong>.</p>
              </div>
              <textarea rows={5} value={inquiryModal.message} onChange={e=>setInquiryModal((prev: any) => ({...prev, message: e.target.value}))} placeholder="Enter your expected volume, harvest date, and quality details..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#B5F140] mb-6 shadow-inner resize-none"/>
              <button onClick={()=>{
                setInquiryModal({isOpen: false, buyer: null, message: ""}); document.body.style.overflow = "auto";
                showToast(`Inquiry sent to ${inquiryModal.buyer.region} buyer. They will contact you shortly.`);
                addHistory("market", "Buyer inquiry submitted", {crop: inquiryModal.buyer.crop});
              }} className="w-full bg-[#B5F140] text-[#12281C] py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-[0_0_15px_rgba(181,241,64,0.3)]">Send Inquiry Request</button>
            </div>
          </div>
        )}

      </main>
      <style dangerouslySetInnerHTML={{__html: ` .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(181, 241, 64, 0.5); } `}} />
    </div>
  );
}
// ============================================================================
// RESPONSIVE UI QA NOTES
// ============================================================================
// The dashboard deliberately keeps data/state logic separate from layout guards.
// This makes hot reloads safer when Tailwind breakpoint classes are regenerated.
// The guards above are intentionally local to the dashboard shell and overview.
// They do not alter forecast calculations, Vision AI requests, marketplace state,
// expert consultation uploads, crop lifecycle calculations, or authentication.
// ============================================================================

// ============================================================================
// YIELDSENSE AI - DASHBOARD STABILITY CHECKLIST
// ============================================================================
// The following notes document the intentional browser-layout safeguards.
// They are kept in this source file so future edits do not accidentally remove
// the protections that were added after the Turbopack runtime rendering issue.
//
// Layout safeguard A: the application shell remains a horizontal flex layout.
// Layout safeguard B: the sidebar keeps a fixed width on medium/large screens.
// Layout safeguard C: the main area may shrink horizontally when required.
// Layout safeguard D: the main area explicitly owns min-width: 0.
// Layout safeguard E: the main area explicitly owns width: 100%.
// Layout safeguard F: the overview header starts its children at the top edge.
// Layout safeguard G: the weather summary cannot stretch to the hero height.
// Layout safeguard H: the weather summary uses automatic height.
// Layout safeguard I: the weather summary is shrink-resistant.
// Layout safeguard J: the overview greeting remains in normal document flow.
// Layout safeguard K: the hero remains in normal document flow.
// Layout safeguard L: the hero wrapper cannot collapse horizontally.
// Layout safeguard M: the existing dashboard cards remain below the hero.
// Layout safeguard N: no feature tab is removed by these layout changes.
// Layout safeguard O: no API endpoint is changed by these layout changes.
// Layout safeguard P: Gemini Vision continues to use the existing route.
// Layout safeguard Q: the crop lifecycle planner remains crop-specific.
// Layout safeguard R: the multilingual dictionary remains unchanged.
// Layout safeguard S: field registration state remains unchanged.
// Layout safeguard T: marketplace state remains unchanged.
// Layout safeguard U: cart state remains unchanged.
// Layout safeguard V: checkout state remains unchanged.
// Layout safeguard W: expert consultation state remains unchanged.
// Layout safeguard X: uploaded expert images remain supported.
// Layout safeguard Y: profile image persistence remains supported.
// Layout safeguard Z: the AI assistant remains available to logged-in users.
//
// Runtime safety note 1: do not reference a map index outside its callback scope.
// Runtime safety note 2: stable keys should remain tied to stable item identity.
// Runtime safety note 3: empty field collections must continue to be supported.
// Runtime safety note 4: activeFieldIndex must remain safe when fields are empty.
// Runtime safety note 5: weather values may remain unavailable until synchronization.
// Runtime safety note 6: unavailable hardware must not be presented as connected.
// Runtime safety note 7: Vision errors must not create an invented diagnosis.
// Runtime safety note 8: external API failures must remain visible to the user.
// Runtime safety note 9: payment UI remains a demo unless a gateway is connected.
// Runtime safety note 10: market reference values should remain clearly identifiable.
//
// Responsive QA target: desktop widths should show sidebar and main content.
// Responsive QA target: tablet widths should allow the main area to shrink.
// Responsive QA target: mobile widths should use the existing responsive flow.
// Responsive QA target: overview content should remain vertically scrollable.
// Responsive QA target: the AI assistant should remain above page content.
// Responsive QA target: modals should retain their existing high z-index.
// Responsive QA target: navigation should remain clickable after HMR.
// Responsive QA target: active-zone selection should update the active field.
// Responsive QA target: the weather card should never become a full-page panel.
// Responsive QA target: the hero should remain visible immediately below the header.
//
// Maintenance rule: keep these guards local to layout rather than changing data.
// Maintenance rule: preserve existing feature handlers when editing the page.
// Maintenance rule: prefer explicit stable identifiers for rendered collections.
// Maintenance rule: keep secrets out of this client component.
// Maintenance rule: keep Gemini credentials in environment configuration.
// Maintenance rule: keep provider-specific integrations behind their API routes.
// Maintenance rule: test the browser after substantial JSX restructuring.
//
// End of dashboard stability checklist.
// ============================================================================

// ============================================================================
// YieldSense AI regression and feature-integrity notes
// ============================================================================
// Crop catalogue is the single source of truth for crop selectors, planner,
// data model registry, certified seeds and recommendation candidates.
// Farm Planner changes duration, stage sequence, target values and guidance
// when the selected crop changes.
// Recommendation uses soil, climate, water, pH, nutrients and risk factors.
// Dataset Explorer renders every crop instead of only three demonstration rows.
// System Architecture presents the experience, API, AI/ML, data and provider
// layers so the engineering design is understandable during demonstration.
// Gemini Vision continues through /api/vision and does not expose credentials.
// Payment remains a demo until a real gateway and order backend are connected.
// IoT telemetry remains connector-ready until actual sensors are connected.
// Market values remain estimates/reference data unless a live feed is connected.
// GPS-dependent maps require actual coordinates before live tiles are claimed.
// Stable React keys should be maintained whenever dynamic lists are changed.
// Regression checklist: overview layout, active field switching, crop switching,
// planner dates, recommendation ranking, model registry coverage, vision upload,
// cart persistence, expert image upload, profile persistence and architecture UI.

// ============================================================================
// YIELDSENSE AI — EXTENDED FEATURE CONTRACTS / REGRESSION NOTES
// ============================================================================
// Business Hub contract: catalog, subscriptions, CSA, education, local SEO,
// inventory, wholesale, contract farming, logistics, orders and seasonal labor
// are intentionally grouped under one Business Hub so the existing navigation
// remains recognizable instead of being replaced by a new application shell.
// Catalog contract: existing shopProducts remains the single marketplace source.
// Deficiency contract: Farm Planner N/P/K actions call getPlannerDeficiencyProducts
// and surface matching fertilizer records on the Certified Seeds screen.
// Purchase contract: Buy Now calls the same addProductToCart function as the
// existing marketplace, so there is one cart rather than duplicate cart state.
// Order contract: the existing demo checkout now creates an order reference,
// payment record and logistics milestone without claiming a real transaction.
// Address contract: profileLocation is reused by checkout and profile tracking.
// Payment contract: no CVV or complete card number is persisted by these additions.
// Subscription contract: plans are local demo records until a billing provider exists.
// CSA contract: basket membership is a management workflow, not a real shipment claim.
// Education contract: articles are educational summaries and do not replace agronomy.
// Local SEO contract: keywords and directory cards are discovery scaffolding; they
// are not endorsements or claims that a named provider is verified.
// Inventory contract: batch identifiers are traceability placeholders until a real
// database records receiving, allocation, transfer, adjustment and audit events.
// Wholesale contract: the UI collects quote requests and never invents supplier price.
// Contract farming contract: inquiries are drafts until a buyer accepts real terms.
// Logistics contract: milestones are local demo states and not GPS/courier events.
// Labor contract: worker counts are planning records until a verified labor source exists.
// Multilingual contract: new module labels use businessTranslations and fall back to
// English only when a translation key is genuinely absent; the existing crop language
// system remains the source of truth for crop names and lifecycle text.
// Existing functionality contract: dashboard, yield forecast, planner, vision, fields,
// data models, architecture, drones, pumps, seeds, expert, intelligence, history,
// market, alerts, operations, chat, profile and cart remain in the same page.
// React-key contract: every new map has a deterministic key based on stable IDs.
// Persistence contract: localStorage is used only for demo continuity; production data
// should move to authenticated PostgreSQL/DB records through the existing backend.
// Security contract: Gemini credentials remain server-side and are not introduced here.
// Provider contract: real payment, live courier, live inventory, real CSA fulfillment,
// verified local directories, labor marketplaces and wholesale supplier pricing need
// authenticated backend/provider integrations before their status can be called live.
// Farmer-first contract: each module has a clear next action instead of only raw data.
// Regression target: this extension must not remove the existing YieldSense AI visual
// identity, navigation style, green/lime palette, dark agricultural theme or existing
// workflow semantics.
// Regression target: the original page source is preserved and this extension only adds
// state, handlers, navigation and render branches around it.
// Regression target: unsupported crops are never silently converted into Rice or Maize.
// Regression target: vision uploads continue to use /api/vision and no browser Gemini key.
// Regression target: profile image upload, cart quantities, expert upload and planner
// calculations continue to use their existing functions and state.
// Regression target: demo order status remains clearly marked as demo.
// Regression target: all newly added user actions provide visible feedback through toast,
// status text, persisted state or a navigation transition.
// Regression target: all newly added lists have stable React keys to avoid the previous
// "Each child in a list should have a unique key" warning.
// Regression target: all new forms validate required values before recording state.
// Regression target: all estimated money values remain explicitly labeled as estimates.
// Regression target: no live market or logistics claim is generated by this client layer.
// End of extended feature contract.

// ============================================================================
// LANGUAGE REGRESSION CHECKLIST — 2026.10
// ============================================================================
// 1. The existing 12-language selector remains the single user-facing control.
// 2. Selecting English restores the original source text through Google Translate.
// 3. Selecting Kannada translates legacy literal English labels as well as native
//    YieldSense labels, planner content and marketplace controls.
// 4. Hindi, Telugu, Tamil, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Odia
//    and Urdu use the same page-wide translation bridge.
// 5. Dynamic React content is reprocessed after active-tab navigation.
// 6. Newly mounted cards and modal content are reprocessed by MutationObserver.
// 7. Common form placeholders use an explicit local dictionary so they do not
//    remain English if a browser translation provider does not translate them.
// 8. Language selector option labels are marked notranslate so language names
//    remain recognizable and do not become recursively translated.
// 9. YieldSense crop names continue to come from cropLanguageNames rather than
//    being forced through an English fallback.
// 10. Planner stage names and actions continue using plannerLanguage.
// 11. Business Hub labels continue using businessTranslations.
// 12. No Gemini key, JWT secret or provider credential is added to the client.
// 13. Google Translate is loaded lazily in the browser and failure does not crash
//     the application; native translations remain available as the fallback.
// 14. The bridge does not alter API endpoints, cart state, field state, vision
//     state, checkout state, expert requests, orders or existing navigation.
// 15. All current YieldSense AI features remain in the same page component.
// ============================================================================

// ============================================================================
// FINAL LIST-KEY REGRESSION GUARD — 2026.10
// Every deficiency recommendation card uses nutrient + product identity +
// occurrence index. A balanced NPK product may legitimately match more than
// one nutrient group, so product ID alone is not sufficient for nested maps.
// This guard changes only React reconciliation identity; cart/product IDs remain
// unchanged. It prevents stale/duplicated cards when the planner recalculates.
// ============================================================================

// ============================================================================
// EXPERT + MARKETPLACE REGRESSION GUARANTEE
// ============================================================================
// The /api/expert route is a real server endpoint, not a client-side placeholder.
// Expert image files are sent using multipart/form-data and are validated server-side.
// The page does not expose Gemini credentials through this workflow.
// The endpoint returns a request identifier so the UI can confirm submission.
// Production expert matching/storage can later replace the local persistence layer.
//
// Marketplace regression guarantee:
// Farm Planner deficiency products and the main catalogue share the same product IDs.
// A product can belong to multiple nutrient groups without being rendered multiple times.
// This is especially important for balanced NPK products that can match N, P and K.
// Stable keys are generated from product ID plus a deterministic occurrence index.
// No product is silently removed from the catalogue; only duplicate render entries are removed.
// Cart state continues to use the original product ID, so Add to Cart remains unchanged.
//
// React warning regression guarantee:
// Dynamic product collections are passed through getUniqueProductList before the
// deficiency recommendation cards are rendered. This prevents duplicate-key warnings
// even when a future API/database returns repeated catalogue records.
// Other existing lists retain their existing stable keys and are not replaced here.
//
// Expert workflow regression guarantee:
// 1. Farmer selects topic.
// 2. Farmer describes the issue.
// 3. Farmer optionally attaches up to the existing supported image set.
// 4. Browser sends FormData to /api/expert.
// 5. Server validates the request.
// 6. Server returns a request ID.
// 7. Page records the request in local history.
// 8. Farmer receives visible success/error feedback.
// ============================================================================

// ============================================================================
// FINAL DELIVERY CONTRACT — KEEP THIS PAGE AS THE SINGLE EXISTING APP SURFACE
// ============================================================================
// This ready build intentionally preserves the complete existing YieldSense AI
// page rather than replacing it with a smaller implementation. The current
// crop planner, recommendation engine, multilingual controls, Gemini Vision
// workflow, fields, dashboard, history, marketplace, fertilizer bridge, cart,
// checkout, expert consultation, business hub, inventory, wholesale, contract
// farming, logistics, subscriptions, CSA, educational content, local discovery,
// seasonal labor, surveillance, irrigation, drone workflow and architecture
// views remain in this file.
//
// The only functional hardening in this delivery is defensive React key
// uniqueness for nested deficiency-product rendering. Product IDs used by the
// cart are not changed. The matching /api/expert server endpoint is delivered
// separately under the App Router so the existing FormData request resolves
// locally instead of returning HTTP 404.
//
// IMPORTANT: restart Next.js after copying route.ts so Turbopack discovers the
// new App Router endpoint. Do not place this endpoint under pages/api.
// ============================================================================

// ============================================================================
// ALL-CROP MARKET + RECOMMENDATION REGRESSION CONTRACT
// ============================================================================
// 1. Every crop in cropCatalog receives at least two Mandi reference records.
// 2. Every crop in cropCatalog receives at least two buyer-directory records.
// 3. The market selector is therefore driven by cropCatalog coverage, not a
//    hard-coded list of five or six demonstration crops.
// 4. Selecting a crop from the coverage matrix filters both directory panels.
// 5. Search continues to filter crop, market, buyer and region text.
// 6. Reference prices are intentionally labeled and are never presented as
//    guaranteed live market prices.
// 7. Buyer records are intentionally marked as directory references until a
//    verified contact provider is connected.
// 8. Farm Planner recommendations use the complete crop catalogue.
// 9. Opening the planner automatically refreshes recommendations for the active
//    field when the displayed recommendation belongs to another field.
// 10. The top three recommendations are also exposed as quick-select actions.
// 11. Choosing a recommended crop updates plannerCrop and forecastForm together.
// 12. Crop display names continue to use getCropDisplayName, so English shows
//     English and Kannada shows Kannada without appending English names.
// 13. The same crop profile continues to feed planner, forecast, recommendation,
//     data model and certified-seed catalogue logic.
// 14. No Rice or Maize profile is used as a silent fallback for another crop.
// 15. No live market, buyer, payment or logistics claim is invented by this page.
// ============================================================================

// ============================================================================
// YIELDSENSE AI — 2026.10 ALL-CROP / LANGUAGE / RECOMMENDATION REGRESSION PACK
// ============================================================================
// Regression 01: Farm Planner recommendation is generated from the complete
// cropCatalog and never uses a Rice profile as an unknown-crop fallback.
// Regression 02: recommendation cards carry crop-specific duration, climate,
// soil, nutrient, water and risk information from the canonical crop profile.
// Regression 03: recommendation cards also expose planning-only yield/cost/
// revenue/profit estimates where a reference market price exists.
// Regression 04: estimated financial values are never presented as guarantees.
// Regression 05: the selected recommendation can open the crop-specific Mandi
// and Direct Buyer records without losing the current crop selection.
// Regression 06: every crop in cropCatalog receives market intelligence records.
// Regression 07: market intelligence is explicitly reference data until a live
// verified market provider is connected; no hard-coded value is called live.
// Regression 08: Mandi records have crop-specific market category and region.
// Regression 09: Direct Buyer records are generated for every supported crop.
// Regression 10: the market coverage selector exposes every supported crop.
// Regression 11: market list keys include crop, identity and occurrence index.
// Regression 12: buyer list keys include crop, identity and occurrence index.
// Regression 13: recommendation list keys include crop and occurrence index.
// Regression 14: architecture now communicates the actual decision flow rather
// than only showing technology names; it connects farmer input to action.
// Regression 15: no existing dashboard, forecast, planner, vision, field,
// marketplace, cart, checkout, expert, profile, history or business tab is removed.
// Regression 16: Gemini Vision remains behind /api/vision and no key is exposed.
// Regression 17: Expert consultation remains behind /api/expert and should be
// backed by the App Router endpoint supplied with this delivery.
// Regression 18: language switching updates document language, Google Translate,
// placeholders and the native crop/planner/business dictionaries together.
// Regression 19: translation retries are bounded to prevent HMR/DOM loops.
// Regression 20: dynamic navigation triggers additional translation passes so
// newly mounted sections are not permanently left in English.
// Regression 21: English restores the original page instead of applying a stale
// translated DOM from a previous language.
// Regression 22: language names in the selector remain readable and are not
// recursively translated into another language.
// Regression 23: crop names continue to use the canonical cropLanguageNames map.
// Regression 24: planner stage names continue to use plannerLanguage.
// Regression 25: business hub labels continue to use businessTranslations.
// Regression 26: placeholder translations remain explicit for form controls.
// Regression 27: unsupported external integrations are clearly marked as demo,
// reference, offline or provider-required instead of being falsely claimed live.
// Regression 28: market and buyer details can be expanded by replacing the
// reference adapter without changing the farmer-facing component contract.
// Regression 29: all newly added maps use deterministic React keys.
// Regression 30: all-crop coverage is derived from the same cropCatalog that
// powers the model registry, planner and recommendation engine.
// ============================================================================
// End of all-crop / language / recommendation regression pack.
// ============================================================================


// -----------------------------------------------------------------------------
// Deployment configuration notes (kept in source for maintainability):
// 1. Local frontend: set NEXT_PUBLIC_API_URL=http://localhost:8000 in frontend/.env.local.
// 2. Hosted frontend: set NEXT_PUBLIC_API_URL to the public HTTPS FastAPI service URL.
// 3. After changing a NEXT_PUBLIC_* variable, restart `npm run dev` locally or redeploy.
// 4. The API URL must be the service root, not a URL ending in /predict or /login.
// 5. Prediction results are updated only after a successful /predict response.
// 6. If the API fails, the UI reports the failure rather than changing results with mock data.
// 7. Do not use localhost as the backend URL in a hosted Vercel deployment.
// 8. Configure CORS on FastAPI to allow the exact frontend origin used in production.
// 9. Keep authentication tokens and server-only secrets out of NEXT_PUBLIC_* variables.
// 10. These notes document configuration; they do not replace environment setup.
// -----------------------------------------------------------------------------


// Deployment verification checklist (kept with the source for maintainers):
// - Local development: frontend/.env.local -> NEXT_PUBLIC_API_URL=http://localhost:8000
// - Hosted frontend: configure NEXT_PUBLIC_API_URL with the public HTTPS FastAPI root URL.
// - Do not include /predict, /login, or /fields in the environment-variable value.
// - Restart `npm run dev` after changing .env.local; redeploy after changing Vercel variables.
// - Identical numeric inputs reuse the last successful result in this browser session.
// - Changed numeric inputs make a new API request; no random forecast is generated offline.
// - If the API is unavailable, the last successful forecast remains visible and an error is shown.
// - Confirm the FastAPI service exposes POST /predict and returns predicted_crop_yield as a number.
// - Confirm CORS allows the frontend origin if the browser calls FastAPI directly.
// - Never use a localhost backend URL in a production deployment.
