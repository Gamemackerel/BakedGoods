"use client";

import React, { useState, useEffect } from 'react';
import ForceGraph from './ForceGraph';
import { getUserId } from '@/lib/cookie-utils';
import { StatsMap } from '@/app/types/baked-goods';
import { Card } from '@/components/ui/card';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const StatsView = () => {
  const [comparisonStats, setComparisonStats] = useState<StatsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string>('');

  const bakedGoods = [
    'bread', 'cake', 'cookie', 'pastry', 'pie', 'roll', 'muffin',
    'donut', 'brownie', 'biscuit', 'scone', 'cracker', 'tortilla',
    'crepe', 'pancake', 'waffle', 'pita'
  ];

  useEffect(() => {
    setUserId(getUserId());
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/comparisons?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      const data = await response.json();
      setComparisonStats(data.comparisons);
    } catch (err) {
      setError('Failed to load comparison data. Please try again later.');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <Card className="w-[calc(100%-1rem)] sm:w-full max-w-2xl mx-2 sm:mx-auto mt-6 sm:mt-24 p-6">
        <LoadingSpinner />
      </Card>
    );
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto">
      <ForceGraph
        comparisonStats={comparisonStats}
        items={bakedGoods}
      />
      {error && <p>{error}</p>}
    </div>
  );
};

export default StatsView;