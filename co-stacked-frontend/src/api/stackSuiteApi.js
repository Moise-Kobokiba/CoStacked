// src/api/stackSuiteApi.js

import API from './axios';

// Helper to strip undefined or null values before URL serialization
const cleanFilters = (filters) => {
  return Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''));
};

/* ═══════════════════════════════════════════════
   POSTS — covers all 7 content types
   (discussion, validation, build-in-public,
    showcase, founder-matching, challenge, accountability)
═══════════════════════════════════════════════ */

export const getStackPosts = async (filters = {}) => {
  const query = new URLSearchParams(cleanFilters(filters)).toString();
  const res = await API.get(`/stack-suite/posts?${query}`);
  return res.data;
};

export const getStackPostById = async (id) => {
  const res = await API.get(`/stack-suite/posts/${id}`);
  return res.data;
};

export const createStackPost = async (postData) => {
  const res = await API.post('/stack-suite/posts', postData);
  return res.data;
};

export const updateStackPost = async (id, postData) => {
  const res = await API.put(`/stack-suite/posts/${id}`, postData);
  return res.data;
};

export const upvoteStackPost = async (id) => {
  const res = await API.put(`/stack-suite/posts/${id}/upvote`);
  return res.data;
};

export const downvoteStackPost = async (id) => {
  const res = await API.put(`/stack-suite/posts/${id}/downvote`);
  return res.data;
};

export const followStackPost = async (id) => {
  const res = await API.put(`/stack-suite/posts/${id}/follow`);
  return res.data;
};

export const joinChallenge = async (id) => {
  const res = await API.put(`/stack-suite/posts/${id}/join`);
  return res.data;
};

export const updateChallengeProgress = async (id, progress) => {
  const res = await API.put(`/stack-suite/posts/${id}/progress`, { progress });
  return res.data;
};

export const encourageAccountability = async (id) => {
  const res = await API.put(`/stack-suite/posts/${id}/encourage`);
  return res.data;
};

export const deleteStackPost = async (id) => {
  const res = await API.delete(`/stack-suite/posts/${id}`);
  return res.data;
};

/* ═══════════════════════════════════════════════
   SHOWCASES
═══════════════════════════════════════════════ */

export const getShowcases = async (filters = {}) => {
  const query = new URLSearchParams(cleanFilters(filters)).toString();
  const res = await API.get(`/stack-suite/showcases?${query}`);
  return res.data;
};

export const getShowcaseById = async (id) => {
  const res = await API.get(`/stack-suite/showcases/${id}`);
  return res.data;
};

export const createShowcase = async (showcaseData) => {
  const res = await API.post('/stack-suite/showcases', showcaseData);
  return res.data;
};

export const upvoteShowcase = async (id) => {
  const res = await API.put(`/stack-suite/showcases/${id}/upvote`);
  return res.data;
};

export const downvoteShowcase = async (id) => {
  const res = await API.put(`/stack-suite/showcases/${id}/downvote`);
  return res.data;
};

export const updateShowcase = async (id, showcaseData) => {
  const res = await API.put(`/stack-suite/showcases/${id}`, showcaseData);
  return res.data;
};

export const deleteShowcase = async (id) => {
  const res = await API.delete(`/stack-suite/showcases/${id}`);
  return res.data;
};

/* ═══════════════════════════════════════════════
   COLLABORATION THREADS
═══════════════════════════════════════════════ */

export const getCollabThreads = async (filters = {}) => {
  const query = new URLSearchParams(cleanFilters(filters)).toString();
  const res = await API.get(`/stack-suite/collab?${query}`);
  return res.data;
};

export const getCollabThreadById = async (id) => {
  const res = await API.get(`/stack-suite/collab/${id}`);
  return res.data;
};

export const upvoteCollabThread = async (id) => {
  const res = await API.put(`/stack-suite/collab/${id}/upvote`);
  return res.data;
};

export const downvoteCollabThread = async (id) => {
  const res = await API.put(`/stack-suite/collab/${id}/downvote`);
  return res.data;
};

export const createCollabThread = async (threadData) => {
  const res = await API.post('/stack-suite/collab', threadData);
  return res.data;
};

