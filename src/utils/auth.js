// Authentication utility functions

export const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const logout = () => {
  localStorage.removeItem('userData');
  localStorage.removeItem('authToken');
};

export const getUserRole = () => {
  const userData = getUserData();
  return userData ? userData.role : null;
};

export const getUserName = () => {
  const userData = getUserData();
  return userData ? userData.name : null;
}; 