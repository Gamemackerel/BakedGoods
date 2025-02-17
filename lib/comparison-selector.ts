interface ComparisonStats {
  yes: number;
  no: number;
}

interface ScoredComparison {
  item1: string;
  item2: string;
  score: number;
}

/**
 * Calculate an "interestingness" score for a comparison
 * Scores are weighted towards:
 * 1. Balanced yes/no ratios (30%)
 * 2. Fewer total votes to ensure coverage (30%)
 * 3. Higher yes ratios (40%)
 * The final score is squared to increase the spread between high and low interest comparisons
 */
function calculateScore(stats: ComparisonStats | undefined): number {
  if (!stats) return 0.468; // Match balanced pair score for new comparisons

  const total = stats.yes + stats.no;
  if (total === 0) return 0.468;

  // Calculate ratio of yes votes
  const yesRatio = stats.yes / total;

  // Boost score for balanced comparisons (closer to 50/50)
  const balanceScore = 1 - Math.abs(0.5 - yesRatio);

  // Boost score for comparisons with more yes votes
  const yesBoost = yesRatio;

  // Reduce score as total votes increase (to ensure coverage)
  const coverageScore = 1 / (1 + Math.log(total + 1));

  // Combine scores with weights
  const baseScore = (balanceScore * 0.2) + (coverageScore * 0.2) + (yesBoost * 0.6);

  // Square the score to increase spread between high and low interest comparisons
  return Math.pow(baseScore, 2);
}

/**
 * Select a comparison pair using a weighted random selection
 * Higher scores have a proportionally higher chance of being selected
 */
export function selectComparison(
  items: string[],
  stats: Record<string, ComparisonStats>,
  userVotes: Set<string>
): { item1: string; item2: string } | null {
  // Generate all possible pairs and score them
  const candidates: ScoredComparison[] = [];
  debugger;
  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;

      const item1 = items[i];
      const item2 = items[j];
      const key = `${item1}-${item2}`;

      // Skip if user has already voted on this pair
      if (userVotes.has(key)) continue;

      const score = calculateScore(stats[key]);
      candidates.push({ item1, item2, score });
    }
  }
  debugger;
  if (candidates.length === 0) return null;

  // Calculate cumulative weights for weighted random selection
  const totalScore = candidates.reduce((sum, c) => sum + c.score, 0);
  const weights = candidates.map(c => c.score / totalScore);

  // Weighted random selection
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < candidates.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return {
        item1: candidates[i].item1,
        item2: candidates[i].item2
      };
    }
  }

  // Fallback to last candidate if we somehow didn't select one
  // (shouldn't happen due to cumulative weights)
  return {
    item1: candidates[candidates.length - 1].item1,
    item2: candidates[candidates.length - 1].item2
  };
}