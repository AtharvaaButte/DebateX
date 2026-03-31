const BASE_URL = 'http://localhost:3000';

const getHeaders = () => {
    const token = localStorage.getItem('debate_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const apiCall = async (endpoint, method = 'GET', body = null) => {
    const token = localStorage.getItem('debate_token');
    
    // Globally block missing tokens from making authenticated logic calls
    if (!token && endpoint !== '/auth/me') {
        window.location.href = '/login';
        throw new Error('No authentication token found');
    }

    const options = {
        method,
        headers: getHeaders()
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    
    // Global 401 interceptor
    if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('debate_token');
        localStorage.removeItem('debate_uid');
        window.location.href = '/login';
        throw new Error('Session expired or invalid token');
    }

    let data;
    try {
        data = await res.json();
    } catch (err) {
        throw new Error('Failed to parse API response');
    }

    if (!res.ok) {
        throw new Error(data.error || 'An error occurred during API request.');
    }

    return data;
};

// API Wrappers
export const getProfile = () => apiCall('/profile/me');
export const setupProfile = (data) => apiCall('/profile/setup', 'POST', data);
export const getCurrentUser = () => apiCall('/auth/me');
export const createRoom = (topic, sideSelectionMode, ownerParticipates, evaluationInstructions) => apiCall('/rooms', 'POST', { topic, sideSelectionMode, ownerParticipates, evaluationInstructions });
export const joinRoom = (roomId, side) => apiCall('/rooms/join', 'POST', { roomId, side });
export const assignSide = (roomId, userId, side) => apiCall(`/rooms/${roomId}/assign-side`, 'POST', { userId, side });
export const addBot = (roomId, name, side) => apiCall(`/rooms/${roomId}/add-bot`, 'POST', { name, side });
export const getRoom = (roomId) => apiCall(`/rooms/${roomId}`);
export const startDebate = (roomId) => apiCall(`/debate/${roomId}/start`, 'POST');
export const submitArgument = (roomId, text) => apiCall('/debate/argument', 'POST', { roomId, text });
export const getArguments = (roomId) => apiCall(`/debate/${roomId}/arguments`);
export const evaluateDebate = (roomId) => apiCall(`/debate/${roomId}/evaluate`, 'POST');
export const getResult = (roomId) => apiCall(`/debate/${roomId}/result`);
export const suggestTopic = () => apiCall(`/ai/suggest-topic`, 'POST');
