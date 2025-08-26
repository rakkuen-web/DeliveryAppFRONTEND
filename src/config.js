const API_URL = process.env.REACT_APP_API_URL || 'https://deliveryappbackend-production.up.railway.app';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || 'https://deliveryappbackend-production.up.railway.app';

export const API_BASE_URL = API_URL + '/api';
export const SOCKET_BASE_URL = SOCKET_URL;

export { API_URL, SOCKET_URL };