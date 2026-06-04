import axios from 'axios';

export const getValidationTips = async () => {
  const response = await axios.get('/api/validation-tips');
  return response.data;
};

export const createValidationTip = async (tip, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const res = await axios.post('/api/validation-tips', tip, config);
  return res.data;
};

export const updateValidationTip = async (id, tip, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const res = await axios.put(`/api/validation-tips/${id}`, tip, config);
  return res.data;
};

export const deleteValidationTip = async (id, token) => {
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const res = await axios.delete(`/api/validation-tips/${id}`, config);
  return res.data;
};