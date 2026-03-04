import axios from 'axios';

export const getCommunityStats = async () => {
  const res = await axios.get('/api/stats/community');
  return res.data;
};
