// Client-Side Administrative Dashboard Management

let templateChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Session verification & privilege checks
    const token = localStorage.getItem("access_token");
    const userJson = localStorage.getItem("user");
    
    if (!token || !userJson) {
        window.location.href = "/auth";
        return;
    }
    
    const user = JSON.parse(userJson);
    if (!user.is_admin) {
        alert("Access Denied. Admin privileges required.");
        window.location.href = "/dashboard";
        return;
    }
    
    // 2. Fetch metrics
    loadDashboardMetrics();
    loadUsersList();
    loadResumesList();
});

// --- API Fetch Functions ---

async function loadDashboardMetrics() {
    try {
        const res = await fetchAPI("/api/admin/dashboard");
        if (res.ok) {
            const data = await res.json();
            
            // Set Metrics Numbers
            document.getElementById("metric-users").textContent = data.stats.total_users;
            document.getElementById("metric-resumes").textContent = data.stats.total_resumes;
            document.getElementById("metric-ai-queries").textContent = data.stats.ai_queries_run;
            document.getElementById("metric-ats-avg").textContent = `${data.stats.average_ats_score}/100`;
            
            // Render template popularity distribution chart
            renderTemplateChart(data.template_popularity);
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadUsersList() {
    try {
        const res = await fetchAPI("/api/admin/users");
        if (res.ok) {
            const users = await res.json();
            const table = document.getElementById("admin-users-table");
            
            if (users.length === 0) {
                table.innerHTML = `<tr><td colspan="6" class="text-center text-secondary">No user records.</td></tr>`;
                return;
            }
            
            table.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge ${u.is_admin ? 'bg-warning text-dark' : 'bg-secondary'}">${u.is_admin ? 'Admin' : 'User'}</span></td>
                    <td><span class="badge ${u.is_verified ? 'bg-success' : 'bg-danger'}">${u.is_verified ? 'Verified' : 'Pending'}</span></td>
                    <td class="text-end">
                        <button onclick="adminDeleteUser(${u.id})" class="btn btn-outline-danger btn-sm" ${u.is_admin ? 'disabled' : ''}>
                            <i class="fa-solid fa-user-minus"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join("");
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadResumesList() {
    try {
        const res = await fetchAPI("/api/admin/resumes");
        if (res.ok) {
            const resumes = await res.json();
            const table = document.getElementById("admin-resumes-table");
            
            if (resumes.length === 0) {
                table.innerHTML = `<tr><td colspan="6" class="text-center text-secondary">No resume records in system.</td></tr>`;
                return;
            }
            
            table.innerHTML = resumes.map(r => `
                <tr>
                    <td>${r.id}</td>
                    <td>${r.user_name || 'Anonymous'}</td>
                    <td>${r.title}</td>
                    <td class="text-capitalize">${r.template_name}</td>
                    <td><span class="badge ${r.ats_score >= 80 ? 'bg-success' : (r.ats_score >= 50 ? 'bg-warning' : 'bg-danger')}">${r.ats_score} Score</span></td>
                    <td class="text-end">
                        <button onclick="adminDeleteResume(${r.id})" class="btn btn-outline-danger btn-sm">
                            <i class="fa-solid fa-trash-can"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join("");
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Action Handlers ---

async function adminDeleteUser(userId) {
    if (!confirm("Are you absolutely sure you want to delete this user? This will delete all of their resumes and associated records!")) return;
    try {
        const res = await fetchAPI(`/api/admin/users/${userId}`, { method: "DELETE" });
        if (res.ok) {
            alert("User deleted successfully.");
            loadDashboardMetrics();
            loadUsersList();
            loadResumesList();
        } else {
            const data = await res.json();
            alert(data.message || "Failed to delete user.");
        }
    } catch (err) {
        console.error(err);
    }
}

async function adminDeleteResume(resumeId) {
    if (!confirm("Are you absolutely sure you want to delete this resume?")) return;
    try {
        const res = await fetchAPI(`/api/admin/resumes/${resumeId}`, { method: "DELETE" });
        if (res.ok) {
            alert("Resume deleted successfully.");
            loadDashboardMetrics();
            loadResumesList();
        } else {
            alert("Failed to delete resume.");
        }
    } catch (err) {
        console.error(err);
    }
}

// --- Charts Rendering ---

function renderTemplateChart(popularity) {
    const ctx = document.getElementById("templateStatsChart");
    if (!ctx) return;
    
    if (templateChartInstance) {
        templateChartInstance.destroy();
    }
    
    const labels = Object.keys(popularity);
    const counts = Object.values(popularity);
    
    templateChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ["No templates used"],
            datasets: [{
                label: 'Resumes Generated',
                data: counts.length ? counts : [0],
                backgroundColor: 'rgba(59, 130, 246, 0.65)',
                borderColor: '#3b82f6',
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#cbd5e1', stepSize: 1 },
                    beginAtZero: true
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
