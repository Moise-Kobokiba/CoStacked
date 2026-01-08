// src/pages/SettingsPage.jsx

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Import all necessary Redux Actions for this page
import { updateUserProfile, deleteAccount, uploadAvatar } from '../features/auth/authSlice';
import { verifySubscription, cancelSubscription } from '../features/payments/paymentSlice';

// Import all required UI Components
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { Textarea } from '../components/shared/Textarea';
import { Label } from '../components/shared/Label';
import { RadioGroup } from '../components/shared/RadioGroup';
import { SettingsSection } from '../components/settings/SettingsSection';
import { ConfirmationModal } from '../components/shared/ConfirmationModal';
import { SubscriptionModal } from '../components/billing/SubscriptionModal';
import { ChangePasswordModal } from '../components/auth/ChangePasswordModal';
import { CheckCircle, AlertCircle, Camera } from 'lucide-react';
import styles from './SettingsPage.module.css';

/**
 * The main page for managing user account settings, preferences, and subscriptions.
 */
export const SettingsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, status: authStatus } = useSelector(state => state.auth);
  const { status: paymentStatus } = useSelector(state => state.payment);
  
   const [formData, setFormData] = useState({
     name: '',
     bio: '',
     skills: '',
     location: '',
     availability: '',
     portfolioLink: '',
     socials: {
       twitter: '',
       linkedin: '',
       instagram: '',
       facebook: '',
       tiktok: '',
     },
     profileVisibility: '',
     notificationEmails: '',
   });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [pageStatus, setPageStatus] = useState({ type: '', message: '' }); // 'success' | 'error'
  
  const [isSubModalOpen, setSubModalOpen] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false); // State for delete confirmation

  useEffect(() => {
    if (user) {
      setFormData({
         name: user.name || '',
         bio: user.bio || '',
         skills: user.skills ? user.skills.join(', ') : '',
         location: user.location || '',
         availability: user.availability || '',
         portfolioLink: user.portfolioLink || '',
         socials: user.socials || {
           twitter: '',
           linkedin: '',
           instagram: '',
           facebook: '',
           tiktok: '',
         },
         profileVisibility: user.profileVisibility || 'public',
         notificationEmails: user.notificationEmails || 'essential',
       });
      setAvatarPreview(user.avatarUrl);
    }
  }, [user]);

   const handleChange = (e) => {
     const { name, value } = e.target;
     if (name.startsWith('socials.')) {
       const key = name.split('.')[1];
       setFormData((prev) => ({
         ...prev,
         socials: { ...prev.socials, [key]: value }
       }));
     } else {
       setFormData(prev => ({ ...prev, [name]: value }));
     }
   };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setPageStatus({ type: '', message: '' });
    
    try {
        // 1. Upload Avatar if changed
        if (avatarFile) {
            const formData = new FormData();
            formData.append('avatar', avatarFile);
            const avatarResult = await dispatch(uploadAvatar(formData));
            if (uploadAvatar.rejected.match(avatarResult)) {
                throw new Error(avatarResult.payload?.message || "Failed to upload avatar.");
            }
        }

        // 2. Update Profile Data
        const resultAction = await dispatch(updateUserProfile(formData));
        if (updateUserProfile.fulfilled.match(resultAction)) {
             setPageStatus({ type: 'success', message: 'Settings saved successfully!' });
             // Clear avatar file state after successful upload
             setAvatarFile(null);
        } else {
             throw new Error(resultAction.payload?.message || "Failed to save settings.");
        }

    } catch (err) {
        setPageStatus({ type: 'error', message: err.message });
    }
  };
  
  const handleVerification = async (chargeToken) => {
    if (!chargeToken) return;
    setSubModalOpen(false);
    alert("Payment successful! Verifying your subscription...");
    const resultAction = await dispatch(verifySubscription(chargeToken));
    if (verifySubscription.fulfilled.match(resultAction)) {
      alert(resultAction.payload.message);
    } else {
      alert(`Verification Failed: ${resultAction.payload?.message || 'Please contact support.'}`);
    }
  };

  const handleCancelSubscription = async () => {
    const resultAction = await dispatch(cancelSubscription());
    if (cancelSubscription.fulfilled.match(resultAction)) {
      alert(resultAction.payload.message);
    } else {
      alert(`Cancellation failed: ${resultAction.payload?.message || 'Please contact support.'}`);
    }
    setCancelModalOpen(false);
  };

  // Handler for confirming and executing account deletion
  const handleDeleteAccount = async () => {
    const resultAction = await dispatch(deleteAccount());
    setDeleteModalOpen(false); // Close the modal immediately
    if (deleteAccount.fulfilled.match(resultAction)) {
      alert(resultAction.payload.message);
      // The logout action inside the thunk will clear the Redux state and localStorage.
      // We navigate to ensure the user is moved to a public page.
      navigate('/login');
    } else {
      alert(`Account deletion failed: ${resultAction.payload?.message || 'An unexpected error occurred.'}`);
    }
  };

  if (!user) {
    return <div style={{textAlign: 'center', padding: '4rem'}}>Loading your settings...</div>;
  }

  return (
    <>
      {/* All Modals */}
      <SubscriptionModal 
        open={isSubModalOpen}
        onClose={() => setSubModalOpen(false)}
        onConfirm={handleVerification}
      />
      <ChangePasswordModal 
        open={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
      <ConfirmationModal
        open={isCancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelSubscription}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your verification subscription? Your verified badge will be removed immediately."
        confirmText="Yes, Cancel Subscription"
        isDestructive={true}
      />
      <ConfirmationModal
        open={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Your Account"
        message="Are you absolutely sure? This action is irreversible and will permanently delete your account and all associated data from CoStacked."
        confirmText="Yes, Permanently Delete My Account"
        isDestructive={true}
      />

      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your account and platform preferences.</p>
        </header>

        {pageStatus.message && (
          <div className={`${styles.statusBanner} ${pageStatus.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
            {pageStatus.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span>{pageStatus.message}</span>
          </div>
        )}

        <div className={styles.settingsContent}>
          <SettingsSection title="Profile Picture" description="Update your avatar.">
             <div className={styles.avatarSection}>
                <div className={styles.avatarPreview}>
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar Preview" className={styles.avatarImage} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{user.name?.charAt(0).toUpperCase()}</div>
                    )}
                </div>
                <div className={styles.avatarUpload}>
                    <input 
                        type="file" 
                        id="avatar-upload" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        className={styles.fileInput}
                        style={{ display: 'none' }}
                    />
                    <label htmlFor="avatar-upload">
                        <Button variant="secondary" onClick={() => document.getElementById('avatar-upload').click()}>
                            <Camera size={16} style={{marginRight: '8px'}}/> Upload New Picture
                        </Button>
                    </label>
                    <p className={styles.avatarHint}>Recommended: Square JPG, PNG. Max 2MB.</p>
                </div>
             </div>
          </SettingsSection>

          <SettingsSection title="Account" description="Your account's email address.">
            <div className={styles.formGroup}>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" value={user.email} disabled />
            </div>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(true)}>
              Change Password
            </Button>
          </SettingsSection>
          
          <SettingsSection title="Profile Details" description="Information shown on your public profile.">
             <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className={styles.formGroup}>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Cape Town" />
                </div>
                <div className={styles.formGroup}>
                    <Label htmlFor="availability">Availability</Label>
                    <Input id="availability" name="availability" value={formData.availability} onChange={handleChange} placeholder="e.g. Open to work" />
                </div>
                <div className={styles.formGroupSpan2}>
                    <Label htmlFor="portfolioLink">Portfolio / Website</Label>
                    <Input id="portfolioLink" name="portfolioLink" value={formData.portfolioLink} onChange={handleChange} placeholder="https://..." />
                </div>
                 <div className={styles.formGroupSpan2}>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Tell us about yourself..." />
                </div>
                  <div className={styles.formGroupSpan2}>
                     <Label htmlFor="skills">Skills (comma separated)</Label>
                     <Input id="skills" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, Design..." />
                 </div>
              </div>
              <div className={styles.formGrid}>
                 <div className={styles.formGroup}>
                     <Label htmlFor="socials.twitter">Twitter</Label>
                     <Input id="socials.twitter" name="socials.twitter" type="url" value={formData.socials.twitter} onChange={handleChange} placeholder="https://twitter.com/username" />
                 </div>
                 <div className={styles.formGroup}>
                     <Label htmlFor="socials.linkedin">LinkedIn</Label>
                     <Input id="socials.linkedin" name="socials.linkedin" type="url" value={formData.socials.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                 </div>
                 <div className={styles.formGroup}>
                     <Label htmlFor="socials.instagram">Instagram</Label>
                     <Input id="socials.instagram" name="socials.instagram" type="url" value={formData.socials.instagram} onChange={handleChange} placeholder="https://instagram.com/username" />
                 </div>
                 <div className={styles.formGroup}>
                     <Label htmlFor="socials.facebook">Facebook</Label>
                     <Input id="socials.facebook" name="socials.facebook" type="url" value={formData.socials.facebook} onChange={handleChange} placeholder="https://facebook.com/username" />
                 </div>
                 <div className={styles.formGroup}>
                     <Label htmlFor="socials.tiktok">TikTok</Label>
                     <Input id="socials.tiktok" name="socials.tiktok" type="url" value={formData.socials.tiktok} onChange={handleChange} placeholder="https://tiktok.com/@username" />
                 </div>
              </div>
          </SettingsSection>

          <SettingsSection title="Profile Visibility" description="Control who sees your profile.">
            <RadioGroup name="profileVisibility" selectedValue={formData.profileVisibility} onChange={handleChange}
              options={[{ value: 'public', label: 'Public' }, { value: 'connections-only', label: 'Connections Only' }]}/>
          </SettingsSection>
          
          <SettingsSection title="Verification Status" description="Get a verified badge on your profile.">
            {user.isVerified ? (
              <div className={styles.verifiedContainer}>
                <div className={styles.verifiedBadge}>
                  <CheckCircle size={20} />
                  <div>
                    <span style={{ display: 'block', fontWeight: '500' }}>Your account is verified.</span>
                    {user.isSubscriptionAutoRenew ? (
                        <span style={{ fontSize: '0.85rem', color: '#4caf50', marginTop: '4px', display: 'block' }}>
                            Renews on {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                        </span>
                    ) : user.subscriptionExpiresAt ? (
                        <span style={{ fontSize: '0.85rem', color: '#f44336', marginTop: '4px', display: 'block' }}>
                            Expires on {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                        </span>
                    ) : null}
                  </div>
                </div>
                {user.isSubscriptionAutoRenew && (
                    <Button variant="destructive" onClick={() => setCancelModalOpen(true)} disabled={paymentStatus === 'loading'}>
                    {paymentStatus === 'loading' ? 'Canceling...' : 'Cancel Subscription'}
                    </Button>
                )}
              </div>
            ) : (
              <div className={styles.verificationContent}>
                <p>Subscribe to get a verified badge and priority support.</p>
                <Button onClick={() => setSubModalOpen(true)}>Subscribe Now (R200/month)</Button>
              </div>
            )}
          </SettingsSection>
          
          <SettingsSection title="Email Notifications" description="Choose which emails you receive.">
            <RadioGroup name="notificationEmails" selectedValue={formData.notificationEmails} onChange={handleChange}
              options={[{ value: 'all', label: 'All notifications' }, { value: 'essential', label: 'Only essential updates' }, { value: 'none', label: 'None' }]}/>
          </SettingsSection>
          
          {/* New "Danger Zone" section for account deletion */}
          <SettingsSection 
            title="Danger Zone" 
            description="These actions are permanent and cannot be undone."
            isDangerZone={true}
          >
            <Button variant="destructive" onClick={() => setDeleteModalOpen(true)} disabled={authStatus === 'loading'}>
              {authStatus === 'loading' && isDeleteModalOpen ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </SettingsSection>
        </div>

        <footer className={styles.footer}>
          <Button onClick={handleSave} disabled={authStatus === 'loading'}>
            {authStatus === 'loading' ? 'Saving...' : 'Save Changes'}
          </Button>
        </footer>
      </div>
    </>
  );
};