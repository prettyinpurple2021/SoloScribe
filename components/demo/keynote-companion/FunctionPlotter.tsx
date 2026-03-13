/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as React from 'react';
import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label as RechartsLabel,
  ReferenceLine
} from 'recharts';

export type GraphData = {
  title?: string;
  functions: string[];
  labels?: string[];
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel?: string;
  yLabel?: string;
  colors?: string[];
};

// Define a default color palette for the plots if not provided.
// Using a high-contrast palette for better distinction.
const DEFAULT_PLOT_COLORS = [
  '#FF0000', // Red
  '#0000FF', // Blue
  '#00AA00', // Green
  '#FF8C00', // Dark Orange
  '#990099', // Purple
  '#00AAAA', // Teal
  '#FF00FF', // Magenta
  '#8B4513', // Saddle Brown
];

declare const MathJax: any;

interface FunctionPlotterProps {
  id: string;
  data: GraphData;
  initialWidth: string | null;
  onResize: (id: string, newWidth: string) => void;
}

// Helper to sanitize common errors in derivative notation from the model.
const sanitizeDerivativeLabel = (label: string): string => {
  // Fixes cases where the model might output '' instead of ' for a second derivative
  let sanitized = label.replace(/''/g, "'");
  // Fixes unnecessary escaping of apostrophes
  sanitized = sanitized.replace(/\\'/g, "'");
  return sanitized;
};

// Helper to evaluate a mathematical function string safely
const evaluateFunction = (fnStr: string, x: number): number | null => {
  try {
    let jsFn = fnStr.trim();
    
    // 1. Handle implicit multiplication
    // 2x -> 2*x
    jsFn = jsFn.replace(/(\d)\s*([xt])/g, '$1 * $2');
    // x(x+1) -> x*(x+1)
    jsFn = jsFn.replace(/([xt])\s*\(/g, '$1 * (');
    // (x+1)(x-1) -> (x+1)*(x-1)
    jsFn = jsFn.replace(/\)\s*\(/g, ') * (');
    // (x+1)2 -> (x+1)*2
    jsFn = jsFn.replace(/\)\s*(\d)/g, ') * $1');

    // 2. Replace common math functions and constants with Math.*
    // Also handle ^ for power
    jsFn = jsFn
      .replace(/\^/g, '**')
      .replace(/\b(sin|cos|tan|asin|acos|atan|exp|log|log10|sqrt|abs|pow|PI|E)\b/g, 'Math.$1');

    // 3. Scoped evaluation
    // Create a function that accepts both x and t.
    // We pass the same value to both to support either variable.
    const f = new Function('x', 't', `"use strict"; return (${jsFn});`);
    const result = f(x, x);
    return isFinite(result) ? result : null;
  } catch (e) {
    return null;
  }
};

// Helper to generate nice ticks including zero
const getNiceTicks = (min: number, max: number, count = 5) => {
  if (!isFinite(min) || !isFinite(max)) return [];
  if (min === max) return [min];
  if (min > max) [min, max] = [max, min];
  
  const step = (max - min) / count;
  if (step <= 0) return [min];

  const power = Math.floor(Math.log10(step));
  const magnitude = Math.pow(10, power);
  const normalizedStep = step / magnitude;
  
  let niceStep;
  if (normalizedStep < 1.5) niceStep = 1;
  else if (normalizedStep < 3) niceStep = 2;
  else if (normalizedStep < 7) niceStep = 5;
  else niceStep = 10;
  
  niceStep *= magnitude;
  
  // If the range includes 0, we want 0 to be a tick.
  // We align the start to be a multiple of niceStep.
  let start = Math.ceil(min / niceStep) * niceStep;
  // Fix floating point issues
  if (Math.abs(start) < 1e-10) start = 0;
  
  const ticks = [];
  // Safety break to prevent infinite loops
  let safety = 0;
  for (let t = start; t <= max + 1e-10; t += niceStep) {
    if (safety++ > 1000) break;
    // Fix floating point issues (e.g. 0.30000000000000004)
    const val = parseFloat(t.toPrecision(10));
    if (val >= min && val <= max) {
      ticks.push(val);
    }
  }
  
  // Ensure 0 is strictly included if it's in range
  if (min <= 0 && max >= 0 && !ticks.some(t => Math.abs(t) < 1e-10)) {
    ticks.push(0);
    ticks.sort((a, b) => a - b);
  }
  
  return ticks;
};

class PlotErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Plotter Error:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="illustration-error" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="icon" style={{ marginRight: '8px' }}>error</span>
          <span>Error rendering plot. Try zooming out or resetting.</span>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

/**
 * A component to render and manage a resizable mathematical graph
 * using Recharts. It is theme-aware and includes a custom legend with MathJax support.
 * Supports Zoom and Pan.
 */
const FunctionPlotter: React.FC<FunctionPlotterProps> = ({
  id,
  data,
  initialWidth,
  onResize,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotAreaRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(400);
  
  // State for Zoom/Pan
  const [xDomain, setXDomain] = useState<[number, number]>(data.xDomain);
  const [yDomain, setYDomain] = useState<[number, number]>(data.yDomain);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);

  // Reset domains when data changes
  useEffect(() => {
    if (data.xDomain && data.xDomain.length === 2 && isFinite(data.xDomain[0]) && isFinite(data.xDomain[1])) {
        setXDomain(data.xDomain);
    }
    if (data.yDomain && data.yDomain.length === 2 && isFinite(data.yDomain[0]) && isFinite(data.yDomain[1])) {
        setYDomain(data.yDomain);
    }
  }, [data.xDomain, data.yDomain]);

  // Effect to re-run MathJax on the legend when data changes
  useEffect(() => {
    if (legendRef.current && typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
      MathJax.typesetClear([legendRef.current]);
      MathJax.typesetPromise([legendRef.current]).catch((err: Error) =>
        console.error('MathJax typesetting error in legend:', err),
      );
    }
  }, [data]);

  // Generate data points for the chart based on current ZOOMED domain
  const chartData = useMemo(() => {
    const points = [];
    const [minX, maxX] = xDomain;
    
    if (!isFinite(minX) || !isFinite(maxX) || minX >= maxX) return [];

    // Generate enough points for smooth curves in the current view
    const pointCount = 200; 
    const step = (maxX - minX) / pointCount;

    for (let i = 0; i <= pointCount; i++) {
      const x = minX + i * step;
      const point: any = { x };
      data.functions.forEach((fn, index) => {
        const y = evaluateFunction(fn, x);
        if (y !== null && isFinite(y)) {
          point[`fn${index}`] = y;
        }
      });
      points.push(point);
    }
    return points;
  }, [data.functions, xDomain]);

  // --- Zoom Logic (Wheel) ---
  // We use a non-passive event listener via ref to ensure preventDefault works
  useEffect(() => {
    const plotArea = plotAreaRef.current;
    if (!plotArea) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = 0.1;
      const direction = e.deltaY > 0 ? 1 : -1; // > 0 is scroll down (zoom out), < 0 is scroll up (zoom in)
      
      setXDomain(([min, max]) => {
        if (!isFinite(min) || !isFinite(max)) return [min, max];
        const range = max - min;
        const change = range * zoomFactor * direction;
        return [min - change, max + change];
      });
      
      setYDomain(([min, max]) => {
        if (!isFinite(min) || !isFinite(max)) return [min, max];
        const range = max - min;
        const change = range * zoomFactor * direction;
        return [min - change, max + change];
      });
    };

    plotArea.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      plotArea.removeEventListener('wheel', onWheel);
    };
  }, []);

  // --- Pan Logic (Drag) ---
  const handleChartMouseDown = (e: React.MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleChartMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMousePos.current) return;
    e.preventDefault();

    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // Convert pixel delta to domain delta
    // We need to approximate the scale. 
    // width is known. height is fixed at 400.
    const [minX, maxX] = xDomain;
    const [minY, maxY] = yDomain;
    
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) return;

    // This is an approximation because we don't have exact chart area dimensions (margins etc)
    // but it's good enough for panning.
    const chartWidth = width - 60; // approximate margins
    const chartHeight = height - 40; // approximate margins
    
    if (chartWidth <= 0 || chartHeight <= 0) return;

    const domainWidth = maxX - minX;
    const domainHeight = maxY - minY;

    const shiftX = (dx / chartWidth) * domainWidth;
    const shiftY = (dy / chartHeight) * domainHeight;

    // Recharts X axis goes left-to-right (screen x increases -> domain x increases)
    // Recharts Y axis goes bottom-to-top (screen y increases -> domain y decreases)
    
    setXDomain([minX - shiftX, maxX - shiftX]);
    setYDomain([minY + shiftY, maxY + shiftY]);
  };

  const handleChartMouseUp = () => {
    setIsDragging(false);
    lastMousePos.current = null;
  };

  const handleChartMouseLeave = () => {
    setIsDragging(false);
    lastMousePos.current = null;
  };

  // --- Resize Logic (Handle) ---
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      const parent = container?.parentElement;
      if (!container || !parent) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = container.offsetWidth;
      const startHeight = height;
      const parentWidth = parent.offsetWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        let newWidthPx = startWidth + dx;
        if (newWidthPx < 300) newWidthPx = 300;
        if (newWidthPx > parentWidth) newWidthPx = parentWidth;
        container.style.width = `${newWidthPx}px`;
        
        let newHeightPx = startHeight + dy;
        if (newHeightPx < 200) newHeightPx = 200; // min height
        if (newHeightPx > 800) newHeightPx = 800; // max height
        setHeight(newHeightPx);
      };

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        if (container) {
          const finalWidthPx = container.offsetWidth;
          const finalWidthPercent = (finalWidthPx / parentWidth) * 100;
          container.style.width = `${finalWidthPercent.toFixed(2)}%`;
          onResize(id, `${finalWidthPercent.toFixed(2)}%`);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [id, onResize, height],
  );

  // Observe container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setWidth(container.offsetWidth);

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const plotColors = data.colors && data.colors.length > 0 ? data.colors : DEFAULT_PLOT_COLORS;
  
  const xTicks = getNiceTicks(xDomain[0], xDomain[1]);
  const yTicks = getNiceTicks(yDomain[0], yDomain[1]);

  return (
    <div
      ref={containerRef}
      className="graph-container resizable my-8 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
      style={{ width: initialWidth || '100%', minHeight: '400px', position: 'relative', display: 'flex', flexDirection: 'column' }}
    >
      {data.title && (
        <div className="graph-title" style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px', fontSize: '1.1em' }}>
          {data.title}
        </div>
      )}

      <div 
        ref={plotAreaRef}
        className="graph-plot-area" 
        style={{ width: '100%', height: height, cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleChartMouseDown}
        onMouseMove={handleChartMouseMove}
        onMouseUp={handleChartMouseUp}
        onMouseLeave={handleChartMouseLeave}
      >
        <PlotErrorBoundary>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                type="number" 
                domain={xDomain} 
                ticks={xTicks}
                allowDataOverflow={true}
                tickFormatter={(val) => val.toFixed(1)}
              >
                 {data.xLabel && <RechartsLabel value={data.xLabel} position="insideBottomRight" offset={-10} />}
              </XAxis>
              <YAxis 
                domain={yDomain} 
                ticks={yTicks}
                allowDataOverflow={true}
              >
                 {data.yLabel && <RechartsLabel value={data.yLabel} angle={-90} position="insideLeft" style={{textAnchor: 'middle'}} />}
              </YAxis>
              <Tooltip 
                formatter={(value: number) => value.toFixed(2)}
                labelFormatter={(label: number) => `x: ${label.toFixed(2)}`}
              />
              {/* Reference lines for axes */}
              <ReferenceLine x={0} stroke="#666" strokeWidth={1} />
              <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
  
              {data.functions.map((fn, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={`fn${index}`}
                  stroke={plotColors[index % plotColors.length]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </PlotErrorBoundary>
        
        <div style={{
            position: 'absolute', 
            top: 10, 
            right: 10, 
            background: 'rgba(255,255,255,0.7)', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none'
        }}>
            Scroll to Zoom • Drag to Pan
        </div>
      </div>

      <div className="graph-legend" ref={legendRef} style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {data.functions.map((fn, i) => {
            const label = data.labels && data.labels[i] ? data.labels[i] : `y_${i}`;
            return (
              <li key={i} className="graph-legend-item" style={{ display: 'flex', alignItems: 'center', minWidth: 'fit-content' }}>
                <span
                  className="legend-color-swatch"
                  style={{ 
                    backgroundColor: plotColors[i % plotColors.length],
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    display: 'inline-block',
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                ></span>
                <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>
                  {(() => {
                    const sanitized = sanitizeDerivativeLabel(label);
                    // If it already has delimiters, or looks like it should be math (no spaces, contains math chars)
                    if (sanitized.includes('$') || sanitized.includes('\\(')) return sanitized;
                    if (/\s/.test(sanitized)) return sanitized; // Likely plain text
                    return `$${sanitized}$`;
                  })()}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="resize-handle" onMouseDown={handleResizeMouseDown}></div>
    </div>
  );
};

export default FunctionPlotter;

