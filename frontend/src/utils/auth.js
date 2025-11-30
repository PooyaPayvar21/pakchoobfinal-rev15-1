/**
 * Authentication utility functions
 */

export const getToken = () => {
  // Try to get the token from localStorage
  const token = localStorage.getItem('token') || localStorage.getItem('kpi_token');
  return token || null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('kpi_token');
  localStorage.removeItem('kpiUserInfo');
};
