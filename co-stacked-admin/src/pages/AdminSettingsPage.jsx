// src/pages/AdminSettingsPage.jsx

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAdminSettings, updateAdminProfile, changeAdminPassword, clearSettingsState } from '../features/settings/adminSettingsSlice';
import { getAdminProfile } from '../features/auth/adminAuthSlice';
import styles from './AdminSettingsPage.module.css';

// Import icons
import { User, Lock, Settings as SettingsIcon, Save, Eye, EyeOff } from 'lucide-react';

const AdminSettingsPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { systemSettings, status, error, successMessage } = useSelector(state => state.settings);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    // Load admin profile and settings on mount
    dispatch(getAdminProfile());
    dispatch(getAdminSettings());
  }, [dispatch]);

  useEffect(() => {
    // Update profile form when user data loads
    if (user) {
      setProfileForm({
        name: user.name || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(updateAdminProfile(profileForm));

    if (updateAdminProfile.fulfilled.match(resultAction)) {
      // Clear success message after 3 seconds
      setTimeout(() => dispatch(clearSettingsState()), 3000);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    const resultAction = await dispatch(changeAdminPassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    }));

    if (changeAdminPassword.fulfilled.match(resultAction)) {
      // Clear form and success message after 3 seconds
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => dispatch(clearSettingsState()), 3000);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'system', label: 'System', icon: SettingsIcon },
  ];

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1>Admin Settings</h1>
        <p>Manage your account and system configuration</p>
      </div>

      <div className={styles.content}>
        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={styles.formSection}>
              <h2>Profile Information</h2>
              <form onSubmit={handleProfileSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className={styles.disabled}
                  />
                  <small className={styles.helpText}>Email cannot be changed from admin panel</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={status === 'loading'}
                >
                  <Save size={18} />
                  {status === 'loading' ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className={styles.formSection}>
              <h2>Change Password</h2>
              <form onSubmit={handlePasswordSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={status === 'loading'}
                >
                  <Save size={18} />
                  {status === 'loading' ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className={styles.systemSection}>
              <h2>System Configuration</h2>

              <div className={styles.configSection}>
                <h3>Email Configuration</h3>
                <div className={styles.configGrid}>
                  <div className={styles.configItem}>
                    <label>Email Service:</label>
                    <span className={systemSettings?.emailConfig?.hasApiKey ? styles.success : styles.error}>
                      {systemSettings?.emailConfig?.hasApiKey ? '✅ Configured' : '❌ Not Configured'}
                    </span>
                  </div>

                  <div className={styles.configItem}>
                    <label>From Email:</label>
                    <span>{systemSettings?.emailConfig?.fromEmail || 'Not set'}</span>
                  </div>

                  <div className={styles.configItem}>
                    <label>From Name:</label>
                    <span>{systemSettings?.emailConfig?.fromName || 'Not set'}</span>
                  </div>

                  <div className={styles.configItem}>
                    <label>Admin Frontend URL:</label>
                    <span>{systemSettings?.emailConfig?.adminFrontendUrl || 'Not set'}</span>
                  </div>

                  <div className={styles.configItem}>
                    <label>Frontend URL:</label>
                    <span>{systemSettings?.emailConfig?.frontendUrl || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.configSection}>
                <h3>System Information</h3>
                <div className={styles.configGrid}>
                  <div className={styles.configItem}>
                    <label>Node Version:</label>
                    <span>{systemSettings?.systemInfo?.nodeVersion || 'Unknown'}</span>
                  </div>

                  <div className={styles.configItem}>
                    <label>Environment:</label>
                    <span className={systemSettings?.systemInfo?.environment === 'production' ? styles.success : styles.warning}>
                      {systemSettings?.systemInfo?.environment || 'development'}
                    </span>
                  </div>

                  <div className={styles.configItem}>
                    <label>Admin Secret Key:</label>
                    <span className={systemSettings?.systemInfo?.hasAdminSecret ? styles.success : styles.error}>
                      {systemSettings?.systemInfo?.hasAdminSecret ? '✅ Set' : '❌ Not Set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {successMessage && (
        <div className={styles.successMessage}>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export { AdminSettingsPage };