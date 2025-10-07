// src/ChartComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

// Helper to format large numbers
const formatLargeNumber = (num) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toString();
};

const ChartComponent = ({ data, timeframe }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  // State to hold the data for the legend
  const [legendData, setLegendData] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const handleResize = () => { /* ... resize logic ... */ };
    
    const chart = createChart(chartContainerRef.current, { /* ... chart options ... */ });
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, { /* ... options ... */ });
    const volumeSeries = chart.addSeries(HistogramSeries, { /* ... options ... */ });
    const openInterestSeries = chart.addSeries(LineSeries, { /* ... options ... */ });

    // --- NEW: Subscribe to crosshair move event ---
    chart.subscribeCrosshairMove(param => {
      // Find the data for the current timestamp
      const candlestickPoint = param.seriesData.get(candlestickSeries);
      const volumePoint = param.seriesData.get(volumeSeries);
      const openInterestPoint = param.seriesData.get(openInterestSeries);

      if (candlestickPoint) {
        setLegendData({
          open: candlestickPoint.open.toFixed(2),
          high: candlestickPoint.high.toFixed(2),
          low: candlestickPoint.low.toFixed(2),
          close: candlestickPoint.close.toFixed(2),
          volume: volumePoint ? formatLargeNumber(volumePoint.value) : 'N/A',
          oi: openInterestPoint ? formatLargeNumber(openInterestPoint.value) : 'N/A',
        });
      }
    });
    
    if (data && data.length > 0) {
      const candlestickData = [];
      const volumeData = [];
      const openInterestData = [];

      data.forEach(d => { /* ... data preparation logic ... */ });

      candlestickSeries.setData(candlestickData);
      volumeSeries.setData(volumeData);
      openInterestSeries.setData(openInterestData);

      // Set initial legend to the last candle
      const lastCandle = candlestickData[candlestickData.length - 1];
      setLegendData({
          open: lastCandle.open.toFixed(2),
          high: lastCandle.high.toFixed(2),
          low: lastCandle.low.toFixed(2),
          close: lastCandle.close.toFixed(2),
          volume: formatLargeNumber(volumeData[volumeData.length - 1].value),
          oi: formatLargeNumber(openInterestData[openInterestData.length - 1].value),
      });
      
      let rightOffset = 10;
      switch (timeframe) { /* ... zoom logic ... */ }
      chart.timeScale().applyOptions({ rightOffset });
    }
    
    window.addEventListener('resize', handleResize);
    return () => { /* ... cleanup logic ... */ };
  }, [data, timeframe]);

  return (
    <div ref={chartContainerRef} className="chart-container">
      {/* --- NEW: The custom legend component --- */}
      {legendData && (
        <div className="legend">
          <div className="legend-item">
            O <span style={{ color: legendData.open >= legendData.close ? '#26a69a' : '#ef5350' }}>{legendData.open}</span>
          </div>
          <div className="legend-item">
            H <span style={{ color: '#26a69a' }}>{legendData.high}</span>
          </div>
          <div className="legend-item">
            L <span style={{ color: '#ef5350' }}>{legendData.low}</span>
          </div>
          <div className="legend-item">
            C <span style={{ color: legendData.open >= legendData.close ? '#26a69a' : '#ef5350' }}>{legendData.close}</span>
          </div>
          <div className="legend-item">
            Vol <span>{legendData.volume}</span>
          </div>
          <div className="legend-item">
            OI <span>{legendData.open_interest}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartComponent;
