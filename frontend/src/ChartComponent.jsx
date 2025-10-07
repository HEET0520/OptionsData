// src/ChartComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

// Helper to format large numbers
const formatLargeNumber = (num) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num?.toString() ?? '0';
};

// Helper to normalize time for lightweight-charts v5
const normalizeChartTime = (raw) => {
  if (!raw) return undefined;
  if (typeof raw === 'number') return raw; // assume UNIX seconds
  if (typeof raw === 'string' && raw.includes('T')) {
    return Math.floor(new Date(raw).getTime() / 1000);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return Math.floor(new Date(raw).getTime() / 1000);
  }
  const parsed = Date.parse(raw);
  if (!isNaN(parsed)) return Math.floor(parsed / 1000);
  return undefined;
};

const ChartComponent = ({ data, timeframe }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const [legendData, setLegendData] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#242632' },
        horzLines: { color: '#242632' }
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#758696',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#758696',
        },
      }
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350'
    });

    chart.subscribeCrosshairMove((param) => {
      const candlestickPoint = param.seriesData.get(candlestickSeries);
      if (candlestickPoint) {
        setLegendData({
          open: candlestickPoint.open.toFixed(2),
          high: candlestickPoint.high.toFixed(2),
          low: candlestickPoint.low.toFixed(2),
          close: candlestickPoint.close.toFixed(2),
          volume:
            candlestickPoint.volume !== undefined
              ? formatLargeNumber(candlestickPoint.volume)
              : 'N/A',
          oi:
            candlestickPoint.oi !== undefined
              ? formatLargeNumber(candlestickPoint.oi)
              : candlestickPoint.open_interest !== undefined
              ? formatLargeNumber(candlestickPoint.open_interest)
              : 'N/A',
        });
      }
    });

    if (data && data.length > 0) {
      const candlestickData = data
        .map((d) => ({
          time: normalizeChartTime(d.time || d.timestamp || d.date),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          oi: d.oi !== undefined ? d.oi : d.open_interest,
        }))
        .filter((d) => d.time !== undefined);

      candlestickSeries.setData(candlestickData);

      const lastCandle = candlestickData[candlestickData.length - 1];
      if (lastCandle) {
        setLegendData({
          open: lastCandle.open.toFixed(2),
          high: lastCandle.high.toFixed(2),
          low: lastCandle.low.toFixed(2),
          close: lastCandle.close.toFixed(2),
          volume: formatLargeNumber(lastCandle.volume),
          oi: formatLargeNumber(lastCandle.oi),
        });
      } else {
        setLegendData(null);
      }

      let rightOffset = 10;
      switch (timeframe) {
        case '1D':
          rightOffset = 5;
          break;
        case '1W':
          rightOffset = 10;
          break;
        case '1M':
          rightOffset = 20;
          break;
        case '1Y':
          rightOffset = 30;
          break;
        default:
          rightOffset = 10;
      }

      // ✅ Time axis formatting for intraday data
      chart.timeScale().applyOptions({
        rightOffset,
        timeVisible: true, // show HH:mm
        secondsVisible: false,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const date = new Date(time * 1000);
          if (['1min', '5min', '30min', '1hour'].includes(timeframe)) {
            return date.toLocaleTimeString(locale, {
              hour: '2-digit',
              minute: '2-digit',
            });
          }
          return date.toLocaleDateString(locale, {
            day: '2-digit',
            month: 'short',
          });
        },
      });
    }

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, timeframe]);

  return (
    <div ref={chartContainerRef} className="chart-container">
      {legendData && (
        <div className="legend">
          <div className="legend-item">
            O{' '}
            <span
              style={{
                color:
                  parseFloat(legendData.open) >= parseFloat(legendData.close)
                    ? '#26a69a'
                    : '#ef5350',
              }}
            >
              {legendData.open}
            </span>
          </div>
          <div className="legend-item">
            H <span style={{ color: '#26a69a' }}>{legendData.high}</span>
          </div>
          <div className="legend-item">
            L <span style={{ color: '#ef5350' }}>{legendData.low}</span>
          </div>
          <div className="legend-item">
            C{' '}
            <span
              style={{
                color:
                  parseFloat(legendData.open) >= parseFloat(legendData.close)
                    ? '#26a69a'
                    : '#ef5350',
              }}
            >
              {legendData.close}
            </span>
          </div>
          <div className="legend-item">
            Vol <span>{legendData.volume}</span>
          </div>
          <div className="legend-item">
            OI <span>{legendData.oi}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartComponent;
