import os
import csv

def load_suspicious_words():
    """
    Load suspicious words from CSV file.
    Returns a list of words/phrases that indicate potential misinformation.
    """
    try:
        # Get the path to the CSV file relative to this file
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        csv_path = os.path.join(base_dir, 'data', 'suspicious_words.csv')
        
        suspicious_words = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            # Skip header
            next(reader, None)
            for row in reader:
                if row and row[0].strip():
                    suspicious_words.append(row[0].strip().lower())
        
        return suspicious_words
    except Exception as e:
        print(f"Error loading suspicious words: {str(e)}")
        # Return a minimal fallback list if the CSV can't be loaded
        return [
            'conspiracy', 'shocking', 'secret', 'hoax', 'fraud',
            'fake news', 'cover-up', 'exposed', 'truth revealed'
        ]