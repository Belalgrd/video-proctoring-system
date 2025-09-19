// frontend/src/services/api.js
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5050';

// Socket.io connection with explicit configuration
export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// API instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  config => {
    console.log('API Request:', config.method, config.url);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const api = {
  // Session management
  createSession: async (sessionData) => {
    try {
      const response = await apiClient.post('/api/sessions', sessionData);
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  updateSession: async (sessionId, updates) => {
    try {
      const response = await apiClient.patch(`/api/sessions/${sessionId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  endSession: async (sessionId) => {
    try {
      const response = await apiClient.post(`/api/sessions/${sessionId}/end`, {
        endTime: Date.now()
      });
      return response.data;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  // Event logging
  logEvents: async (sessionId, events) => {
    try {
      const response = await apiClient.post(`/api/sessions/${sessionId}/events`, {
        events
      });
      return response.data;
    } catch (error) {
      console.error('Error logging events:', error);
      throw error;
    }
  },

  // Reporting
  getSessionReport: async (sessionId) => {
    try {
      const response = await apiClient.get(`/api/sessions/${sessionId}/report`);
      return response.data;
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  },

  // Get all sessions
  getAllSessions: async () => {
    try {
      const response = await apiClient.get('/api/sessions');
      return response.data;
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  }
};