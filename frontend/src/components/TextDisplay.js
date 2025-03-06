import React, { useState, useEffect } from 'react';

const TextDisplay = ({ text, problematicElements }) => {
    const [highlightedText, setHighlightedText] = useState('');
    const [annotations, setAnnotations] = useState([]);
    
    useEffect(() => {
        if (!text || !problematicElements) return;
        
        const allProblematicWords = [
            ...problematicElements.overusedWords,
            ...problematicElements.suspiciousWords
        ];
        
        // Create a map of problematic words to annotations
        const wordAnnotations = {};
        problematicElements.overusedWords.forEach(word => {
            wordAnnotations[word] = `"${word}" is repeated excessively, which is a common tactic in misleading content.`;
        });
        
        problematicElements.suspiciousWords.forEach(word => {
            wordAnnotations[word] = `"${word}" is a loaded term often used in misleading articles to evoke emotional responses.`;
        });
        
        // Process text to add highlight spans
        let processedText = text;
        let currentAnnotations = [];
        let annotationId = 0;
        
        // Track which words have already been highlighted
        const highlightedWords = new Set();
        
        allProblematicWords.forEach(word => {
            // Skip if we've already highlighted this word
            if (highlightedWords.has(word.toLowerCase())) return;
            
            const regex = new RegExp(`\\b${word}\\b`, 'i'); // Only find the first match with non-global regex
            const match = regex.exec(text);
            
            if (match) {
                const id = `annotation-${annotationId++}`;
                const start = match.index;
                const end = start + word.length;
                
                currentAnnotations.push({
                    id,
                    word,
                    position: start,
                    text: wordAnnotations[word.toLowerCase()]
                });
                
                // Add to the set of highlighted words
                highlightedWords.add(word.toLowerCase());
            }
        });
        
        // Sort annotations by position
        currentAnnotations.sort((a, b) => a.position - b.position);
        
        // Create HTML with highlighted spans
        let currentPosition = 0;
        let result = '';
        
        currentAnnotations.forEach(annotation => {
            const { id, word, position } = annotation;
            
            // Add text before the current word
            if (position > currentPosition) {
                result += text.substring(currentPosition, position);
            }
            
            // Add the highlighted word
            result += `<span class="highlighted-text" id="${id}">${text.substring(position, position + word.length)}</span>`;
            
            // Update current position
            currentPosition = position + word.length;
        });
        
        // Add any remaining text
        if (currentPosition < text.length) {
            result += text.substring(currentPosition);
        }
        
        setHighlightedText(result);
        setAnnotations(currentAnnotations);
        
    }, [text, problematicElements]);
    
    return (
        <div className="text-analysis-container">
            <div className="original-text">
                <h3>Article Content</h3>
                <div 
                    className="text-content" 
                    dangerouslySetInnerHTML={{ __html: highlightedText }}
                />
            </div>
            
            <div className="annotations-panel">
                <h3>Content Analysis</h3>
                {annotations.length > 0 ? (
                    <ul className="annotations-list">
                        {annotations.map(annotation => (
                            <li key={annotation.id} className="annotation-item">
                                <span className="annotation-word">"{annotation.word}"</span>
                                <p className="annotation-text">{annotation.text}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No problematic elements detected in the text.</p>
                )}
            </div>
        </div>
    );
};

export default TextDisplay;