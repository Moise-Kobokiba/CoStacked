// src/components/profile/ProfileEditor.jsx

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../features/auth/authSlice';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Label } from '../shared/Label';
import { Textarea } from '../shared/Textarea';
import { 
    Loader2, Twitter, Linkedin, Instagram, Facebook, Github, 
    Plus, Trash2, Rocket, Laptop, GraduationCap, Briefcase
} from 'lucide-react';
import styles from './ProfileEditor.module.css';
import PropTypes from 'prop-types';

export const ProfileEditor = ({ user, onSave, onCancel }) => {
    const dispatch = useDispatch();
    const { status, error } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: '',
        headline: '',
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
            github: '',
        },
        experience: [],
        education: []
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                headline: user.headline || '',
                bio: user.bio || '',
                skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
                location: user.location || '',
                availability: user.availability || '',
                portfolioLink: user.portfolioLink || '',
                socials: {
                    twitter: user.socials?.twitter || '',
                    linkedin: user.socials?.linkedin || '',
                    instagram: user.socials?.instagram || '',
                    facebook: user.socials?.facebook || '',
                    github: user.socials?.github || '',
                },
                experience: Array.isArray(user.experience) ? user.experience : [],
                education: Array.isArray(user.education) ? user.education : []
            });
        }
    }, [user]);

    const handleChange = e => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSocialsChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            socials: { ...prev.socials, [name]: value },
        }));
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

                <div className={styles.formGrid}>
                    <div className={styles.formGroupSpan2}>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className={styles.formGroupSpan2}>
                        <Label htmlFor="headline">Headline / Professional Title</Label>
                        <Input id="headline" name="headline" value={formData.headline} onChange={handleChange} placeholder="e.g., Senior Full-Stack Developer" />
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
                        <Label htmlFor="portfolioLink">Portfolio Link</Label>
                        <Input id="portfolioLink" name="portfolioLink" value={formData.portfolioLink} onChange={handleChange} />
                    </div>
                </div>

                <div className={styles.separator} />

                {/* Profile Links */}
                <h3 className={styles.subtitle}>Profile Links</h3>
                <div className={styles.socialsGrid}>
                    <div className={styles.socialInputGroup}>
                        <Linkedin size={20} className={styles.socialIcon} />
                        <Input name="linkedin" value={formData.socials.linkedin || ''} onChange={handleSocialsChange} placeholder="LinkedIn Profile" />
                    </div>
                    <div className={styles.socialInputGroup}>
                        <Github size={20} className={styles.socialIcon} />
                        <Input name="github" value={formData.socials.github || ''} onChange={handleSocialsChange} placeholder="GitHub Profile" />
                    </div>
                    <div className={styles.socialInputGroup}>
                        <Twitter size={20} className={styles.socialIcon} />
                        <Input name="twitter" value={formData.socials.twitter || ''} onChange={handleSocialsChange} placeholder="Twitter (X)" />
                    </div>
                </div>

                <div className={styles.separator} />

                {/* Experience Section */}
                <div className={styles.sectionHeader}>
                    <h3 className={styles.subtitle}>Professional Experience</h3>
                    <Button type="button" variant="secondary" size="sm" onClick={addExperience}>
                        <Plus size={16} /> Add Position
                    </Button>
                </div>
                
                <div className={styles.dynamicList}>
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
                                    <Input value={exp.title} onChange={e => handleExperienceChange(idx, 'title', e.target.value)} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <Label>Company</Label>
                                    <Input value={exp.company} onChange={e => handleExperienceChange(idx, 'company', e.target.value)} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <Label>Type</Label>
                                    <Input value={exp.employmentType} onChange={e => handleExperienceChange(idx, 'employmentType', e.target.value)} placeholder="Full-time / Remote" />
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
                                <div className={styles.formGroupSpan2}>
                                    <Label>Job Description</Label>
                                    <Textarea value={exp.description} onChange={e => handleExperienceChange(idx, 'description', e.target.value)} rows={3} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.separator} />

                {/* Education Section */}
                <div className={styles.sectionHeader}>
                    <h3 className={styles.subtitle}>Education</h3>
                    <Button type="button" variant="secondary" size="sm" onClick={addEducation}>
                        <Plus size={16} /> Add School
                    </Button>
                </div>

                <div className={styles.dynamicList}>
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
                                    <Input value={edu.degree} onChange={e => handleEducationChange(idx, 'degree', e.target.value)} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <Label>School / University</Label>
                                    <Input value={edu.school} onChange={e => handleEducationChange(idx, 'school', e.target.value)} required />
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