export const updateCollabThread = async (id, threadData) => {
  const res = await API.put(`/stack-suite/collab/${id}`, threadData);
  return res.data;
};

export const deleteCollabThread = async (id) => {
  const res = await API.delete(`/stack-suite/collab/${id}`);
  return res.data;
};

/* ═══════════════════════════════════════════════
   COMMENTS (SHARED across all content types)
═══════════════════════════════════════════════ */

export const getStackComments = async (parentType, parentId) => {
  const res = await API.get(`/stack-suite/comments/${parentType}/${parentId}`);
  return res.data;
};

export const addStackComment = async (parentType, parentId, content, parentCommentId = null) => {
  const res = await API.post(`/stack-suite/comments/${parentType}/${parentId}`, { content, parentCommentId });
  return res.data;
};

export const editStackComment = async (id, content) => {
  const res = await API.put(`/stack-suite/comments/${id}`, { content });
  return res.data;
};

export const upvoteStackComment = async (id) => {
  const res = await API.put(`/stack-suite/comments/${id}/upvote`);
  return res.data;
};

export const likeStackComment = async (id) => {
  const res = await API.put(`/stack-suite/comments/${id}/like`);
  return res.data;
};

export const deleteStackComment = async (id) => {
  const res = await API.delete(`/stack-suite/comments/${id}`);
  return res.data;
};

/* ═══════════════════════════════════════════════
   BOOKMARKS / SAVED ITEMS
═══════════════════════════════════════════════ */

export const getSavedItems = async () => {
  const res = await API.get('/stack-suite/bookmarks');
  return res.data;
};

/* ═══════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════ */

export const getStackSuiteStats = async () => {
  const res = await API.get('/stack-suite/stats');
  return res.data;
};

/* ═══════════════════════════════════════════════
   CONTENT TYPE CONSTANTS
═══════════════════════════════════════════════ */

export const CONTENT_TYPES = {
  DISCUSSION: 'discussion',
  VALIDATION: 'validation',
  BUILD_IN_PUBLIC: 'build-in-public',
  SHOWCASE: 'showcase',
  FOUNDER_MATCHING: 'founder-matching',
  CHALLENGE: 'challenge',
  ACCOUNTABILITY: 'accountability',
};

export const CONTENT_TYPE_LABELS = {
  [CONTENT_TYPES.DISCUSSION]: 'Discussion',
  [CONTENT_TYPES.VALIDATION]: 'Validation',
  [CONTENT_TYPES.BUILD_IN_PUBLIC]: 'Build In Public',
  [CONTENT_TYPES.SHOWCASE]: 'Showcase',
  [CONTENT_TYPES.FOUNDER_MATCHING]: 'Founder Match',
  [CONTENT_TYPES.CHALLENGE]: 'Challenge',
  [CONTENT_TYPES.ACCOUNTABILITY]: 'Accountability',
};

export const CONTENT_TYPE_ICONS = {
  [CONTENT_TYPES.DISCUSSION]: 'MessageCircle',
  [CONTENT_TYPES.VALIDATION]: 'Lightbulb',
  [CONTENT_TYPES.BUILD_IN_PUBLIC]: 'TrendingUp',
  [CONTENT_TYPES.SHOWCASE]: 'Rocket',
  [CONTENT_TYPES.FOUNDER_MATCHING]: 'Users',
  [CONTENT_TYPES.CHALLENGE]: 'Zap',
  [CONTENT_TYPES.ACCOUNTABILITY]: 'Briefcase',
};

export const CONTENT_TYPE_COLORS = {
  [CONTENT_TYPES.DISCUSSION]: '#3b82f6',
  [CONTENT_TYPES.VALIDATION]: '#f59e0b',
  [CONTENT_TYPES.BUILD_IN_PUBLIC]: '#10b981',
  [CONTENT_TYPES.SHOWCASE]: '#8b5cf6',
  [CONTENT_TYPES.FOUNDER_MATCHING]: '#ec4899',
  [CONTENT_TYPES.CHALLENGE]: '#ef4444',
  [CONTENT_TYPES.ACCOUNTABILITY]: '#06b6d4',
};
