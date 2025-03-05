import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Register the chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Methodology = () => {
    // Data for English word frequency distribution
    const wordFreqData = {
        labels: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I'],
        datasets: [{
            label: 'Frequency (%) in English',
            data: [7.14, 4.24, 3.19, 2.60, 2.57, 2.27, 2.15, 1.94, 1.81, 1.78],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
        }]
    };

    // Data for logistic regression feature importance
    const featureImportanceData = {
        labels: ['Entropy Score', 'KL Divergence', 'Repeated Words', 'Suspicious Terms', 'Sentence Length'],
        datasets: [{
            label: 'Feature Weight in Model',
            data: [0.600971, -1.847155 , -1.318058, -1.026311, -2.889868], // Updated weights
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',  // Red for positive weight (entropy)
                'rgba(54, 162, 235, 0.6)',  // Blue for negative weight (KL divergence)
                'rgba(54, 162, 235, 0.6)',  // Blue for negative weight (repeated words)
                'rgba(54, 162, 235, 0.6)',  // Blue for negative weight (suspicious terms)
                'rgba(255, 99, 132, 0.6)',  // Red for positive weight (sentence length)
            ],
        }]
    };

    // Data for bootstrapping confidence intervals
    const bootstrapData = {
        labels: Array.from({ length: 11 }, (_, i) => (i * 10).toString()),
        datasets: [{
            label: 'Distribution of Bootstrap Samples',
            data: [3, 7, 12, 18, 24, 32, 24, 18, 12, 7, 3],
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1
        }]
    };

    return (
        <div className="methodology">
            <h1>Our Methodology</h1>

            
            <p className="intro">
                In today's digital age, misinformation can spread rapidly and shape public opinion in ways that undermine trust and fuel division. 
                Being aware of fake news is crucial because it affects our ability to make informed decisions—from what we believe about health and politics 
                to how we interact with our community. When misinformation goes unchecked, it can distort reality, influence critical choices, and even jeopardize public safety. 
                Staying informed and critically evaluating the news not only protects you but also contributes to a healthier, more resilient society.
            </p>

            <p className="intro">
                Misinfaux uses advanced probabilistic and statistical techniques to analyze text 
                and determine the likelihood of misinformation. Below, we explain each component 
                of our analysis process.
            </p>

            <section className="method-section">
                <h2>Word Frequency Analysis</h2>
                <div className="method-content">
                    <div className="method-text">
                        <p>
                            Our analysis begins by examining word frequencies in the article. 
                            Reliable news sources tend to follow patterns of word usage similar 
                            to standard English, while misleading content often shows anomalous patterns.
                        </p>
                        <p>
                            We compare the distribution of words in the article to the typical 
                            distribution found in reliable sources using Kullback-Leibler (KL) divergence, 
                            which measures how one probability distribution differs from another.
                        </p>
                    </div>
                    <div className="method-chart">
                        <Bar 
                            data={wordFreqData}
                            options={{
                                responsive: true,
                                plugins: {
                                    title: {
                                        display: true,
                                        text: 'Most Common Words in English'
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </section>

            <section className="method-section">
                <h2>Information Theory Metrics</h2>
                <div className="method-content">
                    <div className="method-text">
                    <h3>Shannon Entropy</h3>
                    <p>
                        Shannon entropy measures the information density or unpredictability of text. 
                        Higher entropy (more diverse vocabulary) indicates information-rich content, which 
                        our model uses as a factor when evaluating articles.
                    </p>
                    <p>
                        Formula: H(X) = -∑p(x) log₂ p(x)
                    </p>
                    <p>
                        In our model, higher entropy increases the likelihood of an article being classified 
                        as misleading, with a weight of 0.600971 in our logistic regression.
                    </p>

                    <h3>Kullback-Leibler Divergence</h3>
                    <p>
                        KL divergence quantifies how much the word distribution in an article differs from 
                        expected distributions in reliable journalism.
                    </p>
                    <p>
                        Formula: D<sub>KL</sub>(P||Q) = ∑P(x) log(P(x)/Q(x))
                    </p>
                    <p>
                        Lower KL divergence suggests the article uses vocabulary consistent with typical reliable content.
                        In our model, higher KL divergence decreases the likelihood of being classified as reliable,
                        with a weight of -1.847155.
                    </p>

                    <p><strong>Overused Words:</strong> Repetitive use of certain terms can indicate more reliable content
                    in our model, with a negative weight of -1.318058, meaning more overused words reduce the probability 
                    of being classified as reliable.</p>

                    <p><strong>Emotionally Charged Language:</strong> Terms like "shocking," "incredible," or 
                    "secret" often appear in articles. In our model, more suspicious words decrease the probability
                    of being classified as reliable, with a weight of -1.026311 .</p>

                    <p><strong>Sentence Structure:</strong> Unusual sentence lengths can affect content readability.
                    In our model, deviation from ideal sentence length decreases the probability of being classified 
                    as reliable, with a negative weight of -2.889868.</p>
                    </div>
                </div>
            </section>

            <section className="method-section">
                <h2>Bootstrapping for Confidence Intervals</h2>
                <div className="method-content">
                    <div className="method-text">
                        <p>
                            To provide confidence in our predictions, we use bootstrapping - a resampling technique 
                            that generates multiple samples from the original data to estimate the variability of 
                            our predictions.
                        </p>
                        <p>
                            This allows us to provide a confidence interval for our misinformation score, rather 
                            than just a single point estimate, giving you a better understanding of the certainty 
                            of our analysis.
                        </p>
                    </div>
                    <div className="method-chart">
                        <Line 
                            data={bootstrapData}
                            options={{
                                responsive: true,
                                plugins: {
                                    title: {
                                        display: true,
                                        text: 'Bootstrap Sample Distribution'
                                    }
                                },
                                scales: {
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Confidence Score (%)'
                                        }
                                    },
                                    y: {
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
            </section>

            <section className="method-section">
                <h2>Logistic Regression Model</h2>
                <div className="method-content">
                    <div className="method-text">
                        <p>
                            Our core classification engine uses a logistic regression model that combines multiple 
                            features extracted from text analysis. Logistic regression estimates the probability that 
                            an article belongs to a particular category (reliable or misleading).
                        </p>
                        <p>
                            Formula: P(y=1) = 1/(1 + e<sup>-(β₀ + β₁x₁ + β₂x₂ + ... + βₙxₙ)</sup>)
                        </p>
                        <p>
                            Where:
                        </p>
                        <ul>
                            <li>β₀ = 1.217970 (intercept)</li>
                            <li>β₁ = 0.600971 (entropy weight)</li>
                            <li>β₂ = -1.847155 (KL divergence weight)</li>
                            <li>β₃ = -1.318058 (overused words weight)</li>
                            <li>β₄ = -1.026311 (suspicious words weight)</li>
                            <li>β₅ = 2.889868 (sentence length score weight)</li>
                        </ul>
                        <p>
                            The model is trained on a dataset of articles that have been pre-classified as reliable 
                            or unreliable, allowing it to learn patterns associated with misinformation.
                        </p>
                    </div>
                    <div className="method-chart">
                        <Bar 
                            data={featureImportanceData}
                            options={{
                                responsive: true,
                                plugins: {
                                    title: {
                                        display: true,
                                        text: 'Feature Importance in Classification Model'
                                    }
                                },
                                indexAxis: 'y',
                            }}
                        />
                        <p>
                            The classification rule is simple:
                        </p>
                        <ul>
                            <li>If z ≥ 0 (probability of reliability ≥ 50%), classify as "Likely Reliable"</li>
                            <li>If z ≤ 0 (probability of reliability ≤ 50%), classify as "Potentially Misleading"</li>
                        </ul>
                        <p>
                            The confidence in our classification is based on the absolute magnitude of z. 
                            A z-score further from zero indicates stronger evidence and higher confidence.
                        </p>
                    </div>
                </div>
            </section>

            <section className="method-section">
                <h2>Content Analysis Indicators</h2>
                <div className="method-content">
                    <div className="method-text">
                        <p>
                            Beyond statistical measures, we analyze specific content patterns associated with 
                            misinformation:
                        </p>
                        <ul>
                            <li><strong>Overused Words:</strong> Repetitive use of certain terms can be a persuasive 
                            technique used in misleading content.</li>
                            <li><strong>Emotionally Charged Language:</strong> Terms like "shocking," "incredible," or 
                            "secret" often appear in clickbait and misleading articles.</li>
                            <li><strong>Sentence Structure:</strong> Unusually short or long sentences can indicate 
                            content optimized for emotional impact rather than information.</li>
                        </ul>
                        <p>
                            These indicators, combined with our probabilistic measures, provide a comprehensive 
                            assessment of an article's reliability.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Methodology;