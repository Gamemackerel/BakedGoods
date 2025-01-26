export interface ComparisonStats {
  yes: number;
  no: number;
}

export interface StatsMap {
  [key: string]: ComparisonStats;
}

export interface ComparisonAnswers {
  forward: boolean | null;
  reverse: boolean | null;
}

export interface ComparisonQuestionsProps {
  item1: string;
  item2: string;
  onAnswer: (answers: { forward: boolean; reverse: boolean }) => void;
  stats: {
    forward: ComparisonStats;
    reverse: ComparisonStats;
  };
  showResults: boolean;
  isSubmitting: boolean;
}