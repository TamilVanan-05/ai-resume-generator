import random
import string
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auth_utils")

def generate_verification_code(length=6):
    """Generates a random 6-character verification code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def send_verification_email(email, code):
    """Simulates sending a verification email to the user."""
    logger.info(f"==================================================")
    logger.info(f"SIMULATED EMAIL TO: {email}")
    logger.info(f"SUBJECT: Verify Your AI Resume Account")
    logger.info(f"Verification Code: {code}")
    logger.info(f"Link: http://localhost:5000/auth/verify?email={email}&code={code}")
    logger.info(f"==================================================")
    return True

def send_password_reset_email(email, reset_token):
    """Simulates sending a password reset email."""
    logger.info(f"==================================================")
    logger.info(f"SIMULATED EMAIL TO: {email}")
    logger.info(f"SUBJECT: Reset Your AI Resume Password")
    logger.info(f"Reset Link: http://localhost:5000/auth/reset?token={reset_token}")
    logger.info(f"==================================================")
    return True
