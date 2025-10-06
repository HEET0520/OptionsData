// src/ChartComponent.jsx
import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const ChartComponent = ({ data, timeframe }) => { // Accept timeframe as a prop
  const chartContainerRef = useRef();
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: { background: { type: 'solid', color: '#0a0a0a' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#475569' },
      rightPriceScale: { borderColor: '#475569' },
    });
    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      borderVisible: false,
    });
    
    if (data && data.length > 0) {
      const formattedData = data.map(d => ({
          ...d,
          time: new Date(d.time).getTime() / 1000
      }));
      series.setData(formattedData);

      // --- NEW LOGIC IS HERE ---
      // 1. Determine the right-side padding (offset) based on the timeframe
      let rightOffset = 10; // Default offset
      switch (timeframe) {
        case '1min':
          rightOffset = 70; // More space for 1min charts, making candles bigger
          break;
        case '5min':
          rightOffset = 50;
          break;
        case '30min':
          rightOffset = 25;
          break;
        case '1hour':
          rightOffset = 10; // Less space for 1hour charts, showing more data
          break;
      }

      // 2. Apply the calculated offset
      chart.timeScale().applyOptions({ rightOffset });
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
    // Add timeframe to the dependency array
  }, [data, timeframe]); 

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
};

export default ChartComponent;