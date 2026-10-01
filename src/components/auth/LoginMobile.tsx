import { Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react";
import { useLoginLogic } from "../../hooks/useLoginLogic";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NavigationBar } from "@capgo/capacitor-navigation-bar";

interface LoginMobileProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
  setUser: (user: any) => void;
}

const LoginMobile = ({ setRole, setPage, setUser }: LoginMobileProps) => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => { });
      StatusBar.setStyle({ style: Style.Dark }).catch(() => { });
      NavigationBar.setNavigationBarColor({
        color: '#0A2647',
        darkButtons: false
      }).catch(() => { });
    }
  }, []);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div
      className="min-h-[100dvh] overflow-x-hidden overflow-y-auto flex flex-col justify-between w-full bg-transparent relative notranslate"
      style={{
        paddingTop: Capacitor.getPlatform() === 'android'
          ? 'max(2.5rem, env(safe-area-inset-top, 0px))'
          : 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)'
      }}
    >
      {/* Top Karnataka Flag Accent */}
      <div className="w-full h-1 flex shrink-0 shadow-sm">
        <div className="w-1/2 h-full bg-[#DC2626]" />
        <div className="w-1/2 h-full bg-[#EAB308]" />
      </div>

      {/* HEADER: Official Emblem & Government Titles */}
      <div className="text-center space-y-1.5 pt-4 pb-2 shrink-0 px-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/15 backdrop-blur-md p-2 border border-white/25 shadow-lg flex items-center justify-center">
          <img
            src="/kar-logo.png"
            alt="Government of Karnataka Emblem"
            className="w-full h-full object-contain drop-shadow"
          />
        </div>

        <div className="space-y-0.5 pt-1">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">
            ಕರ್ನಾಟಕ ಸರ್ಕಾರ • Govt. of Karnataka
          </p>
          <h1 className="text-white text-lg sm:text-xl font-black uppercase tracking-tight">
            DIRECTORATE OF MINORITIES
          </h1>
          <p className="text-slate-200 text-xs opacity-90">
            School Education & Administration Portal
          </p>
        </div>
      </div>

      {/* MAIN CONTENT: Login Card */}
      <div className="flex-1 flex flex-col justify-center px-4 max-w-sm w-full mx-auto py-2">
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 border border-white/40 transition-all">
          {/* Card Header */}
          <div className="mb-4 text-center">
            <h2 className="text-[#0F3F73] text-lg font-bold">Portal Sign In</h2>
            <p className="text-slate-500 text-xs mt-0.5">Sign in to access your administrative workspace</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs py-2 px-3 rounded-lg mb-3 border border-red-200 leading-tight">
              {error}
            </div>
          )}

          {/* Form Section */}
          <div className="space-y-3">
            {/* Username Field */}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-700 mb-1 block">Username / USN</label>
              <div className={`flex items-center gap-2.5 bg-slate-50 border ${error ? 'border-red-300' : 'border-slate-200'} rounded-xl h-11 px-3.5`}>
                <User className={`w-4 h-4 ${error ? 'text-red-400' : 'text-slate-400'} shrink-0`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter username"
                  disabled={loading}
                  className="flex-1 border-none bg-transparent focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 text-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase text-slate-700 block">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs font-semibold text-[#0F3F73] hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className={`flex items-center gap-2.5 bg-slate-50 border ${error ? 'border-red-300' : 'border-slate-200'} rounded-xl h-11 px-3.5 relative`}>
                <Lock className={`w-4 h-4 ${error ? 'text-red-400' : 'text-slate-400'} shrink-0`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter password"
                  disabled={loading}
                  className="flex-1 border-none bg-transparent focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 text-sm pr-6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#0F3F73] hover:bg-[#0B335E] text-white font-bold text-sm shadow-lg shadow-[#0F3F73]/30 mt-2 hover:shadow-xl active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-slate-200 text-[11px] pb-3 shrink-0 px-4 space-y-0.5">
        <div className="flex items-center justify-center gap-1 font-semibold text-amber-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Karnataka e-Governance Verified</span>
        </div>
        <p className="opacity-80 text-[10px]">Department of Minority Welfare • Govt. of Karnataka</p>
      </div>
    </div>
  );
};

export default LoginMobile;