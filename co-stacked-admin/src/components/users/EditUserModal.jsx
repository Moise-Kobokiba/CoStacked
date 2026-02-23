// src/components/users/EditUserModal.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../features/users/userManagementSlice';

import { Dialog } from '../shared/Dialog';
import { Button } from '../ui/Button';
import styles from './EditUserModal.module.css';
import PropTypes from 'prop-types';
import { User, FileText, Link as LinkIcon, Share2, Settings, Shield, X, Plus } from 'lucide-react';

const TABS = [
    { id: 'basic', label: 'Basic', icon: User },
    { id: 'profile', label: 'Profile', icon: FileText },
    { id: 'links', label: 'Links', icon: LinkIcon },
    { id: 'socials', label: 'Socials', icon: Share2 },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'admin', label: 'Admin', icon: Shield },
];

const AVAILABILITY_OPTIONS = [
    'Available',
    'Partially Available',
    'Not Available',
    'Open to Offers',
];

const VISIBILITY_OPTIONS = ['public', 'connections-only'];
const NOTIFICATION_OPTIONS = ['all', 'essential', 'none'];

const initialFormData = {
    name: '',
    role: 'developer',
    isAdmin: false,
    bio: '',
    skills: [],
    availability: '',
    location: '',
    portfolioLink: '',
    avatarUrl: '',
    phoneNumber: '',
    socials: {
        twitter: '',
        linkedin: '',
        instagram: '',
        facebook: '',
        tiktok: '',
    },
    profileVisibility: 'public',
    notificationEmails: 'essential',
    isVerified: false,
    isBoosted: false,
    boostExpiresAt: '',
    isEmailVerified: false,
};

