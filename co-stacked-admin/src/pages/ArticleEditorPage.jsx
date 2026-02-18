// src/pages/ArticleEditorPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '../context/PageTitleContext';
import {
    createArticle,
    updateArticle,
    getAllArticles
} from '../api/articleService';
import {
    BookOpen,
    Plus,
    Trash2,
    Save,
    Eye,
    ArrowLeft,
    Type,
    List,
    Heading,
    AlertCircle,
    FileText,
    Link,
    ExternalLink,
    Download
} from 'lucide-react';
import styles from './ArticleEditorPage.module.css';

const CONTENT_TYPES = [
    { value: 'paragraph', label: 'Paragraph', icon: Type },
    { value: 'heading', label: 'Heading', icon: Heading },
    { value: 'list', label: 'List', icon: List },
    { value: 'callout', label: 'Callout', icon: AlertCircle },
];

const CALLOUT_VARIANTS = [
    { value: 'info', label: 'Info', color: '#3b82f6' },
    { value: 'warning', label: 'Warning', color: '#f59e0b' },
    { value: 'success', label: 'Success', color: '#10b981' },
];

const ICON_OPTIONS = [
    'book-open',
    'layers',
    'coins',
    'check-circle',
    'lightbulb',
    'rocket',
    'users',
    'target',
];

