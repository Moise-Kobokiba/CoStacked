// src/components/auth/RegistrationForm.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../../features/auth/authSlice";
import { PasswordInput } from "../shared/PasswordInput";
import { Card } from "../shared/Card";
import { Input } from "../shared/Input";
import { Label } from "../shared/Label";
import { Button } from "../shared/Button";
import { Textarea } from "../shared/Textarea";
import { RadioGroup } from "../shared/RadioGroup";
import { Loader2 } from "lucide-react";
import styles from "./RegistrationForm.module.css";

const roleOptions = [
  { value: 'developer', label: 'Developer' },
  { value: 'founder', label: 'Founder' }
];

export const RegistrationForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "", // Added confirmPassword
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

    const [validationError, setValidationError] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socials.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        socials: { ...prev.socials, [key]: value }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear validation error on change
    if (validationError) setValidationError("");
  };

  const handleStrengthChange = (strength) => {
    setIsPasswordValid(strength.isValid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    if (!isPasswordValid) {
      setValidationError("Password must be weak/invalid. Please follow the security tips.");
      return;
    }

    // Remove confirmPassword before sending to backend
    const { confirmPassword, ...dataToSend } = formData;

    const resultAction = await dispatch(registerUser(dataToSend));

    if (registerUser.fulfilled.match(resultAction)) {
      navigate("/verify-email");
    }
  };

  return (
    <Card className={styles.card}>
      <header className={styles.header}>
        <h1 className={styles.title}>Create Your CoStacked Account</h1>
        <p className={styles.description}>
          Tell us a bit about yourself to get started.
        </p>
      </header>

      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* === Core Account Fields === */}
          {/* === Core Account Fields === */}
          {/* Removed formGrid to stack fields vertically */}
          <div className={styles.formGroup}>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          
          {/* Password Field */}
          <div className={styles.formGroup}>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              showStrengthMeter={true}
              showSecurityTip={true}
              onStrengthChange={handleStrengthChange}
              placeholder="Min 12 characters"
            />
          </div>

          {/* Confirm Password Field */}
          <div className={styles.formGroup}>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter password"
            />
          </div>

          <div className={styles.formGroup}>
            <Label>Your Role</Label>
            <RadioGroup
              name="role"
              options={roleOptions}
              selectedValue={formData.role}
              onChange={handleChange}
            />
          </div>

          <div className={styles.separator} />

          {/* === Profile Detail Fields === */}
          <div className={styles.formGroup}>
            <Label htmlFor="bio">Your Bio / About Me</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="e.g., Passionate frontend developer with a love for React..."
            />
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="skills">Your Skills (comma-separated)</Label>
            <Input
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., TypeScript, Node.js, Figma"
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Cape Town, WC"
              />
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                placeholder="e.g., 20 hours/week"
              />
            </div>
            <div className={styles.formGroupSpan2}>
              <Label htmlFor="portfolioLink">Portfolio/GitHub Link</Label>
              <Input
                id="portfolioLink"
                name="portfolioLink"
                value={formData.portfolioLink}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.separator} />

          {/* === Social Media Links === */}
          <div className={styles.formGroup}>
            <Label>Social Media Profiles (Optional)</Label>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <Label htmlFor="socials.twitter">Twitter</Label>
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

          {validationError && <p className={styles.error}>{validationError}</p>}
          {status === "failed" && <p className={styles.error}>{error}</p>}

          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? (
              <>
                <Loader2 className={styles.loader} /> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{" "}
            <Link to="/login" className={styles.link}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
};
