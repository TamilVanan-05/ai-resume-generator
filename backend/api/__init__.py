from flask import Blueprint

api_bp = Blueprint('api', __name__)

from . import resume, ai, ats, templates, admin
