// src/api/articlesApi.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Fetch all published articles
 */
export const getPublishedArticles = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/articles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error.response?.data || error;
  }
};

/**
 * Fetch a single article by slug
 */
export const getArticleBySlug = async (slug) => {
  try {
    const response = await axios.get(`${API_URL}/api/articles/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching article with slug "${slug}":`, error);
    throw error.response?.data || error;
  }
};
/**
 * Increment article view count
 */
export const trackArticleView = async (slug) => {
  try {
    const response = await axios.post(`${API_URL}/api/articles/${slug}/view`);
    return response.data;
  } catch (error) {
    console.error(`Error tracking view for article "${slug}":`, error);
    throw error.response?.data || error;
  }
};
