/**
 * Logout Client Script
 *
 * Client-side logout functionality that calls the Better Auth API directly
 * Falls back to manual cookie deletion if needed
 */

export function logout() {
  // 1. Call Better Auth signOut endpoint
  fetch('/api/logout', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(() => {
      // 2. Also try to delete the cookie manually
      document.cookie = 'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax';

      // 3. Force redirect
      window.location.href = '/auth/login';
    })
    .catch((error) => {
      console.error('Logout error:', error);

      // Fallback: just try to delete cookie and redirect
      document.cookie = 'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax';
      window.location.href = '/auth/login';
    });
}

export function logoutButtonHandler(event: Event) {
  event.preventDefault();
  logout();
}
