'use client';

let logoutInProgress = false;

export async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);

    if (res.status === 401) {
      if (!logoutInProgress) {
        logoutInProgress = true;
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch {
          // ignore logout errors
        }
        const params = new URLSearchParams(window.location.search);
        const expired = params.get('expired');
        if (!expired) {
          window.location.href = '/login?expired=true';
        } else {
          window.location.href = '/login';
        }
      }
      return res;
    }

    return res;
  } catch (error) {
    // Network errors: don't trigger logout
    throw error;
  }
}
