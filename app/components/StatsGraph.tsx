'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const StatsGraph = ({ comparisonStats, items }) => {
    const [nodePositions, setNodePositions] = useState({});

    useEffect(() => {
      // Calculate node positions in a circle
      const radius = 180;
      const center = { x: 250, y: 250 };
      const positions = {};

      items.forEach((item, index) => {
        const angle = (index / items.length) * 2 * Math.PI;
        positions[item] = {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle)
        };
      });

      setNodePositions(positions);
    }, [items]);

    const getNetYesResponses = (item1, item2) => {
      const key = `${item1}-${item2}`;
      const stats = comparisonStats[key] || { yes: 0, no: 0 };
      return stats.yes - stats.no;
    };

    const getEdges = () => {
      const edges = [];
      items.forEach((item1) => {
        items.forEach((item2) => {
          if (item1 !== item2) {
            const netYes = getNetYesResponses(item1, item2);
            if (netYes > 0) {
              edges.push({
                source: item2,
                target: item1,
                weight: netYes
              });
            }
          }
        });
      });
      return edges;
    };

    const getArrowPoints = (x1, y1, x2, y2, nodeRadius = 20) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const endX = x2 - (nodeRadius * Math.cos(angle));
      const endY = y2 - (nodeRadius * Math.sin(angle));
      const arrowLength = 10;
      const arrowAngle = Math.PI / 6;

      const point1X = endX - arrowLength * Math.cos(angle - arrowAngle);
      const point1Y = endY - arrowLength * Math.sin(angle - arrowAngle);
      const point2X = endX - arrowLength * Math.cos(angle + arrowAngle);
      const point2Y = endY - arrowLength * Math.sin(angle + arrowAngle);

      return {
        end: { x: endX, y: endY },
        arrowPoints: [
          { x: point1X, y: point1Y },
          { x: endX, y: endY },
          { x: point2X, y: point2Y }
        ]
      };
    };

    if (!Object.keys(nodePositions).length) return null;

    return (
      <svg width="500" height="500" className="mx-auto">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>

        {getEdges().map((edge, i) => {
          const sourcePos = nodePositions[edge.source];
          const targetPos = nodePositions[edge.target];
          const strokeWidth = Math.min(edge.weight + 1, 5);
          const arrow = getArrowPoints(
            sourcePos.x,
            sourcePos.y,
            targetPos.x,
            targetPos.y
          );

          return (
            <g key={i}>
              <line
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={arrow.end.x}
                y2={arrow.end.y}
                stroke="#666"
                strokeWidth={strokeWidth}
                opacity={0.5}
                markerEnd="url(#arrowhead)"
              />
            </g>
          );
        })}

        {items.map((item) => {
          const pos = nodePositions[item];
          return (
            <g key={item}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="20"
                fill="white"
                stroke="#333"
                strokeWidth="2"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
              >
                {item}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

export default StatsGraph