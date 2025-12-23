// src/pages/VerifyEmailPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { verifyEmail, clearAuthMessages } from "../features/auth/authSlice";

import { Card } from "../components/shared/Card";
import { Input } from "../components/shared/Input";
import { Label } from "../components/shared/Label";
import { Button } from "../components/shared/Button";
import { Loader2 } from "lucide-react";
import styles from "./LoginPage.module.css";

export const VerifyEmailPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error, successMessage, unverifiedEmail } = useSelector(
    (state) => state.auth
  );

  const [token, setToken] = useState("");

  // Restore email if page refreshed
  const activeEmail =
    unverifiedEmail || localStorage.getItem("unverifiedEmail");

  useEffect(() => {
    // If no email to verify, kick user back
    if (!activeEmail) {
      navigate("/signup");
      return;
    }

    return () => {
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
      // If user is now authenticated (token returned), go to dashboard
      // Otherwise, go to login page
      const redirectTo = result.payload.token ? "/dashboard" : "/login";
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1800);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Card className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Verify Your Email</h1>

          <p className={styles.description}>
            Enter the 6-digit code sent to{" "}
            <strong>{activeEmail || "your email"}</strong>.
          </p>
        </header>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength="6"
                placeholder="123456"
                required
              />
            </div>

            {status === "failed" && error && (
              <p className={styles.error}>{error}</p>
            )}

            {status === "succeeded" && successMessage && (
              <p className={styles.success}>{successMessage}</p>
            )}

            <Button
              type="submit"
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Verifying…
                </>
              ) : (
                "Verify Account"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
