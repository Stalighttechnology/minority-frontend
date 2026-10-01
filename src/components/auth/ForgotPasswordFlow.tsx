import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPassword, resetPassword, verifyOTP } from "../../utils/authService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Mail, ArrowLeft, Send, Shield, LockKeyhole, CheckCircle, AlertCircle } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";


interface ForgotPasswordFlowProps {
  setPage: (page: string) => void;
}

type Step = 'email' | 'otp' | 'password' | 'success';

const ForgotPasswordFlow = ({ setPage }: ForgotPasswordFlowProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false);
  const [token, setToken] = useState("");
  const [resendCountdown, setResendCountdown] = useState(30);

  useEffect(() => {
    if (currentStep === 'otp' && resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, resendCountdown]);

  useEffect(() => {
    // Check if there's a stored temp_user_id from a previous session
    const tempUserId = sessionStorage.getItem("temp_user_id");
    const passwordResetEmail = sessionStorage.getItem("password_reset_email");

    if (tempUserId) {
      setUserId(String(tempUserId));
      // If coming from password reset requirement, skip email step
      if (passwordResetEmail) {
        setEmail(passwordResetEmail);
        setIsPasswordResetFlow(true);
        setCurrentStep('otp');
      }
    }
  }, []);

  const steps = [
  { id: 'email', title: 'Email', description: 'Enter your email', icon: Mail },
  { id: 'otp', title: 'Verification', description: 'Enter OTP code', icon: Shield },
  { id: 'password', title: 'New Password', description: 'Set new password', icon: LockKeyhole },
  { id: 'success', title: 'Complete', description: 'Password reset', icon: CheckCircle }];


  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await forgotPassword({ email: trimmedEmail });

      if (response.success) {
        const userIdString = String(response.user_id || "");
        setUserId(userIdString);
        sessionStorage.setItem("temp_user_id", userIdString);
        setCurrentStep('otp');
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setError("Please enter the OTP");
      return;
    }
    if (trimmedOtp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }
    const trimmedUserId = String(userId || "").trim();
    if (!trimmedUserId) {
      setError("Session expired. Please start over.");
      setCurrentStep('email');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await verifyOTP({ user_id: trimmedUserId, otp: trimmedOtp });
      if (response.success) {
        if (response.token) {
          setToken(response.token);
        }
        setCurrentStep('password');
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
    setLoading(true);
    try {
      const response = await forgotPassword({ email: email.trim() });
      if (response.success) {
        setUserId(String(response.user_id || ""));
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

  const handlePasswordReset = async () => {
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedUserId = String(userId || "").trim();

    if (!trimmedNewPassword || !trimmedConfirmPassword) {
      setError("Please fill in all password fields");
      return;
    }
    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (trimmedNewPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!trimmedUserId) {
      setError("Session expired. Please start over.");
      setCurrentStep('email');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await resetPassword({
        user_id: trimmedUserId,
        otp: otp.trim(),
        token: token || undefined,
        new_password: trimmedNewPassword,
        confirm_password: trimmedConfirmPassword
      });

      if (response.success) {
        setCurrentStep('success');
        sessionStorage.removeItem("temp_user_id");
        sessionStorage.removeItem("password_reset_email");
        setTimeout(() => {
          setPage("login");
        }, 3000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Network error. Please try again.");

    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    switch (currentStep) {
      case 'email':
        handleEmailSubmit();
        break;
      case 'otp':
        handleOTPSubmit();
        break;
      case 'password':
        handlePasswordReset();
        break;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-[hsl(var(--primary))]/20 rounded-lg h-12 transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} />
                
              </div>
            </div>
          </motion.div>);


      case 'otp':
        return (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-[hsl(var(--primary))]/20 rounded-lg h-12 text-center text-lg tracking-widest transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  maxLength={6} />
                
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-600">
                  We sent a verification code to {email}
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCountdown > 0}
                  className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
                </button>
              </div>
            </div>
          </motion.div>);


      case 'password':
        return (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"} // toggle type
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pl-10 pr-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-[hsl(var(--primary))]/20 rounded-lg h-12 transition-all duration-300" />
                
                <button
                  type="button"
                  className="absolute right-3 top-4 text-gray-400"
                  onClick={() => setShowNewPassword(!showNewPassword)}>
                  
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-4 h-4 w-4 text-gray-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"} // toggle type
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pl-10 pr-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-[hsl(var(--primary))]/20 rounded-lg h-12 transition-all duration-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} />
                
                <button
                  type="button"
                  className="absolute right-3 top-4 text-gray-400"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </motion.div>);


      case 'success':
        return (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-4">
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              
              <CheckCircle className="w-8 h-8 text-green-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isPasswordResetFlow ? 'Account Setup Complete!' : 'Password Reset Successfully!'}
            </h3>
            <p className="text-gray-600 text-sm">
              {isPasswordResetFlow ?
              'Your account is now active. You can login with your new password.' :
              'Your password has been reset. You\'ll be redirected to login in a moment.'
              }
            </p>
          </motion.div>);


      default:
        return null;
    }
  };

  const getButtonText = () => {
    switch (currentStep) {
      case 'email':
        return loading ? 'Sending...' : 'Send Reset Code';
      case 'otp':
        return 'Verify Code';
      case 'password':
        return loading ? 'Resetting...' : 'Reset Password';
      default:
        return '';
    }
  };

  const getButtonIcon = () => {
    switch (currentStep) {
      case 'email':
        return <Send className="h-4 w-4" />;
      case 'otp':
        return <Shield className="h-4 w-4" />;
      case 'password':
        return <LockKeyhole className="h-4 w-4" />;
      default:
        return null;
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
                Official Account Recovery & Security Portal
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed hidden sm:block">
            Secure self-service identity verification and password recovery verified via official 6-digit OTP verification codes.
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
            {/* Progress Steps */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <motion.div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-200 ${
                            isActive
                              ? isCurrent
                                ? "bg-[#0F3F73] border-[#0F3F73] text-white shadow"
                                : "bg-[#0F3F73]/15 border-[#0F3F73] text-[#0F3F73] dark:text-amber-400"
                              : "bg-slate-100 border-slate-200 text-slate-400"
                          }`}
                          animate={{ scale: isCurrent ? 1.08 : 1 }}
                        >
                          <Icon className="w-4 h-4" />
                        </motion.div>
                        <p className={`text-[10px] font-semibold mt-1 ${isActive ? "text-[#0F3F73] dark:text-white" : "text-slate-400"}`}>
                          {step.title}
                        </p>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                            index < currentStepIndex ? "bg-[#0F3F73]" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#0F3F73] dark:text-white">
                {currentStep === "email" && "Reset Password"}
                {currentStep === "otp" && "Verify Identity"}
                {currentStep === "password" && "Create New Password"}
                {currentStep === "success" && "Password Reset Successful"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentStep === "email" && "Enter your registered email address"}
                {currentStep === "otp" && "Enter the 6-digit verification code"}
                {currentStep === "password" && "Choose a strong password for your account"}
                {currentStep === "success" && "Your password has been successfully updated"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs flex items-center gap-2 mb-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Dynamic Step Content */}
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            {currentStep !== "success" && (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#0F3F73] hover:bg-[#0B335E] text-white font-bold rounded-xl h-11 shadow-lg shadow-[#0F3F73]/25 mt-4 transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {getButtonText()}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {getButtonIcon()}
                    {getButtonText()}
                  </div>
                )}
              </Button>
            )}

            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setPage("login")}
                className="text-xs font-semibold text-[#0F3F73] hover:text-[#0B335E] dark:text-amber-400 inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </button>
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

export default ForgotPasswordFlow;