export const EditUserModal = ({ user, open, onClose }) => {
    const dispatch = useDispatch();
    const { status } = useSelector(state => state.userManagement);

    const [activeTab, setActiveTab] = useState('basic');
    const [formData, setFormData] = useState(initialFormData);
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                role: user.role || 'developer',
                isAdmin: user.isAdmin || false,
                bio: user.bio || '',
                skills: user.skills || [],
                availability: user.availability || '',
                location: user.location || '',
                portfolioLink: user.portfolioLink || '',
                avatarUrl: user.avatarUrl || '',
                phoneNumber: user.phoneNumber || '',
                socials: {
                    twitter: user.socials?.twitter || '',
                    linkedin: user.socials?.linkedin || '',
                    instagram: user.socials?.instagram || '',
                    facebook: user.socials?.facebook || '',
                    tiktok: user.socials?.tiktok || '',
                },
                profileVisibility: user.profileVisibility || 'public',
                notificationEmails: user.notificationEmails || 'essential',
                isVerified: user.isVerified || false,
                isBoosted: user.isBoosted || false,
                boostExpiresAt: user.boostExpiresAt ? user.boostExpiresAt.split('T')[0] : '',
                isEmailVerified: user.isEmailVerified || false,
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSocialChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [platform]: value,
            },
        }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()],
            }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove),
        }));
    };

    const handleSkillKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleSubmit = () => {
        const submitData = {
            ...formData,
            boostExpiresAt: formData.boostExpiresAt ? new Date(formData.boostExpiresAt).toISOString() : null,
        };
        dispatch(updateUser({ userId: user._id, userData: submitData }));
        onClose();
    };

    if (!open || !user) {
        return null;
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.formGroup}>
                            <label>Full Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email (read-only)</label>
                            <input
                                value={user.email}
                                className={styles.input}
                                disabled
                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>User Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} className={styles.input}>
                                <option value="developer">Developer</option>
                                <option value="founder">Founder</option>
                            </select>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input
                                name="isAdmin"
                                type="checkbox"
                                checked={formData.isAdmin}
                                onChange={handleChange}
                                id="isAdminCheck"
                            />
                            <label htmlFor="isAdminCheck">Administrator</label>
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.formGroup}>
                            <label>Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                className={styles.input}
                                rows={4}
                                placeholder="User's bio..."
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Skills</label>
                            <div className={styles.skillsInput}>
                                <input
                                    value={newSkill}
                                    onChange={(e) => setNewSkill(e.target.value)}
                                    onKeyDown={handleSkillKeyDown}
                                    className={styles.input}
                                    placeholder="Add a skill..."
                                />
                                <button type="button" onClick={handleAddSkill} className={styles.addSkillBtn}>
                                    <Plus size={16} />
                                </button>
                            </div>
                            <div className={styles.skillsList}>
                                {formData.skills.map((skill, index) => (
                                    <span key={index} className={styles.skillTag}>
                                        {skill}
                                        <button type="button" onClick={() => handleRemoveSkill(skill)}>
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Availability</label>
                            <select
                                name="availability"
                                value={formData.availability}
                                onChange={handleChange}
                                className={styles.input}
                            >
                                <option value="">Select availability</option>
                                {AVAILABILITY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Location</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="City, Country"
                            />
                        </div>
                    </div>
                );

            case 'links':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.formGroup}>
                            <label>Avatar URL</label>
                            <input
                                name="avatarUrl"
                                value={formData.avatarUrl}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="https://example.com/avatar.jpg"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Portfolio Link</label>
                            <input
                                name="portfolioLink"
                                value={formData.portfolioLink}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="https://portfolio.example.com"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Phone Number</label>
                            <input
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                    </div>
                );

            case 'socials':
                return (
                    <div className={styles.tabContent}>
                        {[
                            { key: 'twitter', label: 'Twitter' },
                            { key: 'linkedin', label: 'LinkedIn' },
                            { key: 'instagram', label: 'Instagram' },
                            { key: 'facebook', label: 'Facebook' },
                            { key: 'tiktok', label: 'TikTok' },
                        ].map(({ key, label }) => (
                            <div key={key} className={styles.formGroup}>
                                <label>{label}</label>
                                <input
                                    value={formData.socials[key]}
                                    onChange={(e) => handleSocialChange(key, e.target.value)}
                                    className={styles.input}
                                    placeholder={`${label} URL or username`}
                                />
                            </div>
                        ))}
                    </div>
                );

            case 'settings':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.formGroup}>
                            <label>Profile Visibility</label>
                            <select
                                name="profileVisibility"
                                value={formData.profileVisibility}
                                onChange={handleChange}
                                className={styles.input}
                            >
                                {VISIBILITY_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Notification Emails</label>
                            <select
                                name="notificationEmails"
                                value={formData.notificationEmails}
                                onChange={handleChange}
                                className={styles.input}
                            >
                                {NOTIFICATION_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            case 'admin':
                return (
                    <div className={styles.tabContent}>
                        <div className={styles.checkboxGroup}>
                            <input
                                name="isVerified"
                                type="checkbox"
                                checked={formData.isVerified}
                                onChange={handleChange}
                                id="isVerifiedCheck"
                            />
                            <label htmlFor="isVerifiedCheck">Verified User</label>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input
                                name="isEmailVerified"
                                type="checkbox"
                                checked={formData.isEmailVerified}
                                onChange={handleChange}
                                id="isEmailVerifiedCheck"
                            />
                            <label htmlFor="isEmailVerifiedCheck">Email Verified</label>
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input
                                name="isBoosted"
                                type="checkbox"
                                checked={formData.isBoosted}
                                onChange={handleChange}
                                id="isBoostedCheck"
                            />
                            <label htmlFor="isBoostedCheck">Boosted User</label>
                        </div>
                        {formData.isBoosted && (
                            <div className={styles.formGroup}>
                                <label>Boost Expires At</label>
                                <input
                                    type="date"
                                    name="boostExpiresAt"
                                    value={formData.boostExpiresAt}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <h2 className={styles.title}>Edit User: {user.name}</h2>

            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {renderTabContent()}

            <footer className={styles.footer}>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={status === 'loading'}>
                    {status === 'loading' ? 'Saving...' : 'Save Changes'}
                </Button>
            </footer>
        </Dialog>
    );
};

EditUserModal.propTypes = {
    user: PropTypes.object,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};
