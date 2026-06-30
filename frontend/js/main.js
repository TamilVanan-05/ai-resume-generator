// Common main application JavaScript functionality

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    updateAuthNavbar();
    
    // Bind global mobile navbar toggle if it exists
    const menuToggle = document.getElementById("mobile-menu-toggle");
    const mobileNav = document.getElementById("mobile-nav-links");
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener("click", () => {
            mobileNav.classList.toggle("d-none");
        });
    }
});

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || window.APP_CONFIG.defaultTheme;
    const body = document.body;
    
    if (savedTheme === "dark") {
        body.classList.add("dark-mode");
    } else {
        body.classList.remove("dark-mode");
    }
    
    // Bind toggle buttons (if present)
    const themeToggles = document.querySelectorAll(".theme-toggle-btn");
    themeToggles.forEach(btn => {
        btn.addEventListener("click", toggleTheme);
        updateToggleIcon(btn, savedTheme);
    });
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle("dark-mode");
    const newTheme = body.classList.contains("dark-mode") ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    
    const themeToggles = document.querySelectorAll(".theme-toggle-btn");
    themeToggles.forEach(btn => {
        updateToggleIcon(btn, newTheme);
    });
}

function updateToggleIcon(btn, theme) {
    const icon = btn.querySelector("i");
    if (icon) {
        if (theme === "dark") {
            icon.className = "fa-solid fa-sun text-warning";
        } else {
            icon.className = "fa-solid fa-moon text-primary";
        }
    }
}

// --- Global Auth State ---
function updateAuthNavbar() {
    const token = localStorage.getItem("access_token");
    const userJson = localStorage.getItem("user");
    
    const guestNav = document.getElementById("nav-guest-items");
    const userNav = document.getElementById("nav-user-items");
    const userNameSpan = document.getElementById("nav-user-name");
    
    if (token && userJson) {
        const user = JSON.parse(userJson);
        if (guestNav) guestNav.classList.add("d-none");
        if (userNav) userNav.classList.remove("d-none");
        if (userNameSpan) userNameSpan.textContent = user.name;
        
        // If user is admin, show admin panel button link
        const adminBtn = document.getElementById("nav-admin-btn");
        if (adminBtn && user.is_admin) {
            adminBtn.classList.remove("d-none");
        }
    } else {
        if (guestNav) guestNav.classList.remove("d-none");
        if (userNav) userNav.classList.add("d-none");
    }
}

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/";
}

// --- API Helpers ---
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem("access_token");
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    
    const url = `${window.APP_CONFIG.apiBaseUrl}${endpoint}`;
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        // Token expired/invalid, logout user and redirect
        logout();
        throw new Error("Session expired. Please login again.");
    }
    
    return response;
}
