import React from 'react';

const SummaryModal = ({ isOpen, onClose, results }) => {
    if (!isOpen || !results) return null;
    
    const { textMetrics, entropyScore, klDivergence } = results;
    const overusedWordsCount = results.problematicElements?.overusedWords?.length || 0;
    const suspiciousWordsCount = results.problematicElements?.suspiciousWords?.length || 0;
    
    // Calculate sentence length score as in the model
    const avgSentenceLength = textMetrics.avgSentenceLength;
    const sentenceLengthScore = Math.abs(avgSentenceLength - 17.5) / 10;
    
    // Calculate the logistic regression formula result
    // For P(misleading) = 1/(1 + e^-(intercept + β₁*x₁ + β₂*x₂ + ... + βₙxₙ))
    const intercept = 1.217970;
    const weights = {
        entropy: 0.600971,        // Changed from -1.0
        klDivergence: -1.847155,  // Changed from 2.0
        overusedWords: -1.318058, // Changed from 3.0
        suspiciousWords: -1.026311, // Changed from 1.5
        sentenceLength: -2.889868   // Changed from -0.5
    };
    
    const logitScore = intercept + 
    (weights.entropy * entropyScore) + 
    (weights.klDivergence * klDivergence) + 
    (weights.overusedWords * overusedWordsCount / 10) + 
    (weights.suspiciousWords * suspiciousWordsCount) + 
    (weights.sentenceLength * sentenceLengthScore);

    // Calculate probability: P = 1/(1 + e^-z)
    const reliabilityProbability = 1 / (1 + Math.exp(-logitScore));
    const probabilityPercentage = (reliabilityProbability * 100).toFixed(1);
    
    // Calculate confidence based on absolute value of z-score
    const absLogit = Math.abs(logitScore);
    const confidence = Math.min(0.99, 0.5 + 0.1 * absLogit);
    const confidencePercentage = (confidence * 100).toFixed(1);
    
    // Determine classification: reliable when z >= 0 (probability >= 50%)
    const isReliable = logitScore >= 0;

    
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Text Metrics</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                
                <div className="modal-body">
                    <div className="metrics-summary">
                        <div className="metric-item">
                            <h3>Text Structure</h3>
                            <ul>
                                <li><strong>Word Count:</strong> {textMetrics.wordCount}</li>
                                <li><strong>Unique Words:</strong> {textMetrics.uniqueWordCount}</li>
                                <li><strong>Lexical Diversity:</strong> {(textMetrics.uniqueWordCount / textMetrics.wordCount).toFixed(2)}</li>
                                <li><strong>Sentence Count:</strong> {textMetrics.sentenceCount}</li>
                                <li><strong>Avg. Sentence Length:</strong> {textMetrics.avgSentenceLength} words</li>
                            </ul>
                        </div>
                        
                        <div className="metric-item">
                            <h3>Information Theory</h3>
                            <ul>
                                <li><strong>Shannon Entropy:</strong> {entropyScore}</li>
                                <li><strong>KL Divergence:</strong> {klDivergence}</li>
                            </ul>
                            <p className="metric-explanation">
                                Shannon entropy measures the information content of the text. Higher values indicate more diverse vocabulary.
                                KL divergence measures how the word distribution differs from typical reliable sources.
                            </p>
                        </div>
                    </div>
                    
                    <div className="classification-calculation">
                        <h3>Classification Calculation</h3>
                        <p>Our logistic regression model uses the following formula to determine the probability of misinformation:</p>
                        <div className="formula">
                            <span>P(misleading) = 1/(1 + e<sup>-z</sup>)</span>
                        </div>
                        <p>Where z = 1.22 + (0.80 × Entropy) + (-1.85 × KL Divergence) + (-1.32 × Overused Words/10) + (-3.03 × Suspicious Words) + (2.89 × Sentence Length Score)</p>          

                        <div className="calculation-details">
                            <p>For this article:</p>
                            <ul>
                                <li><strong>Entropy:</strong> {entropyScore} × {weights.entropy} = {(entropyScore * weights.entropy).toFixed(2)}</li>
                                <li><strong>KL Divergence:</strong> {klDivergence} × {weights.klDivergence} = {(klDivergence * weights.klDivergence).toFixed(2)}</li>
                                <li><strong>Overused Words:</strong> {overusedWordsCount}/10 × {weights.overusedWords} = {(overusedWordsCount / 10 * weights.overusedWords).toFixed(2)}</li>
                                <li><strong>Suspicious Words:</strong> {suspiciousWordsCount} × {weights.suspiciousWords} = {(suspiciousWordsCount * weights.suspiciousWords).toFixed(2)}</li>
                                <li><strong>Sentence Length Score:</strong> {sentenceLengthScore.toFixed(2)} × {weights.sentenceLength} = {(sentenceLengthScore * weights.sentenceLength).toFixed(2)}</li>
                            </ul>
                            <p><strong>z = {logitScore.toFixed(2)}</strong></p>
                            <p><strong>Reliability Probability = {probabilityPercentage}%</strong></p>
                            
                            <p><strong>Confidence Level:</strong> {confidencePercentage}% (based on the magnitude of z-score)</p>
                        </div>
                    </div>
                    
                    <div className="modal-footer">
                        <p>For more detailed analysis and interactive visualizations, please refer to the Analysis Summary tab.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;