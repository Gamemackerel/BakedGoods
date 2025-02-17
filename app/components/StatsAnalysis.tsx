import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import _ from 'lodash';
import type { StatsMap, ComparisonStats } from '@/app/types/baked-goods';

interface StatsAnalysisProps {
  comparisonStats: StatsMap;
}

interface ControversialRelation {
  pair: [string, string];
  stats: ComparisonStats;
  percentage: number;
}

interface RelationshipCounts {
  mostIncoming: [string, number] | undefined;
  mostOutgoing: [string, number] | undefined;
}

const StatsAnalysis: React.FC<StatsAnalysisProps> = ({ comparisonStats }) => {
  // Helper function to get formatted percentage
  const getPercentage = (yes: number, no: number): number => {
    const total = yes + no;
    return total > 0 ? Math.round((yes / total) * 100) : 0;
  };

  // Find most controversial relationship (closest to 50/50 split)
  const getMostControversial = (): ControversialRelation | null => {
    let closestTo50 = null;
    let smallestDiff = Infinity;

    Object.entries(comparisonStats).forEach(([key, stats]) => {
      const total = stats.yes + stats.no;
      if (total >= 10) {
        const yesPercent = getPercentage(stats.yes, stats.no);
        const diffFrom50 = Math.abs(50 - yesPercent);
        if (diffFrom50 < smallestDiff) {
          smallestDiff = diffFrom50;
          closestTo50 = {
            pair: key.split('-'),
            stats: stats,
            percentage: yesPercent
          };
        }
      }
    });

    return closestTo50;
  };

  // Find items with most incoming/outgoing relationships
  const getRelationshipCounts = (): RelationshipCounts => {
    const incoming: Record<string, number> = {};
    const outgoing: Record<string, number> = {};

    // Process each relationship
    Object.entries(comparisonStats).forEach(([key, stats]) => {
      const [source, target] = key.split('-');

      // Only count strong relationships (more yes than no)
      if (stats.yes > stats.no) {
        // For each valid relationship, increment both counters
        outgoing[source] = (outgoing[source] || 0) + 1;
        incoming[target] = (incoming[target] || 0) + 1;
      }
    });

    // Convert objects to arrays of entries and find max
    const incomingEntries = Object.entries(incoming);
    const outgoingEntries = Object.entries(outgoing);

    const mostIncoming = incomingEntries.length > 0
    ? _.maxBy(incomingEntries, entry => entry[1])
    : undefined;

  const mostOutgoing = outgoingEntries.length > 0
    ? _.maxBy(outgoingEntries, entry => entry[1])
    : undefined;

    return { mostIncoming, mostOutgoing };
  };

  // Find the most clear-cut relationship
  const getMostClearCut = (): ControversialRelation | null => {
    let highestRatio = 0;
    let clearCutRelation = null;

    Object.entries(comparisonStats).forEach(([key, stats]) => {
      const total = stats.yes + stats.no;
      if (total >= 5) {
        const ratio = stats.yes / total;
        if (ratio > highestRatio) {
          highestRatio = ratio;
          clearCutRelation = {
            pair: key.split('-'),
            stats: stats,
            percentage: stats.yes > stats.no ?
              getPercentage(stats.yes, stats.no) :
              getPercentage(stats.no, stats.yes)
          };
        }
      }
    });

    return clearCutRelation;
  };

  const { controversial, relationshipCounts, clearCut } = useMemo(() => {
    const controversial = getMostControversial();
    const relationshipCounts = getRelationshipCounts();
    const clearCut = getMostClearCut();

    return { controversial, relationshipCounts, clearCut };
  }, [comparisonStats]);

  const { mostIncoming, mostOutgoing } = relationshipCounts;

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardContent className="space-y-4 mt-5">
        {mostIncoming && mostIncoming[1] > 0 && (
          <div>
            <h3 className="font-medium mb-1 underline">Most Generic Item</h3>
            <p>
              <span className="font-bold">{mostIncoming[0]}</span> has{' '}
              {mostIncoming[1]} different subtypes
            </p>
          </div>
        )}

        {mostOutgoing && mostOutgoing[1] > 0 && (
          <div>
            <h3 className="font-medium mb-1 underline">Most Versatile Item</h3>
            <p>
              <span className="font-bold">{mostOutgoing[0]}</span> is classified as{' '}
              {mostOutgoing[1]} different types
            </p>
          </div>
        )}

        {controversial && (
          <div>
            <h3 className="font-medium mb-1 underline">Most Controversial Relationship</h3>
            <p>
              Is a <span className="font-bold">{controversial.pair[0]}</span> a type of{' '}
              <span className="font-bold">{controversial.pair[1]}</span>?{' '}
              <span className="text-green-600">{controversial.stats.yes}</span> say yes,{' '}
              <span className="text-red-600">{controversial.stats.no}</span> say no
              ({controversial.percentage}% yes)
            </p>
          </div>
        )}

        {clearCut && (
          <div>
            <h3 className="font-medium mb-1 underline">Most Clear-cut Relationship</h3>
            <p>
              <span className="font-bold">{clearCut.percentage}%</span> agree that a{' '}
              <span className="font-bold">{clearCut.pair[0]}</span> is a type of{' '}
              <span className="font-bold">{clearCut.pair[1]}</span>
              ({clearCut.stats.yes} vs {clearCut.stats.no})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsAnalysis;