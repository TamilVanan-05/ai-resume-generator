// Client-Side User Dashboard Management

let activeTab = "resumes";
let userResumes = [];
let chartsInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Session verification
    const token = localStorage.getItem("access_token");
    const userJson = localStorage.getItem("user");
    
    if (!token || !userJson) {
        window.location.href = "/auth";
        return;
    }
    
    const user = JSON.parse(userJson);
    
    // Check if redirecting from Canva-style landing page template selection
    const urlParams = new URLSearchParams(window.location.search);
    const createTemplate = urlParams.get("create_template");
    if (createTemplate) {
        sessionStorage.removeItem("pending_template_selection");
        autoCreateLandingResume(createTemplate);
        return;
    }
    
    document.getElementById("user-display-name").textContent = user.name;
    document.getElementById("profile-name").value = user.name;
    document.getElementById("profile-email").value = user.email;
    
    // 2. Fetch data
    loadUserResumes();
    loadCoverLetters();
    
    // 3. Event listeners
    document.getElementById("create-resume-form").addEventListener("submit", handleCreateResume);
    document.getElementById("profile-details-form").addEventListener("submit", handleUpdateProfile);
    document.getElementById("profile-password-form").addEventListener("submit", handleUpdatePassword);
});

async function autoCreateLandingResume(templateId) {
    try {
        const title = `My ${templateId.charAt(0).toUpperCase() + templateId.slice(1)} Resume`;
        const res = await fetchAPI("/api/resumes", {
            method: "POST",
            body: JSON.stringify({
                title: title,
                template_name: templateId,
                content: {
                    personal: { name: "", email: "", phone: "", website: "", location: "", title: "", summary: "" },
                    education: [],
                    experience: [],
                    skills: [],
                    projects: [],
                    certificates: [],
                    languages: [],
                    achievements: []
                },
                custom_styling: {
                    font_family: "Inter",
                    font_size: "font-md",
                    spacing: "spacing-normal",
                    theme_color: "#1e3a8a"
                }
            })
        });
        
        if (res.ok) {
            const data = await res.json();
            window.location.href = `/editor?id=${data.id}`;
        } else {
            window.location.href = "/dashboard";
        }
    } catch (err) {
        console.error(err);
        window.location.href = "/dashboard";
    }
}


// Switch Tab Panes
function switchTab(tabName) {
    activeTab = tabName;
    
    // Toggle active pills classes
    document.getElementById("tab-resumes-btn").classList.toggle("active", tabName === "resumes");
    document.getElementById("tab-ats-btn").classList.toggle("active", tabName === "ats");
    document.getElementById("tab-cover-btn").classList.toggle("active", tabName === "cover");
    document.getElementById("tab-profile-btn").classList.toggle("active", tabName === "profile");
    
    // Toggle active panes visibility
    document.getElementById("pane-resumes").classList.toggle("d-none", tabName !== "resumes");
    document.getElementById("pane-ats").classList.toggle("d-none", tabName !== "ats");
    document.getElementById("pane-cover").classList.toggle("d-none", tabName !== "cover");
    document.getElementById("pane-profile").classList.toggle("d-none", tabName !== "profile");
    
    if (tabName === "ats") {
        renderATSChart();
    }
}

// Alert notices
function showDashboardAlert(message, type = "success") {
    const alertBox = document.getElementById("dashboard-alert");
    alertBox.className = `alert alert-${type} py-2 px-3 mb-3 small`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
    setTimeout(() => alertBox.classList.add("d-none"), 4000);
}

// --- Data Fetching ---

