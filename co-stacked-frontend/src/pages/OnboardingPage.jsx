// src/pages/OnboardingPage.jsx
// Enhanced onboarding flow for ALL new users to complete their profile

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, CheckCircle, User, Briefcase, Link, Camera, ChevronRight, ChevronLeft, Plus, Trash2, Rocket, Laptop, GraduationCap } from "lucide-react";
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
  { id: 3, title: "Experience", icon: Rocket, description: "Professional history (Optional)" },
  { id: 4, title: "Education", icon: GraduationCap, description: "Academic history (Optional)" },
  { id: 5, title: "Details", icon: Link, description: "Add your details" },
  { id: 6, title: "Photo", icon: Camera, description: "Upload a photo" },
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
    experience: [],
    education: [],
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
    // Experience/Education are optional, so we don't strictly require them for 100%
    // but they contribute to completeness if present.
    if (formData.experience.length > 0) completed += 1;
    if (formData.education.length > 0) completed += 1;
    
    return Math.min(100, Math.round((completed / 7) * 100));
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

  // Experience Management
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { title: '', company: '', employmentType: 'Full-time', startDate: '', endDate: '', isCurrent: false, description: '', icon: 'rocket_launch' }
      ]
    }));
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    setFormData(prev => {
      const newExp = [...prev.experience];
      newExp[index] = { ...newExp[index], [field]: value };
      return { ...prev, experience: newExp };
    });
  };

  // Education Management
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', school: '', startDate: '', endDate: '', description: '' }
      ]
    }));
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => {
      const newEdu = [...prev.education];
      newEdu[index] = { ...newEdu[index], [field]: value };
      return { ...prev, education: newEdu };
    });
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
    if (currentStep === 5) {
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

            {/* Step 3: Experience */}
            {currentStep === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.sectionHeader}>
                  <p className={styles.hint}>Optional: Add your past or current roles.</p>
                  <Button type="button" variant="outline" size="sm" onClick={addExperience} className={styles.addItemBtn}>
                    <Plus size={16} /> Add Position
                  </Button>
                </div>

                <div className={styles.dynamicList}>
                  {formData.experience.length === 0 && (
                    <div className={styles.emptyDynamicState}>
                      <Briefcase size={40} />
                      <p>No experience added yet.</p>
                    </div>
                  )}
                  {formData.experience.map((exp, idx) => (
                    <div key={idx} className={styles.dynamicItem}>
                      <div className={styles.dynamicItemHeader}>
                        <div className={styles.iconSelection}>
                          <Rocket 
                            size={20} 
                            className={exp.icon === 'rocket_launch' ? styles.iconActive : styles.iconInactive}
                            onClick={() => handleExperienceChange(idx, 'icon', 'rocket_launch')}
                          />
                          <Laptop 
                            size={20} 
                            className={exp.icon === 'laptop_mac' ? styles.iconActive : styles.iconInactive}
                            onClick={() => handleExperienceChange(idx, 'icon', 'laptop_mac')}
                          />
                        </div>
                        <button type="button" onClick={() => removeExperience(idx)} className={styles.removeBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <Label>Job Title</Label>
                          <Input value={exp.title} onChange={e => handleExperienceChange(idx, 'title', e.target.value)} placeholder="e.g. Senior Developer" required />
                        </div>
                        <div className={styles.formGroup}>
                          <Label>Company</Label>
                          <Input value={exp.company} onChange={e => handleExperienceChange(idx, 'company', e.target.value)} placeholder="e.g. Acme Corp" required />
                        </div>
                        <div className={styles.formGroup}>
                          <Label>Start Date</Label>
                          <Input type="date" value={exp.startDate ? exp.startDate.split('T')[0] : ''} onChange={e => handleExperienceChange(idx, 'startDate', e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                          <Label>End Date</Label>
                          <Input type="date" value={exp.endDate ? exp.endDate.split('T')[0] : ''} onChange={e => handleExperienceChange(idx, 'endDate', e.target.value)} disabled={exp.isCurrent} />
                        </div>
                        <div className={styles.checkboxGroup}>
                          <input type="checkbox" checked={exp.isCurrent} onChange={e => handleExperienceChange(idx, 'isCurrent', e.target.checked)} />
                          <Label>I currently work here</Label>
                        </div>
                        <div className={styles.formGroupFull}>
                          <Label>Description</Label>
                          <Textarea value={exp.description} onChange={e => handleExperienceChange(idx, 'description', e.target.value)} rows={2} placeholder="What did you do there?" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Education */}
            {currentStep === 4 && (
              <div className={styles.stepContent}>
                <div className={styles.sectionHeader}>
                  <p className={styles.hint}>Optional: Add your educational background.</p>
                  <Button type="button" variant="outline" size="sm" onClick={addEducation} className={styles.addItemBtn}>
                    <Plus size={16} /> Add School
                  </Button>
                </div>

                <div className={styles.dynamicList}>
                  {formData.education.length === 0 && (
                    <div className={styles.emptyDynamicState}>
                      <GraduationCap size={40} />
                      <p>No education added yet.</p>
                    </div>
                  )}
                  {formData.education.map((edu, idx) => (
                    <div key={idx} className={styles.dynamicItem}>
                      <div className={styles.dynamicItemHeader}>
                        <GraduationCap size={20} className={styles.iconActive} />
                        <button type="button" onClick={() => removeEducation(idx)} className={styles.removeBtn}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                          <Label>Degree / Program</Label>
                          <Input value={edu.degree} onChange={e => handleEducationChange(idx, 'degree', e.target.value)} placeholder="e.g. BS Computer Science" required />
                        </div>
                        <div className={styles.formGroup}>
                          <Label>School / University</Label>
                          <Input value={edu.school} onChange={e => handleEducationChange(idx, 'school', e.target.value)} placeholder="e.g. Stanford University" required />
                        </div>
                        <div className={styles.formGroup}>
                          <Label>Start Date</Label>
                          <Input value={edu.startDate} onChange={e => handleEducationChange(idx, 'startDate', e.target.value)} placeholder="e.g. 2016" />
                        </div>
                        <div className={styles.formGroup}>
                          <Label>End Date</Label>
                          <Input value={edu.endDate} onChange={e => handleEducationChange(idx, 'endDate', e.target.value)} placeholder="e.g. 2020" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Details */}
            {currentStep === 5 && (
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

            {/* Step 6: Photo Upload */}
            {currentStep === 6 && (
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
