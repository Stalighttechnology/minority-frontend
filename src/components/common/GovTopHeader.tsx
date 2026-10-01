import React, { useState } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTheme } from "../../context/ThemeContext";
import { FiSun, FiMoon } from "react-icons/fi";
import { Button } from "../ui/button";

export const GovTopHeader: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);

  const handleFontSizeChange = (level: number) => {
    setFontSizeLevel(level);
    const root = document.documentElement;
    if (level === -1) {
      root.style.fontSize = "92%";
    } else if (level === 1) {
      root.style.fontSize = "108%";
    } else {
      root.style.fontSize = "100%";
    }
  };

  return (
    <header className="w-full select-none notranslate z-40 shrink-0">
      {/* Karnataka State Official Red & Yellow Accent Line */}
      <div className="w-full h-1 flex shadow-sm">
        <div className="w-1/2 h-full bg-[#DC2626]" title="Karnataka State Flag - Red" />
        <div className="w-1/2 h-full bg-[#EAB308]" title="Karnataka State Flag - Yellow" />
      </div>

      {/* Single Unified Official Government Header Bar */}
      <div
        className={`w-full px-3 sm:px-6 h-[54px] flex items-center justify-between border-b text-xs transition-colors duration-200 ${
          theme === "dark"
            ? "bg-slate-900 border-slate-800 text-slate-200"
            : "bg-[#0A2647] border-[#071D36] text-white shadow-md"
        }`}
      >
        {/* Left: State Portal Tag */}
        <div className="hidden lg:flex flex-col items-start leading-tight">
          <span className="font-bold text-xs text-amber-300 tracking-wide">
            ಕರ್ನಾಟಕ ಸರ್ಕಾರ
          </span>
          <span className="text-[10px] text-slate-300 font-normal">
            Govt. of Karnataka
          </span>
        </div>

        {/* Center: Official Directorate of Minorities Branding with kar-logo.png */}
        <div className="flex items-center gap-2.5 sm:gap-3 mx-auto lg:mx-0">
          <img
            src="/kar-logo.png"
            alt="Government of Karnataka Emblem"
            className="h-9 sm:h-10 w-auto object-contain drop-shadow select-none"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <div className="flex flex-col items-start leading-tight">
            <span className="font-black text-xs sm:text-sm md:text-base uppercase tracking-wider text-white">
              DIRECTORATE OF MINORITIES
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-amber-300">
              Government of Karnataka • <span className="opacity-90">ಅಲ್ಪಸಂಖ್ಯಾತರ ನಿರ್ದೇಶನಾಲಯ</span>
            </span>
          </div>
        </div>

        {/* Right: Accessibility Controls & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Font Size Accessibility Adjusters */}
          <div className="hidden sm:flex items-center bg-black/25 rounded p-0.5 border border-white/15">
            <button
              onClick={() => handleFontSizeChange(-1)}
              title="Decrease Font Size (A-)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                fontSizeLevel === -1 ? "bg-white/30 text-amber-300" : "text-white/80 hover:bg-white/10"
              }`}
            >
              A-
            </button>
            <button
              onClick={() => handleFontSizeChange(0)}
              title="Default Font Size (A)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                fontSizeLevel === 0 ? "bg-white/30 text-amber-300" : "text-white/80 hover:bg-white/10"
              }`}
            >
              A
            </button>
            <button
              onClick={() => handleFontSizeChange(1)}
              title="Increase Font Size (A+)"
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                fontSizeLevel === 1 ? "bg-white/30 text-amber-300" : "text-white/80 hover:bg-white/10"
              }`}
            >
              A+
            </button>
          </div>

          {/* Theme Switcher Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-7 w-7 rounded-full text-white/90 hover:bg-white/15 hover:text-white transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <FiSun size={14} className="text-amber-300" /> : <FiMoon size={14} />}
          </Button>

          {/* Official Bilingual Kannada/English Switcher */}
          <div className="border-l border-white/20 pl-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};

export default GovTopHeader;
