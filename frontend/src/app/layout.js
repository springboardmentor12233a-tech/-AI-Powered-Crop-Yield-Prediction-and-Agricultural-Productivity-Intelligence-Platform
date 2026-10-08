import {
  Outfit, Inter, Noto_Sans_Devanagari, Noto_Sans_Kannada, Noto_Sans_Tamil, Noto_Sans_Telugu,
} from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import Preferences from "./components/Preferences";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// Outfit/Inter have no Hindi or Kannada glyphs, so these act as fallbacks.
const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-deva",
  weight: ["400", "500", "600", "700"],
});

const kannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  variable: "--font-kannada",
  weight: ["400", "500", "600", "700"],
});

const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  variable: "--font-tamil",
  weight: ["400", "500", "600", "700"],
});

const telugu = Noto_Sans_Telugu({
  subsets: ["telugu"],
  variable: "--font-telugu",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "AgriVantage",
  description: "AI-powered crop yield prediction and agricultural intelligence.",
};

// Runs before first paint so there is no light-to-dark flash on reload.
// Uses the saved choice, otherwise the device's own setting.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${outfit.variable} ${inter.variable} ${deva.variable} ${kannada.variable} ${tamil.variable} ${telugu.variable} font-sans bg-stone-50`}
      >
        <LanguageProvider>
          <Preferences />
          <div className="app-main">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
