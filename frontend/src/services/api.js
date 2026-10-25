let cachedCsrfToken = null;
let currentStudioId = null;

export const setStudioHeaderId = (studioId) => {
  currentStudioId = studioId;
};

// Extract cookie value by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const fetchCsrfToken = async () => {
  try {
    const res = await fetch('/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken;
    }
  } catch (err) {
    console.warn('Failed to retrieve initial CSRF token:', err);
  }
  return null;
};

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (currentStudioId) {
    headers['x-studio-id'] = currentStudioId;
  }

  // Attach CSRF token on mutating HTTP requests
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const cookieToken = getCookie('XSRF-TOKEN');
    const token = cookieToken || cachedCsrfToken;
    if (token) {
      headers['X-CSRF-Token'] = token;
    } else {
      const freshToken = await fetchCsrfToken();
      if (freshToken) {
        headers['X-CSRF-Token'] = freshToken;
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (url, body, options) => request(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),

  // Health
  getHealth: () => api.get('/api/health'),

  // Auth
  register: (payload) => api.post('/api/auth/register', payload),
  verifyEmail: (payload) => api.post('/api/auth/verify-email', payload),
  login: (payload) => api.post('/api/auth/login', payload),
  logout: () => api.post('/api/auth/logout'),
  getMe: () => api.get('/api/auth/me'),
  forgotPassword: (payload) => api.post('/api/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/api/auth/reset-password', payload),

  // Studios
  getMyStudios: () => api.get('/api/studios'),
  createStudio: (payload) => api.post('/api/studios', payload),
  getStudioById: (studioId) => api.get(`/api/studios/${studioId}`),

  // Memberships & Invitations
  listMembers: (studioId) => api.get(`/api/memberships/${studioId}`),
  updateMemberRole: (studioId, membershipId, role) => api.patch(`/api/memberships/${studioId}/${membershipId}`, { role }),
  removeMember: (studioId, membershipId) => api.delete(`/api/memberships/${studioId}/${membershipId}`),
  issueInvitation: (payload) => api.post('/api/invitations/issue', payload),
  acceptInvitation: (payload) => api.post('/api/invitations/accept', payload),

  // Builds
  listBuilds: (studioId) => api.get(`/api/builds?studioId=${studioId}`),
  createBuild: (payload) => api.post('/api/builds', payload),
  updateBuild: (buildId, payload) => api.patch(`/api/builds/${buildId}`, payload),

  // Sessions
  listSessions: (studioId) => api.get(`/api/sessions?studioId=${studioId}`),
  createSession: (payload) => api.post('/api/sessions', payload),
  joinSessionWithCode: (payload) => api.post('/api/sessions/join', payload),

  // Feedback & Semantic Duplicates
  submitFeedback: (payload) => api.post('/api/feedback', payload),
  listFeedback: (studioId, params = {}) => {
    const query = new URLSearchParams({ studioId, ...params }).toString();
    return api.get(`/api/feedback?${query}`);
  },
  getFeedbackById: (studioId, reportId) => api.get(`/api/feedback/${reportId}?studioId=${studioId}`),
  getDuplicateCandidates: (studioId, reportId) => api.get(`/api/duplicates/candidates/${reportId}?studioId=${studioId}`),
  reviewDuplicateDecision: (payload) => api.post('/api/duplicates/decision', payload),

  // Issues
  listIssues: (studioId, params = {}) => {
    const query = new URLSearchParams({ studioId, ...params }).toString();
    return api.get(`/api/issues?${query}`);
  },
  createIssue: (payload) => api.post('/api/issues', payload),
  getIssueById: (studioId, issueId) => api.get(`/api/issues/${issueId}?studioId=${studioId}`),
  confirmIssue: (studioId, issueId) => api.patch(`/api/issues/${issueId}/confirm`, { studioId }),
  verifyFix: (studioId, issueId, notes) => api.patch(`/api/issues/${issueId}/verify-fix`, { studioId, notes }),

  // Documents
  listDocuments: (studioId, buildId) => api.get(`/api/documents?studioId=${studioId}${buildId ? `&buildId=${buildId}` : ''}`),
  uploadDocument: (payload) => api.post('/api/documents/upload', payload),

  // RAG Chat
  askQuestion: (payload) => api.post('/api/chat/ask', payload),
  getConversationHistory: (studioId, buildId) => api.get(`/api/chat/history?studioId=${studioId}${buildId ? `&buildId=${buildId}` : ''}`),

  // AI Investigation Agent
  investigateTopic: (payload) => api.post('/api/agent/investigate', payload),
  approveProposalIssue: (payload) => api.post('/api/agent/approve-issue', payload)
};
