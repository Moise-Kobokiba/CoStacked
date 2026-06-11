// src/api/usersApi.js
import API from './axios';

// Endorse a user (toggle)
export const endorseUser = async (userId) => {
  const response = await API.post(`/users/${userId}/endorse`);
  return response.data;
};