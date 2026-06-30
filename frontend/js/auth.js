// Client-Side Authentication state transitions & request handlers

// Tracks the email being verified / recovered
let currentEmail = "";

document.addEventListener("DOMContentLoaded", () => {
    // Check if user is already logged in
    const token = localStorage.getItem("access_token");
    if (token) {
        window.location.href = "/dashboard";
        return;
    }
    
    // Check URL parameters (e.g. ?register=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("register") === "true") {
        showSection("signup");
    } else {
        showSection("login");
    }
    
    // Bind Submit Events
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("signup-form").addEventListener("submit", handleSignup);
    document.getElementById("verify-form").addEventListener("submit", handleVerification);
    document.getElementById("forgot-form").addEventListener("submit", handleForgotPassword);
    document.getElementById("reset-form").addEventListener("submit", handleResetPassword);
});

function showSection(section) {
    // Hide all
    document.getElementById("login-container").classList.add("d-none");
    document.getElementById("signup-container").classList.add("d-none");
    document.getElementById("verify-container").classList.add("d-none");
    document.getElementById("forgot-container").classList.add("d-none");
    document.getElementById("reset-container").classList.add("d-none");
    
    // Clear alert
    hideAlert();
    
    // Show chosen
    document.getElementById(`${section}-container`).classList.remove("d-none");
}

// Custom Alerts
function showAlert(message, type = "danger") {
    const alertBox = document.getElementById("auth-alert");
    alertBox.className = `alert alert-${type} py-2 px-3 mb-3 small`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
}

function hideAlert() {
    document.getElementById("auth-alert").classList.add("d-none");
}

// --- Request Handlers ---

async function handleLogin(e) {
    e.preventDefault();
    hideAlert();
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.requires_verification) {
                currentEmail = data.email;
                showAlert(data.message, "info");
                
                // Show dev bypass code
                if (data.dev_bypass_code) {
                    document.getElementById("bypass-code-holder").textContent = data.dev_bypass_code;
                    document.getElementById("verify-bypass-alert").classList.remove("d-none");
                }
                showSection("verify");
            } else {
                // Save access credentials
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                
                const pendingTemplate = sessionStorage.getItem("pending_template_selection");
                if (pendingTemplate) {
                    window.location.href = `/dashboard?create_template=${pendingTemplate}`;
                } else {
                    window.location.href = "/dashboard";
                }
            }
        } else {
            showAlert(data.message || "Login failed. Check details.");
        }
    } catch (err) {
        showAlert("Server connection failed. Try again.");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    hideAlert();
    
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentEmail = data.email;
            showAlert(data.message, "success");
            
            // Show bypass warning to facilitate testing
            if (data.dev_bypass_code) {
                document.getElementById("bypass-code-holder").textContent = data.dev_bypass_code;
                document.getElementById("verify-bypass-alert").classList.remove("d-none");
            }
            showSection("verify");
        } else {
            showAlert(data.message || "Registration failed. Try checking details.");
        }
    } catch (err) {
        showAlert("Server connection failed. Try again.");
    }
}

async function handleVerification(e) {
    e.preventDefault();
    hideAlert();
    
    const code = document.getElementById("verify-code").value.trim().toUpperCase();
    
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/auth/verify-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: currentEmail, code })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            const pendingTemplate = sessionStorage.getItem("pending_template_selection");
            if (pendingTemplate) {
                window.location.href = `/dashboard?create_template=${pendingTemplate}`;
            } else {
                window.location.href = "/dashboard";
            }
        } else {
            showAlert(data.message || "Verification code is incorrect.");
        }
    } catch (err) {
        showAlert("Server verification request failed.");
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    hideAlert();
    
    const email = document.getElementById("forgot-email").value;
    
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert("Reset instruction email sent.", "info");
            
            if (data.dev_bypass_token) {
                document.getElementById("reset-token-holder").textContent = data.dev_bypass_token;
                document.getElementById("reset-bypass-alert").classList.remove("d-none");
                // Pre-fill token to save time
                document.getElementById("reset-token-input").value = data.dev_bypass_token;
            }
            
            showSection("reset");
        } else {
            showAlert(data.message || "Recovery lookup failed.");
        }
    } catch (err) {
        showAlert("Password reset request failed.");
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    hideAlert();
    
    const token = document.getElementById("reset-token-input").value;
    const new_password = document.getElementById("reset-password-input").value;
    
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, new_password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert("Password reset successfully. Redirecting to login...", "success");
            setTimeout(() => {
                showSection("login");
            }, 2000);
        } else {
            showAlert(data.message || "Invalid or expired token.");
        }
    } catch (err) {
        showAlert("Server request error during reset.");
    }
}
