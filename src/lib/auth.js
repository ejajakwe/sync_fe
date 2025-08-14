// src/lib/auth.js
export function isAdminLoggedIn() {
  return localStorage.getItem("isAdmin") === "true";
}

export function loginAdmin() {
  localStorage.setItem("isAdmin", "true");
}

export function logoutAdmin() {
  localStorage.removeItem("isAdmin");
}
