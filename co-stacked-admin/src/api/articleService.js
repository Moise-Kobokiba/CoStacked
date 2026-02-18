// src/api/articleService.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const TOKEN_NAME = 'costacked-admin-token';

// Helper function to get auth headers
const getAuthHeaders = (isFormData = false) => {
  try {
    const serializedAuth = localStorage.getItem(TOKEN_NAME);
    if (!serializedAuth) {
      return {
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      };
    }
    const { token } = JSON.parse(serializedAuth);
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      },
    };
  } catch (e) {
    console.error('Error getting auth token:', e);
    return {
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    };
  }
};

// Helper function to create FormData from article data
const createArticleFormData = (articleData) => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', articleData.title);
  formData.append('slug', articleData.slug);
  formData.append('description', articleData.description);
  formData.append('category', articleData.category);
  formData.append('icon', articleData.icon || 'book-open');
  formData.append('readTime', articleData.readTime || '5 min read');
  formData.append('isPublished', articleData.isPublished || false);
  formData.append('content', JSON.stringify(articleData.content));
  
  // Add resources if they exist
  if (articleData.resources && articleData.resources.length > 0) {
    formData.append('resources', JSON.stringify(articleData.resources));
  }
  
  // Add cover image if it's a File object
  if (articleData.coverImage instanceof File) {
    formData.append('coverImage', articleData.coverImage);
  } else if (articleData.coverImage && typeof articleData.coverImage === 'string') {
    // If it's a URL string, send it as a regular field
    formData.append('coverImage', articleData.coverImage);
  }
  
  // Add resource files
  if (articleData.resourceFiles && articleData.resourceFiles.length > 0) {
    articleData.resourceFiles.forEach((file, index) => {
      if (file instanceof File) {
        formData.append(`resourceFile_${index}`, file);
      }
    });
  }
  
  return formData;
};

// Get all articles (admin - includes drafts)
export const getAllArticles = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/articles/admin/all`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get published articles (public)
export const getPublishedArticles = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/articles`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get article by slug
export const getArticleBySlug = async (slug) => {
  try {
    const response = await axios.get(`${API_URL}/api/articles/${slug}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create article
export const createArticle = async (articleData) => {
  try {
    // Check if we need to send as FormData (if there's a File object)
    const hasFile = articleData.coverImage instanceof File || 
                    (articleData.resourceFiles && articleData.resourceFiles.some(f => f instanceof File));
    
    let data = articleData;
    let headers = getAuthHeaders(false);
    
    if (hasFile) {
      data = createArticleFormData(articleData);
      headers = getAuthHeaders(true);
    } else {
      // If no files, still stringify resources if they exist
      if (articleData.resources) {
        data = {
          ...articleData,
          resources: JSON.stringify(articleData.resources)
        };
      }
    }
    
    const response = await axios.post(
      `${API_URL}/api/articles`,
      data,
      headers
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update article
export const updateArticle = async (id, articleData) => {
  try {
    // Check if we need to send as FormData (if there's a File object)
    const hasFile = articleData.coverImage instanceof File || 
                    (articleData.resourceFiles && articleData.resourceFiles.some(f => f instanceof File));
    
    let data = articleData;
    let headers = getAuthHeaders(false);
    
    if (hasFile) {
      data = createArticleFormData(articleData);
      headers = getAuthHeaders(true);
    } else {
      // If no files, still stringify resources if they exist
      if (articleData.resources) {
        data = {
          ...articleData,
          resources: JSON.stringify(articleData.resources)
        };
      }
    }
    
    const response = await axios.put(
      `${API_URL}/api/articles/${id}`,
      data,
      headers
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete article
export const deleteArticle = async (id) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/articles/${id}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Toggle publish status
export const togglePublishStatus = async (id) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/articles/${id}/publish`,
      {},
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
