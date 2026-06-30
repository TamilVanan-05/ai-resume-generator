// Client-Side Resume Editor & Forms State Engine

let resumeData = {
    title: "Draft Resume",
    template_name: "modern",
    content: {
        personal: { name: "", email: "", phone: "", address: "", linkedin: "", github: "", portfolio: "", summary: "", title: "" },
        education: [],
        experience: [],
        skills: "",
        projects: [],
        certificates: [],
        languages: [],
        achievements: [],
        section_order: ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements']
    },
    custom_styling: {
        font_family: "Inter",
        font_size: "font-md",
        spacing: "spacing-normal",
        theme_color: "#1e3a8a"
    }
};

// Undo/Redo Stacks
let undoStack = [];
let redoStack = [];
let isStateUpdating = false;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Session check
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "/auth";
        return;
    }
    
    // 2. Load templates list options in customization bar
    loadTemplatesList();
    
    // 3. Load active Resume details
    loadResumeDetails();
    
    // 4. Bind event listeners
    bindFormListeners();
    bindToolbarListeners();
    
    // 5. Register canvas resize auto-scaling
    window.addEventListener("resize", adjustCanvasScale);
});

function getResumeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
}

// --- API Loading & Saving ---

async function loadResumeDetails() {
    const resumeId = getResumeIdFromUrl();
    if (!resumeId) {
        window.location.href = "/dashboard";
        return;
    }
    
    try {
        const response = await fetchAPI(`/api/resumes/${resumeId}`);
        if (response.ok) {
            const data = await response.json();
            
            // Normalize schema content keys if empty
            resumeData.title = data.title;
            resumeData.template_name = data.template_name;
            resumeData.content = { ...resumeData.content, ...data.content };
            resumeData.custom_styling = { ...resumeData.custom_styling, ...data.custom_styling };
            
            if (!resumeData.content.section_order) {
                resumeData.content.section_order = ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
            }
            
            // Set header title
            document.getElementById("editor-resume-title").textContent = data.title;
            
            // Pre-fill Forms
            fillFormFields();
            
            // Initialize dynamic lists
            renderEducationList();
            renderExperienceList();
            renderProjectsList();
            renderCertificatesList();
            renderLanguagesList();
            renderAchievementsList();
            
            // Initialize Customizer toolbar state
            document.getElementById("ctrl-template").value = resumeData.template_name;
            document.getElementById("ctrl-font").value = resumeData.custom_styling.font_family || "Inter";
            document.getElementById("ctrl-size").value = resumeData.custom_styling.font_size || "font-md";
            document.getElementById("ctrl-spacing").value = resumeData.custom_styling.spacing || "spacing-normal";
            document.getElementById("ctrl-color").value = resumeData.custom_styling.theme_color || "#1e3a8a";
            
            // Init score badge
            const badge = document.getElementById("score-indicator-badge");
            badge.textContent = `${data.ats_score || 0} ATS Score`;
            
            // Save initial state to undo stack
            saveStateToHistory();
            
            // Initial Preview Render
            renderPreviewCanvas();
            
        } else {
            alert("Resume workspace not found.");
            window.location.href = "/dashboard";
        }
    } catch (err) {
        console.error(err);
    }
}

async function saveResumeData(silent = false) {
    const resumeId = getResumeIdFromUrl();
    if (!resumeId) return;
    
    try {
        const response = await fetchAPI(`/api/resumes/${resumeId}`, {
            method: "PUT",
            body: JSON.stringify({
                title: resumeData.title,
                template_name: resumeData.template_name,
                content: resumeData.content,
                custom_styling: resumeData.custom_styling
            })
        });
        if (!response.ok && !silent) {
            console.error("Auto-save failed.");
        }
    } catch (err) {
        console.error("Auto-save network error: ", err);
    }
}

// Debounce helper to prevent database spamming during typing
let saveTimeout = null;
function triggerAutoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveResumeData(true);
    }, 1500);
}

// --- History State Management (Undo/Redo) ---

