// src/pages/CreateIdeaPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createStackPost } from '../api/stackSuiteApi';
import { Rocket, Info, AlertCircle, Loader2, Target, Lightbulb, BarChart3, Tag } from 'lucide-react';

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
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    <Rocket size={14} />
                    New Validation
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Validate Your Idea</h1>
                <p className="text-lg text-slate-500">Share your vision with the community and get the feedback you need to build with confidence.</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Core Concept */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                        <Lightbulb className="text-blue-600" size={20} />
                        <h2 className="text-xl font-bold">Core Concept</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Idea Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="e.g. AI-driven financial planning for creators"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pitch / Description</label>
                            <textarea
                                name="body"
                                value={formData.body}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 min-h-[160px]"
                                placeholder="Describe the problem you're solving and how your solution works..."
                                required
                            />
                            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                <Info size={12} />
                                Markdown is supported.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 2: Validation Status */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                        <Target className="text-blue-600" size={20} />
                        <h2 className="text-xl font-bold">Validation Status</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Current Phase</label>
                            <div className="flex flex-col gap-3">
                                {[
                                    { id: 'Problem', label: 'Problem Validation', desc: 'Confirming if the pain point is real.' },
                                    { id: 'Solution', label: 'Solution Validation', desc: 'Testing if the idea solves the problem.' },
                                    { id: 'MVP', label: 'MVP Phase', desc: 'Gathering early user feedback on product.' }
                                ].map((phase) => (
                                    <label key={phase.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.phase === phase.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}>
                                        <input
                                            type="radio"
                                            name="phase"
                                            value={phase.id}
                                            checked={formData.phase === phase.id}
                                            onChange={handleChange}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{phase.label}</p>
                                            <p className="text-[11px] text-slate-500">{phase.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col justify-center">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <BarChart3 size={16} />
                                    Confidence Score
                                </label>
                                <span className="text-xl font-black text-blue-600">{formData.confidenceScore}%</span>
                            </div>
                            <input
                                type="range"
                                name="confidenceScore"
                                min="0" max="100"
                                value={formData.confidenceScore}
                                onChange={handleChange}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-4"
                            />
                            <p className="text-xs text-slate-400">How much external validation have you received so far?</p>
                        </div>
                    </div>
                </div>

                {/* Section 3: Classification */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                        <Tag className="text-blue-600" size={20} />
                        <h2 className="text-xl font-bold">Classification</h2>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tags (Comma Separated)</label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            placeholder="e.g. SaaS, Fintech, Creator Economy"
                        />
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-between">
                    <button 
                        type="button" 
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-blue-500/25 flex items-center gap-3 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Rocket size={20} />}
                        {loading ? 'Publishing...' : 'Publish to Validation Board'}
                    </button>
                </div>
            </form>
        </div>
    );
};
