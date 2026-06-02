/**
 * Client Login Utilities
 */
export function getLoginUrl() {
  const origin = window.location.origin;
  const state = btoa(origin); // Pass current origin to state for redirection
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const redirectUri = `${origin}/api/oauth/callback`;
  
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&state=${state}`;
}
