// Client-Side Shared Resume View State Engine

let resumeData = null;

document.addEventListener("DOMContentLoaded", () => {
    loadPublicResume();
    
    // Auto-scaling responsive layout listeners
    window.addEventListener("resize", adjustCanvasScale);
});

function getResumeIdFromUrl() {
    // URL format: http://host/share/1
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1];
}

async function loadPublicResume() {
    const resumeId = getResumeIdFromUrl();
    const canvas = document.getElementById("resume-canvas");
    
    try {
        const response = await fetch(`${window.APP_CONFIG.apiBaseUrl}/api/resumes/public/${resumeId}`);
        const data = await response.json();
        
        if (response.ok) {
            resumeData = data;
            
            // Set Page Title
            document.title = `${data.content.personal.name || 'Resume'} - Shared via Resum.AI`;
            document.getElementById("public-title").textContent = `${data.content.personal.name || 'User'}'s Resume`;
            
            // Render Template HTML
            const renderer = window.TEMPLATE_RENDERERS[data.template_name] || window.TEMPLATE_RENDERERS.modern;
            const htmlOutput = renderer(data.content, data.custom_styling);
            
            canvas.innerHTML = htmlOutput;
            canvas.className = "resume-canvas";
            canvas.classList.add(`template-${data.template_name}`);
            canvas.classList.add(data.custom_styling.font_size);
            canvas.classList.add(data.custom_styling.spacing);
            
            // CSS accent styling properties
            canvas.style.setProperty("--theme-color", data.custom_styling.theme_color);
            
            const fontMap = {
                "Inter": "'Inter', sans-serif",
                "Arial": "Arial, sans-serif",
                "Georgia": "Georgia, serif",
                "Times New Roman": "'Times New Roman', serif",
                "Segoe UI": "'Segoe UI', sans-serif"
            };
            canvas.style.fontFamily = fontMap[data.custom_styling.font_family] || "'Inter', sans-serif";
            
            // Auto scale layout to fit screen size
            setTimeout(adjustCanvasScale, 100);
            
        } else {
            canvas.className = "text-center py-5 text-danger animate-fade-in";
            canvas.innerHTML = `
                <i class="fa-solid fa-lock fs-1 mb-3 text-warning"></i>
                <h3 class="fw-bold">Access Denied</h3>
                <p class="text-secondary small">${data.message || 'This resume is set to private or does not exist.'}</p>
                <a href="/" class="btn btn-outline-light btn-sm mt-3">Back to homepage</a>
            `;
        }
    } catch (err) {
        console.error(err);
        canvas.className = "text-center py-5 text-danger";
        canvas.innerHTML = `<p>Error connecting to API server.</p>`;
    }
}

function adjustCanvasScale() {
    const canvas = document.getElementById("resume-canvas");
    const holder = document.getElementById("preview-canvas-holder");
    if (!canvas || !holder || !resumeData) return;
    
    const canvasWidth = 794; 
    const parentWidth = holder.clientWidth || holder.parentElement.clientWidth;
    
    const scale = (parentWidth - 20) / canvasWidth;
    const finalScale = Math.min(1.0, scale);
    
    canvas.style.transform = `scale(${finalScale})`;
    
    const canvasHeight = canvas.offsetHeight || 1122;
    holder.style.height = `${canvasHeight * finalScale}px`;
}

function exportPDF() {
    const element = document.getElementById('resume-canvas');
    if (!element || !resumeData) return;
    
    const holder = document.getElementById("preview-canvas-holder");
    const prevTransform = holder.style.transform;
    holder.style.transform = "scale(1.0)";
    
    const filename = `${resumeData.content.personal.name || 'resume'}_shared_cv.pdf`;
    
    const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        holder.style.transform = prevTransform;
    }).catch(err => {
        console.error(err);
        holder.style.transform = prevTransform;
    });
}