export const ArticleEditorPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { setTitle } = usePageTitle();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        description: '',
        category: '',
        icon: 'book-open',
        readTime: '5 min read',
        content: [],
        coverImage: '',
        coverImageFile: null,
        resources: [],
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [newResource, setNewResource] = useState({ type: 'link', title: '', description: '', url: '' });
    const [resourceFile, setResourceFile] = useState(null);

    useEffect(() => {
        setTitle(isEditMode ? 'Edit Article' : 'Create New Article');
        if (isEditMode) {
            fetchArticle();
        }
    }, [setTitle, isEditMode, id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const response = await getAllArticles();
            const article = response.data.find(a => a._id === id);
            if (article) {
                setFormData({
                    title: article.title,
                    slug: article.slug,
                    description: article.description,
                    category: article.category,
                    icon: article.icon || 'book-open',
                    readTime: article.readTime,
                    content: article.content || [],
                    coverImage: article.coverImage || '',
                    coverImageFile: null,
                    resources: article.resources || [],
                });
                if (article.coverImage) {
                    setImagePreview(article.coverImage);
                }
            }
        } catch (err) {
            console.error('Error fetching article:', err);
            alert('Failed to load article');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleTitleChange = (value) => {
        setFormData(prev => ({
            ...prev,
            title: value,
            slug: generateSlug(value),
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }

            setFormData(prev => ({
                ...prev,
                coverImageFile: file,
                coverImage: '', // Clear URL when file is selected
            }));

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUrlChange = (url) => {
        setFormData(prev => ({
            ...prev,
            coverImage: url,
            coverImageFile: null,
        }));
        setImagePreview(url);
    };

    const clearImage = () => {
        setFormData(prev => ({
            ...prev,
            coverImage: '',
            coverImageFile: null,
        }));
        setImagePreview(null);
    };

    // Resource management functions
    const handleAddResource = () => {
        if (!newResource.title) {
            alert('Please enter a resource title');
            return;
        }

        if (newResource.type === 'link' && !newResource.url) {
            alert('Please enter a URL for the link');
            return;
        }

        if (newResource.type === 'file' && !resourceFile) {
            alert('Please select a file to upload');
            return;
        }

        let resourceData = {
            type: newResource.type,
            title: newResource.title,
            description: newResource.description,
        };

        if (newResource.type === 'link') {
            resourceData.url = newResource.url;
        } else if (newResource.type === 'file' && resourceFile) {
            resourceData.fileName = resourceFile.name;
            resourceData.fileType = resourceFile.type;
            resourceData.fileSize = resourceFile.size;
            // We'll store the actual file separately and upload it
            resourceData._file = resourceFile; // Temporary property for upload
        }

        setFormData(prev => ({
            ...prev,
            resources: [...prev.resources, resourceData],
        }));

        // Reset form
        setNewResource({ type: 'link', title: '', description: '', url: '' });
        setResourceFile(null);
    };

    const handleRemoveResource = (index) => {
        setFormData(prev => ({
            ...prev,
            resources: prev.resources.filter((_, i) => i !== index),
        }));
    };

    const handleResourceFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size should be less than 10MB');
                return;
            }
            setResourceFile(file);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const addContentBlock = (type) => {
        const newBlock = {
            type,
            content: type === 'list' ? undefined : '',
            items: type === 'list' ? [''] : undefined,
            variant: type === 'callout' ? 'info' : undefined,
        };
        setFormData(prev => ({
            ...prev,
            content: [...prev.content, newBlock],
        }));
    };

    const updateContentBlock = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content.map((block, i) =>
                i === index ? { ...block, [field]: value } : block
            ),
        }));
    };

    const updateListItem = (blockIndex, itemIndex, value) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content.map((block, i) =>
                i === blockIndex
                    ? {
                        ...block,
                        items: block.items.map((item, j) => (j === itemIndex ? value : item)),
                    }
                    : block
            ),
        }));
    };

    const addListItem = (blockIndex) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content.map((block, i) =>
                i === blockIndex
                    ? { ...block, items: [...block.items, ''] }
                    : block
            ),
        }));
    };

    const removeListItem = (blockIndex, itemIndex) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content.map((block, i) =>
                i === blockIndex
                    ? { ...block, items: block.items.filter((_, j) => j !== itemIndex) }
                    : block
            ),
        }));
    };

    const removeContentBlock = (index) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content.filter((_, i) => i !== index),
        }));
    };

    const moveContentBlock = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= formData.content.length) return;

        setFormData(prev => {
            const newContent = [...prev.content];
            [newContent[index], newContent[newIndex]] = [newContent[newIndex], newContent[index]];
            return { ...prev, content: newContent };
        });
    };

    const handleSave = async (publish = false) => {
        // Validation
        if (!formData.title || !formData.description || !formData.category) {
            alert('Please fill in title, description, and category');
            return;
        }

        if (formData.content.length === 0) {
            alert('Please add at least one content block');
            return;
        }

        try {
            setSaving(true);
            // Prepare article data - use coverImageFile if present
            // Separate resource files from resource metadata
            const resourceFiles = [];
            const resourcesData = formData.resources.map(resource => {
                if (resource._file) {
                    resourceFiles.push(resource._file);
                    // Return resource without the _file property
                    const { _file, ...resourceWithoutFile } = resource;
                    return resourceWithoutFile;
                }
                return resource;
            });

            const articleData = {
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                category: formData.category,
                icon: formData.icon,
                readTime: formData.readTime,
                content: formData.content,
                resources: resourcesData,
                resourceFiles: resourceFiles,
                isPublished: publish,
                // Use File object if present, otherwise use URL string
                coverImage: formData.coverImageFile || formData.coverImage,
            };

            if (isEditMode) {
                await updateArticle(id, articleData);
            } else {
                await createArticle(articleData);
            }

            navigate('/articles');
        } catch (err) {
            console.error('Error saving article:', err);
            alert(err.message || 'Failed to save article');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading article...</div>;
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => navigate('/articles')}>
                    <ArrowLeft size={20} />
                    Back to Articles
                </button>
                <div className={styles.headerActions}>
                    <button
                        className={styles.saveButton}
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        <Save size={20} />
                        {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                        className={styles.publishButton}
                        onClick={() => handleSave(true)}
                        disabled={saving}
                    >
                        <Eye size={20} />
                        {isEditMode ? 'Update & Publish' : 'Publish'}
                    </button>
                </div>
            </div>

            {/* Editor Form */}
            <div className={styles.editorGrid}>
                {/* Main Content Column */}
                <div className={styles.mainColumn}>
                    {/* Basic Info */}
                    <div className={styles.section}>
                        <h2>Article Information</h2>

                        <div className={styles.formGroup}>
                            <label>Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Enter article title"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Slug *</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => handleInputChange('slug', e.target.value)}
                                placeholder="auto-generated-from-title"
                            />
                            <small>URL-friendly version of the title</small>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Brief summary of the article"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Content Blocks */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Content</h2>
                            <div className={styles.addBlockButtons}>
                                {CONTENT_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        className={styles.addBlockButton}
                                        onClick={() => addContentBlock(type.value)}
                                        title={`Add ${type.label}`}
                                    >
                                        <type.icon size={16} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.content.length === 0 ? (
                            <div className={styles.emptyContent}>
                                <BookOpen size={32} />
                                <p>No content blocks yet. Add a block to get started.</p>
                            </div>
                        ) : (
                            <div className={styles.contentBlocks}>
                                {formData.content.map((block, index) => (
                                    <div key={index} className={styles.contentBlock}>
                                        <div className={styles.blockHeader}>
                                            <span className={styles.blockType}>
                                                {CONTENT_TYPES.find(t => t.value === block.type)?.label}
                                            </span>
                                            <div className={styles.blockActions}>
                                                <button
                                                    onClick={() => moveContentBlock(index, 'up')}
                                                    disabled={index === 0}
                                                    title="Move up"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => moveContentBlock(index, 'down')}
                                                    disabled={index === formData.content.length - 1}
                                                    title="Move down"
                                                >
                                                    ↓
                                                </button>
                                                <button
                                                    onClick={() => removeContentBlock(index)}
                                                    className={styles.deleteBlock}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Paragraph */}
                                        {block.type === 'paragraph' && (
                                            <textarea
                                                value={block.content}
                                                onChange={(e) => updateContentBlock(index, 'content', e.target.value)}
                                                placeholder="Enter paragraph text"
                                                rows={4}
                                            />
                                        )}

                                        {/* Heading */}
                                        {block.type === 'heading' && (
                                            <input
                                                type="text"
                                                value={block.content}
                                                onChange={(e) => updateContentBlock(index, 'content', e.target.value)}
                                                placeholder="Enter heading text"
                                            />
                                        )}

                                        {/* List */}
                                        {block.type === 'list' && (
                                            <div className={styles.listEditor}>
                                                {block.items.map((item, itemIndex) => (
                                                    <div key={itemIndex} className={styles.listItem}>
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => updateListItem(index, itemIndex, e.target.value)}
                                                            placeholder="List item"
                                                        />
                                                        <button
                                                            onClick={() => removeListItem(index, itemIndex)}
                                                            className={styles.removeListItem}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    className={styles.addListItem}
                                                    onClick={() => addListItem(index)}
                                                >
                                                    <Plus size={14} />
                                                    Add Item
                                                </button>
                                            </div>
                                        )}

                                        {/* Callout */}
                                        {block.type === 'callout' && (
                                            <>
                                                <select
                                                    value={block.variant}
                                                    onChange={(e) => updateContentBlock(index, 'variant', e.target.value)}
                                                    className={styles.variantSelect}
                                                >
                                                    {CALLOUT_VARIANTS.map(v => (
                                                        <option key={v.value} value={v.value}>
                                                            {v.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <textarea
                                                    value={block.content}
                                                    onChange={(e) => updateContentBlock(index, 'content', e.target.value)}
                                                    placeholder="Enter callout text"
                                                    rows={3}
                                                />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resources Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>Resources</h2>
                            <span className={styles.sectionSubtitle}>Links, references, and downloadable files</span>
                        </div>

                        {/* Existing Resources List */}
                        {formData.resources.length > 0 && (
                            <div className={styles.resourcesList}>
                                {formData.resources.map((resource, index) => (
                                    <div key={index} className={styles.resourceItem}>
                                        <div className={styles.resourceIcon}>
                                            {resource.type === 'link' ? <Link size={18} /> : <FileText size={18} />}
                                        </div>
                                        <div className={styles.resourceInfo}>
                                            <p className={styles.resourceTitle}>{resource.title}</p>
                                            {resource.description && (
                                                <p className={styles.resourceDescription}>{resource.description}</p>
                                            )}
                                            {resource.type === 'file' && resource.fileSize && (
                                                <span className={styles.resourceMeta}>{formatFileSize(resource.fileSize)}</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveResource(index)}
                                            className={styles.removeResource}
                                            title="Remove resource"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Resource Form */}
                        <div className={styles.addResourceForm}>
                            <div className={styles.resourceTypeToggle}>
                                <button
                                    className={newResource.type === 'link' ? styles.active : ''}
                                    onClick={() => setNewResource(prev => ({ ...prev, type: 'link' }))}
                                >
                                    <Link size={16} />
                                    Link
                                </button>
                                <button
                                    className={newResource.type === 'file' ? styles.active : ''}
                                    onClick={() => setNewResource(prev => ({ ...prev, type: 'file' }))}
                                >
                                    <FileText size={16} />
                                    File
                                </button>
                            </div>

                            <input
                                type="text"
                                placeholder="Resource title *"
                                value={newResource.title}
                                onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                            />

                            <textarea
                                placeholder="Description (optional)"
                                value={newResource.description}
                                onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                                rows={2}
                            />

                            {newResource.type === 'link' ? (
                                <input
                                    type="url"
                                    placeholder="URL *"
                                    value={newResource.url}
                                    onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                                />
                            ) : (
                                <div className={styles.fileUploadWrapper}>
                                    <input
                                        type="file"
                                        id="resourceFile"
                                        onChange={handleResourceFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="resourceFile" className={styles.fileUploadLabel}>
                                        {resourceFile ? (
                                            <>
                                                <FileText size={16} />
                                                {resourceFile.name} ({formatFileSize(resourceFile.size)})
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} />
                                                Choose file to upload
                                            </>
                                        )}
                                    </label>
                                    <small>Max 10MB</small>
                                </div>
                            )}

                            <button
                                className={styles.addResourceButton}
                                onClick={handleAddResource}
                            >
                                <Plus size={16} />
                                Add Resource
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.section}>
                        <h3>Settings</h3>

                        <div className={styles.formGroup}>
                            <label>Category *</label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                placeholder="e.g., Fundamentals, Business"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Icon</label>
                            <select
                                value={formData.icon}
                                onChange={(e) => handleInputChange('icon', e.target.value)}
                            >
                                {ICON_OPTIONS.map(icon => (
                                    <option key={icon} value={icon}>{icon}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Read Time</label>
                            <input
                                type="text"
                                value={formData.readTime}
                                onChange={(e) => handleInputChange('readTime', e.target.value)}
                                placeholder="5 min read"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Cover Image</label>

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className={styles.imagePreview}>
                                    <img src={imagePreview} alt="Cover preview" />
                                    <button
                                        type="button"
                                        className={styles.removeImage}
                                        onClick={clearImage}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            {/* File Upload */}
                            <div className={styles.fileUpload}>
                                <input
                                    type="file"
                                    id="coverImageUpload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="coverImageUpload" className={styles.uploadButton}>
                                    <Plus size={16} />
                                    Upload Image
                                </label>
                                <small>Max 5MB (JPEG, PNG, WebP)</small>
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
