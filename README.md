# Resum.AI - Full-Stack AI Resume Generator & ATS Grader

An advanced, production-ready AI Resume Generator Website featuring glassmorphic design elements, a real-time ATS scoring diagnostic engine, and 15 custom recruiter-optimized PDF templates. Powered by **Google Gemini 1.5 Flash**.

---

## Features

1. **AI Resumes Creator Form**: 9-step accordion workspace capturing Personal details, Professional summaries, Education milestones, Work histories, Core skills, Work projects, Certificates, Languages, and key Accomplishments.
2. **Google Gemini Integration**: 
   - Generates polished professional profile summaries.
   - Optimizes experience bullet points using the Google XYZ formula (accomplished X, measured by Y, by doing Z).
   - Dynamically recommends relevant career skills based on target job title.
   - Builds custom cover letters and LinkedIn profile bios.
3. **ATS Diagnostics Engine**: Grades resume elements out of 100 on contact info, sections, active verbs, numeric impact metrics, and target job description keywords.
4. **15 Recruiter-Approved Layouts**: Supports Modern, Corporate, Harvard academic standard, Google, Microsoft, AI Engineer, Data Analyst, and entry-level layouts.
5. **Interactive Customizer**: Real-time adjustment of theme accents, fonts (Inter, Arial, Georgia, Times), page margins, line heights, and section layout reordering (via layout drag/move panel).
6. **Multi-Format Exports**: 
   - Pixel-perfect PDF rendering directly on client side using `html2pdf.js`.
   - Structured ATS-compliant DOCX file export from backend via `python-docx`.
7. **Role-Based Workspaces**: Users Dashboard portal for cloning, editing, and checking historical reports; Administrative Panel for tracking usage statistics, active templates, and deleting records.

---

## Tech Stack

### Frontend
- HTML5, CSS3 (Glassmorphism design language)
- Bootstrap 5 (Responsive layouts)
- Font Awesome 6 (Vector icons)
- AOS (Animate on Scroll library)
- Chart.js (Scoring radar grids)
- html2pdf.js & jsPDF (Client-side PDF renderers)

### Backend
- Python Flask (REST API, blueprints routing, asset server)
- SQLAlchemy (ORM)
- Flask-JWT-Extended (JSON Web Token security authentication)
- python-docx (Structured Word document compiler)

### Database
- SQLite (Local development default)
- MySQL (Production ready connection support)

---

## Getting Started

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Ai Resume prompt/Ai resum.Web"
   ```

2. **Create a virtual environment & install requirements**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r backend/requirements.txt
   ```

3. **Configure Environment variables**:
   Create a `.env` file in the root folder using `.env.example` as reference:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` obtained from the [Google AI Studio](https://aistudio.google.com/). If no API key is specified, the application will activate a smart, local rule-based completion helper fallback.

4. **Launch the Flask application**:
   ```bash
   python backend/app.py
   ```
   Open your browser and navigate to `http://localhost:5000`.

---

## Deployment Guide

### 1. Docker Deployment (Recommended)
Build and run the production image using docker-compose:
```bash
docker-compose up --build -d
```
Docker container maps Gunicorn on port `5000` with automated SQLite persistence.

### 2. Render / Railway Deployment
1. Connect your Github repository tree.
2. Select **Python Web Service** runtime environment.
3. Configure build command:
   ```bash
   pip install -r backend/requirements.txt && pip install gunicorn
   ```
4. Configure start command:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:$PORT "backend.app:create_app()"
   ```
5. Add configuration env variables: `SECRET_KEY`, `JWT_SECRET_KEY`, and `GEMINI_API_KEY`.

### 3. Vercel Deployment
To deploy as a serverless static website redirecting backend APIs:
1. Setup a standard Flask serverless configuration structure using a `vercel.json` rewrite file mapping `/api` to `backend/app.py`.
