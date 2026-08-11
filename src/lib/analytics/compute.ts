// Core analytics computation engine
// Transforms raw mock & question log data into actionable intelligence

import type { Mock, QuestionLog } from '@/types/database';
import type {
  SnapshotMetrics,
  TopicTrend,
  GrowthDriver,
  ScoreLeakage,
  FocusRecommendation,
  MockTrend,
  TopicPerformance,
  SectionOverview,
  StudyRoiMetrics,
} from './types';

// ============================
// SNAPSHOT METRICS
export function computeSnapshotMetrics(mocks: Mock[], logs: QuestionLog[]): SnapshotMetrics {
  if (mocks.length === 0 && logs.length === 0) {
    return {
      recentMockScore: 0,
      recentTrend: 0,
      daysStudied: 0,
      questionsSolvedThisMonth: 0,
      hoursInvestedThisMonth: 0,
    };
  }

  const sortedMocks = [...mocks].sort((a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime());
  const recentMockScore = sortedMocks.length > 0 ? (sortedMocks[sortedMocks.length - 1].overall_score || 0) : 0;
  const recentTrend = sortedMocks.length >= 2
    ? (sortedMocks[sortedMocks.length - 1].overall_score || 0) - (sortedMocks[sortedMocks.length - 2].overall_score || 0)
    : 0;

  // Days Studied
  const uniqueDates = new Set<string>();
  logs.forEach((l) => uniqueDates.add(l.date));
  mocks.forEach((m) => uniqueDates.add(m.mock_date));
  const daysStudied = uniqueDates.size;

  // Latest active month-year
  let latestYear = new Date().getFullYear();
  let latestMonth = new Date().getMonth(); // 0-indexed
  if (sortedMocks.length > 0) {
    const d = new Date(sortedMocks[sortedMocks.length - 1].mock_date);
    latestYear = d.getFullYear();
    latestMonth = d.getMonth();
  } else if (logs.length > 0) {
    const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const d = new Date(sortedLogs[sortedLogs.length - 1].date);
    latestYear = d.getFullYear();
    latestMonth = d.getMonth();
  }

  // Logs this month
  const logsThisMonth = logs.filter((l) => {
    const d = new Date(l.date);
    return d.getFullYear() === latestYear && d.getMonth() === latestMonth;
  });

  const questionsSolvedThisMonth = logsThisMonth.reduce((sum, l) => sum + l.questions_attempted, 0);

  // Time spent
  const practiceMinutes = logsThisMonth.reduce((sum, l) => sum + (l.time_spent_minutes || 0), 0);
  const mocksThisMonth = mocks.filter((m) => {
    const d = new Date(m.mock_date);
    return d.getFullYear() === latestYear && d.getMonth() === latestMonth;
  });
  const mockMinutes = mocksThisMonth.reduce((sum, m) => sum + (m.total_time_minutes || 120), 0);

  const hoursInvestedThisMonth = Math.round(((practiceMinutes + mockMinutes) / 60) * 10) / 10;

  return {
    recentMockScore,
    recentTrend,
    daysStudied,
    questionsSolvedThisMonth,
    hoursInvestedThisMonth,
  };
}

// ============================
// STRENGTHENING & WEAKENING TOPICS
// Compare recent 3 mocks vs previous mocks per topic
// ============================
export function computeTopicTrends(mocks: Mock[], logs: QuestionLog[]): TopicTrend[] {
  if (logs.length === 0) return [];

  const latestTime = Math.max(...logs.map((l) => new Date(l.date).getTime()));
  const thirtyDaysAgo = new Date(latestTime - 30 * 24 * 60 * 60 * 1000);

  // Group logs by topic/subtopic label
  const topicMap = new Map<string, { recent: QuestionLog[]; earlier: QuestionLog[]; section: string }>();

  for (const log of logs) {
    const key = log.subtopic || log.topic;
    if (!topicMap.has(key)) {
      topicMap.set(key, { recent: [], earlier: [], section: log.section });
    }
    const entry = topicMap.get(key)!;

    const logTime = new Date(log.date).getTime();
    if (logTime >= thirtyDaysAgo.getTime()) {
      entry.recent.push(log);
    } else {
      entry.earlier.push(log);
    }
  }

  const trends: TopicTrend[] = [];

  for (const [topic, { recent, earlier, section }] of topicMap) {
    if (recent.length === 0) continue;

    const recentSolved = recent.reduce((sum, l) => sum + l.questions_attempted, 0);
    const recentCorrect = recent.reduce((sum, l) => sum + l.questions_correct, 0);
    const recentAcc = recentSolved > 0 ? recentCorrect / recentSolved : 0;

    let earlierAcc = recentAcc;
    if (earlier.length > 0) {
      const earlierSolved = earlier.reduce((sum, l) => sum + l.questions_attempted, 0);
      const earlierCorrect = earlier.reduce((sum, l) => sum + l.questions_correct, 0);
      earlierAcc = earlierSolved > 0 ? earlierCorrect / earlierSolved : 0;
    }

    const delta = Math.round((recentAcc - earlierAcc) * 100);

    trends.push({
      topicId: topic,
      topicLabel: topic,
      section,
      metric: 'accuracy',
      currentValue: Math.round(recentAcc * 100),
      previousValue: Math.round(earlierAcc * 100),
      delta,
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
      dataPoints: recent.length + earlier.length,
    });
  }

  return trends.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function getStrengtheningTopics(mocks: Mock[], logs: QuestionLog[], limit = 5): TopicTrend[] {
  return computeTopicTrends(mocks, logs)
    .filter((t) => t.direction === 'up')
    .slice(0, limit);
}

export function getWeakeningTopics(mocks: Mock[], logs: QuestionLog[], limit = 5): TopicTrend[] {
  return computeTopicTrends(mocks, logs)
    .filter((t) => t.direction === 'down')
    .slice(0, limit);
}

export function computeGrowthDrivers(mocks: Mock[], logs: QuestionLog[]): GrowthDriver[] {
  const sorted = [...mocks].sort((a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime());
  if (sorted.length < 2) return [];

  const firstScore = sorted[0].overall_score || 0;
  const lastScore = sorted[sorted.length - 1].overall_score || 0;
  const totalGrowth = lastScore - firstScore;
  if (totalGrowth <= 0) return [];

  const trends = computeTopicTrends(mocks, logs).filter((t) => t.direction === 'up');
  const totalDelta = trends.reduce((s, t) => s + t.delta, 0);

  if (totalDelta === 0) return [];

  return trends.slice(0, 8).map((t) => ({
    topicLabel: t.topicLabel,
    section: t.section,
    contribution: Math.round((t.delta / totalDelta) * totalGrowth * 10) / 10,
    percentage: Math.round((t.delta / totalDelta) * 100),
  }));
}

export function computeScoreLeakage(logs: QuestionLog[]): ScoreLeakage[] {
  // Find the latest 5 mock dates or mock IDs
  const mockIds = [...new Set(logs.map(l => l.mock_id).filter(Boolean))] as string[];
  const mockIdDates = mockIds.map(id => {
    const log = logs.find(l => l.mock_id === id);
    return { id, date: log ? log.date : '' };
  }).sort((a, b) => b.date.localeCompare(a.date));
  
  const latest5MockIds = new Set(mockIdDates.slice(0, 5).map(m => m.id));

  const topicMap = new Map<string, { section: string; attempted: number; correct: number; wrong: number }>();

  for (const log of logs) {
    if (!log.mock_id || !latest5MockIds.has(log.mock_id)) continue;

    const key = log.subtopic || log.topic;
    if (!topicMap.has(key)) {
      topicMap.set(key, { section: log.section, attempted: 0, correct: 0, wrong: 0 });
    }
    const entry = topicMap.get(key)!;
    entry.attempted += log.questions_attempted;
    entry.correct += log.questions_correct;
    entry.wrong += log.questions_wrong;
  }

  const leakages: ScoreLeakage[] = [];

  for (const [topic, data] of topicMap) {
    if (data.wrong === 0) continue;

    // Opportunity cost of wrong answers (-4 marks each)
    const lostMarks = data.wrong * 4;
    const actualScore = data.correct * 3 - data.wrong * 1;
    const potentialScore = data.attempted * 3;

    leakages.push({
      topicLabel: topic,
      section: data.section,
      potentialScore,
      actualScore,
      lostMarks,
    });
  }

  return leakages.sort((a, b) => b.lostMarks - a.lostMarks).slice(0, 8);
}

export function computeRecommendations(mocks: Mock[], logs: QuestionLog[]): FocusRecommendation[] {
  // Look at logs in the last 5 mocks to compute opportunity
  const mockIds = [...new Set(logs.map(l => l.mock_id).filter(Boolean))] as string[];
  const mockIdDates = mockIds.map(id => {
    const log = logs.find(l => l.mock_id === id);
    return { id, date: log ? log.date : '' };
  }).sort((a, b) => b.date.localeCompare(a.date));
  
  const latest5MockIds = new Set(mockIdDates.slice(0, 5).map(m => m.id));

  const topicMap = new Map<string, {
    section: string;
    attempted: number;
    correct: number;
    wrong: number;
    mockAppearances: Set<string>;
  }>();

  for (const log of logs) {
    const key = log.subtopic || log.topic;
    if (!topicMap.has(key)) {
      topicMap.set(key, { section: log.section, attempted: 0, correct: 0, wrong: 0, mockAppearances: new Set() });
    }
    const entry = topicMap.get(key)!;
    
    if (log.mock_id && latest5MockIds.has(log.mock_id)) {
      entry.attempted += log.questions_attempted;
      entry.correct += log.questions_correct;
      entry.wrong += log.questions_wrong;
      entry.mockAppearances.add(log.mock_id);
    }
  }

  const recommendations: FocusRecommendation[] = [];

  for (const [topic, data] of topicMap) {
    if (data.attempted === 0) continue;

    const accuracy = (data.correct / data.attempted) * 100;
    const mockFrequency = data.mockAppearances.size;

    // Potential gain: Wrong questions in these 5 mocks * 4 marks
    const potentialGain = data.wrong * 4;

    if (potentialGain > 0) {
      const priority = accuracy < 45 ? 'Critical' : accuracy < 60 ? 'High' : 'Medium';

      recommendations.push({
        topicLabel: topic,
        section: data.section,
        reason: `Appeared in ${mockFrequency} recent mocks`,
        currentAccuracy: Math.round(accuracy),
        mockFrequency,
        expectedGain: potentialGain,
        priority,
      });
    }
  }

  return recommendations.sort((a, b) => b.expectedGain - a.expectedGain).slice(0, 3);
}

export function computeStudyRoi(logs: QuestionLog[]): StudyRoiMetrics[] {
  // Group logs by topic
  const topicMap = new Map<string, {
    section: string;
    timeSpentMinutes: number;
    recentCorrect: number;
    recentAttempted: number;
    earlierCorrect: number;
    earlierAttempted: number;
  }>();

  if (logs.length === 0) return [];

  const latestTime = Math.max(...logs.map((l) => new Date(l.date).getTime()));
  const thirtyDaysAgo = new Date(latestTime - 30 * 24 * 60 * 60 * 1000);

  for (const log of logs) {
    const key = log.subtopic || log.topic;
    if (!topicMap.has(key)) {
      topicMap.set(key, {
        section: log.section,
        timeSpentMinutes: 0,
        recentCorrect: 0,
        recentAttempted: 0,
        earlierCorrect: 0,
        earlierAttempted: 0,
      });
    }
    const entry = topicMap.get(key)!;
    
    // Time spent is summed across ALL logs (practice and mock)
    entry.timeSpentMinutes += log.time_spent_minutes || 0;

    const logTime = new Date(log.date).getTime();
    if (logTime >= thirtyDaysAgo.getTime()) {
      entry.recentAttempted += log.questions_attempted;
      entry.recentCorrect += log.questions_correct;
    } else {
      entry.earlierAttempted += log.questions_attempted;
      entry.earlierCorrect += log.questions_correct;
    }
  }

  const roiList: StudyRoiMetrics[] = [];

  for (const [topic, data] of topicMap) {
    const studyHours = Math.round((data.timeSpentMinutes / 60) * 10) / 10;
    if (studyHours === 0) continue; // no ROI if no study time

    const recentAcc = data.recentAttempted > 0 ? (data.recentCorrect / data.recentAttempted) * 100 : 0;
    const earlierAcc = data.earlierAttempted > 0 ? (data.earlierCorrect / data.earlierAttempted) * 100 : recentAcc;

    const accuracyGain = Math.round(recentAcc - earlierAcc);

    // ROI: gain per hour
    const gainPerHour = studyHours > 0 ? accuracyGain / studyHours : 0;
    let roi: 'High' | 'Medium' | 'Low' = 'Low';
    if (gainPerHour > 1.2) roi = 'High';
    else if (gainPerHour >= 0.5) roi = 'Medium';

    roiList.push({
      topicLabel: topic,
      section: data.section,
      studyHours,
      accuracyGain,
      roi,
    });
  }

  return roiList.sort((a, b) => {
    const rank = { High: 0, Medium: 1, Low: 2 };
    return rank[a.roi] - rank[b.roi] || b.accuracyGain - a.accuracyGain;
  });
}

// ============================
// MOCK TRENDS
// Score progression with deltas
// ============================
export function computeMockTrends(mocks: Mock[]): MockTrend[] {
  const sorted = [...mocks].sort((a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime());

  return sorted.map((mock, i) => ({
    mockId: mock.id,
    mockName: mock.mock_name,
    date: mock.mock_date,
    overallScore: mock.overall_score || 0,
    percentile: mock.overall_percentile || 0,
    varcScore: mock.varc_score || 0,
    dilrScore: mock.dilr_score || 0,
    quantScore: mock.quant_score || 0,
    deltaFromPrevious: i > 0 ? (mock.overall_score || 0) - (sorted[i - 1].overall_score || 0) : 0,
  }));
}

// ============================
// TOPIC PERFORMANCE
// Deep dive into a single topic
// ============================
export function computeTopicPerformance(logs: QuestionLog[], topicFilter: string): TopicPerformance | null {
  const filtered = logs.filter((l) => l.topic === topicFilter || l.subtopic === topicFilter);
  if (filtered.length === 0) return null;

  const first = filtered[0];
  const totalAttempted = filtered.reduce((s, l) => s + l.questions_attempted, 0);
  const totalCorrect = filtered.reduce((s, l) => s + l.questions_correct, 0);
  const totalTime = filtered.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);

  // Accuracy trend
  const sortedByDate = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const accuracies = sortedByDate.map((l) => l.questions_attempted > 0 ? l.questions_correct / l.questions_attempted : 0);

  const recentAcc = accuracies.slice(-3).reduce((s, v) => s + v, 0) / Math.min(3, accuracies.length);
  const earlierAcc = accuracies.slice(0, -3).reduce((s, v) => s + v, 0) / Math.max(1, accuracies.length - 3);
  const trend = (recentAcc - earlierAcc) * 100;

  // Consistency (inverse of std dev)
  const mean = accuracies.reduce((s, v) => s + v, 0) / accuracies.length;
  const variance = accuracies.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / accuracies.length;
  const consistency = Math.max(0, 100 - Math.sqrt(variance) * 200);

  // Difficulty breakdown
  const difficultyBreakdown = { easy: { attempted: 0, correct: 0 }, medium: { attempted: 0, correct: 0 }, hard: { attempted: 0, correct: 0 } };
  for (const l of filtered) {
    const d = (l.difficulty?.toLowerCase() || 'medium') as 'easy' | 'medium' | 'hard';
    difficultyBreakdown[d].attempted += l.questions_attempted;
    difficultyBreakdown[d].correct += l.questions_correct;
  }

  // Mistake breakdown
  const mistakeBreakdown: Record<string, number> = {};
  for (const l of filtered) {
    if (l.mistake_type) {
      mistakeBreakdown[l.mistake_type] = (mistakeBreakdown[l.mistake_type] || 0) + l.questions_wrong;
    }
  }

  return {
    topicId: topicFilter,
    topicLabel: first.subtopic || first.topic,
    section: first.section,
    questionsSolved: totalAttempted,
    accuracy: totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0,
    avgTime: totalAttempted > 0 ? Math.round((totalTime / totalAttempted) * 10) / 10 : 0,
    consistency: Math.round(consistency),
    trend: Math.round(trend * 10) / 10,
    difficultyBreakdown,
    mistakeBreakdown,
    mockImpact: Math.round(totalCorrect * 3 - (totalAttempted - totalCorrect)),
  };
}

// ============================
// SECTION OVERVIEW
// Aggregate metrics for VARC, DILR, or Quant
// ============================
export function computeSectionOverview(logs: QuestionLog[], section: string): SectionOverview {
  const sectionLogs = logs.filter((l) => l.section === section);

  const totalAttempted = sectionLogs.reduce((s, l) => s + l.questions_attempted, 0);
  const totalCorrect = sectionLogs.reduce((s, l) => s + l.questions_correct, 0);
  const totalTime = sectionLogs.reduce((s, l) => s + (l.time_spent_minutes || 0), 0);

  const accuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
  const speed = totalTime > 0 ? totalAttempted / totalTime : 0;
  const efficiency = (accuracy / 100) * speed * 10;
  const avgTimePerQuestion = totalAttempted > 0 ? totalTime / totalAttempted : 0;

  // Consistency across dates
  const byDate = new Map<string, { attempted: number; correct: number }>();
  for (const l of sectionLogs) {
    if (!byDate.has(l.date)) byDate.set(l.date, { attempted: 0, correct: 0 });
    const entry = byDate.get(l.date)!;
    entry.attempted += l.questions_attempted;
    entry.correct += l.questions_correct;
  }

  const dateAccuracies = [...byDate.values()].map((d) => d.attempted > 0 ? d.correct / d.attempted : 0);
  const meanAcc = dateAccuracies.reduce((s, v) => s + v, 0) / Math.max(1, dateAccuracies.length);
  const varianceAcc = dateAccuracies.reduce((s, v) => s + Math.pow(v - meanAcc, 2), 0) / Math.max(1, dateAccuracies.length);
  const consistency = Math.max(0, 100 - Math.sqrt(varianceAcc) * 200);

  // Trend data
  const trendData = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
      speed: Math.round(speed * 100) / 100,
    }));

  return {
    section,
    accuracy: Math.round(accuracy * 10) / 10,
    speed: Math.round(speed * 100) / 100,
    efficiency: Math.round(efficiency * 10) / 10,
    consistency: Math.round(consistency),
    totalAttempted,
    totalCorrect,
    avgTimePerQuestion: Math.round(avgTimePerQuestion * 10) / 10,
    trendData,
  };
}
