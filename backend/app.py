import sys
import os

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from api.routes import api_bp

app = Flask(__name__)
# Configure CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# Register the API blueprint
app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def home():
    return jsonify({"status": "Misinfaux API is running"})

@app.route('/api/test', methods=['GET', 'POST'])
def test_endpoint():
    if request.method == 'POST':
        data = request.get_json()
        return jsonify({"message": "Test POST successful", "received": data})
    return jsonify({"message": "Test GET successful"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')