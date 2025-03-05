import re
import math
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import CountVectorizer

def clean_text(text):
    """Cleans the input text by removing unwanted characters and formatting."""
    text = re.sub(r'\s+', ' ', text)  # Remove extra whitespace
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    return text.strip().lower()

def calculate_shannon_entropy(text):
    """
    Calculate the Shannon entropy of text as a measure of information density.
    Higher entropy suggests more diverse vocabulary.
    """
    text = clean_text(text)
    words = text.split()
    
    if not words:
        return 0
        
    word_counts = Counter(words)
    total_words = len(words)
    
    entropy = 0
    for count in word_counts.values():
        probability = count / total_words
        entropy -= probability * math.log2(probability)
        
    return entropy

def calculate_kl_divergence(text, reference_distribution=None):
    """
    Calculate KL divergence between text and a reference distribution.
    Higher values indicate the text differs more from the reference.
    
    If no reference is provided, use a generic English distribution.
    """
    text = clean_text(text)
    
    # Create a word distribution for the input text
    vectorizer = CountVectorizer()
    word_counts = vectorizer.fit_transform([text]).toarray()[0]
    total_words = sum(word_counts)
    
    if total_words == 0:
        return 0
        
    # Normalize to get probabilities
    text_distribution = word_counts / total_words
    
    # If no reference provided, use a simplified English distribution
    # In practice, this would come from a corpus of reliable sources
    if reference_distribution is None:
        # This is a simplified approximation
        reference_distribution = np.ones_like(text_distribution) / len(text_distribution)
    
    # Add smoothing to avoid division by zero
    epsilon = 1e-10
    text_distribution = text_distribution + epsilon
    reference_distribution = reference_distribution + epsilon
    
    # Normalize again
    text_distribution = text_distribution / sum(text_distribution)
    reference_distribution = reference_distribution / sum(reference_distribution)
    
    # Calculate KL divergence
    kl_divergence = np.sum(text_distribution * np.log(text_distribution / reference_distribution))
    
    return kl_divergence

def analyze_content(text):
    """
    Analyze content to extract various statistical and probabilistic measures
    """
    cleaned_text = clean_text(text)
    
    # Get basic statistics
    words = cleaned_text.split()
    total_words = len(words)
    unique_words = len(set(words))
    
    # Calculate entropy
    entropy = calculate_shannon_entropy(text)
    
    # Calculate KL divergence
    kl_divergence = calculate_kl_divergence(text)
    
    return {
        'word_count': total_words,
        'unique_words': unique_words,
        'lexical_diversity': unique_words / total_words if total_words else 0,
        'shannon_entropy': entropy,
        'kl_divergence': kl_divergence
    }