"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ComparisonQuestionsProps, ComparisonAnswers, StatsMap } from '@/app/types/baked-goods';
import { getUserId } from '@/lib/cookie-utils';
import { baseEntitySet } from '@/lib/entities';
import Link from 'next/link';
import { selectComparison } from '@/lib/comparison-selector';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const ComparisonQuestions: React.FC<ComparisonQuestionsProps> = ({
  item1,
  item2,
  onAnswer,
  stats,
  showResults,
  isSubmitting
}) => {
  const [answers, setAnswers] = useState({ forward: null, reverse: null });

  useEffect(() => {
    setAnswers({ forward: null, reverse: null });
  }, [item1, item2]);

  const handleAnswer = (direction: 'forward' | 'reverse', answer: boolean) => {
    const newAnswers = { ...answers, [direction]: answer };
    setAnswers(newAnswers);

    if (newAnswers.forward !== null && newAnswers.reverse !== null) {
      onAnswer(
        {
          forward: newAnswers.forward,
          reverse: newAnswers.reverse
        }
      );
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Forward question */}
        <div className={"space-y-4 p-6 border rounded-lg" + (answers.forward !== null ? " border-green-200 bg-green-50" : "")}>
          <p className="text-lg text-center">
            Is a <span className="font-bold">{item1}</span> a type of{' '}
            <span className="font-bold">{item2}</span>?
          </p>

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleAnswer('forward', true)}
              disabled={answers.forward !== null || isSubmitting}
              variant="outline"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleAnswer('forward', false)}
              disabled={answers.forward !== null || isSubmitting}
              variant="outline"
            >
              No
            </Button>
          </div>

          {showResults && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="font-medium">Yes</p>
                  <p className="text-xl text-green-600">{stats.forward?.yes || 0}</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">No</p>
                  <p className="text-xl text-red-600">{stats.forward?.no || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reverse question */}
        <div className={"space-y-4 p-6 border rounded-lg" + (answers.reverse !== null ? " border-green-200 bg-green-50" : "")}>
          <p className="text-lg text-center">
            Is a <span className="font-bold">{item2}</span> a type of{' '}
            <span className="font-bold">{item1}</span>?
          </p>

          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleAnswer('reverse', true)}
              disabled={answers.reverse !== null || isSubmitting}
              variant="outline"
            >
              Yes
            </Button>
            <Button
              onClick={() => handleAnswer('reverse', false)}
              disabled={answers.reverse !== null || isSubmitting}
              variant="outline"
            >
              No
            </Button>
          </div>

          {showResults && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="font-medium">Yes</p>
                  <p className="text-xl text-green-600">{stats.reverse?.yes || 0}</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">No</p>
                  <p className="text-xl text-red-600">{stats.reverse?.no || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BakedGoodsGame = () => {


  const [items, setItems] = useState({ item1: '', item2: '' });
  const [showResults, setShowResults] = useState(false);
  const [comparisonStats, setComparisonStats] = useState<StatsMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get or create user ID from cookie
    setUserId(getUserId());
  }, []);

  const getRandomPair = (comparisonStats: StatsMap, userVotes: Set<string>) => {
    const result = selectComparison(baseEntitySet, comparisonStats, userVotes);
    if (!result) {
      setError("You've answered all available comparisons!");
      return false;
    }

    setItems(result);
    setShowResults(false);
    return true;
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/comparisons?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch comparison data');
      const data = await response.json();

      setComparisonStats(data.comparisons);

      const votes = new Set<string>();
      data.userVotes.forEach((vote: {item1: string, item2: string}) => {
        votes.add(`${vote.item1}-${vote.item2}`);
      });
      setUserVotes(votes);
      return {
        comparisons: data.comparisons,
        userVotes: votes
      }
    } catch (err) {
      setError('Failed to load comparison data. Please try again later.');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchStats().then((result) => {
        if (result) {
          getRandomPair(result.comparisons, result.userVotes);
        }
      });
    }
  }, [userId]);

  const handleAnswers = async ({ forward, reverse }: ComparisonAnswers) => {
    if (!userId) return;

    setIsSubmitting(true);
    setError('');

    try {
      const responses = await Promise.all([
        fetch('/api/comparisons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item1: items.item1,
            item2: items.item2,
            response: forward,
            userId
          }),
        }),
        fetch('/api/comparisons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item1: items.item2,
            item2: items.item1,
            response: reverse,
            userId
          }),
        }),
      ]);

      if (!responses.every(r => r.ok)) {
        throw new Error('Failed to submit one or more answers');
      }

      userVotes.add(`${items.item1}-${items.item2}`);
      userVotes.add(`${items.item2}-${items.item1}`);
      setUserVotes(new Set(userVotes));

      await fetchStats();
      setShowResults(true);
    } catch (err) {
      setError('Failed to submit answers. Please try again.');
      console.error('Error submitting answers:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentStats = () => ({
    forward: comparisonStats[`${items.item1}-${items.item2}`] || { yes: 0, no: 0 },
    reverse: comparisonStats[`${items.item2}-${items.item1}`] || { yes: 0, no: 0 }
  });

  if (isLoading) {
    return (
      <Card className="w-[calc(100%-1rem)] sm:w-full max-w-2xl mx-2 sm:mx-auto mt-6 sm:mt-24 p-6">
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[calc(100%-1rem)] sm:w-full max-w-2xl mx-2 sm:mx-auto mt-6 sm:mt-24 p-6">
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold">Breaducator</h2>
              <Link href="/graph" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  Results
                </Button>
              </Link>
            </div>
            <p className="text-sm mb-8">Discovering the true taxonomy of baked goods through collective wisdom.</p>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <ComparisonQuestions
              item1={items.item1}
              item2={items.item2}
              onAnswer={handleAnswers}
              stats={getCurrentStats()}
              showResults={showResults}
              isSubmitting={isSubmitting}
            />

            {isSubmitting && <LoadingSpinner />}
            {showResults && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => getRandomPair(comparisonStats, userVotes)}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  Next Pair
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BakedGoodsGame;