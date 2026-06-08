import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/ideas`;

// Create a new idea
export const createIdea = async (ideaData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(API_URL, ideaData, config);
  return response.data;
};

// Get all ideas (can accept query params like ?visibility=public or ?sort=popular)
export const getIdeas = async (filters = {}) => {
  const queryString = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_URL}?${queryString}`);
  return response.data;
};

// Get single idea by ID
export const getIdeaById = async (id, token) => {
    // Token is optional depending on if we need to check private access, 
    // but usually helpful to pass if user is logged in
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.get(`${API_URL}/${id}`, token ? config : {});
    return response.data;
};

// Vote for an idea (voteType: 'up' or 'down')
export const voteIdea = async (id, voteType, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(`${API_URL}/${id}/vote`, { voteType }, config);
  return response.data;
};

// Convert idea to project
export const convertIdeaToProject = async (id, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.post(`${API_URL}/${id}/convert`, {}, config);
  return response.data;
};

// Delete idea 
export const deleteIdea = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.delete(`${API_URL}/${id}`, config);
    return response.data;
};

// Get comments for an idea
export const getIdeaComments = async (ideaId) => {
    const response = await axios.get(`${API_URL}/${ideaId}/comments`);
    return response.data;
};

// Add comment to an idea (optional parentCommentId for replies)
export const addIdeaComment = async (ideaId, content, token, parentCommentId = null) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const body = { content };
    if (parentCommentId) {
        body.parentCommentId = parentCommentId;
    }
    const response = await axios.post(`${API_URL}/${ideaId}/comments`, body, config);
    return response.data;
};

// Delete comment
export const deleteIdeaComment = async (ideaId, commentId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.delete(`${API_URL}/${ideaId}/comments/${commentId}`, config);
    return response.data;
};

// Edit comment
export const editIdeaComment = async (ideaId, commentId, content, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.put(`${API_URL}/${ideaId}/comments/${commentId}`, { content }, config);
    return response.data;
};
