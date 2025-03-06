import React, { useState } from 'react';
import axios from 'axios';

const FactChecker = ({ setResults, setIsLoading }) => {
    const [inputType, setInputType] = useState('url');
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!inputValue.trim()) {
            setError('Please enter text or URL to analyze');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            let payload;
            
            if (inputType === 'url') {
                payload = { url: inputValue };
            } else {
                payload = { text: inputValue };
            }
            
            // Use relative URL for API requests (works in both dev and production)
            const response = await axios.post('/api/analyze', payload);
            
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
                setError('Failed to connect to the server. Please try again later.');
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