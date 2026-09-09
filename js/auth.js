/**
 * EVENTIFY - Authentication & Session Management
 * Handles login, registration, role-based route guards, and demo accounts.
 */

const Auth = {
  getSession() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'admin') {
        const adminData = {
          id: 'USR-001',
          name: 'Alexander Wright',
          email: 'admin@eventify.com',
          role: 'SuperAdmin',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          phone: '+1 (555) 019-2834',
          location: 'San Francisco, CA',
          loginTime: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(adminData));
        return adminData;
      }
      if (urlParams.get('demo') === 'user') {
        const userData = {
          id: 'USR-102',
          name: 'Sophia Martinez',
          email: 'user@eventify.com',
          role: 'User',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
          phone: '+1 (555) 345-6789',
          location: 'New York, USA',
          loginTime: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(userData));
        return userData;
      }

      const adminSess = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
      if (adminSess) {
        const parsed = JSON.parse(adminSess);
        if (parsed.role === 'Admin') parsed.role = 'SuperAdmin';
        return parsed;
      }

      const userSess = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (userSess) return JSON.parse(userSess);

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

    // Auto-migrate legacy Admin role
    if (user.role === 'Admin') {
      user.role = 'SuperAdmin';
      Storage.saveUser(user);
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password. Please try again.' };
    }

    if (user.status === 'Pending') {
      return { success: false, message: 'Your organizer account is pending approval by a Super Admin.' };
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

    if (user.role === 'SuperAdmin' || user.role === 'Organizer') {
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
      avatar: userData.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      status: userData.role === 'Organizer' ? 'Pending' : 'Active'
    });

    if (newUser.status === 'Pending') {
      return { success: false, message: 'Your organizer account is pending approval by a Super Admin.' };
    }

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

    // If 'Admin' is required, allow both SuperAdmin and Organizer
    if (requiredRole === 'Admin') {
      if (session.role !== 'SuperAdmin' && session.role !== 'Organizer' && session.role !== 'Admin') {
        window.location.href = inSubDir ? '../user/dashboard.html' : 'user/dashboard.html';
        return null;
      }
    } else if (requiredRole && session.role !== requiredRole) {
      if (session.role === 'SuperAdmin' || session.role === 'Organizer' || session.role === 'Admin') {
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
