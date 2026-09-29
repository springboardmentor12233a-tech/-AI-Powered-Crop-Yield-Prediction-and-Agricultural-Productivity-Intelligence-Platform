// Small helpers around what login already stores in localStorage:
// "token" (the JWT) and "user" (the user object, including role).

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getRole() {
  const user = getUser();
  return user?.role || null;
}

export function isAdmin() {
  return getRole() === "admin";
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("last_prediction");
  sessionStorage.removeItem("chat_messages");
}