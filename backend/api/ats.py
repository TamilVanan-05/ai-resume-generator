import re
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Resume, ATSReport
from . import api_bp

# Predefined standard resume action verbs
ACTION_VERBS = {
    'spearheaded', 'designed', 'engineered', 'implemented', 'managed', 'optimized',
    'developed', 'led', 'executed', 'collaborated', 'accelerated', 'achieved',
    'maximized', 'minimized', 'formulated', 'streamlined', 'coordinated', 'overhauled',
    'increased', 'decreased', 'delivered', 'established', 'launched', 'resolved'
}

def analyze_resume_text(resume_content, job_description=""):
    """
    Core algorithm that checks resume completeness, contact info, structure, 
    action verbs, numbers (quantifiables), and matches keywords.
    """
    score_breakdown = {
        'contact_info': 20,
        'sections': 20,
        'action_verbs': 20,
        'metrics': 20,
        'keyword_match': 20
    }
    
    suggestions = []
    
    # 1. Contact Info Verification
    personal = resume_content.get('personal', {})
    contact_score = 20
    missing_contact = []
    
    if not personal.get('email'):
        contact_score -= 5
        missing_contact.append('Email Address')
    if not personal.get('phone'):
        contact_score -= 5
        missing_contact.append('Phone Number')
    if not personal.get('linkedin'):
        contact_score -= 4
        missing_contact.append('LinkedIn Profile')
    if not personal.get('github') and not personal.get('portfolio'):
        contact_score -= 3
        missing_contact.append('GitHub or Portfolio Link')
    if not personal.get('address'):
        contact_score -= 3
        missing_contact.append('Physical Address')
        
    score_breakdown['contact_info'] = max(0, contact_score)
    if missing_contact:
        suggestions.append({
            'section': 'Contact Information',
            'severity': 'medium' if len(missing_contact) < 3 else 'high',
            'message': f"Missing contact items: {', '.join(missing_contact)}. Adding these helps recruiters reach you."
        })

    # 2. Sections presence
    section_score = 20
    missing_sections = []
    
    experience = resume_content.get('experience', [])
    education = resume_content.get('education', [])
    skills = resume_content.get('skills', [])
    projects = resume_content.get('projects', [])
    
    if not experience:
        section_score -= 7
        missing_sections.append('Experience')
    if not education:
        section_score -= 5
        missing_sections.append('Education')
    if not skills:
        section_score -= 5
        missing_sections.append('Skills')
    if not projects:
        section_score -= 3
        missing_sections.append('Projects')
        
    score_breakdown['sections'] = max(0, section_score)
    if missing_sections:
        suggestions.append({
            'section': 'Resume Structure',
            'severity': 'high',
            'message': f"Crucial sections missing from resume: {', '.join(missing_sections)}. Complete these to meet baseline criteria."
        })

    # Concatenate all resume text to perform text searches
    full_text = ""
    # Add personal details
    full_text += f" {personal.get('name', '')} {personal.get('summary', '')}"
    
    # Add experience descriptions
    exp_text = ""
    for exp in experience:
        exp_text += f" {exp.get('role', '')} {exp.get('company', '')} {exp.get('description', '')}"
    full_text += exp_text
    
    # Add skills
    if isinstance(skills, list):
        full_text += " " + " ".join(skills)
    elif isinstance(skills, str):
        full_text += " " + skills
        
    # Add projects
    for proj in projects:
        full_text += f" {proj.get('title', '')} {proj.get('description', '')}"
        
    # Lowercase full text for pattern matching
    full_text_lower = full_text.lower()
    
    # 3. Action Verbs analysis
    found_verbs = [verb for verb in ACTION_VERBS if re.search(r'\b' + verb + r'\b', full_text_lower)]
    verbs_count = len(found_verbs)
    
    if verbs_count >= 6:
        verbs_score = 20
    elif verbs_count >= 3:
        verbs_score = 12
    elif verbs_count >= 1:
        verbs_score = 6
    else:
        verbs_score = 0
        
    score_breakdown['action_verbs'] = verbs_score
    if verbs_count < 5:
        suggestions.append({
            'section': 'Experience Writing',
            'severity': 'medium',
            'message': f"Found only {verbs_count} active power verbs. Use strong action verbs (e.g. 'spearheaded', 'engineered') to start work descriptions."
        })

    # 4. Quantifiable metrics analysis (numbers, percentage signs, currency)
    # Regex to find numbers, currency symbols ($ or €), or percentages (%)
    metrics_matches = re.findall(r'\b\d+(?:%|\s*percent\b|\s*million\b|\s*k\b)?\b|[\$\€\£]\s*\d+', full_text)
    metrics_count = len(metrics_matches)
    
    if metrics_count >= 5:
        metrics_score = 20
    elif metrics_count >= 3:
        metrics_score = 12
    elif metrics_count >= 1:
        metrics_score = 6
    else:
        metrics_score = 0
        
    score_breakdown['metrics'] = metrics_score
    if metrics_count < 4:
        suggestions.append({
            'section': 'Quantifiable Metrics',
            'severity': 'high' if metrics_count == 0 else 'medium',
            'message': f"Found {metrics_count} quantitative achievements. Boost credibility by adding measurable figures (e.g. 'reduced cost by 15%', 'managed $5k budget')."
        })

    # 5. Keyword Match against Job Description
    kw_found = []
    match_pct = 0
    kw_score = 20
    
    if job_description:
        # Simple extraction of keywords from job description (words > 4 chars, excluding common stopwords)
        stopwords = {
            'their', 'about', 'would', 'there', 'their', 'which', 'project', 'experience',
            'skills', 'working', 'ability', 'knowledge', 'strong', 'years', 'using', 'requirements'
        }
        jd_words = re.findall(r'\b[a-zA-Z]{4,15}\b', job_description.lower())
        jd_keywords = set([w for w in jd_words if w not in stopwords])
        
        # Check matching
        matches = [kw for kw in jd_keywords if re.search(r'\b' + kw + r'\b', full_text_lower)]
        if jd_keywords:
            match_pct = int((len(matches) / len(jd_keywords)) * 100)
            kw_score = int((len(matches) / len(jd_keywords)) * 20)
            kw_found = matches[:15]  # Limit to top 15 found
            
        score_breakdown['keyword_match'] = kw_score
        
        if match_pct < 40:
            suggestions.append({
                'section': 'Keyword Optimization',
                'severity': 'high',
                'message': f"Low keyword match ({match_pct}%). Tailor your resume to include terms from the job description like: {', '.join(list(jd_keywords - set(matches))[:6])}."
            })
    else:
        # Default neutral keyword match score if no JD is supplied
        score_breakdown['keyword_match'] = 15
        match_pct = 75
        suggestions.append({
            'section': 'Keyword Optimization',
            'severity': 'low',
            'message': "Add a target Job Description in the editor's ATS tab to calculate exact keyword matching matches."
        })
        
    total_score = sum(score_breakdown.values())
    
    # Final length checks
    word_count = len(full_text.split())
    if word_count < 150:
        total_score = max(10, total_score - 15)
        suggestions.append({
            'section': 'Resume Length',
            'severity': 'high',
            'message': f"Resume is too short ({word_count} words). Aim for at least 300 words to provide adequate professional depth."
        })
    elif word_count > 1000:
        total_score = max(20, total_score - 10)
        suggestions.append({
            'section': 'Resume Length',
            'severity': 'medium',
            'message': f"Resume is very long ({word_count} words). ATS engines and human screeners prefer concise, 1-2 page structures."
        })
        
    return {
        'score': min(100, max(0, total_score)),
        'breakdown': score_breakdown,
        'suggestions': suggestions,
        'keywords_found': kw_found,
        'match_percentage': match_pct
    }

