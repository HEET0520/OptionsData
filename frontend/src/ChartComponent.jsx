// src/ChartComponent.jsx
import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

const ChartComponent = ({ data, timeframe }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const handleResize = () => { /* ... resize logic ... */ };
    
    const chart = createChart(chartContainerRef.current, { /* ... chart options ... */ });
    chartRef.current = chart;

    // --- Price (Candlestick) Series ---
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      borderVisible: false,
    });

    // --- Volume Series (Histogram) ---
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Puts it on a separate pane at the bottom
    });
    // Adjust pane heights: 70% for price, 30% for volume
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });

    // --- Open Interest Series (Line) ---
    const openInterestSeries = chart.addLineSeries({
      color: '#FFD700', // Gold color for OI
      lineWidth: 2,
      priceScaleId: 'oi', // A custom ID to create a new pane
    });
    // Adjust pane heights again for the new OI pane
    chart.priceScale('oi').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    
    
    if (data && data.length > 0) {
      // --- Prepare Data for Each Series ---
      const candlestickData = [];
      const volumeData = [];
      const openInterestData = [];

      data.forEach(d => {
        const timestamp = new Date(d.time).getTime() / 1000;
        
        candlestickData.push({
          time: timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        });
        
        volumeData.push({
          time: timestamp,
          value: d.volume,
          // Color volume bar based on price change
          color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        });

        openInterestData.push({
          time: timestamp,
          value: d.open_interest,
        });
      });

      // --- Set the data for all three series ---
      candlestickSeries.setData(candlestickData);
      volumeSeries.setData(volumeData);
      openInterestSeries.setData(openInterestData);
      
      // --- Zoom Logic (same as before) ---
      let rightOffset = 10;
      switch (timeframe) {
        case '1min': rightOffset = 70; break;
        case '5min': rightOffset = 50; break;
        case '30min': rightOffset = 25; break;
        case '1hour': rightOffset = 10; break;
      }
      chart.timeScale().applyOptions({ rightOffset });
    }
    
    window.addEventListener('resize', handleResize);
    return () => { /* ... cleanup logic ... */ };
  }, [data, timeframe]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
};

export default ChartComponent;