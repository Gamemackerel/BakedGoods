import React, { useEffect, useRef, useState } from 'react';
import type { Node, GraphLink, ForceGraphProps, SimulationState } from '@/app/types/force-graph';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import StatsAnalysis from './StatsAnalysis';

const ForceGraph: React.FC<ForceGraphProps> = ({ comparisonStats, items }: ForceGraphProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setGraphLinks] = useState<GraphLink[]>([]);
  const animationRef = useRef<number | null>(null);
  const simulationRef = useRef<SimulationState | null>(null);

  const basicStrokeColor = '#6b7280';
  const fadedStrokeColor = '#E5E7EB';

  const width = window.innerWidth;
  const height = Math.max(500, window.innerHeight - 100);

  useEffect(() => {
    const nodeRadius = 30;

    // Process data
    const nodes = items.map(item => ({ id: item, radius: nodeRadius, x: width/2, y: height/2 }));
    const links: GraphLink[] = [];
    const allValues: number[] = [];

    // First pass: collect all values for statistical analysis
    items.forEach((item1) => {
      items.forEach((item2) => {
        if (item1 !== item2) {
          const key = `${item1}-${item2}`;
          const stats = comparisonStats[key];
          if (stats && stats.yes > stats.no) {
            allValues.push(stats.yes - stats.no);
          }
        }
      });
    });

    // Calculate mean and standard deviation
    const mean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    const stdDev = Math.sqrt(
      allValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / allValues.length
    ) || 1; // Use 1 as fallback when stdDev is 0

    // Second pass: only include links that are statistically significant (z-score > 1)
    items.forEach((item1) => {
      items.forEach((item2) => {
        if (item1 !== item2) {
          const key = `${item1}-${item2}`;
          const stats = comparisonStats[key];
          if (stats && stats.yes > stats.no) {
            const value = stats.yes - stats.no;
            const zScore = (value - mean) / stdDev;
            if (zScore > -2) {
              links.push({
                source: item1,
                target: item2,
                value: value
              });
            }
          }
        }
      });
    });

    // Initial positions in a circle
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      node.x = width/2 + Math.cos(angle) * 150;
      node.y = height/2 + Math.sin(angle) * 150;
    });

    setNodes(nodes);
    setGraphLinks(links);
    simulationRef.current = { nodes, links };

    // Start animation
    if (!draggedNode) {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [comparisonStats, items]);

  const startAnimation = () => {
    const animate = () => {
      if (!simulationRef.current || draggedNode) return;

      const sim = simulationRef.current;

      // Apply forces
      sim.nodes.forEach(node1 => {
        // Center force
        const centerX = (width*3)/8;
        const centerY = height/2;
        node1.x += (centerX - node1.x) * 0.005;
        node1.y += (centerY - node1.y) * 0.005;

        // Node repulsion
        sim.nodes.forEach(node2 => {
          if (node1 !== node2) {
            const dx = node2.x - node1.x;
            const dy = node2.y - node1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              const force = (100 - dist) / dist * 0.2;
              node1.x -= dx * force;
              node1.y -= dy * force;
              node2.x += dx * force;
              node2.y += dy * force;
            }
          }
        });

        // Boundary forces
        const padding = node1.radius + 10;
        node1.x = Math.max(padding, Math.min(width - padding, node1.x));
        node1.y = Math.max(padding, Math.min(height - padding, node1.y));
      });

      // GraphLink forces
      sim.links.forEach(link => {
        const source = sim.nodes.find(n => n.id === link.source);
        const target = sim.nodes.find(n => n.id === link.target);

        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const targetDist = 120;
        const force = (targetDist - dist) / dist * 0.05;

        source.x -= dx * force;
        source.y -= dy * force;
        target.x += dx * force;
        target.y += dy * force;
      });

      setNodes([...sim.nodes]);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedNode && svgRef.current && simulationRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const y = e.clientY - svgRect.top;
        updateNodePosition(draggedNode, simulationRef.current, x, y);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (draggedNode && svgRef.current && simulationRef.current) {
        e.preventDefault();
        const svgRect = svgRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - svgRect.left;
        const y = touch.clientY - svgRect.top;
        updateNodePosition(draggedNode, simulationRef.current, x, y);
      }
    };

    const handleMouseUp = () => {
      if (draggedNode) {
        setDraggedNode(null);
        setHoveredNode(null);
        startAnimation();
      }
    };

    const handleTouchEnd = handleMouseUp;

    const updateNodePosition = (
      currentNode: Node,
      simulation: SimulationState,
      x: number,
      y: number
    ) => {
      const updatedNodes = nodes.map(node =>
        node.id === currentNode.id
          ? {
              ...node,
              x: Math.max(node.radius, Math.min(width - node.radius, x)),
              y: Math.max(node.radius, Math.min(height - node.radius, y))
            }
          : node
      );

      setNodes(updatedNodes);
      simulation.nodes = updatedNodes;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draggedNode, nodes]);

  const getStrokeColor = (link: GraphLink) => {
    if (!hoveredNode) return basicStrokeColor;
    return (link.source === hoveredNode || link.target === hoveredNode) ? basicStrokeColor : fadedStrokeColor;
  };

  const getStrokeWidth = (link: GraphLink) => {
    // Calculate z-score for this link's value compared to all links
    const values = links.map(l => l.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
    );

    // Convert z-score to a width between 1 and 6
    const zScore = (link.value - mean) / stdDev;
    const baseWidth = Math.max(1, Math.min(6, 3 + zScore));

    // Adjust width on hover
    if (!hoveredNode) return baseWidth || 1;
    return ((link.source === hoveredNode || link.target === hoveredNode)
      ? baseWidth + 0.5
      : baseWidth - 0.5) || 1;
  };

  const getNodeOpacity = (node: Node) => {
    if (!hoveredNode) return 1;
    return node.id === hoveredNode || links.some(l =>
      (l.source === hoveredNode && l.target === node.id) ||
      (l.target === hoveredNode && l.source === node.id)
    ) ? 1 : 0.15;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              className="w-full"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Game
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">Relationship Graph</h2>
        </div>
        <p className="mt-2 text-gray-600">
          This graph shows hierarchical relationships between baked goods based on user answers.
          Arrows point from the subtype to the supertype.
        </p>
      </div>

      <div className="flex-1 overflow-hidden">

        <svg ref={svgRef} width={width} height={height} className="">
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
              className="transition-opacity duration-200"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={hoveredNode ? fadedStrokeColor : basicStrokeColor} />
            </marker>
            <marker
              id="arrowhead-active"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#666"/>
            </marker>
          </defs>

          <g className="links">
            {links.map((link, i) => {
              const source = nodes.find(n => n.id === link.source);
              const target = nodes.find(n => n.id === link.target);
              if (!source || !target) return null;

              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const dr = Math.sqrt(dx * dx + dy * dy);

              // Check if there's a reverse link and if this is the second link
              const reverseGraphLink = links.find(l =>
                l.source === link.target && l.target === link.source
              );
              const isSecondGraphLink = reverseGraphLink && link.source > link.target;

              // Curve in opposite directions for bidirectional links
              const curve = reverseGraphLink ? (isSecondGraphLink ? -dr * 0.2 : dr * 0.2) : 0;

              const sourceRadius = 30;
              const targetRadius = 30;

              const angle = Math.atan2(dy, dx);
              const sourceX = source.x + sourceRadius * Math.cos(angle);
              const sourceY = source.y + sourceRadius * Math.sin(angle);
              const targetX = target.x - targetRadius * Math.cos(angle);
              const targetY = target.y - targetRadius * Math.sin(angle);

              // Create curved path with adjusted control points for opposite curves
              const midX = (sourceX + targetX) / 2;
              const midY = (sourceY + targetY) / 2;

              // Determine curve direction based on node IDs to ensure consistency
              const curveDirection = link.source < link.target ? 1 : -1;
              const perpX = -dy / dr * curve * curveDirection;
              const perpY = dx / dr * curve * curveDirection;
              const controlX = midX + perpX;
              const controlY = midY + perpY;

              const path = reverseGraphLink
                ? `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`
                : `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

              return (
                <g key={i} className="link">
                  <path
                    d={path}
                    fill="none"
                    stroke={getStrokeColor(link)}
                    strokeWidth={getStrokeWidth(link)}
                    markerEnd={`url(#${(hoveredNode && (link.source === hoveredNode || link.target === hoveredNode)) ? 'arrowhead-active' : 'arrowhead'})`}
                    opacity={0.6}
                  />
                  {hoveredNode && (link.source === hoveredNode || link.target === hoveredNode) && (
                    <text
                      x={controlX}
                      y={controlY}
                      dy={curveDirection * -5}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#3b82f6"  // Tailwind blue-500
                      className="select-none pointer-events-none"
                      fontWeight="bold"
                    >
                      {link.value}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          <g className="nodes">
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x || 0},${node.y || 0})`}
                opacity={getNodeOpacity(node)}
                onMouseEnter={() => !draggedNode && setHoveredNode(node.id)}
                onMouseLeave={() => !draggedNode && setHoveredNode(null)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setDraggedNode(node);
                  setHoveredNode(node.id);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  setDraggedNode(node);
                  setHoveredNode(node.id);
                }}
                className="cursor-grab active:cursor-grabbing touch-none"
              >
                <circle
                  r="30"
                  fill="white"
                  stroke={hoveredNode === node.id ? '#000' : basicStrokeColor}
                  strokeWidth={hoveredNode === node.id ? 3 : 1}
                  className="transition-all duration-200"
                />
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fontSize="12"
                  fontWeight={hoveredNode === node.id ? 'bold' : 'normal'}
                  className="select-none pointer-events-none"
                >
                  {node.id}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
      <footer className="text-center text-sm text-gray-500 mb-2">
        <StatsAnalysis comparisonStats={comparisonStats} />
        <a className='hover:underline' href='https://github.com/Gamemackerel/BakedGoods'>View on GitHub</a>
      </footer>
    </div>
  );
};

export default ForceGraph;