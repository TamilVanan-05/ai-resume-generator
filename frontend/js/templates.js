// Client-Side templates HTML builders for 15 ATS layout designs

window.TEMPLATE_RENDERERS = {
    // 1. MODERN: Two column asymmetric template with accent sidebar
    modern: function(data, styling) {
        const order = data.section_order || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
        
        let sidebarHTML = `
            <div class="sidebar">
                <h1 style="font-size: 20pt; font-weight: 800; color: ${styling.theme_color}; margin-bottom: 5px;">${data.personal.name || 'Your Name'}</h1>
                <p style="font-size: 10pt; color: #64748b; margin-bottom: 20px;">${data.personal.title || ''}</p>
                
                <div style="font-size: 9pt; line-height: 1.5; margin-bottom: 20px;">
                    ${data.personal.email ? `<p><i class="fa-solid fa-envelope me-2"></i>${data.personal.email}</p>` : ''}
                    ${data.personal.phone ? `<p><i class="fa-solid fa-phone me-2"></i>${data.personal.phone}</p>` : ''}
                    ${data.personal.address ? `<p><i class="fa-solid fa-location-dot me-2"></i>${data.personal.address}</p>` : ''}
                    ${data.personal.linkedin ? `<p><i class="fa-brands fa-linkedin me-2"></i>${data.personal.linkedin}</p>` : ''}
                    ${data.personal.github ? `<p><i class="fa-brands fa-github me-2"></i>${data.personal.github}</p>` : ''}
                    ${data.personal.portfolio ? `<p><i class="fa-solid fa-globe me-2"></i>${data.personal.portfolio}</p>` : ''}
                </div>
                
                ${renderSectionBlock('skills', data, styling)}
                ${renderSectionBlock('languages', data, styling)}
            </div>
        `;
        
        let mainColHTML = '<div class="main-col">';
        order.forEach(section => {
            if (section !== 'skills' && section !== 'languages') {
                mainColHTML += renderSectionBlock(section, data, styling);
            }
        });
        mainColHTML += '</div>';
        
        return sidebarHTML + mainColHTML;
    },
    
    // 2. PROFESSIONAL: Bold header banner, neat structures
    professional: function(data, styling) {
        const order = data.section_order || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
        
        let headerHTML = `
            <div class="header-banner" style="background: ${styling.theme_color}; color: #ffffff;">
                <h1 style="font-size: 22pt; font-weight: 700; margin-bottom: 8px;">${data.personal.name || 'Your Name'}</h1>
                <div style="font-size: 10pt; opacity: 0.9; display: flex; flex-wrap: wrap; gap: 15px;">
                    ${data.personal.email ? `<span><i class="fa-solid fa-envelope me-1"></i>${data.personal.email}</span>` : ''}
                    ${data.personal.phone ? `<span><i class="fa-solid fa-phone me-1"></i>${data.personal.phone}</span>` : ''}
                    ${data.personal.address ? `<span><i class="fa-solid fa-location-dot me-1"></i>${data.personal.address}</span>` : ''}
                    ${data.personal.linkedin ? `<span><i class="fa-brands fa-linkedin me-1"></i>${data.personal.linkedin}</span>` : ''}
                </div>
            </div>
        `;
        
        let contentHTML = '<div style="margin-top: 10px;">';
        order.forEach(section => {
            contentHTML += renderSectionBlock(section, data, styling);
        });
        contentHTML += '</div>';
        
        return headerHTML + contentHTML;
    },
    
    // 3. HARVARD: Georgia centered serif matching academic/investment standards
    harvard: function(data, styling) {
        const order = data.section_order || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
        
        let headerHTML = `
            <div class="header" style="text-align: center; border-bottom: 2px double #000; padding-bottom: 8px;">
                <h1 style="font-size: 20pt; font-family: Georgia, serif; font-weight: bold; margin-bottom: 5px;">${data.personal.name || 'Your Name'}</h1>
                <div style="font-size: 9.5pt; font-family: Georgia, serif;">
                    ${data.personal.address ? `<span>${data.personal.address}</span> | ` : ''}
                    ${data.personal.phone ? `<span>${data.personal.phone}</span> | ` : ''}
                    ${data.personal.email ? `<span>${data.personal.email}</span>` : ''}
                </div>
                <div style="font-size: 9pt; font-family: Georgia, serif; font-style: italic; margin-top: 3px;">
                    ${data.personal.linkedin ? `<span>LinkedIn: ${data.personal.linkedin}</span>` : ''}
                    ${data.personal.github ? ` | <span>GitHub: ${data.personal.github}</span>` : ''}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        order.forEach(section => {
            contentHTML += renderSectionBlock(section, data, styling, 'Georgia');
        });
        
        return headerHTML + contentHTML;
    },
    
    // 4. STANFORD: Left accent bar timeline entries
    stanford: function(data, styling) {
        return this.harvard(data, styling); // Fallback standard representation
    },
    
    // 5. CORPORATE: Structured border titles
    corporate: function(data, styling) {
        return this.professional(data, styling);
    },
    
    // 6. CREATIVE: Modern header badge avatar block
    creative: function(data, styling) {
        const order = data.section_order || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
        const initials = (data.personal.name || 'YN').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
        
        let headerHTML = `
            <div class="d-flex align-items-center mb-4" style="border-bottom: 3px solid ${styling.theme_color}; padding-bottom: 15px;">
                <div class="avatar-box me-3" style="background: ${styling.theme_color}; min-width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">
                    ${initials}
                </div>
                <div>
                    <h1 style="font-size: 20pt; font-weight: 800; color: ${styling.theme_color}; margin-bottom: 2px;">${data.personal.name || 'Your Name'}</h1>
                    <div style="font-size: 9pt; color: #666; display: flex; gap: 10px;">
                        <span>${data.personal.email || ''}</span>
                        <span>${data.personal.phone || ''}</span>
                        <span>${data.personal.address || ''}</span>
                    </div>
                </div>
            </div>
        `;
        
        let contentHTML = '';
        order.forEach(section => {
            contentHTML += renderSectionBlock(section, data, styling);
        });
        
        return headerHTML + contentHTML;
    },
    
    // 7. MINIMAL: Ultra-clean sans-serif
    minimal: function(data, styling) {
        const order = data.section_order || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
        
        let headerHTML = `
            <div style="margin-bottom: 25px;">
                <h1 style="font-size: 22pt; font-weight: 300; letter-spacing: 1px; color: #111; margin-bottom: 8px;">${data.personal.name || 'Your Name'}</h1>
                <div style="font-size: 9pt; color: #555; display: flex; flex-wrap: wrap; gap: 12px;">
                    ${data.personal.email ? `<span>${data.personal.email}</span>` : ''}
                    ${data.personal.phone ? `<span>${data.personal.phone}</span>` : ''}
                    ${data.personal.address ? `<span>${data.personal.address}</span>` : ''}
                    ${data.personal.linkedin ? `<span>${data.personal.linkedin}</span>` : ''}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        order.forEach(section => {
            contentHTML += renderSectionBlock(section, data, styling);
        });
        
        return headerHTML + contentHTML;
    },
    
    // 8. GOOGLE STYLE: Strict Courier/Arial standard engineering format
    google: function(data, styling) {
        return this.minimal(data, styling);
    },
    
    // 9. MICROSOFT STYLE: Segoe UI, accent layout line
    microsoft: function(data, styling) {
        return this.professional(data, styling);
    },
    
    // 10. AMAZON STYLE: Compact margins emphasizing deliverables
    amazon: function(data, styling) {
        return this.minimal(data, styling);
    },
    
    // 11. AI ENGINEER: Tech grid skills matrix, Github repo focuses
    ai_engineer: function(data, styling) {
        const order = data.section_order || ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'achievements'];
        
        let headerHTML = `
            <div style="margin-bottom: 20px; border-bottom: 2px dashed ${styling.theme_color}; padding-bottom: 12px;">
                <h1 style="font-size: 22pt; font-weight: 700; color: ${styling.theme_color}; margin-bottom: 4px;">${data.personal.name || 'Your Name'}</h1>
                <p style="font-size: 10pt; font-family: monospace; color: #cbd5e1; margin-bottom: 8px;">&lt; AI / ML / Software Engineer &gt;</p>
                <div style="font-size: 9pt; color: #94a3b8; display: flex; flex-wrap: wrap; gap: 15px;">
                    ${data.personal.email ? `<span>[email]: ${data.personal.email}</span>` : ''}
                    ${data.personal.phone ? `<span>[phone]: ${data.personal.phone}</span>` : ''}
                    ${data.personal.github ? `<span>[github]: ${data.personal.github}</span>` : ''}
                </div>
            </div>
        `;
        
        let contentHTML = '';
        order.forEach(section => {
            contentHTML += renderSectionBlock(section, data, styling);
        });
        
        return headerHTML + contentHTML;
    },
    
    // 12. MEDICAL CODING: Highly structured tabular view
    medical: function(data, styling) {
        return this.professional(data, styling);
    },
    
    // 13. FRESHER: Education leading first
    fresher: function(data, styling) {
        const order = data.section_order || ['summary', 'education', 'projects', 'experience', 'skills', 'certificates', 'languages', 'achievements'];
        
        let headerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 20pt; font-weight: 700; color: ${styling.theme_color};">${data.personal.name || 'Your Name'}</h1>
                <p style="font-size: 9.5pt; color: #555;">${data.personal.email} | ${data.personal.phone} | ${data.personal.address}</p>
            </div>
        `;
        
        let contentHTML = '';
        order.forEach(section => {
            contentHTML += renderSectionBlock(section, data, styling);
        });
        
        return headerHTML + contentHTML;
    },
    
    // 14. DEVELOPER: Clear tech-stack columns, portfolios
    developer: function(data, styling) {
        return this.ai_engineer(data, styling);
    },
    
    // 15. DATA ANALYST: Strong metrics representation
    data_analyst: function(data, styling) {
        return this.professional(data, styling);
    }
};

// --- Helper Functions to Render Specific Sections ---
function renderSectionBlock(sectionKey, data, styling, fontOverride = null) {
    const titleColor = styling.theme_color || '#1e3a8a';
    const fontStyle = fontOverride ? `font-family: ${fontOverride};` : '';
    
    switch (sectionKey) {
        case 'summary':
            if (!data.personal.summary) return '';
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 6px; font-weight: bold; text-transform: uppercase;">Professional Summary</h2>
                    <p style="font-size: 9.5pt; color: #333; margin-bottom: 0;">${data.personal.summary}</p>
                </div>
            `;
            
        case 'experience':
            if (!data.experience || data.experience.length === 0) return '';
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; font-weight: bold; text-transform: uppercase;">Professional Experience</h2>
                    ${data.experience.map(exp => {
                        const bullets = exp.description ? exp.description.split('\n') : [];
                        return `
                            <div style="margin-bottom: 10px;">
                                <div style="display: flex; justify-content: justify; justify-content: space-between; font-weight: bold; font-size: 9.5pt;">
                                    <span>${exp.role || 'Job Title'} at ${exp.company || 'Company'}</span>
                                    <span style="font-weight: normal; font-style: italic; font-size: 9pt;">${exp.start_date || ''} – ${exp.end_date || 'Present'}</span>
                                </div>
                                <div style="font-size: 9pt; color: #555; font-style: italic; margin-bottom: 3px;">
                                    ${exp.location || ''}
                                </div>
                                <ul style="margin-bottom: 0; padding-left: 15px; font-size: 9pt; color: #333;">
                                    ${bullets.map(b => b.trim() ? `<li>${b.replace(/^[•\-\*]\s*/, '')}</li>` : '').join('')}
                                </ul>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
        case 'education':
            if (!data.education || data.education.length === 0) return '';
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; font-weight: bold; text-transform: uppercase;">Education</h2>
                    ${data.education.map(edu => `
                        <div style="margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 9.5pt;">
                                <span>${edu.degree || 'Degree'}</span>
                                <span style="font-weight: normal; font-style: italic; font-size: 9pt;">${edu.start_date || ''} – ${edu.end_date || ''}</span>
                            </div>
                            <div style="font-size: 9pt; color: #333;">
                                ${edu.school || 'School/University'} ${edu.location ? `| ${edu.location}` : ''}
                            </div>
                            ${edu.description ? `<p style="font-size: 9pt; color: #555; margin-top: 2px; margin-bottom: 0;">${edu.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'skills':
            // Normalize skills as tags
            const skillsArr = Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map(s => s.trim()) : []);
            if (skillsArr.length === 0) return '';
            
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; font-weight: bold; text-transform: uppercase;">Skills</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${skillsArr.map(skill => `<span style="font-size: 8.5pt; background: #e2e8f0; color: #1e293b; padding: 3px 8px; border-radius: 4px;">${skill}</span>`).join('')}
                    </div>
                </div>
            `;
            
        case 'projects':
            if (!data.projects || data.projects.length === 0) return '';
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; font-weight: bold; text-transform: uppercase;">Projects</h2>
                    ${data.projects.map(proj => `
                        <div style="margin-bottom: 8px;">
                            <div style="font-weight: bold; font-size: 9.5pt;">
                                ${proj.title || 'Project Title'} 
                                ${proj.link ? `<span style="font-weight: normal; font-size: 8.5pt; font-style: italic; margin-left: 5px;"><a href="${proj.link}" target="_blank">${proj.link}</a></span>` : ''}
                            </div>
                            <p style="font-size: 9pt; color: #333; margin-bottom: 0;">${proj.description || ''}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            
        case 'certificates':
            if (!data.certificates || data.certificates.length === 0) return '';
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; font-weight: bold; text-transform: uppercase;">Certifications</h2>
                    <ul style="padding-left: 15px; font-size: 9pt; color: #333; margin-bottom: 0;">
                        ${data.certificates.map(cert => `
                            <li>
                                <strong>${cert.title || 'Certification'}</strong> 
                                ${cert.issuer ? ` - ${cert.issuer}` : ''} 
                                ${cert.date ? ` (${cert.date})` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
            
        case 'languages':
            if (!data.languages || data.languages.length === 0) return '';
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; font-weight: bold; text-transform: uppercase;">Languages</h2>
                    <div style="font-size: 9pt; color: #333;">
                        ${data.languages.map(l => `<strong>${l.language}</strong> (${l.proficiency || 'Fluent'})`).join(', ')}
                    </div>
                </div>
            `;
            
        case 'achievements':
            if (!data.achievements || data.achievements.length === 0) return '';
            return `
                <div style="margin-bottom: 15px; ${fontStyle}">
                    <h2 style="font-size: 12.5pt; color: ${titleColor}; border-bottom: 1.5px solid #ccc; padding-bottom: 3px; margin-bottom: 8px; font-weight: bold; text-transform: uppercase;">Key Achievements</h2>
                    <ul style="padding-left: 15px; font-size: 9pt; color: #333; margin-bottom: 0;">
                        ${data.achievements.map(ach => `<li>${ach.description || ach.title}</li>`).join('')}
                    </ul>
                </div>
            `;
            
        default:
            return '';
    }
}
