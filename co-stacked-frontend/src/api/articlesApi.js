// src/api/articlesApi.js

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Fetch all published articles
 */
export const getPublishedArticles = async () => {
  try {
    const response = await axios.get(`${API_URL}/articles`);
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
    const response = await axios.get(`${API_URL}/articles/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching article with slug "${slug}":`, error);
    throw error.response?.data || error;
  }
};