function saveStateToHistory() {
    if (isStateUpdating) return;
    
    // Stringify deep copy to isolate instances
    const stateCopy = JSON.stringify({
        content: resumeData.content,
        custom_styling: resumeData.custom_styling,
        template_name: resumeData.template_name
    });
    
    // Clear redo if new modification is made
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === stateCopy) {
        return; // No actual change made
    }
    
    undoStack.push(stateCopy);
    redoStack = []; // Reset redo
    
    updateHistoryButtons();
}

function undo() {
    if (undoStack.length <= 1) return;
    
    isStateUpdating = true;
    const currentState = undoStack.pop();
    redoStack.push(currentState);
    
    const prevState = JSON.parse(undoStack[undoStack.length - 1]);
    resumeData.content = prevState.content;
    resumeData.custom_styling = prevState.custom_styling;
    resumeData.template_name = prevState.template_name;
    
    // Re-fill forms & render
    fillFormFields();
    rebuildDynamicLists();
    syncToolbarControls();
    renderPreviewCanvas();
    saveResumeData(true);
    
    isStateUpdating = false;
    updateHistoryButtons();
}

function redo() {
    if (redoStack.length === 0) return;
    
    isStateUpdating = true;
    const nextState = redoStack.pop();
    undoStack.push(nextState);
    
    const stateObj = JSON.parse(nextState);
    resumeData.content = stateObj.content;
    resumeData.custom_styling = stateObj.custom_styling;
    resumeData.template_name = stateObj.template_name;
    
    // Re-fill forms & render
    fillFormFields();
    rebuildDynamicLists();
    syncToolbarControls();
    renderPreviewCanvas();
    saveResumeData(true);
    
    isStateUpdating = false;
    updateHistoryButtons();
}

function updateHistoryButtons() {
    document.getElementById("btn-undo").disabled = undoStack.length <= 1;
    document.getElementById("btn-redo").disabled = redoStack.length === 0;
}

function rebuildDynamicLists() {
    renderEducationList();
    renderExperienceList();
    renderProjectsList();
    renderCertificatesList();
    renderLanguagesList();
    renderAchievementsList();
}

function syncToolbarControls() {
    document.getElementById("ctrl-template").value = resumeData.template_name;
    document.getElementById("ctrl-font").value = resumeData.custom_styling.font_family;
    document.getElementById("ctrl-size").value = resumeData.custom_styling.font_size;
    document.getElementById("ctrl-spacing").value = resumeData.custom_styling.spacing;
    document.getElementById("ctrl-color").value = resumeData.custom_styling.theme_color;
}

// --- Form Filling & Syncing ---

function fillFormFields() {
    const personal = resumeData.content.personal;
    document.getElementById("in-name").value = personal.name || "";
    document.getElementById("in-email").value = personal.email || "";
    document.getElementById("in-phone").value = personal.phone || "";
    document.getElementById("in-address").value = personal.address || "";
    document.getElementById("in-linkedin").value = personal.linkedin || "";
    document.getElementById("in-github").value = personal.github || "";
    document.getElementById("in-portfolio").value = personal.portfolio || "";
    document.getElementById("in-summary").value = personal.summary || "";
    
    // Skills
    const skills = resumeData.content.skills;
    document.getElementById("in-skills").value = Array.isArray(skills) ? skills.join(", ") : (skills || "");
}

function bindFormListeners() {
    // Listen to personal text input details
    const inputs = document.querySelectorAll(".input-sync");
    inputs.forEach(input => {
        input.addEventListener("input", (e) => {
            const key = e.target.id.replace("in-", "");
            if (key === "skills") {
                resumeData.content.skills = e.target.value.split(",").map(s => s.trim()).filter(s => s !== "");
            } else if (key === "summary") {
                resumeData.content.personal.summary = e.target.value;
            } else {
                resumeData.content.personal[key] = e.target.value;
                
                // Derive headline if name changes
                if (key === "name" && !resumeData.content.personal.title) {
                    resumeData.content.personal.title = "Software Engineer / Professional";
                }
            }
            
            saveStateToHistory();
            renderPreviewCanvas();
            triggerAutoSave();
        });
    });
}

