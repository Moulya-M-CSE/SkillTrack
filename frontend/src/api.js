
const API = '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  register: (name, email, password) =>
    request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getSkills: (userId) =>
    request(`/skills?user_id=${userId}`),

  addSkill: (userId, name, level, category = 'Technical') =>
    request('/skills', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        name,
        level,
        category,
      }),
    }),

  updateSkill: (skillId, userId, name, level, category) =>
    request(`/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify({
        user_id: userId,
        name,
        level,
        category,
      }),
    }),

  deleteSkill: (skillId, userId) =>
    request(`/skills/${skillId}?user_id=${userId}`, {
      method: 'DELETE',
    }),

  getCareerAnalysis: (userId, career) =>
    request(
      `/career-analysis?user_id=${userId}&career=${encodeURIComponent(career)}`
    ),

  getRecommendations: (userId, career) =>
    request(
      `/recommendations?user_id=${userId}&career=${encodeURIComponent(career)}`
    ),

  getDashboard: (userId) =>
    request(`/dashboard?user_id=${userId}`),

  getProgress: (userId) =>
    request(`/progress?user_id=${userId}`),

  addProgress: (userId, title) =>
    request('/progress', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, title }),
    }),

  updateProgress: (goalId, userId, completed) =>
    request(`/progress/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify({
        user_id: userId,
        completed,
      }),
    }),
};
