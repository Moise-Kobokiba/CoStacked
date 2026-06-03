// src/api/axios.js

import axios from 'axios';
// We don't import the store here to keep this file simple and avoid circular dependencies.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const API = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor
API.interceptors.request.use(
  (config) => {
    let token = null;
    const TOKEN_NAME = 'costacked-admin-token'; // Must match the key used in adminAuthSlice

    try {
      const authDataString = localStorage.getItem(TOKEN_NAME);
      if (authDataString) {
        // The slice saves the whole object { user, token }, so we parse it.
        const authData = JSON.parse(authDataString);
        token = authData.token;
      }
    } catch (e) {
      console.error("Could not parse auth data from localStorage in admin axios.", e);
    }

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;