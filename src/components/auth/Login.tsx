import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLoginLogic } from "../../hooks/useLoginLogic";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { getLanguage, setLanguage, onLanguageChange, AppLanguage } from "../../utils/languageManager";

interface LoginProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
  setUser: (user: any) => void;
}

const Login = ({ setRole, setPage, setUser }: LoginProps) => {
  const [currentLang, setCurrentLang] = useState<AppLanguage>(getLanguage());

  useEffect(() => {
    const unsubscribe = onLanguageChange((newLang) => {
      setCurrentLang(newLang);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleLang = (lang: AppLanguage) => {
    if (lang !== currentLang) {
      setCurrentLang(lang);
      setLanguage(lang);
    }
  };

  const {
    username,
    setUsername,
    password,
    setPassword,
    error,
    loading,
    showPassword,
    setShowPassword,
    handleLogin,
    handleForgotPassword,
  } = useLoginLogic({ setRole, setPage, setUser });

  return (
    <div
      className="min-h-screen flex flex-col justify-between font-sans bg-cover bg-center relative"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(7, 25, 47, 0.65), rgba(11, 41, 75, 0.45), rgba(8, 28, 54, 0.70)), url('/desktop image.jpg')`,
      }}
    >
      {/* Top Karnataka State Flag Ribbon */}
      <div className="w-full h-1.5 flex shadow-sm z-20 notranslate">
        <div className="w-1/2 h-full bg-[#DC2626]" title="Karnataka State Flag - Red" />
        <div className="w-1/2 h-full bg-[#EAB308]" title="Karnataka State Flag - Yellow" />
      </div>

      {/* Top Header with Kannada / English Language Switcher */}
      <header className="w-full bg-black/20 backdrop-blur-md border-b border-white/10 px-6 py-2.5 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-xs font-semibold text-white/90 tracking-wide">
            ಕರ್ನಾಟಕ ಸರ್ಕಾರ • Government of Karnataka
          </div>

          {/* Bilingual English / Kannada Switcher */}
          <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-0.5 text-xs font-semibold shadow-sm notranslate">
            <button
              type="button"
              onClick={() => handleToggleLang("en")}
              className={`px-3 py-1 rounded-md transition-all duration-200 ${
                currentLang === "en"
                  ? "bg-white text-[#0F3F73] font-bold shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleToggleLang("kn")}
              className={`px-3 py-1 rounded-md transition-all duration-200 ${
                currentLang === "kn"
                  ? "bg-[#EAB308] text-[#0A2647] font-bold shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Split View */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 sm:p-10 lg:p-16 gap-10 lg:gap-20 max-w-7xl mx-auto w-full z-10">
        {/* Left Section: Official State Portal Branding */}
        <motion.div
          className="flex-1 text-white max-w-xl text-center lg:text-left space-y-6"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Official Emblem + Department Title */}
          <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md p-2.5 border border-white/20 shadow-2xl flex items-center justify-center shrink-0">
              <img
                src="/kar-logo.png"
                alt="Government of Karnataka Emblem"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <div className="space-y-1">
              <div className="inline-block text-[11px] font-bold text-amber-300 uppercase tracking-widest bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-300/30">
                ಕರ್ನಾಟಕ ಸರ್ಕಾರ • Govt. of Karnataka
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white drop-shadow">
                DIRECTORATE OF MINORITIES
              </h1>
              <p className="text-sm sm:text-base font-medium text-slate-200">
                School Education & Administration Management Portal
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed hidden sm:block">
            Official centralized digital governance portal providing unified administration, student records, academic tracking, attendance, and institutional management across Karnataka Minority Residential Institutions.
          </p>
        </motion.div>

        {/* Right Section: Official Login Card */}
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-slate-800 p-8 sm:p-9 text-slate-900 dark:text-white">
            {/* Card Header */}
            <div className="text-left mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-bold tracking-tight text-[#0F3F73] dark:text-white">
                Sign In
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials to access your portal account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className={`p-3.5 rounded-xl text-xs sm:text-sm border mb-5 font-medium ${
                  error.includes("Password reset required")
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <div className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Username / USN / Staff ID
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter registered username or ID"
                  disabled={loading}
                  className="px-4 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#0F3F73] focus:ring-2 focus:ring-[#0F3F73]/20 rounded-xl h-11 text-sm transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-xs font-semibold text-[#0F3F73] hover:text-[#0B335E] dark:text-amber-400 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Enter account password"
                    disabled={loading}
                    className="px-4 pr-11 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#0F3F73] focus:ring-2 focus:ring-[#0F3F73]/20 rounded-xl h-11 text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#0F3F73] hover:bg-[#0B335E] text-white font-bold rounded-xl h-11 shadow-md shadow-[#0F3F73]/25 hover:shadow-lg hover:shadow-[#0F3F73]/40 transition-all duration-200 mt-2 text-sm tracking-wide"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  "Sign In to Portal"
                )}
              </Button>
            </div>

            {/* Terms & Privacy */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              <Link to="/privacy-policy" className="hover:text-[#0F3F73] dark:hover:text-white underline-offset-4 hover:underline transition-colors">
                Privacy Policy
              </Link>
              <span className="mx-2 opacity-40">•</span>
              <Link to="/terms-of-service" className="hover:text-[#0F3F73] dark:hover:text-white underline-offset-4 hover:underline transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Official Government Bottom Footer */}
      <footer className="w-full bg-[#0A2647]/90 backdrop-blur-md border-t border-white/10 py-2.5 px-6 text-center text-[11px] text-slate-300 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಅಲ್ಪಸಂಖ್ಯಾತರ ಕಲ್ಯಾಣ ಇಲಾಖೆ (Minority Welfare Department)</span>
          <span>Compliant with Karnataka e-Governance & Digital Security Standards • © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default Login;
