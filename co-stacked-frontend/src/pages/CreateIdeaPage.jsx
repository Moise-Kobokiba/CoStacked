// src/pages/CreateIdeaPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createStackPost } from '../api/stackSuiteApi';
import { Rocket, Info, AlertCircle, Loader2, Target, Lightbulb, BarChart3, Tag } from 'lucide-react';
import styles from './ValidationBoard.module.css';

export const CreateIdeaPage = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        body: '',
        phase: 'Problem',
        confidenceScore: 50,
        tags: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'confidenceScore' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                title: formData.title,
                body: formData.body,
                category: 'Validation',
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                phase: formData.phase,
                confidenceScore: formData.confidenceScore,
            };
            await createStackPost(payload);
            navigate('/validation-board');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to publish idea');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container} style={{ maxWidth: '44rem' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '4px 12px', background: 'rgba(79, 70, 229, 0.05)', color: 'var(--primary)', borderRadius: '99px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                    <Rocket size={14} />
                    New Validation
                </div>
                <h1 className={styles.title}>Validate Your Idea</h1>
                <p className={styles.subtitle}>Share your vision with the community and get the feedback you need to build with confidence.</p>
            </div>

            {error && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '14px', fontWeight: '500' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Section 1: Core Concept */}
                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <Lightbulb style={{ color: 'var(--primary)' }} size={20} />
                        <h2 className={styles.sectionTitle}>Core Concept</h2>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label className={styles.formLabel}>Idea Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className={styles.formInput}
                                placeholder="e.g. AI-driven financial planning for creators"
                                required
                            />
                        </div>

                        <div>
                            <label className={styles.formLabel}>Pitch / Description</label>
                            <textarea
                                name="body"
                                value={formData.body}
                                onChange={handleChange}
                                className={styles.formInput}
                                style={{ minHeight: '160px', resize: 'vertical' }}
                                placeholder="Describe the problem you're solving and how your solution works..."
                                required
                            />
                            <p style={{ marginTop: '0.5rem', fontSize: '11px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Info size={12} />
                                Markdown is supported.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Validation Status */}
                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <Target style={{ color: 'var(--primary)' }} size={20} />
                        <h2 className={styles.sectionTitle}>Validation Status</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                        <div>
                            <label className={styles.formLabel} style={{ marginBottom: '1rem' }}>Current Phase</label>
                            <div className={styles.phaseGrid}>
                                {[
                                    { id: 'Problem', label: 'Problem Validation', desc: 'Confirming if the pain point is real.' },
                                    { id: 'Solution', label: 'Solution Validation', desc: 'Testing if the idea solves the problem.' },
                                    { id: 'MVP', label: 'MVP Phase', desc: 'Gathering early user feedback on product.' }
                                ].map((phase) => (
                                    <label key={phase.id} className={`${styles.phaseOption} ${formData.phase === phase.id ? styles.phaseOptionActive : ''}`}>
                                        <input
                                            type="radio"
                                            name="phase"
                                            value={phase.id}
                                            checked={formData.phase === phase.id}
                                            onChange={handleChange}
                                            style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                                        />
                                        <div>
                                            <p style={{ fontSize: '13px', fontBold: '700', color: 'var(--foreground)' }}>{phase.label}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{phase.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div className={styles.confidenceHeader}>
                                <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                                    <BarChart3 size={16} />
                                    Confidence Score
                                </label>
                                <span className={styles.confidenceValue}>{formData.confidenceScore}%</span>
                            </div>
                            <input
                                type="range"
                                name="confidenceScore"
                                min="0" max="100"
                                value={formData.confidenceScore}
                                onChange={handleChange}
                                className={styles.slider}
                            />
                            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '1rem' }}>How much external validation have you received so far?</p>
                        </div>
                    </div>
                </div>

                {/* Section 3: Classification */}
                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <Tag style={{ color: 'var(--primary)' }} size={20} />
                        <h2 className={styles.sectionTitle}>Classification</h2>
                    </div>

                    <div>
                        <label className={styles.formLabel}>Tags (Comma Separated)</label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className={styles.formInput}
                            placeholder="e.g. SaaS, Fintech, Creator Economy"
                        />
                    </div>
                </div>

                <div style={{ padding: '1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button 
                        type="button" 
                        onClick={() => navigate(-1)}
                        style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: '700', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={styles.createBtn}
                        style={{ padding: '1rem 2.5rem', borderRadius: '1rem' }}
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Rocket size={20} />}
                        {loading ? 'Publishing...' : 'Publish to Board'}
                    </button>
                </div>
            </form>
        </div>
    );
};
