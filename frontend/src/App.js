import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Analysis from './Analysis';
import Methodology from './pages/Methodology';
import './App.css';

function App() {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Router>
      <div className="App">
        <Header />
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/analysis">
            <Analysis 
              results={results} 
              setResults={setResults} 
              isLoading={isLoading} 
              setIsLoading={setIsLoading} 
            />
          </Route>
          <Route path="/methodology">
            <Methodology />
          </Route>
        </Switch>
        <footer>
          <p>© 2025 Misinfaux - CS 109 Project</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;