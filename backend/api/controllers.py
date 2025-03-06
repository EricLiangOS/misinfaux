from flask import request, jsonify
import re
import math
import random
import requests
import numpy as np
import sys
import os
import traceback

# Fix imports by adding parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.analyzer import analyze_content, calculate_shannon_entropy, calculate_kl_divergence
from models.ml_models import classify_text
from utils.text_utils import load_suspicious_words

def analyze_text():
    try:
        data = request.get_json()
        
        if data is None:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        # Analyze the text
        entropy_score = calculate_shannon_entropy(text)
        kl_score = calculate_kl_divergence(text)
        
        # Run internal bootstrapping for standard error
        bootstrap_stats = run_internal_bootstrapping(text, 400)  # Reduced from 1000 to 100 samples
        entropy_mean = bootstrap_stats['entropy_mean']
        entropy_std_err = bootstrap_stats['entropy_std_err']
        kl_mean = bootstrap_stats['kl_mean']
        kl_std_err = bootstrap_stats['kl_std_err']
        
        # Use ML model to classify text
        classification, confidence = classify_text(text)

        # Generate bootstrap confidence interval based on this new confidence
        bootstrap_samples = 100
        confidence_samples = []
        for _ in range(bootstrap_samples):
            # Simulate bootstrap resampling by adding noise
            noise = random.uniform(-0.05, 0.05) 
            confidence_samples.append(min(max(0, confidence + noise), 1))

        # Calculate 95% confidence interval
        confidence_samples.sort()
        lower_bound = confidence_samples[int(0.025 * bootstrap_samples)]
        upper_bound = confidence_samples[int(0.975 * bootstrap_samples)]

        # Format the numbers
        confidence_percentage = round(confidence * 100, 1)
        lower_bound_percentage = round(max(0, lower_bound * 100), 1)
        upper_bound_percentage = round(min(100, upper_bound * 100), 1)
        
        # Find problematic patterns in the text
        words = text.lower().split()
        
        # Filter to only alphabetic words with length > 3
        filtered_words = [word for word in words if len(word) > 3 and word.isalpha()]
        total_filtered_words = len(filtered_words)
        
        word_counts = {}
        for word in filtered_words:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        # Calculate word frequencies in the article
        word_freqs = {word: count / total_filtered_words for word, count in word_counts.items()}
        
        # Get English language frequencies from NLTK Brown corpus
        try:
            from nltk.corpus import brown
            from nltk.probability import FreqDist
            import scipy.stats as stats
            
            # Download NLTK data if not already downloaded
            import nltk
            try:
                nltk.data.find('corpora/brown')
            except LookupError:
                nltk.download('brown')
            
            # Get English language frequencies
            brown_words = [word.lower() for word in brown.words() if len(word) > 3 and word.isalpha()]
            brown_freq_dist = FreqDist(brown_words)
            brown_total = len(brown_words)
            
            english_freqs = {word: brown_freq_dist[word] / brown_total for word in word_freqs.keys()}
            
            # Calculate z-scores for each word
            # Adjust standard deviation based on article length
            # For shorter texts, we expect more variance in word frequency
            length_factor = 1 / math.sqrt(min(total_filtered_words, 1000) / 1000)
            
            z_scores = {}
            length_factor = 1 / math.sqrt(min(total_filtered_words, 1000) / 1000)

            z_scores = {}
            overused_words = []

            for word in word_freqs:
                # Get English frequency or use a small default
                eng_freq = english_freqs.get(word, 0.0001)
                
                # Calculate standard deviation - smaller for common words, larger for rare words
                std_dev = math.sqrt(eng_freq * (1 - eng_freq) / total_filtered_words) * length_factor
                
                # Calculate z-score
                z_scores[word] = (word_freqs[word] - eng_freq) / max(std_dev, 0.0001)
                
                # Words with z-score > 3 are statistically overused (changed from 2)
                if z_scores[word] > 5 and word_counts[word] > 8:
                    overused_words.append(word)
        except Exception as e:
            # Fallback to simpler method if NLTK or scipy not available
            print(f"Error in statistical analysis: {str(e)}")
            overused_words = [word for word, count in word_counts.items() if count > 3]
        
        try:
            suspicious_words = load_suspicious_words()
        except Exception as e:
            print(f"Error loading suspicious words: {str(e)}")
            # Fallback to a smaller hardcoded list if CSV loading fails
            suspicious_words = [
                'conspiracy', 'shocking', 'secret', 'hoax', 'fraud',
                'fake news', 'cover-up', 'exposed', 'truth revealed'
            ]

        found_suspicious = [word for word in suspicious_words if any(word in w.lower() for w in words)]
            
        
        found_suspicious = [word for word in suspicious_words if any(word in w.lower() for w in words)]
        
        # Text metrics
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
        
        # Generate analysis details
        if entropy_score < 3.5:
            entropy_explanation = "The text shows low lexical diversity, which is often characteristic of repetitive content."
        else:
            entropy_explanation = "The text shows normal lexical diversity, similar to standard journalistic writing."
            
        if kl_score > 0.5:
            kl_explanation = "The word distribution differs significantly from typical reliable sources."
        else:
            kl_explanation = "The word distribution is consistent with typical reliable sources."
        
        # Sort by frequency and get top 15 words
        common_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:15]
        
        # Calculate percentages
        word_percentages = [(word, (count / total_filtered_words) * 100) for word, count in common_words]
        
        # Import NLTK for reference word frequencies (keeping your normalized approach)
        try:
            # Get only the words that appear in the article from Brown corpus
            brown_words = [word.lower() for word in brown.words() if len(word) > 3 and word.isalpha()]
            brown_freq = FreqDist(brown_words)
            
            # Get frequencies for the same words as in the article
            reference_percentages = []
            article_words = [w for w, _ in word_percentages]
            
            # Calculate total counts for only these specific words in the reference
            word_specific_total = sum(brown_freq[word] for word in article_words)
            
            # Now calculate percentages based on this specific subset total
            for word, _ in word_percentages:
                brown_count = brown_freq[word]
                # Normalize using only the counts of words that appear in the article
                percentage = (brown_count / word_specific_total) * 100 if word_specific_total > 0 else 0
                reference_percentages.append((word, percentage))
        except Exception as e:
            # Fallback to simple reference distribution if NLTK fails
            reference_words = ['the', 'that', 'with', 'from', 'this', 'have', 'they', 'were', 'their', 'which', 
                            'when', 'what', 'some', 'time', 'will']
            reference_percentages = [(w, (1.0 - (i * 0.05))) for i, w in enumerate(reference_words)]
        
        result = {
            'originalText': text,
            'classification': 'Likely Reliable' if confidence < 0.5 else 'Potentially Misleading',
            'confidenceScore': confidence_percentage,
            'confidenceInterval': [lower_bound_percentage, upper_bound_percentage],
            'entropyScore': round(entropy_score, 2),
            'klDivergence': round(kl_score, 2),
            'bootstrapStats': {
                'entropyMean': round(entropy_mean, 2),
                'entropyStdErr': round(entropy_std_err, 3),
                'klMean': round(kl_mean, 2),
                'klStdErr': round(kl_std_err, 3),
                'avgSentLengthMean': round(bootstrap_stats['avg_sent_length_mean'], 2),  # Fixed from bootstrap_results to bootstrap_stats
                'avgSentLengthStdErr': round(bootstrap_stats['avg_sent_length_std_err'], 3),
                'overusedWordsMean': round(bootstrap_stats['overused_words_mean'], 2),
                'overusedWordsStdErr': round(bootstrap_stats['overused_words_std_err'], 3)
            },
            'details': f"{entropy_explanation} {kl_explanation}",
            'textMetrics': {
                'avgSentenceLength': round(avg_sentence_length, 1),
                'sentenceCount': len(sentences),
                'wordCount': len(words),
                'uniqueWordCount': len(set(words)),
            },
            'problematicElements': {
                'overusedWords': overused_words,
                'suspiciousWords': found_suspicious
            },
            'wordFrequencies': {
                'words': [w for w, p in word_percentages],
                'counts': [round(p, 2) for _, p in word_percentages]
            },
            'referenceFrequencies': {
                'words': [w for w, _ in reference_percentages],
                'counts': [round(p, 2) for _, p in reference_percentages]
            }
        }
        
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def analyze_url():
    try:
        data = request.get_json()
        
        if data is None:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        url = data.get('url', '')
        
        if not url:
            return jsonify({'error': 'No URL provided'}), 400
        
        # Set headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
        
        # Fetch the content from URL
        response = requests.get(url, headers=headers, timeout=10)
        
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove common non-content elements
        for element in soup.select('nav, footer, .ads, .advertisement, .sidebar, [class*="ad-"], [id*="ad-"], script, style'):
            if element:
                element.decompose()
            
        # Try to find the main article content
        article_content = None
        
        # Common article containers
        article_selectors = ['article', '.article', '.post-content', '.entry-content', '.content', '#content', 'main']
        
        for selector in article_selectors:
            article_element = soup.select_one(selector)
            if article_element:
                article_content = article_element
                break
        
        # If no article container found, use the whole body
        if not article_content:
            article_content = soup.body if soup.body else soup
        
        # Extract headers and paragraphs
        headers = []
        for i in range(1, 7):  # h1 through h6
            for header in article_content.find_all(f'h{i}'):
                if header.text.strip():
                    headers.append(f"Heading: {header.text.strip()}")
        
        paragraphs = []
        for p in article_content.find_all('p'):
            if p.text.strip() and len(p.text.strip()) > 20:  # Skip very short paragraphs
                paragraphs.append(p.text.strip())
        
        # Combine all content
        all_content = headers + paragraphs
        text = '\n\n'.join(all_content)
        
        if not text:
            # Fallback to basic paragraph extraction if nothing was found
            paragraphs = soup.find_all('p')
            text = ' '.join([p.text for p in paragraphs if p.text.strip()])
            
            if not text:
                return jsonify({'error': 'No content could be extracted from the URL'}), 400
        
        # Create metadata for the URL
        metadata = {
            'url': url,
            'title': soup.title.text if soup.title else 'No title found',
            'source': url.split('/')[2] if len(url.split('/')) > 2 else 'Unknown source'
        }
        
        # Add a source note to the text
        text = f"Source: {metadata['source']}\nTitle: {metadata['title']}\n\n{text}"
        
        # Create a new request for text analysis
        data = {'text': text}
        request._cached_json = (data, request._cached_json[1] if hasattr(request, '_cached_json') else None)
        
        return analyze_text()
    except Exception as e:
        return jsonify({'error': f'Error processing URL: {str(e)}'}), 500

