// src/api/articleService.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
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
    const response = await axios.post(
      `${API_URL}/api/articles`,
      articleData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update article
export const updateArticle = async (id, articleData) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/articles/${id}`,
      articleData,
      getAuthHeaders()
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
