// src/api/savedItemsApi.js

import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/saved-items`;

export const getSavedItems = async (token, { type = 'all', search = '' } = {}) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    params: { type, search },
  };
  const response = await axios.get(API_URL, config);
  return response.data;
};

export const saveItem = async (token, { itemType, itemId }) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const response = await axios.post(API_URL, { itemType, itemId }, config);
  return response.data;
};

export const unsaveItem = async (token, savedItemId) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const response = await axios.delete(`${API_URL}/${savedItemId}`, config);
  return response.data;
};

export const unsaveItemByType = async (token, { itemType, itemId }) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    data: { itemType, itemId },
  };
  const response = await axios.delete(`${API_URL}/by-type`, config);
  return response.data;
};

export const checkSaved = async (token, itemType, itemId) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const response = await axios.get(`${API_URL}/check/${itemType}/${itemId}`, config);
  return response.data;
};