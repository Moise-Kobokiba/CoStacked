// src/pages/VerifyEmailPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { verifyEmail, resendVerificationEmail, clearAuthMessages } from "../features/auth/authSlice";

import { Card } from "../components/shared/Card";
import { Input } from "../components/shared/Input";
import { Label } from "../components/shared/Label";
import { Button } from "../components/shared/Button";
import { Loader2, Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./VerifyEmailPage.module.css";

export const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error, successMessage, unverifiedEmail } = useSelector(
    (state) => state.auth
  );

  const [token, setToken] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Restore email if page refreshed
  const activeEmail =
    unverifiedEmail || localStorage.getItem("unverifiedEmail");

  useEffect(() => {
    // If no email to verify, kick user back
    if (!activeEmail) {
      navigate("/signup");
      return;
    }

    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      dispatch(clearAuthMessages());
    };
  }, [activeEmail, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !activeEmail) return;

    const result = await dispatch(
      verifyEmail({ email: activeEmail, token })
    );

    if (verifyEmail.fulfilled.match(result)) {
      // Store user data temporarily for onboarding check
      localStorage.setItem("pendingUser", JSON.stringify(result.payload.user));
      
      // Redirect based on whether profile is completed
      setTimeout(() => {
        if (result.payload.user && !result.payload.user.profileCompleted) {
          navigate("/onboarding", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 1800);
    }
  };

  const handleResend = async () => {
    if (!canResend || !activeEmail) return;
    
    setCanResend(false);
    setResendTimer(60);
    
    await dispatch(resendVerificationEmail(activeEmail));
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <header className={styles.header}>
          <div className={styles.iconWrapper}>
            <Mail size={48} className={styles.emailIcon} />
          </div>
          <h1 className={styles.title}>Verify Your Email</h1>
          <p className={styles.description}>
            We&apos;ve sent a 6-digit verification code to{" "}
            <strong className={styles.email}>{activeEmail || "your email"}</strong>.
            <br />
            Enter the code below to complete your registration.
          </p>
        </header>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <Label htmlFor="token" className={styles.label}>
                Verification Code
              </Label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                placeholder="123456"
                required
                className={styles.codeInput}
                autoComplete="one-time-code"
              />
            </div>

            {status === "failed" && error && (
              <div className={styles.errorMessage}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {status === "succeeded" && successMessage && (
              <div className={styles.successMessage}>
                <CheckCircle size={20} />
                <span>{successMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={status === "loading" || token.length !== 6}
              className={styles.verifyButton}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="animate-spin" /> Verifying…
                </>
              ) : (
                "Verify Account"
              )}
            </Button>
          </form>

          <div className={styles.resendSection}>
            <p className={styles.resendText}>
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={!canResend || status === "loading"}
              className={styles.resendButton}
            >
              <RefreshCw size={16} className={!canResend && styles.spinning} />
              {canResend 
                ? "Resend Code" 
                : `Resend in ${resendTimer}s`
              }
            </button>
          </div>

          <div className={styles.helpSection}>
            <p className={styles.helpText}>
              Wrong email?{" "}
              <button 
                onClick={() => navigate("/signup")}
                className={styles.linkButton}
              >
                Sign up with a different email
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
