// Templates Directory Explorer Management (Canva-style)

const ALL_TEMPLATES = [
    { id: "modern", name: "Modern Minimalist", category: "minimalist", icon: "fa-file-invoice", color: "text-primary", desc: "Clean modern grid structure with prominent titles. Highly versatile layout suitable for corporate, sales, and tech positions." },
    { id: "professional", name: "Executive Professional", category: "professional", icon: "fa-briefcase", color: "text-success", desc: "Traditional clean template focusing heavily on career timeline and achievements. Ideal for managerial and corporate applications." },
    { id: "harvard", name: "Harvard Academic", category: "academic", icon: "fa-graduation-cap", color: "text-danger", desc: "Centered headings, elegant serif typography. Designed based on Harvard University graduate standards. Ideal for research, finance, and legal careers." },
    { id: "stanford", name: "Stanford Classical", category: "academic", icon: "fa-book-open", color: "text-warning", desc: "Elegant academic layout with serif headings. Highly readable layout recommended for graduates, education professionals, and writers." },
    { id: "corporate", name: "Corporate Executive", category: "professional", icon: "fa-building", color: "text-info", desc: "Sophisticated structured format designed to highlight executive competencies, leadership history, and board metrics." },
    { id: "creative", name: "Creative Designer", category: "creative", icon: "fa-palette", color: "text-primary", desc: "Two-column design featuring modern sidebar layout. Best choice to showcase portfolios for designers, copywriters, and marketers." },
    { id: "minimal", name: "Minimal Standard", category: "minimalist", icon: "fa-square-check", color: "text-secondary", desc: "Clean lines, sparse layout prioritizing density and quick readability. Fits extensive career logs onto single page formats easily." },
    { id: "google", name: "Google Style Developer", category: "tech", icon: "fa-google", color: "text-primary", desc: "Clean standard design popular among software applicants. Highly readable margins and spacing optimized for quick tech recruiter reviews." },
    { id: "microsoft", name: "Microsoft Corporate", category: "professional", icon: "fa-windows", color: "text-info", desc: "Polished blue header block, standard serif listings. Matches corporate standards. Ideal for operations managers and analysts." },
    { id: "amazon", name: "Amazon Style Engineer", category: "tech", icon: "fa-amazon", color: "text-warning", desc: "Sleek compact layout optimizing space for engineering skills listings. Excellent for software engineers, QA, and cloud architects." },
    { id: "ai_engineer", name: "AI Engineer Specialized", category: "tech", icon: "fa-robot", color: "text-primary", desc: "Designed explicitly for AI/ML specialists. Emphasizes technical stacks, models deployed, project github repos, and publications." },
    { id: "medical", name: "Medical Coding Standard", category: "professional", icon: "fa-user-doctor", color: "text-danger", desc: "Structured layout with dedicated spaces for certifications, medical credentials, and clinical rotation listings." },
    { id: "fresher", name: "Fresher Entry-Level", category: "minimalist", icon: "fa-seedling", color: "text-success", desc: "Emphasizes education, internships, academic projects, and certifications. Designed to present maximum value for candidates without professional experience." },
    { id: "developer", name: "Software Developer Custom", category: "tech", icon: "fa-code", color: "text-success", desc: "Layout showcasing project repositories, stack categorizations, and system architectures designed for programmers." },
    { id: "data_analyst", name: "Data Analyst / Scientist", category: "tech", icon: "fa-chart-pie", color: "text-info", desc: "Presents dashboards built, quantitative metrics achieved, and tool proficiencies. Best for statisticians and analysts." }
];

let selectedCategory = "all";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", () => {
    renderTemplatesDirectory();
});

function renderTemplatesDirectory() {
    const grid = document.getElementById("templates-directory-grid");
    if (!grid) return;
    
    // Filter template list
    const filtered = ALL_TEMPLATES.filter(t => {
        const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5 text-secondary animate-fade-in">
                <i class="fa-solid fa-folder-open display-4 mb-3 text-warning"></i>
                <h5>No Templates Found</h5>
                <p class="small">Try refining your search keyword or selecting a different category.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = filtered.map(t => {
        return `
            <div class="col-md-6 col-lg-4 animate-fade-in">
                <div class="glass-card p-3 h-100 d-flex flex-column justify-content-between template-card">
                    <div class="position-relative overflow-hidden rounded mb-3 template-preview-mockup">
                        <i class="fa-solid ${t.icon} ${t.color} display-3 opacity-75"></i>
                        <div class="position-absolute bottom-0 start-0 w-100 bg-black bg-opacity-65 py-2 text-white small text-center text-capitalize">${t.category}</div>
                    </div>
                    <div>
                        <h5 class="fw-bold mb-1 text-white">${t.name}</h5>
                        <p class="small text-secondary mb-3 text-truncate-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; height: 60px;">${t.desc}</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button onclick="openCanvaPreview('${t.id}')" class="btn btn-outline-light btn-sm flex-fill">Preview</button>
                        <button onclick="useTemplateOnLanding('${t.id}')" class="btn btn-glass-primary btn-sm flex-fill">Customize</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function filterCategory(category, event) {
    if (event) event.preventDefault();
    selectedCategory = category;
    
    // Update active class on sidebar links
    const links = document.querySelectorAll(".sidebar-links .nav-link");
    links.forEach(l => {
        l.classList.remove("active");
        if (l.textContent.toLowerCase().includes(category) || (category === "all" && l.textContent.toLowerCase().includes("all"))) {
            l.classList.add("active");
        }
    });
    
    renderTemplatesDirectory();
}

function filterTemplates() {
    searchQuery = document.getElementById("template-search").value;
    renderTemplatesDirectory();
}

function openCanvaPreview(templateId) {
    const template = ALL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    // Set details inside modal
    document.getElementById("preview-modal-title").textContent = template.name;
    document.getElementById("preview-modal-desc").textContent = template.desc;
    document.getElementById("preview-modal-category").textContent = template.category;
    
    const icon = document.getElementById("preview-modal-icon");
    icon.className = `fa-solid ${template.icon} ${template.color} display-1 mb-3`;
    
    const useBtn = document.getElementById("preview-modal-use-btn");
    useBtn.onclick = () => {
        // Close modal first
        const modalEl = document.getElementById("canvaPreviewModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        
        useTemplateOnLanding(templateId);
    };
    
    // Trigger bootstrap modal
    const modalEl = document.getElementById("canvaPreviewModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}
