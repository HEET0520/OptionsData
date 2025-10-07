// src/ChartComponent.jsx
import React, { useEffect, useRef } from 'react';
// --- FIX #1: Import all the necessary series types ---
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

const ChartComponent = ({ data, timeframe }) => {
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

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350',
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      borderVisible: false,
    });

    // --- FIX #2: Use the correct v5 syntax for HistogramSeries ---
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    chart.priceScale('').applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });

    // --- FIX #3: Use the correct v5 syntax for LineSeries ---
    const openInterestSeries = chart.addSeries(LineSeries, {
      color: '#FFD700',
      lineWidth: 2,
      priceScaleId: 'oi',
    });
    chart.priceScale('oi').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
    
    if (data && data.length > 0) {
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
          color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        });

        openInterestData.push({
          time: timestamp,
          value: d.open_interest,
        });
      });

      candlestickSeries.setData(candlestickData);
      volumeSeries.setData(volumeData);
      openInterestSeries.setData(openInterestData);
      
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
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, timeframe]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
};

export default ChartComponent;
