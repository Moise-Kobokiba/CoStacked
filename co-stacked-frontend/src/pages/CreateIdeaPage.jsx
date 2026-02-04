import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createIdea } from '../api/ideasApi';
import styles from './CreateIdeaPage.module.css';

export const CreateIdeaPage = () => {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        industry: '',
        problemStatement: '',
        targetAudience: '',
        valueProposition: '',
        monetizationModel: '',
        risks: '',
        assumptions: '',
        visibility: 'public',
    });

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createIdea(formData, token);
            navigate('/validation-board');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create idea');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Validate Your Idea</h1>
                <p>Fill out the canvas below to test your assumptions and gather feedback.</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h2>Core Concept</h2>
                    <div className={styles.formGroup}>
                        <label>Idea Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Uber for Dog Walking"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Industry</label>
                        <select name="industry" value={formData.industry} onChange={handleChange} required>
                            <option value="">Select Industry</option>
                            <option value="Tech">Technology</option>
                            <option value="Finance">Finance</option>
                            <option value="Health">Health</option>
                            <option value="Education">Education</option>
                            <option value="Retail">Retail</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>The Problem & Solution</h2>
                    <div className={styles.formGroup}>
                        <label>Problem Statement</label>
                        <textarea
                            name="problemStatement"
                            value={formData.problemStatement}
                            onChange={handleChange}
                            placeholder="What pain point are you solving?"
                            required
                            rows={4}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Target Audience</label>
                        <textarea
                            name="targetAudience"
                            value={formData.targetAudience}
                            onChange={handleChange}
                            placeholder="Who experiences this problem?"
                            required
                            rows={3}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Value Proposition</label>
                        <textarea
                            name="valueProposition"
                            value={formData.valueProposition}
                            onChange={handleChange}
                            placeholder="Why is your solution better?"
                            required
                            rows={4}
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>Business Viability</h2>
                    <div className={styles.formGroup}>
                        <label>Monetization Model</label>
                        <textarea
                            name="monetizationModel"
                            value={formData.monetizationModel}
                            onChange={handleChange}
                            placeholder="How will you make money?"
                            rows={3}
                        />
                    </div>
                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Key Risks</label>
                            <textarea
                                name="risks"
                                value={formData.risks}
                                onChange={handleChange}
                                placeholder="What could go wrong?"
                                rows={3}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Core Assumptions</label>
                            <textarea
                                name="assumptions"
                                value={formData.assumptions}
                                onChange={handleChange}
                                placeholder="What must be true for this to work?"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>Visibility</h2>
                    <div className={styles.radioGroup}>
                        <label>
                            <input
                                type="radio"
                                name="visibility"
                                value="public"
                                checked={formData.visibility === 'public'}
                                onChange={handleChange}
                            />
                            Public (Visible to everyone)
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="visibility"
                                value="private"
                                checked={formData.visibility === 'private'}
                                onChange={handleChange}
                            />
                            Private (Connections & Founders only - Coming Soon)
                        </label>
                    </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Publishing...' : 'Publish to Validation Board'}
                </button>
            </form>
        </div>
    );
};
