import React from 'react';
import FactChecker from './components/FactChecker';
import ResultsDisplay from './components/ResultsDisplay';

const Analysis = ({ results, setResults, isLoading, setIsLoading }) => {
    return (
        <main>
            <FactChecker setResults={setResults} setIsLoading={setIsLoading} />
            
            {isLoading ? (
                <div className="loading">
                    <p>Analyzing content...</p>
                    <div className="spinner"></div>
                </div>
            ) : (
                <ResultsDisplay results={results} />
            )}
        </main>
    );
};

export default Analysis;