function bindToolbarListeners() {
    // Template changer
    document.getElementById("ctrl-template").addEventListener("change", (e) => {
        resumeData.template_name = e.target.value;
        saveStateToHistory();
        renderPreviewCanvas();
        triggerAutoSave();
    });
    
    // Font changer
    document.getElementById("ctrl-font").addEventListener("change", (e) => {
        resumeData.custom_styling.font_family = e.target.value;
        saveStateToHistory();
        renderPreviewCanvas();
        triggerAutoSave();
    });
    
    // Font size changer
    document.getElementById("ctrl-size").addEventListener("change", (e) => {
        resumeData.custom_styling.font_size = e.target.value;
        saveStateToHistory();
        renderPreviewCanvas();
        triggerAutoSave();
    });
    
    // Spacing changer
    document.getElementById("ctrl-spacing").addEventListener("change", (e) => {
        resumeData.custom_styling.spacing = e.target.value;
        saveStateToHistory();
        renderPreviewCanvas();
        triggerAutoSave();
    });
    
    // Theme color accent picker
    document.getElementById("ctrl-color").addEventListener("change", (e) => {
        resumeData.custom_styling.theme_color = e.target.value;
        saveStateToHistory();
        renderPreviewCanvas();
        triggerAutoSave();
    });
}

function loadTemplatesList() {
    // Populate templates dropdown options
    const select = document.getElementById("ctrl-template");
    const templates = [
        { id: "modern", name: "Modern" },
        { id: "professional", name: "Professional" },
        { id: "harvard", name: "Harvard" },
        { id: "stanford", name: "Stanford" },
        { id: "corporate", name: "Corporate" },
        { id: "creative", name: "Creative" },
        { id: "minimal", name: "Minimal" },
        { id: "google", name: "Google Style" },
        { id: "microsoft", name: "Microsoft Style" },
        { id: "amazon", name: "Amazon Style" },
        { id: "ai_engineer", name: "AI Engineer" },
        { id: "medical", name: "Medical Coding" },
        { id: "fresher", name: "Fresher" },
        { id: "developer", name: "Software Developer" },
        { id: "data_analyst", name: "Data Analyst" }
    ];
    
    select.innerHTML = templates.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
}

// --- Preview Rendering Canvas ---

function renderPreviewCanvas() {
    const canvas = document.getElementById("resume-canvas");
    if (!canvas) return;
    
    // Match renderer function
    const renderer = window.TEMPLATE_RENDERERS[resumeData.template_name] || window.TEMPLATE_RENDERERS.modern;
    const htmlOutput = renderer(resumeData.content, resumeData.custom_styling);
    
    canvas.innerHTML = htmlOutput;
    
    // Clear dynamic class lists
    canvas.className = "resume-canvas";
    
    // Apply styling classes
    canvas.classList.add(`template-${resumeData.template_name}`);
    canvas.classList.add(resumeData.custom_styling.font_size);
    canvas.classList.add(resumeData.custom_styling.spacing);
    
    // Apply CSS variables inline
    canvas.style.setProperty("--theme-color", resumeData.custom_styling.theme_color);
    
    // Set custom inline font family style overrides
    const fontMap = {
        "Inter": "'Inter', sans-serif",
        "Arial": "Arial, sans-serif",
        "Georgia": "Georgia, serif",
        "Times New Roman": "'Times New Roman', serif",
        "Segoe UI": "'Segoe UI', sans-serif"
    };
    canvas.style.fontFamily = fontMap[resumeData.custom_styling.font_family] || "'Inter', sans-serif";
    
    // Scale canvas dynamically to fit viewport width
    adjustCanvasScale();
}

// --- Repeatable Input Lists Rendering (Step items builders) ---

