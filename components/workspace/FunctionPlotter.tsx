/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface FunctionPlotterProps {
  id: string;
  data: {
    title: string;
    functions: string[];
    labels: string[];
    xDomain: [number, number];
    yDomain: [number, number];
    xLabel: string;
    yLabel: string;
    colors: string[];
  };
  initialWidth?: string | number;
  onResize?: (id: string, width: string) => void;
}

/**
 * A component that plots mathematical functions using d3.
 */
const FunctionPlotter: React.FC<FunctionPlotterProps> = ({
  id,
  data,
  initialWidth = 400,
  onResize,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const widthNum = (typeof initialWidth === 'string' ? parseInt(initialWidth) : initialWidth) || 400;
    const width = widthNum - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X-axis scale
    const x = d3.scaleLinear().domain(data.xDomain).range([0, width]);
    // Y-axis scale
    const y = d3.scaleLinear().domain(data.yDomain).range([height, 0]);

    // Add X-axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .text(data.xLabel);

    // Add Y-axis
    svg
      .append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', 'currentColor')
      .attr('text-anchor', 'middle')
      .text(data.yLabel);

    // Add title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('class', 'font-display text-sm uppercase tracking-widest')
      .attr('fill', 'currentColor')
      .text(data.title);

    // Plot functions
    data.functions.forEach((funcStr, i) => {
      const color = data.colors[i] || d3.schemeCategory10[i % 10];
      
      // Create a function from the string
      // Note: This is a simple parser, it might not handle complex functions
      const plotFunc = (xVal: number) => {
        try {
          // Replace common math functions with Math. equivalents
          const sanitized = funcStr
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/exp/g, 'Math.exp')
            .replace(/log/g, 'Math.log')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/pow/g, 'Math.pow')
            .replace(/abs/g, 'Math.abs')
            .replace(/PI/g, 'Math.PI')
            .replace(/E/g, 'Math.E');
          
          // Use Function constructor for evaluation
          const f = new Function('x', `return ${sanitized}`);
          return f(xVal);
        } catch (e) {
          return NaN;
        }
      };

      const line = d3
        .line<number>()
        .x((d) => x(d))
        .y((d) => y(plotFunc(d)))
        .defined((d) => !isNaN(plotFunc(d)));

      const points = d3.range(data.xDomain[0], data.xDomain[1], (data.xDomain[1] - data.xDomain[0]) / 200);

      svg
        .append('path')
        .datum(points)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    // Add legend
    if (data.labels.length > 0) {
      const legend = svg
        .append('g')
        .attr('transform', `translate(${width - 100}, 0)`);

      data.labels.forEach((label, i) => {
        const color = data.colors[i] || d3.schemeCategory10[i % 10];
        const g = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
        g.append('rect').attr('width', 10).attr('height', 10).attr('fill', color);
        g.append('text')
          .attr('x', 15)
          .attr('y', 10)
          .attr('font-size', '10px')
          .attr('fill', 'currentColor')
          .text(label);
      });
    }
  }, [data, initialWidth]);

  return (
    <div className="function-plotter border-2 border-black bg-theme-surface p-4 shadow-[4px_4px_0_0_#000]">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default FunctionPlotter;
