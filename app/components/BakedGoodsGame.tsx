"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const GraphVisualization = ({ comparisonStats, items }) => {
  const [nodePositions, setNodePositions] = useState({});

  useEffect(() => {
    // Calculate node positions in a circle
    const radius = 180; // Increased radius to accommodate more items
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

  // Calculate net yes responses (yes - no) for a single direction
  const getNetYesResponses = (item1, item2) => {
    const key = `${item1}-${item2}`;
    const stats = comparisonStats[key] || { yes: 0, no: 0 };
    return stats.yes - stats.no;
  };

  // Get edges with positive net yes responses
  const getEdges = () => {
    const edges = [];
    items.forEach((item1) => {
      items.forEach((item2) => {
        if (item1 !== item2) {
          const netYes = getNetYesResponses(item1, item2);
          if (netYes > 0) {
            edges.push({
              source: item2, // Reversed: arrow points from parent to child
              target: item1,
              weight: netYes
            });
          }
        }
      });
    });
    return edges;
  };

  // Calculate arrow points for edge
  const getArrowPoints = (x1, y1, x2, y2, nodeRadius = 20) => {
    // Calculate the angle of the line
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Calculate the end point, adjusted for node radius
    const endX = x2 - (nodeRadius * Math.cos(angle));
    const endY = y2 - (nodeRadius * Math.sin(angle));

    // Calculate arrow head points
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6; // 30 degrees

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

      {/* Draw edges */}
      {getEdges().map((edge, i) => {
        const sourcePos = nodePositions[edge.source];
        const targetPos = nodePositions[edge.target];
        const strokeWidth = Math.min(edge.weight + 1, 5);

        // Calculate arrow points
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

      {/* Draw nodes */}
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

const BakedGoodsGame = () => {
  const bakedGoods = [
    'bread',
    'cake',
    'cookie',
    'pastry',
    'pie',
    'roll',
    'muffin',
    'donut',
    'brownie',
    'biscuit',
    'scone',
    'cracker',
    'tortilla',
    'crepe',
    'pancake',
    'waffle',
    'pita'
  ];

  // State management
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [showNext, setShowNext] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [comparisonStats, setComparisonStats] = useState({});

  const getComparisonKey = (item1, item2) => {
    return `${item1}-${item2}`;
  };

  const getRandomQuestion = () => {
    let first, second;
    do {
      first = bakedGoods[Math.floor(Math.random() * bakedGoods.length)];
      second = bakedGoods[Math.floor(Math.random() * bakedGoods.length)];
    } while (first === second);

    setItem1(first);
    setItem2(second);
    setShowNext(false);
  };

  useEffect(() => {
    getRandomQuestion();
  }, []);

  const handleAnswer = (answer) => {
    const key = getComparisonKey(item1, item2);
    setComparisonStats(prev => ({
      ...prev,
      [key]: {
        yes: (prev[key]?.yes || 0) + (answer === 'yes' ? 1 : 0),
        no: (prev[key]?.no || 0) + (answer === 'no' ? 1 : 0)
      }
    }));
    setShowNext(true);
  };

  const getCurrentStats = () => {
    const key = getComparisonKey(item1, item2);
    return comparisonStats[key] || { yes: 0, no: 0 };
  };

  if (showStats) {
    return (
      <Card className="w-full max-w-4xl mx-auto p-6">
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center">
              <Button
                onClick={() => setShowStats(false)}
                variant="ghost"
                className="mr-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Game
              </Button>
              <h2 className="text-2xl font-bold">Relationship Graph</h2>
            </div>

            <p className="text-gray-600">
              This graph shows hierarchical relationships between baked goods based on user answers.
              Arrows point from parent categories to their subtypes (e.g., if users say "a cookie is a type of pastry",
              an arrow points from pastry → cookie). Thicker arrows indicate stronger relationships.
            </p>

            <GraphVisualization
              comparisonStats={comparisonStats}
              items={bakedGoods}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto p-6">
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Baked Goods Comparison</h2>
              <Button
                onClick={() => setShowStats(true)}
                variant="outline"
              >
                View Stats Graph
              </Button>
            </div>
            <p className="text-xl mb-6">
              Is a <span className="font-bold text-blue-600">{item1}</span> a type of{' '}
              <span className="font-bold text-green-600">{item2}</span>?
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleAnswer('yes')}
              disabled={showNext}
              className="bg-green-500 hover:bg-green-600"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleAnswer('no')}
              disabled={showNext}
              className="bg-red-500 hover:bg-red-600"
            >
              No
            </Button>
          </div>

          {showNext && (
            <div className="space-y-4">
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  How others answered "{item1} - {item2}":
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="font-medium">Yes Answers</p>
                    <p className="text-2xl text-green-600">{getCurrentStats().yes}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">No Answers</p>
                    <p className="text-2xl text-red-600">{getCurrentStats().no}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={getRandomQuestion}
                  className="mt-4 bg-blue-500 hover:bg-blue-600"
                >
                  Next Question
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BakedGoodsGame;