// 1. Education
function renderEducationList() {
    const container = document.getElementById("education-entries-container");
    const list = resumeData.content.education || [];
    
    container.innerHTML = list.map((item, idx) => `
        <div class="card bg-dark border-secondary p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold">Item #${idx + 1}</span>
                <button onclick="removeListItem('education', ${idx})" class="btn btn-outline-danger btn-sm py-0"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="row g-2">
                <div class="col-md-6">
                    <input type="text" value="${item.degree || ''}" oninput="updateListItem('education', ${idx}, 'degree', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Degree / Program">
                </div>
                <div class="col-md-6">
                    <input type="text" value="${item.school || ''}" oninput="updateListItem('education', ${idx}, 'school', this.value)" class="form-control form-control-glass form-control-sm" placeholder="School Name">
                </div>
                <div class="col-md-4">
                    <input type="text" value="${item.start_date || ''}" oninput="updateListItem('education', ${idx}, 'start_date', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Start Date (e.g. 2022)">
                </div>
                <div class="col-md-4">
                    <input type="text" value="${item.end_date || ''}" oninput="updateListItem('education', ${idx}, 'end_date', this.value)" class="form-control form-control-glass form-control-sm" placeholder="End Date (e.g. 2026)">
                </div>
                <div class="col-md-4">
                    <input type="text" value="${item.location || ''}" oninput="updateListItem('education', ${idx}, 'location', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Location">
                </div>
            </div>
        </div>
    `).join("");
}

function addEducationEntry() {
    if (!resumeData.content.education) resumeData.content.education = [];
    resumeData.content.education.push({ degree: "", school: "", start_date: "", end_date: "", location: "", description: "" });
    saveStateToHistory();
    renderEducationList();
    renderPreviewCanvas();
}

// 2. Experience
function renderExperienceList() {
    const container = document.getElementById("experience-entries-container");
    const list = resumeData.content.experience || [];
    
    container.innerHTML = list.map((item, idx) => `
        <div class="card bg-dark border-secondary p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold">Role #${idx + 1}</span>
                <button onclick="removeListItem('experience', ${idx})" class="btn btn-outline-danger btn-sm py-0"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="row g-2">
                <div class="col-md-6">
                    <input type="text" value="${item.role || ''}" oninput="updateListItem('experience', ${idx}, 'role', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Job Title / Role">
                </div>
                <div class="col-md-6">
                    <input type="text" value="${item.company || ''}" oninput="updateListItem('experience', ${idx}, 'company', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Company Name">
                </div>
                <div class="col-md-4">
                    <input type="text" value="${item.start_date || ''}" oninput="updateListItem('experience', ${idx}, 'start_date', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Start (e.g. June 2023)">
                </div>
                <div class="col-md-4">
                    <input type="text" value="${item.end_date || ''}" oninput="updateListItem('experience', ${idx}, 'end_date', this.value)" class="form-control form-control-glass form-control-sm" placeholder="End (e.g. Present)">
                </div>
                <div class="col-md-4">
                    <input type="text" value="${item.location || ''}" oninput="updateListItem('experience', ${idx}, 'location', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Location">
                </div>
                <div class="col-12 mt-2">
                    <div class="d-flex justify-content-between mb-1">
                        <label class="text-secondary small mb-0">Role Descriptions (One bullet per line)</label>
                        <button onclick="aiOptimizeBullet(${idx})" class="btn btn-outline-primary btn-sm py-0 px-2 style="font-size: 8pt;"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Optimize Description</button>
                    </div>
                    <textarea oninput="updateListItem('experience', ${idx}, 'description', this.value)" id="exp-desc-${idx}" class="form-control form-control-glass form-control-sm" rows="4" placeholder="- Developed scalable cloud architecture...">${item.description || ''}</textarea>
                </div>
            </div>
        </div>
    `).join("");
}

function addExperienceEntry() {
    if (!resumeData.content.experience) resumeData.content.experience = [];
    resumeData.content.experience.push({ role: "", company: "", start_date: "", end_date: "", location: "", description: "" });
    saveStateToHistory();
    renderExperienceList();
    renderPreviewCanvas();
}

// 3. Projects
function renderProjectsList() {
    const container = document.getElementById("projects-entries-container");
    const list = resumeData.content.projects || [];
    
    container.innerHTML = list.map((item, idx) => `
        <div class="card bg-dark border-secondary p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold">Project #${idx + 1}</span>
                <button onclick="removeListItem('projects', ${idx})" class="btn btn-outline-danger btn-sm py-0"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="row g-2">
                <div class="col-md-6">
                    <input type="text" value="${item.title || ''}" oninput="updateListItem('projects', ${idx}, 'title', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Project Name">
                </div>
                <div class="col-md-6">
                    <input type="text" value="${item.link || ''}" oninput="updateListItem('projects', ${idx}, 'link', this.value)" class="form-control form-control-glass form-control-sm" placeholder="URL Link (e.g. GitHub)">
                </div>
                <div class="col-12 mt-2">
                    <input type="text" value="${item.description || ''}" oninput="updateListItem('projects', ${idx}, 'description', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Project outcome details / tools used...">
                </div>
            </div>
        </div>
    `).join("");
}

