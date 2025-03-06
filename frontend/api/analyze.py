# /Users/ehliang/Desktop/Projects/misinfaux/misinfaux/frontend/api/analyze.py
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add path for imports
current_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(current_dir, "../../backend"))

from services.analyzer import calculate_shannon_entropy, calculate_kl_divergence
from models.ml_models import classify_text

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            text = data.get('text', '')

            if not text:
                self._send_response(400, {'error': 'No text provided'})
                return
                
            # Analyze the text
            entropy_score = calculate_shannon_entropy(text)
            kl_score = calculate_kl_divergence(text)
            
            # Use ML model to classify text
            classification, confidence = classify_text(text)
            
            # Return results
            result = {
                'classification': classification,
                'confidenceScore': confidence * 100,
                'entropyScore': entropy_score,
                'klDivergence': kl_score,
                # Add other metrics as needed
            }
            
            self._send_response(200, result)
            
        except Exception as e:
            self._send_response(500, {'error': str(e)})
    
    def _send_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response = json.dumps(data).encode('utf-8')
        self.wfile.write(response)
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()