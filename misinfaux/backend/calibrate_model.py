import sys
import os
import numpy as np
import random

# Add the current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Now we can import our module
from models.ml_models import get_classifier, train_model

def generate_synthetic_article(is_unreliable=False):
    """
    Generate a synthetic article for testing
    
    Args:
        is_unreliable: Whether to make the article appear unreliable
    
    Returns:
        Article text
    """
    # Base vocabulary
    common_words = ['the', 'to', 'and', 'of', 'a', 'in', 'is', 'that', 'for', 'it', 
                   'with', 'as', 'was', 'on', 'be', 'at', 'by', 'this', 'have', 'from']
    
    # Words that might indicate unreliability
    suspicious_words = ['conspiracy', 'shocking', 'secret', 'they', 'them', 'cover-up', 
                       'revealed', 'truth', 'exposed', 'incredible']
    
    # Generate base article
    sentence_count = random.randint(20, 50)
    article = []
    
    for _ in range(sentence_count):
        # Decide sentence length
        if is_unreliable:
            # Unreliable articles might have very short or very long sentences
            if random.random() < 0.5:
                sentence_length = random.randint(3, 10)
            else:
                sentence_length = random.randint(30, 50)
        else:
            # Reliable articles have more consistent sentence lengths
            sentence_length = random.randint(12, 25)
        
        sentence = []
        for _ in range(sentence_length):
            # Decide which word to use
            if is_unreliable and random.random() < 0.1:
                # 10% chance of using a suspicious word in unreliable articles
                word = random.choice(suspicious_words)
            else:
                # Otherwise use common words with higher probability
                if random.random() < 0.7:
                    word = random.choice(common_words)
                else:
                    # Generate a random word
                    word = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=random.randint(4, 10)))
            
            sentence.append(word)
        
        # Capitalize first letter and add period
        sentence[0] = sentence[0].capitalize()
        article.append(' '.join(sentence) + '.')
    
    # Sometimes repeat words excessively in unreliable articles
    if is_unreliable and random.random() < 0.7:
        repeat_word = random.choice(['absolutely', 'definitely', 'certainly', 'obviously', 'clearly'])
        for i in range(random.randint(10, 20)):
            # Insert repeated word randomly throughout the article
            insert_pos = random.randint(0, len(article) - 1)
            words = article[insert_pos].split()
            insert_word_pos = random.randint(0, len(words) - 1)
            words.insert(insert_word_pos, repeat_word)
            article[insert_pos] = ' '.join(words)
    
    return '\n\n'.join(article)

def calibrate_model():
    """Generate synthetic data and calibrate the model"""
    print("Generating synthetic articles...")
    
    # Generate 100 synthetic articles
    articles = []
    labels = []
    
    # Create predominantly reliable articles (80%)
    for _ in range(80):
        articles.append(generate_synthetic_article(is_unreliable=False))
        labels.append(0)  # 0 = reliable
    
    # Create some unreliable articles (20%)
    for _ in range(20):
        articles.append(generate_synthetic_article(is_unreliable=True))
        labels.append(1)  # 1 = unreliable
    
    # Shuffle the data
    combined = list(zip(articles, labels))
    random.shuffle(combined)
    articles, labels = zip(*combined)
    
    print(f"Training model with {len(articles)} articles ({sum(labels)} unreliable, {len(labels) - sum(labels)} reliable)")
    
    # Train and calibrate the model
    results = train_model(articles, labels)
    
    print(f"Model calibrated successfully")
    print(f"Accuracy: {results['accuracy']:.2f}")
    print(f"Threshold set to: {results['threshold']:.2f}")
    print(f"Percentage classified as unreliable: {results['unreliable_percentage']:.1f}%")
    
    # Test on new data
    print("\nGenerating 50 new articles for testing...")
    test_articles = []
    test_labels = []
    
    # Create 40 reliable and 10 unreliable articles
    for _ in range(40):
        test_articles.append(generate_synthetic_article(is_unreliable=False))
        test_labels.append(0)
        
    for _ in range(10):
        test_articles.append(generate_synthetic_article(is_unreliable=True))
        test_labels.append(1)
    
    # Shuffle
    combined = list(zip(test_articles, test_labels))
    random.shuffle(combined)
    test_articles, test_labels = zip(*combined)
    
    # Classify
    classifier = get_classifier()
    predictions = []
    for article in test_articles:
        prediction, confidence = classifier.predict(article)
        predictions.append(1 if prediction == 'Potentially Misleading' else 0)
    
    # Calculate metrics
    accuracy = sum(1 for p, l in zip(predictions, test_labels) if p == l) / len(predictions)
    unreliable_percentage = sum(predictions) / len(predictions) * 100
    
    print(f"Test Accuracy: {accuracy:.2f}")
    print(f"Test Percentage classified as unreliable: {unreliable_percentage:.1f}%")
    
    return results

if __name__ == "__main__":
    calibrate_model()