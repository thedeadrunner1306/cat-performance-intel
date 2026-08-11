// Auto-generated performance insights engine
// Analyzes data patterns and produces actionable intelligence cards

import type { Mock, QuestionLog } from '@/types/database';
import type { Insight } from './types';
import { computeTopicTrends, computeSectionOverview } from './compute';

export function generateInsights(mocks: Mock[], logs: QuestionLog[]): Insight[] {
  const insights: Insight[] = [];
  let id = 0;

  // 1. Effort vs Impact Mismatch
  insights.push(...detectEffortMismatch(logs, ++id));

  // 2. Cross-Section Interference
  insights.push(...detectCrossSectionInterference(mocks, logs, ++id));

  // 3. Streak Detection (consecutive decline/improvement)
  insights.push(...detectStreaks(mocks, logs, ++id));

  // 4. Fastest Improving Topic
  insights.push(...detectFastestImproving(mocks, logs, ++id));

  // 5. Time Allocation Patterns
  insights.push(...detectTimePatterns(mocks, logs, ++id));

  // 6. Mistake Type Patterns
  insights.push(...detectMistakePatterns(logs, ++id));

  return insights.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, positive: 2, info: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

function detectEffortMismatch(logs: QuestionLog[], baseId: number): Insight[] {
  const insights: Insight[] = [];

  // Group by topic: time spent (effort) vs accuracy improvement (impact)
  const topicTime = new Map<string, { time: number; correct: number; attempted: number; section: string }>();

  for (const l of logs) {
    const key = l.subtopic || l.topic;
    if (!topicTime.has(key)) topicTime.set(key, { time: 0, correct: 0, attempted: 0, section: l.section });
    const entry = topicTime.get(key)!;
    entry.time += l.time_spent_minutes || 0;
    entry.correct += l.questions_correct;
    entry.attempted += l.questions_attempted;
  }

  const totalTime = [...topicTime.values()].reduce((s, t) => s + t.time, 0);
  const totalCorrect = [...topicTime.values()].reduce((s, t) => s + t.correct, 0);

  for (const [topic, data] of topicTime) {
    const timePercent = totalTime > 0 ? (data.time / totalTime) * 100 : 0;
    const impactPercent = totalCorrect > 0 ? (data.correct / totalCorrect) * 100 : 0;

    // Flag if time% is 2x+ the impact%
    if (timePercent > 15 && impactPercent < timePercent * 0.5) {
      insights.push({
        id: `insight-effort-${baseId}-${topic}`,
        type: 'effort-mismatch',
        title: `${topic}: High effort, low returns`,
        description: `You spend ${Math.round(timePercent)}% of study time on ${topic} but it contributes only ${Math.round(impactPercent)}% of your correct answers. Consider redistributing time to higher-impact areas.`,
        severity: 'warning',
        metric: `${Math.round(timePercent)}% time → ${Math.round(impactPercent)}% impact`,
        relatedTopics: [topic],
        actionable: true,
        suggestion: `Reduce ${topic} practice time by 30% and redirect to topics with higher accuracy gaps.`,
      });
    }

    // Flag high-impact, low-effort topics
    if (impactPercent > 15 && timePercent < impactPercent * 0.5) {
      insights.push({
        id: `insight-underinvested-${baseId}-${topic}`,
        type: 'effort-mismatch',
        title: `${topic}: Underinvested high-performer`,
        description: `${topic} contributes ${Math.round(impactPercent)}% of correct answers with only ${Math.round(timePercent)}% of study time. Investing more time here could yield outsized returns.`,
        severity: 'positive',
        metric: `${Math.round(timePercent)}% time → ${Math.round(impactPercent)}% impact`,
        relatedTopics: [topic],
        actionable: true,
        suggestion: `Increase ${topic} practice by 20% to capitalize on your natural strength.`,
      });
    }
  }

  return insights;
}

function detectCrossSectionInterference(mocks: Mock[], logs: QuestionLog[], baseId: number): Insight[] {
  const insights: Insight[] = [];

  // Check if DILR time > 40 min correlates with Quant score drop
  const sorted = [...mocks].sort((a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime());

  const highDilrTimeMocks = sorted.filter((m) => (m.dilr_time_minutes || 0) > 40);
  const normalDilrTimeMocks = sorted.filter((m) => (m.dilr_time_minutes || 0) <= 40);

  if (highDilrTimeMocks.length >= 2 && normalDilrTimeMocks.length >= 2) {
    const avgQuantHigh = highDilrTimeMocks.reduce((s, m) => s + (m.quant_score || 0), 0) / highDilrTimeMocks.length;
    const avgQuantNormal = normalDilrTimeMocks.reduce((s, m) => s + (m.quant_score || 0), 0) / normalDilrTimeMocks.length;

    if (avgQuantNormal - avgQuantHigh > 3) {
      insights.push({
        id: `insight-cross-section-${baseId}`,
        type: 'cross-section',
        title: 'DILR overtime hurts Quant performance',
        description: `When DILR exceeds 40 minutes, your Quant score drops by ${Math.round(avgQuantNormal - avgQuantHigh)} marks on average (${Math.round(avgQuantHigh)} vs ${Math.round(avgQuantNormal)}).`,
        severity: 'warning',
        metric: `-${Math.round(avgQuantNormal - avgQuantHigh)} marks`,
        relatedTopics: ['DILR', 'Quant'],
        actionable: true,
        suggestion: 'Set a hard 38-minute cap for DILR and practice timed DILR sets to improve speed.',
      });
    }
  }

  return insights;
}

function detectStreaks(mocks: Mock[], logs: QuestionLog[], baseId: number): Insight[] {
  const insights: Insight[] = [];
  const trends = computeTopicTrends(mocks, logs);

  // Look at topic-level streaks by grouping logs by date
  const topicByDate = new Map<string, Map<string, number>>();

  for (const l of logs) {
    const key = l.subtopic || l.topic;
    if (!topicByDate.has(key)) topicByDate.set(key, new Map());
    const dateMap = topicByDate.get(key)!;

    if (!dateMap.has(l.date)) dateMap.set(l.date, 0);
    const acc = l.questions_attempted > 0 ? l.questions_correct / l.questions_attempted : 0;
    dateMap.set(l.date, acc);
  }

  for (const [topic, dateMap] of topicByDate) {
    const entries = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    if (entries.length < 3) continue;

    // Check last 3+ entries for consecutive decline
    let declineStreak = 0;
    for (let i = entries.length - 1; i > 0; i--) {
      if (entries[i][1] < entries[i - 1][1]) {
        declineStreak++;
      } else break;
    }

    if (declineStreak >= 3) {
      const section = logs.find((l) => (l.subtopic || l.topic) === topic)?.section || '';
      insights.push({
        id: `insight-streak-decline-${baseId}-${topic}`,
        type: 'streak',
        title: `${topic}: ${declineStreak}-week decline`,
        description: `${topic} accuracy has fallen for ${declineStreak} consecutive sessions. This pattern usually indicates either fatigue or a concept gap that needs targeted revision.`,
        severity: 'critical',
        relatedTopics: [topic],
        actionable: true,
        suggestion: `Pause timed practice for ${topic} and spend 2 sessions on concept revision before resuming.`,
      });
    }
  }

  return insights;
}

function detectFastestImproving(mocks: Mock[], logs: QuestionLog[], baseId: number): Insight[] {
  const trends = computeTopicTrends(mocks, logs).filter((t) => t.direction === 'up');
  if (trends.length === 0) return [];

  const fastest = trends[0];

  return [{
    id: `insight-fastest-${baseId}`,
    type: 'fastest-improving',
    title: `${fastest.topicLabel} is your fastest improving topic`,
    description: `${fastest.topicLabel} accuracy improved by +${fastest.delta}% (from ${fastest.previousValue}% to ${fastest.currentValue}%). Your study approach here is working — consider applying similar methods to weaker topics.`,
    severity: 'positive',
    metric: `+${fastest.delta}%`,
    value: fastest.delta,
    relatedTopics: [fastest.topicLabel],
    actionable: false,
  }];
}

function detectTimePatterns(mocks: Mock[], logs: QuestionLog[], baseId: number): Insight[] {
  const insights: Insight[] = [];

  // Section time allocation across mocks
  const sorted = [...mocks].sort((a, b) => new Date(a.mock_date).getTime() - new Date(b.mock_date).getTime());
  if (sorted.length < 3) return insights;

  const recent = sorted.slice(-3);
  const avgVarc = recent.reduce((s, m) => s + (m.varc_time_minutes || 40), 0) / 3;
  const avgDilr = recent.reduce((s, m) => s + (m.dilr_time_minutes || 40), 0) / 3;
  const avgQuant = recent.reduce((s, m) => s + (m.quant_time_minutes || 40), 0) / 3;

  // Check for unbalanced time allocation
  const times = [
    { section: 'VARC', time: avgVarc },
    { section: 'DILR', time: avgDilr },
    { section: 'Quant', time: avgQuant },
  ];

  const maxTime = Math.max(...times.map((t) => t.time));
  const minTime = Math.min(...times.map((t) => t.time));

  if (maxTime - minTime > 12) {
    const maxSection = times.find((t) => t.time === maxTime)!;
    const minSection = times.find((t) => t.time === minTime)!;

    // Compare section scores to see if time correlates with performance
    const maxSectionOverview = computeSectionOverview(logs, maxSection.section);
    const minSectionOverview = computeSectionOverview(logs, minSection.section);

    if (maxSectionOverview.accuracy < minSectionOverview.accuracy) {
      insights.push({
        id: `insight-time-${baseId}`,
        type: 'time-allocation',
        title: 'Time allocation mismatch',
        description: `You spend ${Math.round(maxTime)} min on ${maxSection.section} (${Math.round(maxSectionOverview.accuracy)}% accuracy) but only ${Math.round(minTime)} min on ${minSection.section} (${Math.round(minSectionOverview.accuracy)}% accuracy). The lower-time section actually has better accuracy.`,
        severity: 'info',
        relatedTopics: [maxSection.section, minSection.section],
        actionable: true,
        suggestion: `Rebalance: cap ${maxSection.section} at ${Math.round(maxTime - 5)} min and give the extra time to ${minSection.section}.`,
      });
    }
  }

  return insights;
}

function detectMistakePatterns(logs: QuestionLog[], baseId: number): Insight[] {
  const insights: Insight[] = [];

  const mistakeCounts: Record<string, number> = {};
  let totalMistakes = 0;

  for (const l of logs) {
    if (l.mistake_type && l.questions_wrong > 0) {
      mistakeCounts[l.mistake_type] = (mistakeCounts[l.mistake_type] || 0) + l.questions_wrong;
      totalMistakes += l.questions_wrong;
    }
  }

  if (totalMistakes === 0) return insights;

  // Find dominant mistake type
  const sorted = Object.entries(mistakeCounts).sort(([, a], [, b]) => b - a);
  const [topMistake, topCount] = sorted[0];
  const topPercent = (topCount / totalMistakes) * 100;

  if (topPercent > 30) {
    insights.push({
      id: `insight-mistake-${baseId}`,
      type: 'pattern',
      title: `${topMistake} is your dominant mistake pattern`,
      description: `${Math.round(topPercent)}% of all errors are ${topMistake}s (${topCount} out of ${totalMistakes} total mistakes). Targeted drills for this error type could eliminate a significant number of lost marks.`,
      severity: topPercent > 40 ? 'critical' : 'warning',
      metric: `${Math.round(topPercent)}%`,
      value: topPercent,
      relatedTopics: [],
      actionable: true,
      suggestion: topMistake === 'Silly Error'
        ? 'Implement a 30-second review step before marking each answer in mocks.'
        : topMistake === 'Calculation Error'
        ? 'Practice mental math and estimation techniques for 15 min daily.'
        : topMistake === 'Time Pressure Error'
        ? 'Practice with a timer set to 80% of normal time to build speed under pressure.'
        : `Dedicate 20 minutes per study session to ${topMistake} prevention drills.`,
    });
  }

  return insights;
}
