// src/pages/OnboardingPage.jsx
// Enhanced onboarding flow for ALL new users to complete their profile

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, CheckCircle, User, Briefcase, Link, Camera, ChevronRight, ChevronLeft } from "lucide-react";
import API from "../api/axios";
import { setUser, getUserProfile } from "../features/auth/authSlice";
import { Card } from "../components/shared/Card";
import { Input } from "../components/shared/Input";
import { Label } from "../components/shared/Label";
import { Button } from "../components/shared/Button";
import { Textarea } from "../components/shared/Textarea";
import { RadioGroup } from "../components/shared/RadioGroup";
import styles from "./OnboardingPage.module.css";

const roleOptions = [
  { value: "developer", label: "Developer", description: "I want to collaborate on projects" },
  { value: "founder", label: "Founder", description: "I have ideas and need talent" },
];

const STEPS = [
  { id: 1, title: "Role", icon: Briefcase, description: "Choose your role" },
  { id: 2, title: "Basics", icon: User, description: "Tell us about yourself" },
  { id: 3, title: "Details", icon: Link, description: "Add your details" },
  { id: 4, title: "Photo", icon: Camera, description: "Upload a photo" },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    role: "developer",
    bio: "",
    skills: "",
    location: "",
    availability: "",
    portfolioLink: "",
    phoneNumber: "",
    avatarUrl: "",
    socials: {
      twitter: "",
      linkedin: "",
      instagram: "",
      facebook: "",
      tiktok: "",
    },
  });

  // Check for pending user from email verification
  useEffect(() => {
    const pendingUser = localStorage.getItem("pendingUser");
    if (pendingUser) {
      const parsed = JSON.parse(pendingUser);
      if (parsed.role) {
        setFormData(prev => ({ ...prev, role: parsed.role }));
      }
      // Clean up pending user after reading
      localStorage.removeItem("pendingUser");
    }
  }, []);

  // Redirect if not authenticated or profile already completed
  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem("userToken")) {
      navigate("/login", { replace: true });
    } else if (user?.profileCompleted) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch fresh user data on mount
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getUserProfile());
    }
  }, [dispatch, isAuthenticated, user]);

  const calculateProgress = () => {
    let completed = 0;
    const fields = [
      formData.role,
      formData.bio,
      formData.skills,
      formData.location,
      formData.availability,
    ];
    completed = fields.filter(Boolean).length;
    if (formData.avatarUrl) completed += 1;
    return Math.round((completed / 6) * 100);
  };

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

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1 && !formData.role) {
      setError("Please select a role to continue");
      return;
    }
    if (currentStep === 2) {
      if (!formData.bio || formData.bio.length < 20) {
        setError("Please provide a bio (at least 20 characters)");
        return;
      }
      if (!formData.skills) {
        setError("Please add at least one skill");
        return;
      }
    }
    if (currentStep === 3) {
      if (!formData.location) {
        setError("Please enter your location");
        return;
      }
      if (!formData.availability) {
        setError("Please specify your availability");
        return;
      }
      // Phone required for founders
      if (formData.role === 'founder' && !formData.phoneNumber) {
        setError("Phone number is required for founders to build trust");
        return;
      }
    }
    
    setError("");
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("avatar", file);

    try {
      const response = await API.put("/users/profile/avatar", formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setFormData(prev => ({ ...prev, avatarUrl: response.data.avatarUrl }));
    } catch (err) {
      setError("Failed to upload avatar. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Require photo for completion
    if (!formData.avatarUrl) {
      setError("Please upload a profile photo to complete your profile");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      const response = await API.put("/users/complete-profile", formData);
      
      if (response.data.success) {
        // Update Redux store with completed profile
        dispatch(setUser(response.data.user));
        
        // Show success and redirect
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 500);
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

  if (!user && isAuthenticated) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={48} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  const CurrentStepIcon = STEPS[currentStep - 1].icon;

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        {/* Progress Header */}
        <div className={styles.progressHeader}>
          <div className={styles.stepIndicators}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index + 1 === currentStep;
              const isCompleted = index + 1 < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`${styles.stepIndicator} ${
                    isActive ? styles.active : ""
                  } ${isCompleted ? styles.completed : ""}`}
                >
                  <div className={styles.stepIcon}>
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <span className={styles.stepTitle}>{step.title}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>
            {currentStep === 1 && "Welcome to CoStacked!"}
            {currentStep === 2 && "Tell Us About Yourself"}
            {currentStep === 3 && "Professional Details"}
            {currentStep === 4 && "Add Your Photo"}
          </h1>
          <p className={styles.description}>
            {STEPS[currentStep - 1].description}
            {currentStep === 4 && " (Required for trust & connections)"}
          </p>
        </header>

        <div className={styles.content}>
          <form onSubmit={currentStep === STEPS.length ? handleSubmit : (e) => e.preventDefault()} className={styles.form}>
            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.formGroup}>
                  <Label className={styles.stepLabel}>I am a...</Label>
                  <div className={styles.roleCards}>
                    {roleOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`${styles.roleCard} ${
                          formData.role === option.value ? styles.selected : ""
                        }`}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, role: option.value }))
                        }
                      >
                        <div className={styles.roleIcon}>
                          {option.value === "developer" ? (
                            <User size={32} />
                          ) : (
                            <Briefcase size={32} />
                          )}
                        </div>
                        <h3 className={styles.roleTitle}>{option.label}</h3>
                        <p className={styles.roleDescription}>
                          {option.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {currentStep === 2 && (
              <div className={styles.stepContent}>
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
                    minLength={20}
                  />
                  <p className={styles.hint}>
                    Minimum 20 characters. This helps others understand who you are.
                  </p>
                </div>

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
              </div>
            )}

            {/* Step 3: Details */}
            {currentStep === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.formGrid}>
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

                  <div className={styles.formGroup}>
                    <Label htmlFor="availability">Availability *</Label>
                    <Input
                      id="availability"
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      required
                      placeholder="e.g., 20 hours/week, Full-time"
                    />
                  </div>
                </div>

                {formData.role === 'founder' && (
                  <div className={styles.formGroup}>
                    <Label htmlFor="phoneNumber">
                      Phone Number * (Required for founders to build trust)
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required={formData.role === 'founder'}
                      placeholder="e.g., +1 (555) 123-4567"
                    />
                  </div>
                )}

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

                <div className={styles.formGroup}>
                  <Label>Social Media Profiles (Optional)</Label>
                  <div className={styles.socialGrid}>
                    <Input
                      name="socials.linkedin"
                      type="url"
                      value={formData.socials.linkedin}
                      onChange={handleChange}
                      placeholder="LinkedIn URL"
                    />
                    <Input
                      name="socials.twitter"
                      type="url"
                      value={formData.socials.twitter}
                      onChange={handleChange}
                      placeholder="Twitter URL"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Photo Upload */}
            {currentStep === 4 && (
              <div className={styles.stepContent}>
                <div className={styles.avatarUpload}>
                  {formData.avatarUrl ? (
                    <div className={styles.avatarPreview}>
                      <img
                        src={formData.avatarUrl}
                        alt="Profile"
                        className={styles.avatarImage}
                      />
                      <button
                        type="button"
                        className={styles.changePhotoButton}
                        onClick={() =>
                          document.getElementById("avatar-input").click()
                        }
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.avatarPlaceholder}
                      onClick={() =>
                        document.getElementById("avatar-input").click()
                      }
                    >
                      <Camera size={48} />
                      <span>Click to upload photo</span>
                      <p className={styles.avatarHint}>
                        Required for making connections
                      </p>
                    </div>
                  )}
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className={styles.hiddenInput}
                  />
                </div>

                <div className={styles.completionInfo}>
                  <div className={styles.completionScore}>
                    <span className={styles.scoreLabel}>Profile Completion</span>
                    <span className={styles.scoreValue}>{calculateProgress()}%</span>
                  </div>
                  <div className={styles.completionBar}>
                    <div
                      className={styles.completionFill}
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.buttonGroup}>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className={styles.backButton}
                >
                  <ChevronLeft size={20} />
                  Back
                </Button>
              )}

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className={styles.nextButton}
                >
                  Continue
                  <ChevronRight size={20} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.avatarUrl}
                  className={styles.submitButton}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className={styles.loader} /> Completing...
                    </>
                  ) : (
                    <>
                      Complete Profile
                      <CheckCircle size={20} />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default OnboardingPage;
