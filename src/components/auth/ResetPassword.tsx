import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { resetPassword } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Shield, LockKeyhole, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";

interface ResetPasswordProps {
  setPage: (page: string) => void;
}

const ResetPassword = ({ setPage }: ResetPasswordProps) => {
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const user_id = sessionStorage.getItem("temp_user_id") || "";

  useEffect(() => {
    if (!user_id && !isReset) {
      setError("Session expired. Please request a new OTP.");
      setTimeout(() => setPage("forgot-password"), 2000);
    }
  }, [user_id, setPage, isReset]);

  const handleResetPassword = async () => {
    const trimmedOtp = otp.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedOtp || !trimmedNewPassword || !trimmedConfirmPassword) {
      setError("All fields are required");
      return;
    }
    if (!user_id) {
      setError("User ID missing. Please request a new OTP.");
      setTimeout(() => setPage("forgot-password"), 2000);
      return;
    }
    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await resetPassword({
        user_id,
        otp: trimmedOtp,
        new_password: trimmedNewPassword,
        confirm_password: trimmedConfirmPassword
      });

      if (response.success) {
        setSuccess("Password reset successfully. Redirecting to login...");
        setIsReset(true);
        sessionStorage.removeItem("temp_user_id");
        setTimeout(() => {
          setPage("login");
        }, 2000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Background Image with Responsive Media Query Fallback */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 md:bg-[url('/desktop%20image.jpg')] bg-[url('/mobile%20image.jpg')]"
      />
      
      {/* Official Government Dark/Navy Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#07192F]/62 via-[#0B294B]/40 to-[#081C36]/65" />

      {/* Karnataka State Dual Accent Top Line */}
      <div className="relative z-20 h-1.5 w-full flex">
        <div className="h-full w-1/2 bg-[#D92B2B]" />
        <div className="h-full w-1/2 bg-[#F1C40F]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <motion.div
          className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/40 overflow-hidden"
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Card Header with Karnataka Emblem */}
          <div className="bg-gradient-to-r from-[#0F3F73] via-[#154B86] to-[#0D335D] text-white p-6 text-center relative">
            <div className="flex justify-center mb-3">
              <div className="bg-white/95 p-2 rounded-full shadow-md w-16 h-16 flex items-center justify-center border-2 border-[#D4AF37]">
                <img
                  src="/kar-logo.png"
                  alt="Government of Karnataka Emblem"
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
            
            <p className="text-[#F5D547] text-xs font-semibold tracking-wider uppercase mb-0.5">
              ಕರ್ನಾಟಕ ಸರ್ಕಾರ | Government of Karnataka
            </p>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase">
              DIRECTORATE OF MINORITIES
            </h1>
            <p className="text-blue-100 text-xs mt-1 font-medium">
              Create New Secure Credential
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {error && (
              <motion.div
                className="bg-red-50 border-l-4 border-red-600 text-red-800 p-3.5 rounded text-sm flex items-start gap-2.5 shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-tight">{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 p-3.5 rounded text-sm flex items-start gap-2.5 shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium leading-tight">{success}</span>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Security OTP Code *
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="pl-10 h-11 bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg text-center tracking-widest text-base font-semibold focus:border-[#0F3F73] focus:ring-1 focus:ring-[#0F3F73]"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  New Password *
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter strong password"
                    className="pl-10 h-11 bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg text-sm focus:border-[#0F3F73] focus:ring-1 focus:ring-[#0F3F73]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="pl-10 h-11 bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-lg text-sm focus:border-[#0F3F73] focus:ring-1 focus:ring-[#0F3F73]"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading || isReset}
              className="w-full bg-[#0F3F73] hover:bg-[#0c3159] text-white font-semibold rounded-lg h-11 shadow-md hover:shadow-lg transition-all text-sm tracking-wide uppercase"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Updating Password...
                </div>
              ) : (
                "Save & Reset Password"
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setPage("login")}
                className="text-sm font-semibold text-[#0F3F73] hover:text-[#0b2d52] inline-flex items-center gap-1.5 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Official Login
              </button>
            </div>
          </div>

          {/* Card Footer */}
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-xs text-slate-600">
            Protected under Government of Karnataka Information Security Policy
          </div>
        </motion.div>
      </div>

      {/* Official Portal Footer */}
      <footer className="relative z-10 bg-slate-950/80 backdrop-blur-md text-slate-300 text-xs py-3 px-4 border-t border-white/10 text-center flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div>
          © {new Date().getFullYear()} Directorate of Minorities, Government of Karnataka. All Rights Reserved.
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Designed & Hosted by e-Governance Department</span>
          <span className="hidden sm:inline">•</span>
          <span>Version 3.2.0</span>
        </div>
      </footer>
    </div>
  );
};

export default ResetPassword;