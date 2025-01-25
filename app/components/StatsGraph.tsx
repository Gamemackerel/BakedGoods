import React, { useEffect, useRef, useState } from 'react';

const StatsGraph = ({ comparisonStats, items }) => {
  const svgRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const animationRef = useRef(null);
  const simulationRef = useRef(null);

  useEffect(() => {
    const width = 600;
    const height = 500;
    const nodeRadius = 30;

    // Process data
    const nodes = items.map(item => ({ id: item, radius: nodeRadius, x: width/2, y: height/2 }));
    const links = [];

    items.forEach((item1) => {
      items.forEach((item2) => {
        if (item1 !== item2) {
          const key = `${item1}-${item2}`;
          const stats = comparisonStats[key];
          if (stats && stats.yes > stats.no) {
            links.push({
              source: item1,
              target: item2,
              value: stats.yes - stats.no
            });
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
    setLinks(links);
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
        const centerX = 300;
        const centerY = 250;
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
        node1.x = Math.max(30, Math.min(570, node1.x));
        node1.y = Math.max(30, Math.min(470, node1.y));
      });

      // Link forces
      sim.links.forEach(link => {
        const source = sim.nodes.find(n => n.id === link.source);
        const target = sim.nodes.find(n => n.id === link.target);
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
    const handleMouseMove = (e) => {
      if (draggedNode) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const y = e.clientY - svgRect.top;

        const updatedNodes = nodes.map(node =>
          node.id === draggedNode.id
            ? { ...node, x: Math.max(30, Math.min(570, x)), y: Math.max(30, Math.min(470, y)) }
            : node
        );
        setNodes(updatedNodes);
        simulationRef.current.nodes = updatedNodes;
      }
    };

    const handleMouseUp = () => {
      if (draggedNode) {
        setDraggedNode(null);
        startAnimation();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedNode, nodes]);

  const getStrokeColor = (link) => {
    if (!hoveredNode) return '#666';
    return (link.source === hoveredNode || link.target === hoveredNode) ? '#000' : '#ddd';
  };

  const getStrokeWidth = (link) => {
    const baseWidth = Math.min(link.value, 5);
    if (!hoveredNode) return baseWidth;
    return (link.source === hoveredNode || link.target === hoveredNode) ? baseWidth + 1 : baseWidth - 1;
  };

  const getNodeOpacity = (node) => {
    if (!hoveredNode) return 1;
    return node.id === hoveredNode || links.some(l =>
      (l.source === hoveredNode && l.target === node.id) ||
      (l.target === hoveredNode && l.source === node.id)
    ) ? 1 : 0.3;
  };

  return (
    <svg ref={svgRef} width="600" height="500" className="mx-auto">
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="25"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
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
          const angle = Math.atan2(dy, dx);

          const sourceRadius = 30;
          const targetRadius = 30;

          const sourceX = source.x + sourceRadius * Math.cos(angle);
          const sourceY = source.y + sourceRadius * Math.sin(angle);
          const targetX = target.x - targetRadius * Math.cos(angle);
          const targetY = target.y - targetRadius * Math.sin(angle);

          return (
            <g key={i} className="link">
              <line
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                stroke={getStrokeColor(link)}
                strokeWidth={getStrokeWidth(link)}
                markerEnd="url(#arrowhead)"
                opacity={0.6}
              />
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
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onMouseDown={(e) => {
              e.preventDefault();
              setDraggedNode(node);
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <circle
              r="30"
              fill="white"
              stroke={hoveredNode === node.id ? '#000' : '#666'}
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
  );
};

export default StatsGraph;