function addProjectEntry() {
    if (!resumeData.content.projects) resumeData.content.projects = [];
    resumeData.content.projects.push({ title: "", description: "", link: "" });
    saveStateToHistory();
    renderProjectsList();
    renderPreviewCanvas();
}

// 4. Certificates
function renderCertificatesList() {
    const container = document.getElementById("certificates-entries-container");
    const list = resumeData.content.certificates || [];
    
    container.innerHTML = list.map((item, idx) => `
        <div class="card bg-dark border-secondary p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold">Certificate #${idx + 1}</span>
                <button onclick="removeListItem('certificates', ${idx})" class="btn btn-outline-danger btn-sm py-0"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="row g-2">
                <div class="col-md-5">
                    <input type="text" value="${item.title || ''}" oninput="updateListItem('certificates', ${idx}, 'title', this.value)" class="form-control form-control-glass form-control-sm" placeholder="AWS Solution Architect">
                </div>
                <div class="col-md-4">
                    <input type="text" value="${item.issuer || ''}" oninput="updateListItem('certificates', ${idx}, 'issuer', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Amazon Web Services">
                </div>
                <div class="col-md-3">
                    <input type="text" value="${item.date || ''}" oninput="updateListItem('certificates', ${idx}, 'date', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Date">
                </div>
            </div>
        </div>
    `).join("");
}

function addCertificateEntry() {
    if (!resumeData.content.certificates) resumeData.content.certificates = [];
    resumeData.content.certificates.push({ title: "", issuer: "", date: "" });
    saveStateToHistory();
    renderCertificatesList();
    renderPreviewCanvas();
}

// 5. Languages
function renderLanguagesList() {
    const container = document.getElementById("languages-entries-container");
    const list = resumeData.content.languages || [];
    
    container.innerHTML = list.map((item, idx) => `
        <div class="card bg-dark border-secondary p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold">Language #${idx + 1}</span>
                <button onclick="removeListItem('languages', ${idx})" class="btn btn-outline-danger btn-sm py-0"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="row g-2">
                <div class="col-md-6">
                    <input type="text" value="${item.language || ''}" oninput="updateListItem('languages', ${idx}, 'language', this.value)" class="form-control form-control-glass form-control-sm" placeholder="English">
                </div>
                <div class="col-md-6">
                    <input type="text" value="${item.proficiency || ''}" oninput="updateListItem('languages', ${idx}, 'proficiency', this.value)" class="form-control form-control-glass form-control-sm" placeholder="Native / Fluent / Intermediate">
                </div>
            </div>
        </div>
    `).join("");
}

function addLanguageEntry() {
    if (!resumeData.content.languages) resumeData.content.languages = [];
    resumeData.content.languages.push({ language: "", proficiency: "" });
    saveStateToHistory();
    renderLanguagesList();
    renderPreviewCanvas();
}

// 6. Achievements
function renderAchievementsList() {
    const container = document.getElementById("achievements-entries-container");
    const list = resumeData.content.achievements || [];
    
    container.innerHTML = list.map((item, idx) => `
        <div class="card bg-dark border-secondary p-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold">Achievement #${idx + 1}</span>
                <button onclick="removeListItem('achievements', ${idx})" class="btn btn-outline-danger btn-sm py-0"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <input type="text" value="${item.description || item.title || ''}" oninput="updateListItem('achievements', ${idx}, 'description', this.value)" class="form-control form-control-glass form-control-sm" placeholder="e.g. Won Hackathon 2025 out of 100 entries.">
        </div>
    `).join("");
}

function addAchievementEntry() {
    if (!resumeData.content.achievements) resumeData.content.achievements = [];
    resumeData.content.achievements.push({ description: "" });
    saveStateToHistory();
    renderAchievementsList();
    renderPreviewCanvas();
}

