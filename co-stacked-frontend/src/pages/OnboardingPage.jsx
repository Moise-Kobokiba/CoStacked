// src/pages/OnboardingPage.jsx
// Onboarding flow for OAuth users to complete their profile

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
import API from "../api/axios";
import { setUser } from "../features/auth/authSlice";
import { Card } from "../components/shared/Card";
import { Input } from "../components/shared/Input";
import { Label } from "../components/shared/Label";
import { Button } from "../components/shared/Button";
import { Textarea } from "../components/shared/Textarea";
import { RadioGroup } from "../components/shared/RadioGroup";
import styles from "./OnboardingPage.module.css";

const roleOptions = [
  { value: "developer", label: "Developer" },
  { value: "founder", label: "Founder" },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    role: "developer",
    bio: "",
    skills: "",
    location: "",
    availability: "",
    portfolioLink: "",
    socials: {
      twitter: "",
      linkedin: "",
      instagram: "",
      facebook: "",
      tiktok: "",
    },
  });

  // Redirect if not authenticated or profile already completed
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    } else if (user?.profileCompleted) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("socials.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        socials: { ...prev.socials, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await API.put("/users/complete-profile", formData);
      
      if (response.data.success) {
        // Update Redux store with completed profile
        dispatch(setUser(response.data.user));
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(
        err.response?.data?.message || 
        "Failed to complete profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={48} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Welcome to CoStacked!</h1>
          <p className={styles.description}>
            Complete your profile to get started. This helps others understand
            who you are and what you&apos;re looking for.
          </p>
        </header>

        <div className={styles.content}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Role Selection - Critical for OAuth users */}
            <div className={styles.formGroup}>
              <Label>I am a...</Label>
              <RadioGroup
                name="role"
                options={roleOptions}
                selectedValue={formData.role}
                onChange={handleChange}
              />
              <p className={styles.hint}>
                Choose whether you&apos;re looking to build projects as a developer
                or seeking developers as a founder.
              </p>
            </div>

            <div className={styles.separator} />

            {/* Bio */}
            <div className={styles.formGroup}>
              <Label htmlFor="bio">Your Bio / About Me *</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                required
                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
              />
            </div>

            {/* Skills */}
            <div className={styles.formGroup}>
              <Label htmlFor="skills">Your Skills (comma-separated) *</Label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                required
                placeholder="e.g., React, Node.js, Python, UI/UX Design, Product Management"
              />
            </div>

            <div className={styles.formGrid}>
              {/* Location */}
              <div className={styles.formGroup}>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Cape Town, WC"
                />
              </div>

              {/* Availability */}
              <div className={styles.formGroup}>
                <Label htmlFor="availability">Availability *</Label>
                <Input
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 20 hours/week, Full-time, Weekends only"
                />
              </div>
            </div>

            {/* Portfolio Link */}
            <div className={styles.formGroup}>
              <Label htmlFor="portfolioLink">Portfolio / GitHub / Website Link</Label>
              <Input
                id="portfolioLink"
                name="portfolioLink"
                type="url"
                value={formData.portfolioLink}
                onChange={handleChange}
                placeholder="https://github.com/username or https://yourportfolio.com"
              />
            </div>

            <div className={styles.separator} />

            {/* Social Media Links */}
            <div className={styles.formGroup}>
              <Label>Social Media Profiles (Optional)</Label>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <Label htmlFor="socials.twitter">Twitter / X</Label>
                  <Input
                    id="socials.twitter"
                    name="socials.twitter"
                    type="url"
                    value={formData.socials.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="socials.linkedin">LinkedIn</Label>
                  <Input
                    id="socials.linkedin"
                    name="socials.linkedin"
                    type="url"
                    value={formData.socials.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="socials.instagram">Instagram</Label>
                  <Input
                    id="socials.instagram"
                    name="socials.instagram"
                    type="url"
                    value={formData.socials.instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/username"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="socials.facebook">Facebook</Label>
                  <Input
                    id="socials.facebook"
                    name="socials.facebook"
                    type="url"
                    value={formData.socials.facebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/username"
                  />
                </div>
                <div className={styles.formGroup}>
                  <Label htmlFor="socials.tiktok">TikTok</Label>
                  <Input
                    id="socials.tiktok"
                    name="socials.tiktok"
                    type="url"
                    value={formData.socials.tiktok}
                    onChange={handleChange}
                    placeholder="https://tiktok.com/@username"
                  />
                </div>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
              {isSubmitting ? (
                <>
                  <Loader2 className={styles.loader} /> Completing Profile...
                </>
              ) : (
                "Complete Profile & Continue"
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingPage;
