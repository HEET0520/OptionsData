// src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartComponent from './ChartComponent.jsx';
import './index.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function App() {
  const [allScrips, setAllScrips] = useState([]);
  const [selectedScrip, setSelectedScrip] = useState('');
  const [timeframe, setTimeframe] = useState('5min');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/scrips`)
      .then(response => {
        setAllScrips(response.data);
        if (response.data.length > 0) {
          setSelectedScrip(response.data[0]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch scrips list", err);
        setError("Could not connect to the backend API.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedScrip || !timeframe) return;
    
    setLoading(true);
    setError(null);
    
    axios.get(`${API_BASE_URL}/ohlc/${timeframe}/${selectedScrip}`)
      .then(response => {
        setChartData(response.data);
      })
      .catch(err => {
        console.error(`Failed to fetch OHLC data for ${selectedScrip}`, err);
        setChartData([]); // Clear chart on error
        setError(`No data found for ${selectedScrip} at ${timeframe} timeframe.`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedScrip, timeframe]);

  return (
    <div className="container">
      <div className="controls-bar">
        {/* Left Side Control */}
        <div className="control-group">
          <label htmlFor="scrip-select">Instrument</label>
          <select
            id="scrip-select"
            value={selectedScrip}
            onChange={e => setSelectedScrip(e.target.value)}
            disabled={allScrips.length === 0}
          >
            {allScrips.map(scrip => (
              <option key={scrip} value={scrip}>{scrip}</option>
            ))}
          </select>
        </div>

        {/* Right Side Control */}
        <div className="control-group">
            <label>Timeframe</label>
            <div className="timeframe-options">
                {['1min', '5min', '30min', '1hour','1d'].map(tf => (
                    <button key={tf} onClick={() => setTimeframe(tf)} className={timeframe === tf ? 'active' : ''}>
                        {tf}
                    </button>
                ))}
            </div>
        </div>
      </div>

      <main className="main-content">
        {loading && !error && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        {/* Pass the timeframe state as a prop to the chart */}
        {!loading && !error && <ChartComponent data={chartData} timeframe={timeframe} />}
      </main>
    </div>
  );
}

export default App;
