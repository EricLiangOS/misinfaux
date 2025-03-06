import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import TextDisplay from './TextDisplay';
import SummaryModal from './SummaryModal';
import axios from 'axios';

const ResultsDisplay = ({ results }) => {
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');
    
    // Bootstrap state
    const [bootstrapSamples, setBootstrapSamples] = useState([]);
    const [bootstrapWordFreqs, setBootstrapWordFreqs] = useState(null);
    const [entropyHistory, setEntropyHistory] = useState([]);
    const [klHistory, setKLHistory] = useState([]);
    const [sentLengthHistory, setSentLengthHistory] = useState([]);
    const [overusedWordsHistory, setOverusedWordsHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    if (!results) {
        return (
            <div className="results-display empty">
                <h2>Analysis Results</h2>
                <p>No results available. Please perform an analysis.</p>
            </div>
        );
    }

    const calculateClassification = () => {
        const { entropyScore, klDivergence, textMetrics, problematicElements } = results;
        const overusedWordsCount = problematicElements?.overusedWords?.length || 0;
        const suspiciousWordsCount = problematicElements?.suspiciousWords?.length || 0;
        
        // Calculate sentence length score as in the model
        const avgSentenceLength = textMetrics.avgSentenceLength;
        const sentenceLengthScore = Math.abs(avgSentenceLength - 17.5) / 10;
        
        // Use the same weights as in SummaryModal
        const intercept = 1.217970;
        const weights = {
            entropy: 0.600971,
            klDivergence: -1.847155,
            overusedWords: -1.318058,
            suspiciousWords: -1.026311,
            sentenceLength: -2.889868
        };
        
        // Calculate logit score
        const logitScore = intercept + 
            (weights.entropy * entropyScore) + 
            (weights.klDivergence * klDivergence) + 
            (weights.overusedWords * overusedWordsCount / 10) + 
            (weights.suspiciousWords * suspiciousWordsCount) + 
            (weights.sentenceLength * sentenceLengthScore);

        // Calculate reliability probability
        const reliabilityProbability = 1 / (1 + Math.exp(-logitScore));
        
        // Calculate confidence based on absolute value of z-score
        const absLogit = Math.abs(logitScore);
        const confidence = Math.min(0.99, 0.5 + 0.1 * absLogit) * 100;
        
        // Determine classification: reliable when z >= 0 (probability >= 50%)
        const isReliable = logitScore >= 0;
        const classification = isReliable ? "Likely Reliable" : "Potentially Misleading";
        
        return {
            classification,
            confidence,
            reliabilityProbability: reliabilityProbability * 100
        };
    };

    // Get the recalculated classification results
    const calculatedResults = calculateClassification();
    
    // Determine confidence level classes based on recalculated confidence
    const getConfidenceClass = (score) => {
        if (score > 80) return 'high-confidence';
        if (score > 60) return 'medium-confidence';
        return 'low-confidence';
    };
    
    // Use the word frequencies from the analysis or fallback to empty arrays
    const wordFrequencies = results.wordFrequencies || { words: [], counts: [] };
    const referenceFrequencies = results.referenceFrequencies || { words: [], counts: [] };
    
    // Prepare word frequency chart data
    const wordFreqChartData = {
        labels: wordFrequencies.words,
        datasets: [
            {
                label: 'Article Word Frequencies (%)',
                data: wordFrequencies.counts,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Reference Word Frequencies (%)',
                data: referenceFrequencies.counts.slice(0, wordFrequencies.words.length),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }
        ]
    };
    
    // Create histogram data for entropy scores
    const entropyHistogram = bootstrapSamples.length > 0 ? {
        labels: generateHistogramLabels(entropyHistory, 10),
        datasets: [{
            label: 'Entropy Score Distribution',
            data: calculateHistogramData(entropyHistory, 10).counts,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    } : null;
    
    // Create histogram data for KL divergence
    const klHistogram = bootstrapSamples.length > 0 ? {
        labels: generateHistogramLabels(klHistory, 10),
        datasets: [{
            label: 'KL Divergence Distribution',
            data: calculateHistogramData(klHistory, 10).counts,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    } : null;
    
    // Create histogram data for sentence length
    const sentLengthHistogram = bootstrapSamples.length > 0 ? {
        labels: generateHistogramLabels(sentLengthHistory, 10),
        datasets: [{
            label: 'Avg. Sentence Length Distribution',
            data: calculateHistogramData(sentLengthHistory, 10).counts,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
        }]
    } : null;
    
    // Create histogram data for overused words count
    const overusedWordsHistogram = bootstrapSamples.length > 0 ? {
        labels: generateHistogramLabels(overusedWordsHistory, 10),
        datasets: [{
            label: 'Overused Words Count Distribution',
            data: calculateHistogramData(overusedWordsHistory, 10).counts,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    } : null;
    
    // Prepare bootstrap word frequency chart data if available
    const bootstrapWordFreqChartData = bootstrapWordFreqs ? {
        labels: bootstrapWordFreqs.words,
        datasets: [
            {
                label: 'Bootstrap Sample Word Frequencies (%)',
                data: bootstrapWordFreqs.counts,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    } : null;
    
    // Function to calculate histogram buckets
    function calculateHistogramData(data, buckets) {
        if (!data || data.length === 0) return { counts: Array(buckets).fill(0), edges: [] };
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        const bucketSize = range / buckets;
        
        // Create buckets array and edges array
        const histogram = Array(buckets).fill(0);
        const edges = Array(buckets + 1).fill(0).map((_, i) => min + i * bucketSize);
        
        // Fill buckets
        data.forEach(value => {
            const bucketIndex = Math.min(
                Math.floor((value - min) / bucketSize),
                buckets - 1
            );
            histogram[bucketIndex]++;
        });
        
        return { counts: histogram, edges: edges };
    }
    
    // Function to generate labels with actual numeric values
    function generateHistogramLabels(data, buckets) {
        if (!data || data.length === 0) return Array(buckets).fill('');
        
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        const bucketSize = range / buckets;
        
        return Array(buckets).fill(0).map((_, i) => {
            const lowerBound = min + i * bucketSize;
            const upperBound = min + (i + 1) * bucketSize;
            return `${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)}`;
        });
    }

    const runBootstrapSimulation = async () => {
        setIsLoading(true);
        try {
            const baseUrl = 'http://localhost:5000';
            const response = await axios.post(`${baseUrl}/api/bootstrap`, {
                text: results.originalText
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            const newSample = response.data;
            
            // Update state with new bootstrap sample data
            setBootstrapSamples([...bootstrapSamples, newSample]);
            setBootstrapWordFreqs(newSample.wordFrequencies);
            setEntropyHistory([...entropyHistory, newSample.entropyScore]);
            setKLHistory([...klHistory, newSample.klDivergence]);
            setSentLengthHistory([...sentLengthHistory, newSample.avgSentenceLength]);
            setOverusedWordsHistory([...overusedWordsHistory, newSample.overusedWordCount]);
        } catch (error) {
            console.error('Error running bootstrap simulation:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="results-display">
            <h2>Analysis Results</h2>
                        
            {/* Tab Navigation */}
            <div className="input-options">
                <button 
                    className={activeTab === 'summary' ? 'active' : ''}
                    onClick={() => setActiveTab('summary')}
                >
                    Analysis Summary
                </button>
                <button 
                    className={activeTab === 'content' ? 'active' : ''}
                    onClick={() => setActiveTab('content')}
                >
                    Article Content
                </button>
            </div>
            
            <div className={`classification-result ${calculatedResults.classification === 'Likely Reliable' ? 'reliable' : 'suspicious'}`}>
                <h3>{calculatedResults.classification}</h3>
                <p className={getConfidenceClass(calculatedResults.confidence)}>
                    Confidence: {calculatedResults.confidence.toFixed(1)}%
                    <span className="confidence-interval">
                        (Based on statistical analysis)
                    </span>
                </p>
                <button className="view-metrics-btn" onClick={() => setShowModal(true)}>
                    View Text Metrics
                </button>
            </div>

            
            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'summary' && (
                    <>
                        <div className="explanation">
                            <h4>Analysis Explanation</h4>
                            <p>{results.details}</p>
                        </div>

                        <div className="metrics">
                            {/* Entropy Metric */}
                            <div className="metric">
                                <h4>Shannon Entropy</h4>
                                <div className="score-bar">
                                    <div 
                                        className="score-fill"
                                        style={{width: `${Math.min(results.entropyScore * 20, 100)}%`}}
                                    ></div>
                                </div>
                                <p>{results.entropyScore}</p>
                                <small>Higher value indicates more complex language</small>
                                {results.bootstrapStats && (
                                    <div className="bootstrap-stats">
                                        <small>Mean: {results.bootstrapStats.entropyMean} ± {results.bootstrapStats.entropyStdErr} (SE)</small>
                                    </div>
                                )}
                            </div>

                            {/* KL Divergence Metric */}
                            <div className="metric">
                                <h4>KL Divergence</h4>
                                <div className="score-bar">
                                    <div 
                                        className="score-fill"
                                        style={{width: `${Math.min(results.klDivergence * 100, 100)}%`}}
                                    ></div>
                                </div>
                                <p>{results.klDivergence}</p>
                                <small>Lower value indicates closer match to reliable sources</small>
                                {results.bootstrapStats && (
                                    <div className="bootstrap-stats">
                                        <small>Mean: {results.bootstrapStats.klMean} ± {results.bootstrapStats.klStdErr} (SE)</small>
                                    </div>
                                )}
                            </div>

                            {/* Average Sentence Length Metric */}
                            <div className="metric">
                                <h4>Average Sentence Length</h4>
                                <div className="score-bar">
                                    <div 
                                        className="score-fill"
                                        style={{width: `${Math.min(results.textMetrics.avgSentenceLength * 5, 100)}%`}}
                                    ></div>
                                </div>
                                <p>{results.textMetrics.avgSentenceLength}</p>
                                <small>Words per sentence (15-20 is typical for articles)</small>
                                {results.bootstrapStats && (
                                    <div className="bootstrap-stats">
                                        <small>Mean: {results.bootstrapStats.avgSentLengthMean} ± {results.bootstrapStats.avgSentLengthStdErr} (SE)</small>
                                    </div>
                                )}
                            </div>

                            {/* Overused Words Metric */}
                            <div className="metric">
                                <h4>Overused Words</h4>
                                <div className="score-bar">
                                    <div 
                                        className="score-fill"
                                        style={{width: `${Math.min(results.problematicElements.overusedWords.length * 10, 100)}%`}}
                                    ></div>
                                </div>
                                <p>{results.problematicElements.overusedWords.length}</p>
                                <small>Words that appear much more frequently than expected</small>
                                {results.bootstrapStats && (
                                    <div className="bootstrap-stats">
                                        <small>Mean: {results.bootstrapStats.overusedWordsMean} ± {results.bootstrapStats.overusedWordsStdErr} (SE)</small>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Word Frequency Chart */}
                        <h3 className="chart-section-header">Word Frequency Analysis</h3>
                        <div className="chart-container">
                            <div className="word-freq-chart">
                                <Bar 
                                    data={wordFreqChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            title: {
                                                display: true,
                                                text: 'Word Frequencies: Article vs. Reference'
                                            },
                                            legend: {
                                                position: 'top',
                                            },
                                        },
                                        scales: {
                                            y: {
                                                title: {
                                                    display: true,
                                                    text: 'Frequency (%)'
                                                },
                                                beginAtZero: true
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        
                        {/* Bootstrap Analysis Section */}
                        <div className="bootstrap-section">
                            <h3 className="chart-section-header">Bootstrap Analysis</h3>
                            <p>
                                Bootstrap resampling allows us to estimate the variability of our metrics by randomly 
                                resampling from the original text. Click the button below to generate a bootstrap sample.
                            </p>
                            
                            <button 
                                className="bootstrap-btn" 
                                onClick={runBootstrapSimulation}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Running Simulation...' : 'Run Bootstrap Simulation'}
                            </button>
                            
                            <div className="bootstrap-results">
                                {bootstrapSamples.length > 0 && (
                                    <>
                                        <h4>Bootstrap Samples: {bootstrapSamples.length}</h4>
                                        
                                        {/* Latest bootstrap word frequencies */}
                                        <div className="chart-container">
                                            <h5>Latest Bootstrap Sample Word Frequencies</h5>
                                            <div className="bootstrap-word-freq">
                                                {bootstrapWordFreqChartData && (
                                                    <Bar 
                                                        data={bootstrapWordFreqChartData}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    display: true,
                                                                    position: 'top',
                                                                }
                                                            },
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Frequency (%)'
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Distribution charts with clear separation */}
                                        <h5 className="chart-section-header">Metric Distributions</h5>
                                        <div className="bootstrap-charts">
                                            {/* Entropy Score Distribution */}
                                            <div className="chart-container">
                                                <h5>Entropy Score Distribution</h5>
                                                <div className="bootstrap-chart">
                                                    <Bar 
                                                        data={entropyHistogram}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    display: true,
                                                                    position: 'top',
                                                                }
                                                            },
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Frequency'
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* KL Divergence Distribution */}
                                            <div className="chart-container">
                                                <h5>KL Divergence Distribution</h5>
                                                <div className="bootstrap-chart">
                                                    <Bar 
                                                        data={klHistogram}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    display: true,
                                                                    position: 'top',
                                                                }
                                                            },
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Frequency'
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Average Sentence Length Distribution */}
                                            <div className="chart-container">
                                                <h5>Average Sentence Length Distribution</h5>
                                                <div className="bootstrap-chart">
                                                    <Bar 
                                                        data={sentLengthHistogram}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    display: true,
                                                                    position: 'top',
                                                                }
                                                            },
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Frequency'
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Overused Words Count Distribution */}
                                            <div className="chart-container">
                                                <h5>Overused Words Count Distribution</h5>
                                                <div className="bootstrap-chart">
                                                    <Bar 
                                                        data={overusedWordsHistogram}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    display: true,
                                                                    position: 'top',
                                                                }
                                                            },
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    title: {
                                                                        display: true,
                                                                        text: 'Frequency'
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
                
                {activeTab === 'content' && results.originalText && (
                    <TextDisplay 
                        text={results.originalText} 
                        problematicElements={results.problematicElements}
                    />
                )}
            </div>
            
            <SummaryModal 
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                results={results}
            />
        </div>
    );
};

export default ResultsDisplay;