// Shared List Mutation Helpers
function updateListItem(section, idx, key, val) {
    if (!resumeData.content[section]) return;
    resumeData.content[section][idx][key] = val;
    saveStateToHistory();
    renderPreviewCanvas();
    triggerAutoSave();
}

function removeListItem(section, idx) {
    if (!resumeData.content[section]) return;
    resumeData.content[section].splice(idx, 1);
    saveStateToHistory();
    rebuildDynamicLists();
    renderPreviewCanvas();
    triggerAutoSave();
}

// --- Drag-and-drop / Section Reordering Modal ---

// Set reorder modal UI options list
const reorderModalEl = document.getElementById("reorderModal");
if (reorderModalEl) {
    reorderModalEl.addEventListener("show.bs.modal", () => {
        const order = resumeData.content.section_order || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
        const list = document.getElementById("reorder-sections-list");
        
        list.innerHTML = order.map((section, idx) => {
            const prettyNames = {
                summary: "Professional Summary", experience: "Professional Experience",
                education: "Education Details", skills: "Core Skills",
                projects: "Academic / Work Projects", certificates: "Certifications",
                languages: "Languages Profile", achievements: "Key Achievements"
            };
            
            return `
                <li class="list-group-item bg-dark border-secondary text-white d-flex align-items-center justify-content-between py-2" data-section="${section}">
                    <span>${prettyNames[section] || section}</span>
                    <div class="d-flex gap-1">
                        <button onclick="moveSectionItem(${idx}, -1)" class="btn btn-outline-light btn-sm py-0" ${idx === 0 ? 'disabled' : ''}><i class="fa-solid fa-angle-up"></i></button>
                        <button onclick="moveSectionItem(${idx}, 1)" class="btn btn-outline-light btn-sm py-0" ${idx === order.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-angle-down"></i></button>
                    </div>
                </li>
            `;
        }).join("");
    });
}

function moveSectionItem(idx, direction) {
    const order = resumeData.content.section_order;
    const targetIdx = idx + direction;
    
    // Swap items in order array
    const temp = order[idx];
    order[idx] = order[targetIdx];
    order[targetIdx] = temp;
    
    // Trigger modal redraw manually by firing showing event
    const event = new Event('show.bs.modal');
    reorderModalEl.dispatchEvent(event);
}

function applyReorderedSections() {
    saveStateToHistory();
    renderPreviewCanvas();
    saveResumeData(true);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(reorderModalEl);
    if (modal) modal.hide();
}

// --- AI Assistants ---

