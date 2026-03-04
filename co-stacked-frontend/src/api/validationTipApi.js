import axios from 'axios';

export const getValidationTips = async () => {
  const response = await axios.get('/api/validation-tips');
  return response.data;
};