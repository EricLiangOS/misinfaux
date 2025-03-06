from flask import Blueprint, request, jsonify
from .controllers import analyze_text, analyze_url, bootstrap_simulation

api_bp = Blueprint('api', __name__)

@api_bp.route('/analyze/text', methods=['POST'])
def analyze_text_route():
    return analyze_text()

@api_bp.route('/analyze/url', methods=['POST'])
def analyze_url_route():
    return analyze_url()

@api_bp.route('/bootstrap', methods=['POST'])
def bootstrap_route():
    return bootstrap_simulation()