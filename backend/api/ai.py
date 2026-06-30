import os
import requests
import json
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import AIUsage, Resume
from . import api_bp
from config import Config

def call_gemini(prompt, system_instruction=None):
    """
    Helper function to query the Google Gemini 1.5 Flash API.
    If key is missing or request fails, falls back gracefully.
    """
    api_key = Config.GEMINI_API_KEY
    if not api_key:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
        
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code == 200:
            res_data = response.json()
            # Extract content text from Gemini JSON format
            text = res_data['candidates'][0]['content']['parts'][0]['text']
            return text.strip()
        else:
            print(f"Gemini API Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Exception during Gemini API call: {e}")
        return None

def track_usage(user_id, action_type, token_estimate=100):
    """Logs AI token usage into database."""
    try:
        usage = AIUsage(user_id=user_id, action_type=action_type, token_count=token_estimate)
        db.session.add(usage)
        db.session.commit()
    except Exception as e:
        print(f"Error logging AI usage: {e}")

# --- AI Generative Endpoints ---

@api_bp.route('/ai/summary', methods=['POST'])
@jwt_required()
def generate_summary():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    job_title = data.get('job_title', 'Professional')
    experience_summary = data.get('experience_summary', '')
    skills = data.get('skills', [])
    
    skills_str = ", ".join(skills) if isinstance(skills, list) else skills
    prompt = (
        f"Generate a professional, high-impact resume summary (3-4 sentences) for a '{job_title}' "
        f"possessing these skills: {skills_str}. "
        f"Key experience highlights: {experience_summary}. "
        f"Keep it concise, active, and tailored for ATS compatibility. Avoid generic buzzwords."
    )
    
    result = call_gemini(prompt, system_instruction="You are an expert executive resume writer.")
    
    # Fallback generator if API key is not configured or failed
    if not result:
        result = (
            f"Results-driven and highly motivated {job_title} with a proven track record of "
            f"leveraging core strengths in {skills_str or 'industry-best practices'} to drive operational success. "
            f"Experienced in {experience_summary or 'leading complex projects and delivering cross-functional solutions'}. "
            f"Adheres to high professional standards to optimize workflows, solve complex challenges, and contribute "
            f"meaningfully to team-oriented corporate goals."
        )
        
    track_usage(user_id, 'summary_gen', 150)
    return jsonify({'summary': result}), 200

@api_bp.route('/ai/optimize-bullets', methods=['POST'])
@jwt_required()
def optimize_bullets():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    raw_bullet = data.get('bullet_point', '')
    job_title = data.get('job_title', '')
    
    if not raw_bullet:
        return jsonify({'message': 'No bullet point text provided'}), 400
        
    prompt = (
        f"Rewrite the following resume experience bullet point to make it more professional, "
        f"impactful, and compatible with ATS engines. "
        f"Incorporate strong action verbs and structure it using the Google X-Y-Z formula "
        f"(Accomplished [X] as measured by [Y], by doing [Z]) if possible. "
        f"Job Title context: {job_title}. "
        f"Original: \"{raw_bullet}\" "
        f"Provide ONLY the rewritten bullet point text (no explanations or surrounding quotes)."
    )
    
    result = call_gemini(prompt, system_instruction="You are a professional ATS resume editor.")
    
    if not result:
        # Basic rule-based optimization fallback
        words = raw_bullet.strip().split()
        if words and words[0].lower() in ['worked', 'made', 'helped', 'did']:
            verb_map = {
                'worked': 'Spearheaded',
                'made': 'Engineered',
                'helped': 'Collaborated to optimize',
                'did': 'Executed'
            }
            words[0] = verb_map[words[0].lower()]
            result = " ".join(words) + " resulting in a 15% increase in operational efficiency."
        else:
            result = f"Spearheaded key initiatives: {raw_bullet} (optimized for quantitative business impact and scalability)."
            
    track_usage(user_id, 'bullets_opt', 80)
    return jsonify({'optimized_bullet': result}), 200

@api_bp.route('/ai/suggest-skills', methods=['POST'])
@jwt_required()
def suggest_skills():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    job_title = data.get('job_title', '')
    
    if not job_title:
        return jsonify({'message': 'No job title provided'}), 400
        
    prompt = (
        f"Provide a JSON list containing exactly 10 highly relevant skills and keywords "
        f"for a '{job_title}'. The skills should be a mix of technical hard skills and key soft skills. "
        f"Return ONLY a valid JSON array of strings, for example: [\"Skill1\", \"Skill2\"]. "
        f"Do not write markdown backticks or explanations."
    )
    
    result = call_gemini(prompt, system_instruction="You are a data analyst database query returning JSON lists.")
    
    skills = []
    if result:
        try:
            # Strip backticks if the model returned markdown
            clean_res = result.replace("```json", "").replace("```", "").strip()
            skills = json.loads(clean_res)
        except Exception:
            skills = []
            
    if not skills:
        # Fallback list for common jobs
        job_lower = job_title.lower()
        if 'software' in job_lower or 'developer' in job_lower or 'engineer' in job_lower:
            skills = ["JavaScript", "Python", "React.js", "Node.js", "Git", "REST APIs", "SQL", "Cloud Computing", "Agile Methodologies", "System Design"]
        elif 'data' in job_lower or 'analyst' in job_lower:
            skills = ["SQL", "Python", "Data Visualization", "Tableau", "Excel", "Statistical Analysis", "R Programming", "Pandas", "ETL", "Communication"]
        elif 'manager' in job_lower or 'management' in job_lower:
            skills = ["Project Management", "Agile/Scrum", "Strategic Planning", "Stakeholder Management", "Resource Allocation", "Risk Management", "Leadership", "Budgeting", "Product Strategy", "Cross-functional Collaboration"]
        else:
            skills = ["Communication", "Problem Solving", "Time Management", "Project Execution", "Teamwork", "Adaptability", "Data Analysis", "Leadership", "Technical Proficiency", "Critical Thinking"]
            
    track_usage(user_id, 'skills_gen', 50)
    return jsonify({'skills': skills}), 200

