// src/components/profile/ProfileEditor.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../features/auth/authSlice';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Label } from '../shared/Label';
import { Textarea } from '../shared/Textarea';
import { Loader2, Twitter, Linkedin, Instagram, Facebook } from 'lucide-react';
import styles from './ProfileEditor.module.css';
import PropTypes from 'prop-types';

export const ProfileEditor = ({ user, onSave, onCancel }) => {
    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.auth);

    // 1. EXPAND state to include the 'socials' object
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
            tiktok: '', // Even if no icon, we manage the data
        },
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
                location: user.location || '',
                availability: user.availability || '',
                portfolioLink: user.portfolioLink || '',
                // Populate the socials object, providing fallbacks for undefined values
                socials: {
                    twitter: user.socials?.twitter || '',
                    linkedin: user.socials?.linkedin || '',
                    instagram: user.socials?.instagram || '',
                    facebook: user.socials?.facebook || '',
                    tiktok: user.socials?.tiktok || '',
                },
            });
        }
    }, [user]);

    const handleChange = e => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // 2. ADD a dedicated handler for the nested 'socials' state
    const handleSocialsChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            socials: {
                ...prev.socials,
                [name]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultAction = await dispatch(updateUserProfile(formData));
        if (updateUserProfile.fulfilled.match(resultAction)) {
            onSave();
        } else {
            alert('Failed to update profile. Please check for errors.');
        }
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h2 className={styles.title}>Edit Your Profile</h2>

                {/* --- Standard Profile Fields --- */}
                <div className={styles.formGrid}>
                    <div className={styles.formGroupSpan2}>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className={styles.formGroupSpan2}>
                        <Label htmlFor="bio">Bio / About Me</Label>
                        <Textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={4} />
                    </div>
                    <div className={styles.formGroupSpan2}>
                        <Label htmlFor="skills">Skills (comma-separated)</Label>
                        <Input id="skills" name="skills" value={formData.skills} onChange={handleChange} />
                    </div>
                    <div className={styles.formGroup}>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Cape Town, WC" />
                    </div>
                    <div className={styles.formGroup}>
                        <Label htmlFor="availability">Availability</Label>
                        <Input id="availability" name="availability" value={formData.availability} onChange={handleChange} placeholder="e.g., 20 hours/week" />
                    </div>
                    <div className={styles.formGroupSpan2}>
                        <Label htmlFor="portfolioLink">Portfolio/GitHub Link</Label>
                        <Input id="portfolioLink" name="portfolioLink" value={formData.portfolioLink} onChange={handleChange} />
                    </div>
                </div>

                <div className={styles.separator} />

                {/* --- 3. ADD the Social Media Links Section --- */}
                <h3 className={styles.subtitle}>Social Links (Usernames only)</h3>
                <div className={styles.socialsGrid}>
                    <div className={styles.socialInputGroup}>
                        <Linkedin size={20} className={styles.socialIcon} />
                        <Input name="linkedin" value={formData.socials.linkedin} onChange={handleSocialsChange} placeholder="linkedin-username" />
                    </div>
                    <div className={styles.socialInputGroup}>
                        <Twitter size={20} className={styles.socialIcon} />
                        <Input name="twitter" value={formData.socials.twitter} onChange={handleSocialsChange} placeholder="twitter-handle" />
                    </div>
                    <div className={styles.socialInputGroup}>
                        <Instagram size={20} className={styles.socialIcon} />
                        <Input name="instagram" value={formData.socials.instagram} onChange={handleSocialsChange} placeholder="instagram-username" />
                    </div>
                    <div className={styles.socialInputGroup}>
                        <Facebook size={20} className={styles.socialIcon} />
                        <Input name="facebook" value={formData.socials.facebook} onChange={handleSocialsChange} placeholder="facebook-username" />
                    </div>
                </div>

                {status === 'failed' && error && <p className={styles.error}>{error}</p>}

                <div className={styles.footer}>
                    <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button type="submit" disabled={status === 'loading'}>
                        {status === 'loading' ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

ProfileEditor.propTypes = {
    user: PropTypes.object.isRequired,
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};