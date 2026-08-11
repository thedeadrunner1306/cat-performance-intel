export interface SnapshotMetrics {
  recentMockScore: number;
  recentTrend: number;
  daysStudied: number;
  questionsSolvedThisMonth: number;
  hoursInvestedThisMonth: number;
}

export interface TopicTrend {
  topicId: string;
  topicLabel: string;
  section: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  direction: 'up' | 'down' | 'stable';
  dataPoints: number;
}

export interface GrowthDriver {
  topicLabel: string;
  section: string;
  contribution: number;
  percentage: number;
}

export interface ScoreLeakage {
  topicLabel: string;
  section: string;
  potentialScore: number;
  actualScore: number;
  lostMarks: number;
}

export interface FocusRecommendation {
  topicLabel: string;
  section: string;
  reason: string;
  currentAccuracy: number;
  mockFrequency: number;
  expectedGain: number;
  priority: 'Critical' | 'High' | 'Medium';
}

export interface MockTrend {
  mockId: string;
  mockName: string;
  date: string;
  overallScore: number;
  percentile: number;
  varcScore: number;
  dilrScore: number;
  quantScore: number;
  deltaFromPrevious: number;
}

export interface TopicPerformance {
  topicId: string;
  topicLabel: string;
  section: string;
  questionsSolved: number;
  accuracy: number;
  avgTime: number;
  consistency: number;
  trend: number;
  difficultyBreakdown: {
    easy: { attempted: number; correct: number };
    medium: { attempted: number; correct: number };
    hard: { attempted: number; correct: number };
  };
  mistakeBreakdown: Record<string, number>;
  mockImpact: number;
}

export interface SectionOverview {
  section: string;
  accuracy: number;
  speed: number;
  efficiency: number;
  consistency: number;
  totalAttempted: number;
  totalCorrect: number;
  avgTimePerQuestion: number;
  trendData: { date: string; accuracy: number; speed: number }[];
}

export interface Insight {
  id: string;
  type: 'effort-mismatch' | 'cross-section' | 'streak' | 'fastest-improving' | 'time-allocation' | 'pattern';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'positive';
  metric?: string;
  value?: number;
  relatedTopics: string[];
  actionable: boolean;
  suggestion?: string;
}

export interface FilterState {
  dateRange: { start: string | null; end: string | null };
  mockRange: { start: string | null; end: string | null };
  section: string | null;
  topic: string | null;
  subtopic: string | null;
  difficulty: string | null;
}

export interface StudyRoiMetrics {
  topicLabel: string;
  section: string;
  studyHours: number;
  accuracyGain: number;
  roi: 'High' | 'Medium' | 'Low';
}
