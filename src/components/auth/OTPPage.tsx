import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { verifyOTP, resendOTP } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Shield, ArrowLeft, RotateCcw, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface OTPPageProps {
  setRole: (role: string) => void;
  setPage: (page: string) => void;
  setUser: (user: any) => void;
}

const OTPPage = ({ setRole, setPage, setUser }: OTPPageProps) => {
  const navigate = useNavigate();
  const { setTokens } = useAuth();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [isVerified, setIsVerified] = useState(false);
  const user_id = sessionStorage.getItem("temp_user_id") || "";

  useEffect(() => {
    if (!user_id && !isVerified) {
      setError("Session expired. Please log in again.");
      setTimeout(() => setPage("login"), 2000);
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled, user_id, setPage, isVerified]);

  const handleVerifyOTP = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setError("Please enter the OTP");
      return;
    }
    if (!user_id) {
      setError("User ID missing. Please log in again.");
      setTimeout(() => setPage("login"), 2000);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await verifyOTP({ user_id, otp: trimmedOtp });

      if (response.success) {
        setSuccess("OTP verified successfully");
        setIsVerified(true);
        
        // Hydrate AuthContext immediately
        if (response.access && response.role && response.profile) {
          setTokens(response.access, response.role, response.profile as Record<string, any>);
        }

        // Navigate directly to appropriate dashboard
        const userRole = response.role;
        setTimeout(() => {
          switch (userRole) {
            case "org_admin":
              navigate("/org-admin", { replace: true });
              break;
            case "admin":
            case "principal":
              navigate("/admin", { replace: true });
              break;
            case "hod":
              navigate("/hod", { replace: true });
              break;
            case "fees_manager":
              navigate("/fees-manager", { replace: true });
              break;
            case "hms_admin":
              navigate("/hms", { replace: true });
              break;
            case "warden":
              navigate("/warden", { replace: true });
              break;
            case "transport_admin":
              navigate("/transport-admin", { replace: true });
              break;
            case "library_admin":
              navigate("/library-admin", { replace: true });
              break;
            case "driver":
              navigate("/driver", { replace: true });
              break;
            case "teacher":
            case "faculty":
            case "group_d":
            case "security":
              navigate("/faculty", { replace: true });
              break;
            case "student":
            case "parent":
              navigate("/dashboard", { replace: true });
              break;
            case "outside_student":
              navigate("/student-hostel-details", { replace: true });
              break;
            case "dean":
              navigate("/dean", { replace: true });
              break;
            case "coe":
              navigate("/coe", { replace: true });
              break;
            case "inventory_manager":
              navigate("/inventory-manager", { replace: true });
              break;
            case "admission_manager":
              navigate("/admission-manager", { replace: true });
              break;
            case "counsellor":
              navigate("/counsellor", { replace: true });
              break;
            default:
              navigate("/", { replace: true });
          }
        }, 100);
      } else {
        setError(response.message || "Verification failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!user_id) {
      setError("User ID missing. Please log in again.");
      setTimeout(() => setPage("login"), 2000);
      return;
    }

    setError(null);
    setSuccess(null);
    setResendDisabled(true);
    setCountdown(60);

    try {
      const response = await resendOTP({ user_id });

      if (response.success) {
        setSuccess("OTP resent successfully");
      } else {
        setError(response.message || "Failed to resend OTP");
        setResendDisabled(false);
        setCountdown(0);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between font-sans bg-cover bg-center relative notranslate"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(7, 25, 47, 0.62), rgba(11, 41, 75, 0.40), rgba(8, 28, 54, 0.65)), url('/desktop image.jpg')`,
      }}
    >
      {/* Top Karnataka Flag Ribbon */}
      <div className="w-full h-1.5 flex shadow-sm z-20">
        <div className="w-1/2 h-full bg-[#DC2626]" title="Karnataka State Flag - Red" />
        <div className="w-1/2 h-full bg-[#EAB308]" title="Karnataka State Flag - Yellow" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 sm:p-10 lg:p-16 gap-8 lg:gap-16 max-w-7xl mx-auto w-full z-10">
        {/* Left Section: Branding & Emblem */}
        <motion.div
          className="flex-1 text-white max-w-xl text-center lg:text-left space-y-6"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
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
                Two-Factor Security Verification
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed hidden sm:block">
            Two-factor authentication step ensuring verified government personnel access.
          </p>
        </motion.div>

        {/* Right Section: Form Card */}
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 dark:border-slate-800 p-7 sm:p-9 text-slate-900 dark:text-white">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#0F3F73]/10 dark:bg-primary/20 text-[#0F3F73] dark:text-primary mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-[#0F3F73] dark:text-white">Verify Your Identity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter the 6-digit verification code sent to your registered email
              </p>
            </div>

            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-xs mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {success}
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter code"
                    className="pl-10 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#0F3F73] focus:ring-[#0F3F73]/20 rounded-xl h-11 text-center text-lg tracking-widest font-bold transition-all"
                    onKeyPress={(e) => e.key === "Enter" && handleVerifyOTP()}
                    maxLength={6}
                  />
                </div>
              </div>

              <Button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full bg-[#0F3F73] hover:bg-[#0B335E] text-white font-bold rounded-xl h-11 shadow-lg shadow-[#0F3F73]/25 transition-all mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Code...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Verify & Proceed
                  </div>
                )}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setPage("login")}
                  className="flex-1 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-[#0F3F73] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Sign In
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendDisabled}
                  className="flex-1 px-3 py-2 text-[#0F3F73] dark:text-amber-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  <RotateCcw className="h-3 w-3" />
                  {resendDisabled ? `Resend (${countdown}s)` : "Resend OTP"}
                </button>
              </div>
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

export default OTPPage;