@api_bp.route('/ats/score', methods=['POST'])
@jwt_required()
def check_ats():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    resume_id = data.get('resume_id')
    job_description = data.get('job_description', '')
    
    if not resume_id:
        # Accept ad-hoc content payload check as well
        resume_content = data.get('content')
        if not resume_content:
            return jsonify({'message': 'Missing resume details'}), 400
    else:
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if not resume:
            return jsonify({'message': 'Resume not found'}), 404
        resume_content = resume.content
        
    analysis = analyze_resume_text(resume_content, job_description)
    
    # Save the report in db if resume exists
    if resume_id:
        resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if resume:
            resume.ats_score = analysis['score']
            
            # Save historical report entry
            report = ATSReport(
                resume_id=resume_id,
                score=analysis['score'],
                issues=analysis['suggestions'],
                keywords_found=analysis['keywords_found'],
                match_percentage=analysis['match_percentage']
            )
            db.session.add(report)
            db.session.commit()
            
    return jsonify(analysis), 200

@api_bp.route('/ats/reports/<resume_id>', methods=['GET'])
@jwt_required()
def get_ats_reports(resume_id):
    user_id = int(get_jwt_identity())
    resume = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not resume:
        return jsonify({'message': 'Resume not found'}), 404
        
    reports = ATSReport.query.filter_by(resume_id=resume_id).order_by(ATSReport.checked_at.desc()).limit(10).all()
    return jsonify([r.to_dict() for r in reports]), 200
