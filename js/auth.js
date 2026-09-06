/**
 * EVENTIFY - Authentication & Session Management
 * Handles login, registration, role-based route guards, and demo accounts.
 */

const Auth = {
  // Check current session
  getSession() {
    try {
      const adminSess = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (adminSess) return { ...JSON.parse(adminSess), role: 'Admin' };

      const userSess = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (userSess) return { ...JSON.parse(userSess), role: 'User' };

      return null;
    } catch {
      return null;
    }
  },

  // Perform login
  login(email, password, expectedRole = null) {
    email = email.trim().toLowerCase();
    const user = Storage.getUserByEmail(email);

    if (!user) {
      return { success: false, message: 'No account found with this email address.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password. Please try again.' };
    }

    if (user.status === 'Inactive') {
      return { success: false, message: 'Your account has been deactivated. Please contact support.' };
    }

    if (expectedRole && user.role !== expectedRole) {
      return { success: false, message: `Access restricted. This account is registered as ${user.role}.` };
    }

    // Save session
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      location: user.location,
      loginTime: new Date().toISOString()
    };

    if (user.role === 'Admin') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(sessionData));
    } else {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
    }

    return { success: true, user: sessionData };
  },

  // Register new user
  register(userData) {
    const existing = Storage.getUserByEmail(userData.email);
    if (existing) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = Storage.saveUser({
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'User',
      phone: userData.phone || '+1 (555) 000-0000',
      location: userData.location || 'New York, USA',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      status: 'Active'
    });

    // Auto login
    this.login(newUser.email, userData.password);
    return { success: true, user: newUser };
  },

  // Logout current user
  logout() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    
    // Find correct relative path to login page
    const inSubDir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/user/');
    window.location.href = inSubDir ? '../login.html' : 'login.html';
  },

  // Route Guard: Require Role or redirect
  requireAuth(requiredRole) {
    const session = this.getSession();
    const inSubDir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/user/');
    const loginPath = inSubDir ? '../login.html' : 'login.html';

    if (!session) {
      window.location.href = loginPath;
      return null;
    }

    if (requiredRole && session.role !== requiredRole) {
      if (session.role === 'Admin') {
        window.location.href = inSubDir ? '../admin/dashboard.html' : 'admin/dashboard.html';
      } else {
        window.location.href = inSubDir ? '../user/dashboard.html' : 'user/dashboard.html';
      }
      return null;
    }

    // Populate user profile info in DOM
    this.populateDomUser(session);
    return session;
  },

  // Populate DOM user badges and profile snippets
  populateDomUser(user) {
    const populate = () => {
      const nameElements = document.querySelectorAll('.user-name-display');
      const emailElements = document.querySelectorAll('.user-email-display');
      const avatarElements = document.querySelectorAll('.user-avatar-display');

      nameElements.forEach(el => { el.textContent = user.name; });
      emailElements.forEach(el => { el.textContent = user.email; });
      avatarElements.forEach(el => {
        if (el.tagName === 'IMG') {
          el.src = user.avatar;
          el.alt = user.name;
        } else {
          el.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;">`;
        }
      });
    };

    // If DOM is already loaded, run immediately; otherwise wait
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', populate);
    } else {
      populate();
    }
  }
};
