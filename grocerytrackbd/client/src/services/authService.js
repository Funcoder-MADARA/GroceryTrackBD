import jwt_decode from 'jwt-decode';

class AuthService {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem('token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp < currentTime) {
        this.removeToken();
        return false;
      }
      
      return true;
    } catch (error) {
      this.removeToken();
      return false;
    }
  }

  // Get user info from token
  getUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = jwt_decode(token);
      return decoded.user;
    } catch (error) {
      return null;
    }
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getUser();
    if (!user) return false;
    return user.role === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Logout user
  logout() {
    this.removeToken();
    window.location.href = '/login';
  }
}

export default new AuthService();
