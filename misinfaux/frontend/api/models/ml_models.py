import numpy as np
import re
import pickle
import os
import sys
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

# Fix import issues by using absolute imports
# Add the parent directory to sys.path if needed
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))
from services.analyzer import calculate_shannon_entropy, calculate_kl_divergence
from utils.text_utils import load_suspicious_words

# Default weights for the model (can be overridden by trained model)
DEFAULT_WEIGHTS = {
    'entropy': 0.8009709,         # Changed from -1.0
    'kl_divergence': -1.847155,  # Changed from 2.0
    'overused_words': -1.318058, # Changed from 3.0
    'suspicious_words': -1.026311, # Changed from 1.5
    'avg_sentence_length': -2.889868  # Changed from 0.5
}

class TextClassifier:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.threshold = 0.8  # Higher threshold to classify 20% as unreliable
        
        # Try to load pre-trained model if it exists
        model_path = os.path.join(os.path.dirname(__file__), 'trained_model.pkl')
        if os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    saved_data = pickle.load(f)
                    self.model = saved_data.get('model')
                    if 'scaler' in saved_data:
                        self.scaler = saved_data.get('scaler')
                    if 'threshold' in saved_data:
                        self.threshold = saved_data.get('threshold')
            except Exception as e:
                print(f"Error loading model: {str(e)}")
                self.model = None
        
        # If no model was loaded, initialize a simple one with predefined coefficients
        if self.model is None:
            self.model = LogisticRegression()
            self.model.classes_ = np.array([0, 1])  # 0 = reliable, 1 = unreliable
            
            # Set coefficients to give higher weight to overused words
            self.model.coef_ = np.array([[
                -DEFAULT_WEIGHTS['entropy'],       # Higher entropy → more misleading now
                DEFAULT_WEIGHTS['kl_divergence'],  # Higher KL divergence → less misleading now
                DEFAULT_WEIGHTS['overused_words'], # More overused words → less misleading now
                DEFAULT_WEIGHTS['suspicious_words'], # More suspicious words → less misleading now
                -DEFAULT_WEIGHTS['avg_sentence_length']  # Deviation from ideal sentence length → more misleading now
            ]])
            
            # Set intercept to balance reliable vs unreliable
            self.model.intercept_ = np.array([1.217970])
    
    def extract_features(self, text):
        """Extract features from text for classification"""
        # Calculate entropy and KL divergence
        entropy = calculate_shannon_entropy(text)
        kl_divergence = calculate_kl_divergence(text)
        
        # Count overused words using z-score method
        words = text.lower().split()
        filtered_words = [word for word in words if len(word) > 3 and word.isalpha()]
        total_filtered = len(filtered_words)
        
        word_counts = {}
        for word in filtered_words:
            word_counts[word] = word_counts.get(word, 0) + 1
            
        # Calculate frequencies
        if total_filtered > 0:
            word_freqs = {word: count / total_filtered for word, count in word_counts.items()}
        else:
            word_freqs = {}
        
        # Use simplified approach for overused words as feature
        # Count words that appear frequently (5+ times)
        overused_count = sum(1 for count in word_counts.values() if count >= 5) / max(1, len(word_counts)) * 10
        
        # Count suspicious words/phrases
        try:
            suspicious_words = load_suspicious_words()
        except Exception as e:
            print(f"Error loading suspicious words: {str(e)}")
            # Fallback to a smaller hardcoded list if CSV loading fails
            suspicious_words = [
                'conspiracy', 'shocking', 'secret', 'hoax', 'fraud',
                'fake news', 'cover-up', 'exposed', 'truth revealed'
            ]

        suspicious_count = sum(1 for word in suspicious_words if any(word in w.lower() for w in words))
        
        suspicious_count = sum(1 for word in suspicious_words if any(word in w.lower() for w in words))
        
        # Calculate average sentence length
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        
        # Normalize sentence length to a score where both very short and very long are penalized
        # Optimal range is 15-20 words
        sentence_length_score = abs(avg_sentence_length - 17.5) / 10
        
        # Return feature vector
        return np.array([
            entropy,
            kl_divergence,
            overused_count,
            suspicious_count,
            sentence_length_score
        ]).reshape(1, -1)
    
    def predict(self, text):
        """Predict if text is reliable or not"""
        features = self.extract_features(text)
        
        # Scale features if we have a fitted scaler
        try:
            features = self.scaler.transform(features)
        except:
            # If scaler isn't fitted, just proceed with unscaled features
            pass
        
        # Calculate the z-score (logit value)
        z_score = self.model.decision_function(features)[0]
        
        # Get probability of being reliable using the standard logistic function
        # Higher z_score means higher probability of being reliable
        reliability_probability = 1 / (1 + np.exp(-z_score))
        
        # If z_score < 0, then reliability_probability < 0.5, classify as "Potentially Misleading"
        # If z_score >= 0, then reliability_probability >= 0.5, classify as "Likely Reliable" 
        is_reliable = z_score >= 0
        
        # Calculate confidence based on absolute value of z-score
        # The larger the absolute z, the more confident we are
        confidence = min(0.99, 0.5 + 0.1 * abs(z_score))
        
        # Return classification and confidence
        return (
            'Likely Reliable' if is_reliable else 'Potentially Misleading',
            confidence  # Return confidence based on absolute z-score
        )
        
    def save_model(self):
        """Save the current model to disk"""
        model_path = os.path.join(os.path.dirname(__file__), 'trained_model.pkl')
        try:
            with open(model_path, 'wb') as f:
                pickle.dump({
                    'model': self.model,
                    'scaler': self.scaler,
                    'threshold': self.threshold
                }, f)
            return True
        except Exception as e:
            print(f"Error saving model: {str(e)}")
            return False

# Initialize a singleton instance of the classifier
_classifier = None

def get_classifier():
    """Get or create the classifier singleton"""
    global _classifier
    if _classifier is None:
        _classifier = TextClassifier()
    return _classifier

def classify_text(text):
    """Classify the given text as reliable or unreliable"""
    classifier = get_classifier()
    return classifier.predict(text)

def train_model(texts, labels):
    """
    Train the classifier with new data
    
    Args:
        texts: List of article texts
        labels: List of labels (1 for unreliable, 0 for reliable)
    """
    classifier = get_classifier()
    
    # Extract features
    features = np.vstack([classifier.extract_features(text) for text in texts])
    labels = np.array(labels)
    
    # Fit scaler
    classifier.scaler.fit(features)
    features_scaled = classifier.scaler.transform(features)
    
    # Train model
    classifier.model.fit(features_scaled, labels)
    
    # Calibrate threshold to achieve ~20% unreliable classification
    probas = classifier.model.predict_proba(features_scaled)[:, 1]
    
    # Find threshold that gives approximately 20% unreliable
    # (80th percentile of probabilities)
    classifier.threshold = np.percentile(probas, 80)
    
    # Save the trained model
    classifier.save_model()
    
    return {
        'accuracy': (classifier.model.predict(features_scaled) == labels).mean(),
        'threshold': classifier.threshold,
        'unreliable_percentage': (probas > classifier.threshold).mean() * 100
    }