async function loadUserResumes() {
    try {
        const res = await fetchAPI("/api/resumes");
        if (res.ok) {
            userResumes = await res.json();
            renderResumesGrid();
        } else {
            document.getElementById("resumes-grid").innerHTML = `
                <div class="col-12 text-center text-danger">
                    <p>Failed to retrieve resumes.</p>
                </div>
            `;
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadCoverLetters() {
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/api/resumes`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            }
        });
        if (!response.ok) return;
        
        // We'll mock cover letters or fetch from user DB
        // Let's implement static or query details
        const listBody = document.getElementById("cover-letters-table");
        listBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-secondary py-4">No letters created. Create a Cover Letter under your resume editor's AI section.</td>
            </tr>
        `;
    } catch (err) {
        console.error(err);
    }
}

// --- Rendering ---

function renderResumesGrid() {
    const grid = document.getElementById("resumes-grid");
    if (userResumes.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-file-circle-plus fs-1 text-secondary mb-3"></i>
                <h3>No Resumes Yet</h3>
                <p class="text-secondary">Click the "Create Resume" button to design your first layout.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = userResumes.map(res => {
        const updatedDate = new Date(res.updated_at).toLocaleDateString();
        const score = res.ats_score || 0;
        let badgeColor = "bg-danger";
        if (score >= 80) badgeColor = "bg-success";
        else if (score >= 50) badgeColor = "bg-warning";
        
        return `
            <div class="col-md-6 col-lg-4 animate-fade-in">
                <div class="glass-card p-3 h-100 d-flex flex-column justify-content-between">
                    <div>
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <span class="badge ${badgeColor} p-2 rounded">${score} ATS Score</span>
                            <span class="small text-secondary">${updatedDate}</span>
                        </div>
                        <h4 class="fw-bold mb-1 text-truncate">${res.title}</h4>
                        <p class="small text-secondary mb-3">Template: <span class="text-capitalize">${res.template_name}</span></p>
                    </div>
                    
                    <div class="d-flex flex-column gap-2 mt-3">
                        <a href="/editor?id=${res.id}" class="btn btn-glass-primary w-100 btn-sm text-center">
                            <i class="fa-solid fa-pen-to-square me-2"></i>Edit Resume
                        </a>
                        <div class="d-flex gap-2">
                            <button onclick="cloneResume(${res.id})" class="btn btn-outline-light btn-sm flex-fill" title="Clone">
                                <i class="fa-solid fa-copy"></i> Copy
                            </button>
                            <button onclick="deleteResume(${res.id})" class="btn btn-outline-danger btn-sm px-3" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// --- Action Handlers ---

async function handleCreateResume(e) {
    e.preventDefault();
    const title = document.getElementById("new-resume-title").value;
    const template_name = document.getElementById("new-resume-template").value;
    
    try {
        const res = await fetchAPI("/api/resumes", {
            method: "POST",
            body: JSON.stringify({ title, template_name })
        });
        
        if (res.ok) {
            const data = await res.json();
            // Close bootstrap modal dynamically
            const modalEl = document.getElementById("newResumeModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            
            // Redirect straight to Editor
            window.location.href = `/editor?id=${data.id}`;
        } else {
            const data = await res.json();
            alert(data.message || "Failed to create resume.");
        }
    } catch (err) {
        alert("Server error connecting to workspace API.");
    }
}

async function cloneResume(resumeId) {
    if (!confirm("Clone this resume configuration?")) return;
    try {
        const res = await fetchAPI(`/api/resumes/${resumeId}/clone`, { method: "POST" });
        if (res.ok) {
            showDashboardAlert("Resume duplicated successfully.");
            loadUserResumes();
        } else {
            showDashboardAlert("Failed to copy resume.", "danger");
        }
    } catch (err) {
        console.error(err);
    }
}

async function deleteResume(resumeId) {
    if (!confirm("Are you absolutely sure you want to delete this resume? This cannot be undone.")) return;
    try {
        const res = await fetchAPI(`/api/resumes/${resumeId}`, { method: "DELETE" });
        if (res.ok) {
            showDashboardAlert("Resume deleted successfully.");
            loadUserResumes();
        } else {
            showDashboardAlert("Failed to delete resume.", "danger");
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Profile & Security Updates ---

async function handleUpdateProfile(e) {
    e.preventDefault();
    const name = document.getElementById("profile-name").value;
    try {
        const res = await fetchAPI("/auth/profile", {
            method: "PUT",
            body: JSON.stringify({ name })
        });
        
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem("user", JSON.stringify(data.user));
            document.getElementById("user-display-name").textContent = data.user.name;
            showDashboardAlert("Profile updated successfully!");
        } else {
            showDashboardAlert("Failed to update profile details.", "danger");
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleUpdatePassword(e) {
    e.preventDefault();
    const password = document.getElementById("profile-new-password").value;
    try {
        const res = await fetchAPI("/auth/profile", {
            method: "PUT",
            body: JSON.stringify({ password })
        });
        
        if (res.ok) {
            document.getElementById("profile-new-password").value = "";
            showDashboardAlert("Password updated successfully!");
        } else {
            showDashboardAlert("Failed to update security credentials.", "danger");
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Render ATS Chart ---

function renderATSChart() {
    const scores = userResumes.map(r => r.ats_score || 0);
    const titles = userResumes.map(r => r.title);
    
    // Set average score metric
    const avg = scores.length ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : 0;
    document.getElementById("avg-ats-holder").textContent = avg;
    
    const ctx = document.getElementById("atsTrendsChart");
    if (!ctx) return;
    
    if (chartsInstance) {
        chartsInstance.destroy();
    }
    
    chartsInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: titles.length ? titles : ["No Data"],
            datasets: [{
                label: 'ATS Grader Scores',
                data: scores.length ? scores : [0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#cbd5e1' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#cbd5e1' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
