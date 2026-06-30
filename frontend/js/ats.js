// Client-Side ATS scoring calculations & Chart.js rendering

let atsChartInstance = null;

async function runATSCheck() {
    const resumeId = getResumeIdFromUrl();
    const jobDescription = document.getElementById("ats-job-desc").value;
    
    // Save current state first to ensure latest content is evaluated
    await saveResumeData(true);
    
    const alertList = document.getElementById("ats-suggestions-list");
    alertList.innerHTML = `
        <li class="list-group-item bg-transparent text-center text-white-50 border-0">
            <div class="spinner-border spinner-border-sm text-primary me-2"></div>
            Analyzing resume with ATS algorithms...
        </li>
    `;
    
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/api/ats/score`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("access_token")}`
            },
            body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription })
        });
        
        if (response.ok) {
            const evaluation = await response.json();
            
            // Update UI Score Indicator
            const badge = document.getElementById("score-indicator-badge");
            badge.textContent = `${evaluation.score} ATS Score`;
            badge.className = `badge p-2 ${evaluation.score >= 80 ? 'bg-success' : (evaluation.score >= 50 ? 'bg-warning' : 'bg-danger')}`;
            
            // 1. Render Chart
            renderRadarChart(evaluation.breakdown);
            
            // 2. Render Suggestions list
            renderSuggestions(evaluation.suggestions);
            
        } else {
            alertList.innerHTML = `<li class="list-group-item bg-transparent text-danger">Failed to retrieve ATS metrics.</li>`;
        }
    } catch (err) {
        console.error(err);
        alertList.innerHTML = `<li class="list-group-item bg-transparent text-danger">Server diagnostic connection error.</li>`;
    }
}

function renderRadarChart(breakdown) {
    const ctx = document.getElementById("atsRadarChart");
    if (!ctx) return;
    
    if (atsChartInstance) {
        atsChartInstance.destroy();
    }
    
    // Values extracted from grading breakdown object
    const dataValues = [
        breakdown.contact_info,
        breakdown.sections,
        breakdown.action_verbs,
        breakdown.metrics,
        breakdown.keyword_match
    ];
    
    atsChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Contact Info', 'Key Sections', 'Action Verbs', 'Metrics', 'Keywords'],
            datasets: [{
                data: dataValues,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                pointBackgroundColor: '#3b82f6',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#94a3b8', font: { size: 9 } },
                    ticks: { display: false, stepSize: 5 },
                    min: 0,
                    max: 20
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderSuggestions(suggestions) {
    const list = document.getElementById("ats-suggestions-list");
    if (suggestions.length === 0) {
        list.innerHTML = `
            <li class="list-group-item bg-transparent text-success border-0 py-2 d-flex align-items-center gap-2">
                <i class="fa-solid fa-circle-check fs-5"></i>
                Awesome! No critical issues found. Your resume meets ATS expectations.
            </li>
        `;
        return;
    }
    
    list.innerHTML = suggestions.map(s => {
        let badgeClass = "bg-info";
        let icon = "fa-circle-info";
        if (s.severity === "high") {
            badgeClass = "bg-danger";
            icon = "fa-triangle-exclamation";
        } else if (s.severity === "medium") {
            badgeClass = "bg-warning text-dark";
            icon = "fa-circle-exclamation";
        }
        
        return `
            <li class="list-group-item bg-transparent border-bottom border-secondary-subtle py-3 text-white">
                <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="fw-bold small text-white-50">${s.section}</span>
                    <span class="badge ${badgeClass} text-uppercase style="font-size: 7.5pt;">${s.severity}</span>
                </div>
                <div class="d-flex align-items-start gap-2 small text-secondary">
                    <i class="fa-solid ${icon} mt-1 text-primary"></i>
                    <span>${s.message}</span>
                </div>
            </li>
        `;
    }).join("");
}
