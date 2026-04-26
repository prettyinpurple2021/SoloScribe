import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useUI, useWorkspaceStore } from '../../lib/state';

export const ProjectGraph: React.FC = () => {
  const { projects } = useUI();
  const { wikiLinks } = useWorkspaceStore();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || projects.length === 0) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height]);
    
    svg.selectAll('*').remove();

    const nodes = projects.map(p => ({ id: p.id, name: p.name }));
    const links = wikiLinks.map(l => ({ source: l.sourceProjectId, target: l.targetProjectId }));

    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', '#00f3ff')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('rect')
      .attr('width', (d: any) => d.name.length * 8 + 20)
      .attr('height', 30)
      .attr('x', (d: any) => -(d.name.length * 8 + 20) / 2)
      .attr('y', -15)
      .attr('fill', '#fff')
      .attr('stroke', '#000')
      .attr('stroke-width', 3);

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-family', 'Rajdhani')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text((d: any) => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => { simulation.stop(); };
  }, [projects, wikiLinks]);

  return (
    <div className="w-full h-full bg-black/40 border-4 border-black p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display uppercase text-[#00f3ff]">Startup Brain Graph</h3>
        <span className="text-[10px] text-white/50 font-mono italic">VISUALIZING DOCUMENT CONNECTIVITY</span>
      </div>
      <div className="flex-1 bg-white/5 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
};
