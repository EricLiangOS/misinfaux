import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="home">
            <h1>Welcome to Misinfaux 🔍</h1>
            <p>Your go-to platform for detecting misinformation using advanced machine learning techniques.</p>
            <Link to="/analysis" className="btn">Get Started</Link>
        </div>
    );
};

export default Home;