async function showAIModalSpinner(title) {
    document.getElementById("ai-modal-title").textContent = title;
    document.getElementById("ai-modal-spinner").classList.remove("d-none");
    document.getElementById("ai-modal-result-content").classList.add("d-none");
    document.getElementById("ai-modal-footer").classList.add("d-none");
    
    const modalEl = document.getElementById("aiResultModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

function showAIModalResult(text, applyCallback = null) {
    document.getElementById("ai-modal-spinner").classList.add("d-none");
    document.getElementById("ai-modal-result-content").classList.remove("d-none");
    
    const outputArea = document.getElementById("ai-modal-output-text");
    outputArea.value = text;
    
    const applyBtn = document.getElementById("btn-ai-apply");
    if (applyCallback) {
        applyBtn.classList.remove("d-none");
        document.getElementById("ai-modal-footer").classList.remove("d-none");
        applyBtn.onclick = () => {
            applyCallback(outputArea.value);
            const modalEl = document.getElementById("aiResultModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        };
    } else {
        applyBtn.classList.add("d-none");
        document.getElementById("ai-modal-footer").classList.remove("d-none");
    }
}

async function aiGenerateSummary() {
    const jobTitle = resumeData.content.personal.title || "Professional";
    const skills = resumeData.content.skills || [];
    
    showAIModalSpinner("AI Professional Summary Generator");
    
    try {
        const response = await fetchAPI("/api/ai/summary", {
            method: "POST",
            body: JSON.stringify({
                job_title: jobTitle,
                skills: skills,
                experience_summary: resumeData.content.experience.map(e => e.role).join(", ")
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showAIModalResult(data.summary, (newValue) => {
                document.getElementById("in-summary").value = newValue;
                resumeData.content.personal.summary = newValue;
                saveStateToHistory();
                renderPreviewCanvas();
                triggerAutoSave();
            });
        } else {
            showAIModalResult("AI summaries generation failed.");
        }
    } catch (err) {
        showAIModalResult("Network error query AI summaries.");
    }
}

async function aiOptimizeBullet(idx) {
    const descArea = document.getElementById(`exp-desc-${idx}`);
    if (!descArea) return;
    const text = descArea.value;
    
    if (!text) {
        alert("Please input details description text to optimize.");
        return;
    }
    
    showAIModalSpinner("AI Bullet Optimizer");
    
    try {
        const response = await fetchAPI("/api/ai/optimize-bullets", {
            method: "POST",
            body: JSON.stringify({
                bullet_point: text,
                job_title: resumeData.content.personal.title || ""
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showAIModalResult(data.optimized_bullet, (newValue) => {
                descArea.value = newValue;
                resumeData.content.experience[idx].description = newValue;
                saveStateToHistory();
                renderPreviewCanvas();
                triggerAutoSave();
            });
        } else {
            showAIModalResult("AI optimization failed.");
        }
    } catch (err) {
        showAIModalResult("Connection error calling API.");
    }
}

async function aiSuggestSkills() {
    const jobTitle = resumeData.content.personal.title || "Software Engineer";
    
    showAIModalSpinner("AI Suggested Tech Stack");
    
    try {
        const response = await fetchAPI("/api/ai/suggest-skills", {
            method: "POST",
            body: JSON.stringify({ job_title: jobTitle })
        });
        
        if (response.ok) {
            const data = await response.json();
            const skillString = data.skills.join(", ");
            showAIModalResult(skillString, (newValue) => {
                document.getElementById("in-skills").value = newValue;
                resumeData.content.skills = newValue.split(",").map(s => s.trim()).filter(s => s !== "");
                saveStateToHistory();
                renderPreviewCanvas();
                triggerAutoSave();
            });
        } else {
            showAIModalResult("AI skills lookup failed.");
        }
    } catch (err) {
        showAIModalResult("Connection error during skills evaluation.");
    }
}

async function aiGenerateCoverLetter() {
    const resumeId = getResumeIdFromUrl();
    const jobDescription = document.getElementById("ats-job-desc").value;
    
    showAIModalSpinner("AI Cover Letter Draft");
    
    try {
        const response = await fetchAPI("/api/ai/cover-letter", {
            method: "POST",
            body: JSON.stringify({
                resume_id: resumeId,
                job_description: jobDescription
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showAIModalResult(data.cover_letter); // Read only, copy enabled
        } else {
            showAIModalResult("Failed to construct Cover Letter.");
        }
    } catch (err) {
        showAIModalResult("API service query error.");
    }
}

async function aiGenerateLinkedInBio() {
    const resumeId = getResumeIdFromUrl();
    showAIModalSpinner("AI LinkedIn Profile Optimizer");
    
    try {
        const response = await fetchAPI("/api/ai/linkedin-optimizer", {
            method: "POST",
            body: JSON.stringify({ resume_id: resumeId })
        });
        
        if (response.ok) {
            const data = await response.json();
            const output = `PROPOSED HEADLINE:\n${data.headline}\n\nPROPOSED ABOUT BIO SUMMARY:\n${data.about_section}`;
            showAIModalResult(output);
        } else {
            showAIModalResult("Failed to generate LinkedIn details.");
        }
    } catch (err) {
        showAIModalResult("LinkedIn Optimizer query error.");
    }
}

// --- PDF and DOCX Exporter functions ---

function exportPDF() {
    const element = document.getElementById('resume-canvas');
    if (!element) return;
    
    // Scale preview wrapper temporarily to normal 1.0 to export clean PDF coordinates
    const holder = document.getElementById("preview-canvas-holder");
    const prevTransform = holder.style.transform;
    holder.style.transform = "scale(1.0)";
    
    const filename = `${resumeData.content.personal.name || 'resume'}_cv.pdf`;
    
    const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Run exporter
    html2pdf().set(opt).from(element).save().then(() => {
        // Restore transform
        holder.style.transform = prevTransform;
    }).catch(err => {
        console.error(err);
        holder.style.transform = prevTransform;
    });
}

async function exportDOCX() {
    const resumeId = getResumeIdFromUrl();
    if (!resumeId) return;
    
    try {
        const res = await fetchAPI(`/api/resumes/${resumeId}/export-docx`);
        if (res.ok) {
            const blob = await res.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            
            const filename = `${resumeData.content.personal.name || 'resume'}_cv.docx`;
            link.download = filename;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Failed to export DOCX.");
        }
    } catch (err) {
        console.error(err);
        alert("Server network error exporting file.");
    }
}

function adjustCanvasScale() {
    const canvas = document.getElementById("resume-canvas");
    const holder = document.getElementById("preview-canvas-holder");
    if (!canvas || !holder) return;
    
    // A4 width in pixels is ~794px
    const canvasWidth = 794; 
    const parentWidth = holder.clientWidth || holder.parentElement.clientWidth;
    
    // Calculate responsive scale factor
    const scale = (parentWidth - 20) / canvasWidth;
    const finalScale = Math.min(1.0, scale);
    
    canvas.style.transform = `scale(${finalScale})`;
    
    // Height correction to avoid large empty spaces below scaled element
    const canvasHeight = canvas.offsetHeight || 1122; // A4 height ~1122px
    holder.style.height = `${canvasHeight * finalScale}px`;
}

async function openShareModal() {
    const resumeId = getResumeIdFromUrl();
    try {
        const response = await fetchAPI(`/api/resumes/${resumeId}`);
        if (response.ok) {
            const data = await response.json();
            const isPublic = data.is_public || false;
            
            const toggle = document.getElementById("share-toggle-switch");
            const label = document.getElementById("share-toggle-label");
            const linkSec = document.getElementById("share-link-section");
            const urlInput = document.getElementById("share-url-input");
            
            toggle.checked = isPublic;
            label.textContent = isPublic ? "Public (Shared globally)" : "Private (Hidden from public)";
            
            if (isPublic) {
                urlInput.value = `${window.location.origin}/share/${resumeId}`;
                linkSec.classList.remove("d-none");
            } else {
                urlInput.value = "";
                linkSec.classList.add("d-none");
            }
            
            const modalEl = document.getElementById("shareModal");
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    } catch (err) {
        console.error(err);
    }
}

async function togglePublicSharing() {
    const resumeId = getResumeIdFromUrl();
    const toggle = document.getElementById("share-toggle-switch");
    const label = document.getElementById("share-toggle-label");
    const linkSec = document.getElementById("share-link-section");
    const urlInput = document.getElementById("share-url-input");
    
    try {
        const response = await fetchAPI(`/api/resumes/${resumeId}/toggle-public`, {
            method: "PUT"
        });
        
        if (response.ok) {
            const data = await response.json();
            const isPublic = data.is_public;
            
            toggle.checked = isPublic;
            label.textContent = isPublic ? "Public (Shared globally)" : "Private (Hidden from public)";
            
            if (isPublic) {
                urlInput.value = `${window.location.origin}/share/${resumeId}`;
                linkSec.classList.remove("d-none");
            } else {
                urlInput.value = "";
                linkSec.classList.add("d-none");
            }
        } else {
            alert("Failed to toggle sharing.");
            toggle.checked = !toggle.checked;
        }
    } catch (err) {
        console.error(err);
        toggle.checked = !toggle.checked;
    }
}

function copyShareLink() {
    const input = document.getElementById("share-url-input");
    input.select();
    input.setSelectionRange(0, 99999);
    
    try {
        navigator.clipboard.writeText(input.value);
        
        const btn = document.getElementById("btn-copy-share-url");
        const origHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-check text-success"></i>`;
        
        setTimeout(() => {
            btn.innerHTML = origHTML;
        }, 2000);
    } catch (err) {
        console.error("Copy failed: ", err);
    }
}

