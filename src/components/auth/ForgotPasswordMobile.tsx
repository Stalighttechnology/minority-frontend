
import React, { useState } from "react";
import { Mail, MessageSquareDashed, Lock, Check, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import clsx from "clsx";
import { forgotPassword, resetPassword, verifyOTP } from "../../utils/authService";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordMobile({ setPage }: { setPage: (page: string) => void }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);

  const steps = [Mail, MessageSquareDashed, Lock, Check];

  React.useEffect(() => {
    if (step === "otp" && resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, resendCountdown]);

  // Handlers for each step
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await forgotPassword({ email: email.trim() });
      if (response.success) {
        setUserId(String(response.user_id || ""));
        setStep("otp");
        setSuccess(null);
        setError(null);
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the OTP");
      return;
    }
    if (otp.trim().length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }
    if (!userId) {
      setError("Session expired. Please start over.");
      setStep("email");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await verifyOTP({ user_id: userId, otp: otp.trim() });
      if (response.success) {
        if (response.token) {
          setToken(response.token);
        }
        setStep("password");
        setSuccess(null);
      } else {
        setError(response.message || "Invalid OTP code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await forgotPassword({ email: email.trim() });
      if (response.success) {
        setUserId(String(response.user_id || ""));
        setSuccess("OTP resent successfully!");
        setResendCountdown(30);
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!userId) {
      setError("Session expired. Please start over.");
      setStep("email");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await resetPassword({
        user_id: userId,
        otp: otp.trim(),
        token: token || undefined,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (response.success) {
        setStep("success");
        setSuccess(null);
        setError(null);
        setTimeout(() => setPage("login"), 2500);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Stepper UI
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;

  return (
    <div className="min-h-[100dvh] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] overflow-x-hidden overflow-y-auto flex flex-col justify-between w-full bg-transparent relative notranslate">
      {/* Top Karnataka Flag Ribbon */}
      <div className="w-full h-1 flex shrink-0 shadow-sm">
        <div className="w-1/2 h-full bg-[#DC2626]" />
        <div className="w-1/2 h-full bg-[#EAB308]" />
      </div>

      {/* HEADER: Emblem & Government Titles */}
      <div className="relative z-10 text-center pt-5 pb-2 shrink-0 px-4 text-white flex flex-col items-center gap-2">
        <div className="w-13 h-13 rounded-2xl bg-white/15 backdrop-blur-md p-2 border border-white/25 shadow-lg flex items-center justify-center">
          <img
            src="/kar-logo.png"
            alt="Government of Karnataka Emblem"
            className="w-10 h-10 object-contain drop-shadow"
          />
        </div>

        <div className="space-y-0.5">
          <p className="text-amber-300 text-xs font-bold uppercase tracking-wider">
            ಕರ್ನಾಟಕ ಸರ್ಕಾರ • Govt. of Karnataka
          </p>
          <h1 className="text-white text-lg font-black uppercase tracking-tight">
            DIRECTORATE OF MINORITIES
          </h1>
          <p className="text-slate-200 text-xs opacity-90">Account Recovery & Security Verification</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 max-w-sm w-full mx-auto py-2">
        <div className="flex flex-col gap-4 w-full items-center">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2.5">
            {steps.map((Icon, idx) => (
              <React.Fragment key={idx}>
                <div
                  className={clsx(
                    "flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold transition-all",
                    idx === stepIndex
                      ? "bg-amber-400 text-[#0F3F73] border-amber-300 shadow-md scale-110"
                      : idx < stepIndex
                      ? "bg-emerald-500 text-white border-emerald-400"
                      : "bg-white/15 text-white/70 border-white/10"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {idx < 3 && <div className="w-5 h-0.5 bg-white/20 rounded" />}
              </React.Fragment>
            ))}
          </div>

          {/* Step Forms */}
          {step === "email" && (
            <form className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl w-full" onSubmit={handleEmailSubmit}>
              <div className="text-center flex flex-col gap-0.5">
                <h2 className="text-lg font-bold text-[#0F3F73]">Reset Password</h2>
                <p className="text-xs text-slate-500">Enter your email to receive a 6-digit code</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl h-11 px-3.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <Input
                    type="email"
                    placeholder="Enter registered email"
                    className="flex-1 border-none bg-transparent focus:ring-0 text-slate-800 placeholder:text-slate-400 text-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    aria-label="Email address"
                  />
                </div>
                {error && <div className="text-red-600 text-xs mt-0.5">{error}</div>}
              </div>
              <Button
                type="submit"
                className="bg-[#0F3F73] hover:bg-[#0B335E] text-white h-11 rounded-xl font-bold text-sm shadow-md shadow-[#0F3F73]/25 mt-1"
                disabled={loading}
                aria-busy={loading}
                fullWidth
              >
                {loading ? "Sending Code..." : "Send Verification Code"}
              </Button>
              <button
                type="button"
                className="text-[#0F3F73] font-semibold text-xs text-center hover:underline"
                onClick={() => setPage && setPage("login")}
              >
                Back to Sign In
              </button>
            </form>
          )}

          {step === "otp" && (
            <form className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl w-full" onSubmit={handleOtpSubmit}>
              <div className="text-center flex flex-col gap-0.5">
                <h2 className="text-lg font-bold text-[#0F3F73]">Enter Verification Code</h2>
                <p className="text-xs text-slate-500">We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span></p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl h-11 px-3.5">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 border-none bg-transparent focus:ring-0 text-slate-800 placeholder:text-slate-400 text-center tracking-widest text-base font-bold"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    aria-label="OTP code"
                    maxLength={6}
                  />
                </div>
                {error && <div className="text-red-600 text-xs mt-0.5">{error}</div>}
                {success && <div className="text-emerald-600 text-xs mt-0.5">{success}</div>}
              </div>
              <div className="flex flex-col gap-2.5">
                <Button
                  type="submit"
                  className="bg-[#0F3F73] hover:bg-[#0B335E] text-white h-11 rounded-xl font-bold text-sm shadow-md shadow-[#0F3F73]/25"
                  disabled={loading}
                  aria-busy={loading}
                  fullWidth
                >
                  Verify Code
                </Button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCountdown > 0}
                  className="text-[#0F3F73] font-semibold text-xs disabled:opacity-50"
                >
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend Verification Code"}
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl p-5 flex flex-col gap-4 shadow-2xl w-full" onSubmit={handlePasswordSubmit}>
              <div className="text-center flex flex-col gap-0.5">
                <h2 className="text-lg font-bold text-[#0F3F73]">Set New Password</h2>
                <p className="text-xs text-slate-500">Create a secure new password</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl h-11 px-3.5 relative">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    className="flex-1 border-none bg-transparent focus:ring-0 text-slate-800 placeholder:text-slate-400 text-sm pr-6"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    aria-label="New password"
                  />
                  <button type="button" className="absolute right-3 text-slate-400" onClick={() => setShowNewPassword(v => !v)}>
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl h-11 px-3.5 relative">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    className="flex-1 border-none bg-transparent focus:ring-0 text-slate-800 placeholder:text-slate-400 text-sm pr-6"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    aria-label="Confirm new password"
                  />
                  <button type="button" className="absolute right-3 text-slate-400" onClick={() => setShowConfirmPassword(v => !v)}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {error && <div className="text-red-600 text-xs mt-0.5">{error}</div>}
              </div>
              <Button
                type="submit"
                className="bg-[#0F3F73] hover:bg-[#0B335E] text-white h-11 rounded-xl font-bold text-sm shadow-md shadow-[#0F3F73]/25 mt-1"
                disabled={loading}
                aria-busy={loading}
                fullWidth
              >
                {loading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          )}

          {step === "success" && (
            <div className="bg-white/95 backdrop-blur-xl border border-white/40 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl text-center w-full">
              <div className="flex flex-col items-center gap-3">
                <Check className="w-10 h-10 text-emerald-600 mx-auto" />
                <h2 className="text-lg font-bold text-[#0F3F73]">Password Reset Complete!</h2>
                <p className="text-xs text-slate-500">Your password has been successfully updated.<br />Redirecting to sign in...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-slate-200 text-[11px] pb-3 shrink-0 px-4 space-y-0.5">
        <p className="font-semibold text-amber-300">Karnataka e-Governance Compliant</p>
        <p className="opacity-80 text-[10px]">Department of Minority Welfare • Govt. of Karnataka</p>
      </div>
    </div>
  );
}
