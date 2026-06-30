import unittest
import json
import os
import sys

# Adjust path to find backend files correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database import db
from models import User, Resume
from api.ats import analyze_resume_text

class APITestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        self.app = create_app()
        self.app.config['TESTING'] = True
        # Use an in-memory SQLite database for testing to avoid overwriting dev db
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            
    def test_signup_and_verify(self):
        # 1. Register Account
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "securepassword123"
        }
        res = self.client.post("/auth/signup", json=payload)
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("dev_bypass_code", data)
        
        code = data["dev_bypass_code"]
        
        # 2. Verify Email
        verify_payload = {
            "email": "test@example.com",
            "code": code
        }
        res_verify = self.client.post("/auth/verify-email", json=verify_payload)
        self.assertEqual(res_verify.status_code, 201)
        verify_data = json.loads(res_verify.data)
        self.assertIn("access_token", verify_data)
        self.assertEqual(verify_data["user"]["name"], "Test User")

    def test_invalid_login(self):
        # Try logging in before signing up
        login_payload = {
            "email": "ghost@example.com",
            "password": "wrongpassword"
        }
        res = self.client.post("/auth/login", json=login_payload)
        self.assertEqual(res.status_code, 401)

    def test_ats_analysis_engine(self):
        # Construct a mock resume content payload
        mock_content = {
            "personal": {
                "name": "Developer Joe",
                "email": "joe@dev.com",
                "phone": "+1 555-0199",
                "linkedin": "linkedin.com/in/joe",
                "github": "github.com/joe",
                "address": "San Francisco, CA",
                "summary": "Experienced engineer specializing in cloud deployments and scaling REST APIs."
            },
            "skills": ["Python", "Flask", "SQL", "Docker", "AWS"],
            "experience": [
                {
                    "role": "Software Architect",
                    "company": "Tech Corp",
                    "start_date": "2023",
                    "end_date": "Present",
                    "description": "Spearheaded redevelopment of core services. Engineered distributed database structures, resulting in a 30% reduction in API response times. Managed $10k cloud infrastructure budget."
                }
            ],
            "education": [
                {
                    "degree": "B.S. Computer Science",
                    "school": "University of Tech",
                    "start_date": "2019",
                    "end_date": "2023"
                }
            ],
            "projects": [
                {
                    "title": "AI Image Filter",
                    "description": "Designed a deep learning pipeline to clean photo inputs.",
                    "link": "github.com/joe/filter"
                }
            ]
        }
        
        # Execute ATS scoring analysis algorithm direct call
        evaluation = analyze_resume_text(mock_content, job_description="Looking for Python Flask Developer with SQL and Docker experience")
        
        # Verify grading ranges
        self.assertGreater(evaluation["score"], 50)
        self.assertEqual(evaluation["breakdown"]["contact_info"], 20) # Has all contacts
        self.assertEqual(evaluation["breakdown"]["sections"], 20) # Has all sections
        self.assertGreaterEqual(evaluation["breakdown"]["action_verbs"], 6) # Speaheaded, Engineered, etc.
        self.assertGreaterEqual(evaluation["breakdown"]["metrics"], 6) # 30%, $10k, etc.
        self.assertGreater(evaluation["match_percentage"], 0) # Keywords matched

if __name__ == '__main__':
    unittest.main()