@api_bp.route('/ai/cover-letter', methods=['POST'])
@jwt_required()
def generate_cover_letter():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    resume_id = data.get('resume_id')
    job_title = data.get('job_title', 'Target Role')
    company_name = data.get('company_name', 'Target Company')
    job_description = data.get('job_description', '')
    
    resume_content = {}
    if resume_id:
        res = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
        if res:
            resume_content = res.content
            
    # Compile key resume parameters for AI context
    personal = resume_content.get('personal', {})
    name = personal.get('name', 'Applicant')
    skills = resume_content.get('skills', [])
    
    prompt = (
        f"Write a highly professional and tailored cover letter for {name} applying for the position of "
        f"'{job_title}' at '{company_name}'.\n"
        f"Applicant Key Skills: {', '.join(skills) if isinstance(skills, list) else ''}.\n"
        f"Target Job Description details: {job_description}.\n"
        f"Structure the letter with a formal heading, intro, body paragraphs focusing on value match, and call to action. "
        f"Ensure it flows naturally and does not sound generic."
    )
    
    result = call_gemini(prompt, system_instruction="You are an expert career coach and executive recruiter.")
    
    if not result:
        result = (
            f"Dear Hiring Team at {company_name},\n\n"
            f"I am writing to express my strong interest in the {job_title} position at your company. "
            f"With a solid background in executing complex projects and utilizing technical core competencies, "
            f"I am confident in my ability to immediately add value to your team.\n\n"
            f"Throughout my career, I have developed expertise in key domains, including: "
            f"{', '.join(skills[:5]) if isinstance(skills, list) and len(skills) > 0 else 'analytical problem-solving and cross-functional leadership'}. "
            f"I pride myself on my focus on quality, efficiency, and alignment with organizational goals. "
            f"Your company's commitment to innovation matches my career aspiration, and I would love "
            f"to bring my expertise to this opening.\n\n"
            f"Thank you for your time and consideration. I look forward to discussing how my skills and "
            f"background align with the needs of the {job_title} role.\n\n"
            f"Sincerely,\n{name}"
        )
        
    track_usage(user_id, 'cover_letter', 400)
    return jsonify({'cover_letter': result}), 200

@api_bp.route('/ai/linkedin-optimizer', methods=['POST'])
@jwt_required()
def linkedin_optimizer():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    resume_id = data.get('resume_id')
    
    if not resume_id:
        return jsonify({'message': 'No resume configuration provided'}), 400
        
    res = Resume.query.filter_by(id=resume_id, user_id=user_id).first()
    if not res:
        return jsonify({'message': 'Resume not found'}), 404
        
    personal = res.content.get('personal', {})
    skills = res.content.get('skills', [])
    experience = res.content.get('experience', [])
    
    experience_summary = ""
    for exp in experience[:2]:
        experience_summary += f"- {exp.get('role')} at {exp.get('company')}: {exp.get('description')}\n"
        
    prompt = (
        f"Based on this resume data, optimize a professional LinkedIn profile 'About' bio section "
        f"and suggest a professional Profile Headline. "
        f"Name: {personal.get('name')}\n"
        f"Key Skills: {', '.join(skills)}\n"
        f"Experience:\n{experience_summary}\n"
        f"Return the output in a clean JSON format containing keys 'headline' and 'about_section'. "
        f"Return ONLY valid JSON. No markdown backticks."
    )
    
    result = call_gemini(prompt, system_instruction="You are a social media branding expert for tech and business professionals.")
    
    response_data = None
    if result:
        try:
            clean_res = result.replace("```json", "").replace("```", "").strip()
            response_data = json.loads(clean_res)
        except Exception:
            response_data = None
            
    if not response_data:
        # Fallback profile branding
        title = personal.get('name', 'Professional')
        skills_sub = ", ".join(skills[:4]) if skills else "Technology & Management"
        response_data = {
            'headline': f"Passionate Professional | Specializing in {skills_sub} | driving business impact and innovation",
            'about_section': (
                f"I am a results-oriented professional with a strong interest in engineering quality, scalable solutions. "
                f"With hands-on experience in {skills_sub}, I thrive in solving complex problems "
                f"and building collaborative teams. Open to network and explore exciting initiatives in tech and product development."
            )
        }
        
    track_usage(user_id, 'linkedin_opt', 250)
    return jsonify(response_data), 200
