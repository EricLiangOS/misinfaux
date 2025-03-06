# Misinfaux - Reliability Detector

Misinfaux is a web application designed to detect and analyze misinformation using advanced probability concepts and machine learning techniques. This project aims to provide users with tools to evaluate the credibility of information and understand the underlying statistical principles.

## Project Structure

The project is organized into three main directories:

- **backend**: Contains the server-side code, including the Flask application, API endpoints, and machine learning models.
- **frontend**: Contains the client-side code, built with React, providing an interactive user interface for analysis and results display.
- **ml**: Contains scripts and Jupyter notebooks for data processing and model training.

## Features

- Text analysis for misinformation detection
- Probability calculations for evaluating information credibility
- User-friendly interface for inputting text or URLs
- Detailed results display, including entropy scores and classification results

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd misinfaux
   ```

2. Set up the backend:
   - Navigate to the `backend` directory.
   - Install the required Python packages:
     ```
     pip install -r requirements.txt
     ```

3. Set up the frontend:
   - Navigate to the `frontend` directory.
   - Install the required Node.js packages:
     ```
     npm install
     ```

## Usage

1. Start the backend server:
   ```
   python app.py
   ```

2. Start the frontend application:
   ```
   npm start
   ```

3. Open your web browser and navigate to `http://localhost:3000` to access the Misinfaux application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.