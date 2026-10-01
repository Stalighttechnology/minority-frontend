import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { ShieldCheck } from "lucide-react";

export const GovFooter: React.FC = () => {
  const { theme } = useTheme();

  return (
    <footer className="w-full select-none notranslate z-40 shrink-0">
      {/* Red & Yellow State Flag Accent Strip */}
      <div className="w-full h-1 flex shadow-sm">
        <div className="w-1/2 h-full bg-[#DC2626]" title="Karnataka State Flag - Red" />
        <div className="w-1/2 h-full bg-[#EAB308]" title="Karnataka State Flag - Yellow" />
      </div>

      {/* Official Government Bottom Bar */}
      <div
        className={`w-full px-3 sm:px-6 py-2 sm:h-[34px] flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] border-t transition-colors duration-200 ${
          theme === "dark"
            ? "bg-slate-900 border-slate-800 text-slate-400"
            : "bg-[#0A2647] border-[#071D36] text-slate-200 shadow-inner"
        }`}
      >
        {/* Left: Official Government Attribution */}
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-white font-semibold">ಕರ್ನಾಟಕ ಸರ್ಕಾರ</span>
          <span className="opacity-40">|</span>
          <span className="text-slate-200">Directorate of Minorities</span>
        </div>

        {/* Center: Portal Designation */}
        <div className="hidden md:block text-[10.5px] text-slate-300 font-medium">
          School Education & Administration Portal
        </div>

        {/* Right: e-Governance Compliance & Copyright */}
        <div className="flex items-center gap-2 text-[10px] text-slate-300/90">
          <span>Karnataka e-Governance Compliant</span>
          <span className="opacity-40">•</span>
          <span className="text-amber-300 font-medium">© {new Date().getFullYear()} DMWD</span>
        </div>
      </div>
    </footer>
  );
};

export default GovFooter;