def bootstrap_simulation():
    try:
        data = request.get_json()
        
        if data is None:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        # Perform bootstrap resampling
        words = text.lower().split()
        bootstrap_sample = random.choices(words, k=len(words))
        
        # Calculate metrics on the bootstrap sample
        bootstrap_text = ' '.join(bootstrap_sample)
        entropy_score = calculate_shannon_entropy(bootstrap_text)
        kl_score = calculate_kl_divergence(bootstrap_text)
        
        # Calculate sentence length metrics
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        sentence_lengths = [len(s.split()) for s in sentences]
        n_sentences = len(sentences)
        
        # Bootstrap sentence lengths
        if n_sentences > 0:
            bootstrap_sentence_lengths = [random.choice(sentence_lengths) for _ in range(n_sentences)]
            avg_sentence_length = sum(bootstrap_sentence_lengths) / n_sentences
        else:
            avg_sentence_length = 0
        
        # Filter to only alphabetic words with length > 3
        filtered_bootstrap = [word for word in bootstrap_sample if len(word) > 3 and word.isalpha()]
        total_filtered = len(filtered_bootstrap)
        
        # Get word frequency for the bootstrap sample
        word_counts = {}
        for word in filtered_bootstrap:
            word_counts[word] = word_counts.get(word, 0) + 1
        
        # Calculate word frequencies
        word_freqs = {word: count / total_filtered for word, count in word_counts.items()} if total_filtered > 0 else {}
        
        # Calculate overused words with z-score method
        try:
            from nltk.corpus import brown
            from nltk.probability import FreqDist
            
            brown_words = [word.lower() for word in brown.words() if len(word) > 3 and word.isalpha()]
            brown_freq_dist = FreqDist(brown_words)
            brown_total = len(brown_words)
            
            english_freqs = {word: brown_freq_dist[word] / brown_total for word in word_freqs.keys()}
            
            length_factor = 1 / math.sqrt(min(total_filtered, 1000) / 1000)
            z_scores = {}
            overused_words = []
            
            for word in word_freqs:
                eng_freq = english_freqs.get(word, 0.0001)
                std_dev = math.sqrt(eng_freq * (1 - eng_freq) / total_filtered) * length_factor
                z_scores[word] = (word_freqs[word] - eng_freq) / max(std_dev, 0.0001)
                
                # Use threshold of 3
                if z_scores[word] > 5 and word_counts[word] > 8:
                    overused_words.append(word)
        except Exception as e:
            # Fallback to simpler method
            overused_words = [word for word, count in word_counts.items() if count >= 5]
            
        # Sort by frequency and get top 15 words
        common_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:15]
        
        # Calculate percentages
        word_percentages = [(word, (count / total_filtered) * 100) for word, count in common_words]
        
        result = {
            'entropyScore': round(entropy_score, 2),
            'klDivergence': round(kl_score, 2),
            'avgSentenceLength': round(avg_sentence_length, 2),
            'overusedWordCount': len(overused_words),
            'wordFrequencies': {
                'words': [w for w, p in word_percentages],
                'counts': [round(p, 2) for _, p in word_percentages]
            }
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

def run_internal_bootstrapping(text, n_samples=400):  # Reduced default from 1000 to 100
    """
    Run bootstrap resampling internally to calculate standard error 
    and mean for entropy and KL divergence, plus new metrics
    """
    import numpy as np
    import re
    
    # For sentence analysis
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_lengths = [len(s.split()) for s in sentences]
    n_sentences = len(sentences)
    
    words = text.lower().split()
    n_words = len(words)
    
    entropy_scores = []
    kl_scores = []
    avg_sent_lengths = []
    overused_word_counts = []
    
    # Pre-load NLTK data once outside the loop
    try:
        from nltk.corpus import brown
        from nltk.probability import FreqDist
        
        brown_words = [word.lower() for word in brown.words() if len(word) > 3 and word.isalpha()]
        brown_freq_dist = FreqDist(brown_words)
        brown_total = len(brown_words)
    except Exception:
        brown_freq_dist = None
        brown_total = 0
    
    for i in range(n_samples):
        # Removed print(i) statement that was slowing things down
        
        # Generate bootstrap sample
        bootstrap_sample = random.choices(words, k=n_words)
        bootstrap_text = ' '.join(bootstrap_sample)
        
        # Calculate entropy & KL divergence
        entropy = calculate_shannon_entropy(bootstrap_text)
        kl = calculate_kl_divergence(bootstrap_text)
        
        # Bootstrap sentence lengths - optimized to avoid recalculating for very large texts
        if n_sentences > 0:
            # For large texts, sample a subset of sentences
            sample_size = min(n_sentences, 200)  # Cap at 200 sentences for performance
            bootstrap_sentence_lengths = random.choices(sentence_lengths, k=sample_size)
            avg_sent_length = sum(bootstrap_sentence_lengths) / len(bootstrap_sentence_lengths)
        else:
            avg_sent_length = 0
            
        # Calculate overused words with higher threshold - optimized
        filtered_bootstrap = [word for word in bootstrap_sample if len(word) > 3 and word.isalpha()]
        
        # For very large texts, take a sample for word frequency analysis
        if len(filtered_bootstrap) > 5000:
            filtered_bootstrap = random.sample(filtered_bootstrap, 5000)
        
        total_filtered = len(filtered_bootstrap)
        
        word_counts = {}
        for word in filtered_bootstrap:
            word_counts[word] = word_counts.get(word, 0) + 1
            
        # Calculate word frequencies
        if total_filtered > 0:
            word_freqs = {word: count / total_filtered for word, count in word_counts.items()}
        else:
            word_freqs = {}
        
        # Count statistically overused words using z-score method
        try:
            if brown_freq_dist and brown_total > 0:
                english_freqs = {word: brown_freq_dist[word] / brown_total for word in word_freqs.keys()}
                
                # Higher threshold for significance
                length_factor = 1 / math.sqrt(min(total_filtered, 1000) / 1000)
                overused_count = 0
                
                for word in word_freqs:
                    eng_freq = english_freqs.get(word, 0.0001)
                    std_dev = math.sqrt(eng_freq * (1 - eng_freq) / total_filtered) * length_factor
                    z_score = (word_freqs[word] - eng_freq) / max(std_dev, 0.0001)
                    
                    # Using a higher z-score threshold of 3
                    if z_score > 3 and word_counts[word] > 8:
                        overused_count += 1
            else:
                raise Exception("NLTK data not available")
        except Exception:
            # Fallback: only count words used 5+ times
            overused_count = sum(1 for count in word_counts.values() if count >= 5)
        
        # Store results
        entropy_scores.append(entropy)
        kl_scores.append(kl)
        avg_sent_lengths.append(avg_sent_length)
        overused_word_counts.append(overused_count)
    
    # Calculate mean and standard error
    return {
        'entropy_mean': np.mean(entropy_scores),
        'entropy_std_err': np.std(entropy_scores, ddof=1) / np.sqrt(n_samples),
        'kl_mean': np.mean(kl_scores),
        'kl_std_err': np.std(kl_scores, ddof=1) / np.sqrt(n_samples),
        'avg_sent_length_mean': np.mean(avg_sent_lengths),
        'avg_sent_length_std_err': np.std(avg_sent_lengths, ddof=1) / np.sqrt(n_samples),
        'overused_words_mean': np.mean(overused_word_counts),
        'overused_words_std_err': np.std(overused_word_counts, ddof=1) / np.sqrt(n_samples),
    }
