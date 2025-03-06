import React, { useState } from 'react';
import axios from 'axios';

const FactChecker = ({ setResults, setIsLoading }) => {
    const [inputType, setInputType] = useState('url');
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!inputValue.trim()) {
            setError('Please enter a URL or text to analyze');
            return;
        }
    
        console.log(`Submitting ${inputType} for analysis`);
        setIsLoading(true);
        
        try {
            const endpoint = inputType === 'url' ? '/api/analyze/url' : '/api/analyze/text';
            const payload = inputType === 'url' ? { url: inputValue } : { text: inputValue };
            
            console.log(`Making request to ${endpoint} with payload:`, payload);
            
            // Configure headers explicitly
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            
            // Use absolute URL with explicit port
            const baseUrl = 'http://localhost:5000';
            const response = await axios.post(`${baseUrl}${endpoint}`, payload, config);
            
            console.log("Response received:", response.data);
            setResults(response.data);
        } catch (err) {
            console.error('Error during analysis:', err);
            if (err.response) {
                console.error('Server response:', err.response.data);
                console.error('Status code:', err.response.status);
                setError(`Failed to analyze content: ${err.response.data.error || 'Unknown error'}`);
            } else if (err.request) {
                console.error('No response received from server');
                setError('Failed to connect to the server. Is the backend running?');
            } else {
                console.error('Error message:', err.message);
                setError('Failed to analyze content. Please try again.');
            }
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fact-checker">
            <h2>Reliability Detector</h2>
            <div className="input-options">
                <button 
                    className={inputType === 'url' ? 'active' : ''}
                    onClick={() => setInputType('url')}
                >
                    Analyze URL
                </button>
                <button 
                    className={inputType === 'text' ? 'active' : ''}
                    onClick={() => setInputType('text')}
                >
                    Analyze Text
                </button>
            </div>
            
            <form onSubmit={handleSubmit}>
                {inputType === 'url' ? (
                    <input
                        type="url"
                        placeholder="Enter article URL"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                ) : (
                    <textarea
                        placeholder="Paste article text here"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        rows={8}
                    />
                )}
                
                {error && <p className="error">{error}</p>}
                
                <button type="submit" className="analyze-btn">
                    Analyze for Reliability
                </button>
            </form>
        </div>
    );
};

export default FactChecker;