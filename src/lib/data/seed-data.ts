import { Mock, QuestionLog } from '@/types/database';

const DEMO_USER_ID = 'demo-user-001';

const DEMO_MOCKS: Omit<Mock, 'user_id'>[] = [
  { id: 'mock-001', mock_name: 'SimCAT 1', mock_provider: 'IMS', mock_date: '2025-01-05', overall_score: 112, overall_percentile: 78, varc_score: 38, dilr_score: 32, quant_score: 42, total_time_minutes: 120, varc_time_minutes: 40, dilr_time_minutes: 42, quant_time_minutes: 38, created_at: '2025-01-05T10:00:00Z' },
  { id: 'mock-002', mock_name: 'SimCAT 2', mock_provider: 'IMS', mock_date: '2025-01-12', overall_score: 118, overall_percentile: 81, varc_score: 42, dilr_score: 30, quant_score: 46, total_time_minutes: 120, varc_time_minutes: 38, dilr_time_minutes: 44, quant_time_minutes: 38, created_at: '2025-01-12T10:00:00Z' },
  { id: 'mock-003', mock_name: 'IMS Mock 1', mock_provider: 'IMS', mock_date: '2025-01-19', overall_score: 124, overall_percentile: 84, varc_score: 44, dilr_score: 34, quant_score: 46, total_time_minutes: 120, varc_time_minutes: 37, dilr_time_minutes: 40, quant_time_minutes: 43, created_at: '2025-01-19T10:00:00Z' },
  { id: 'mock-004', mock_name: 'SimCAT 3', mock_provider: 'IMS', mock_date: '2025-01-26', overall_score: 120, overall_percentile: 82, varc_score: 40, dilr_score: 36, quant_score: 44, total_time_minutes: 120, varc_time_minutes: 39, dilr_time_minutes: 38, quant_time_minutes: 43, created_at: '2025-01-26T10:00:00Z' },
  { id: 'mock-005', mock_name: 'CL Mock 1', mock_provider: 'CL', mock_date: '2025-02-02', overall_score: 130, overall_percentile: 87, varc_score: 46, dilr_score: 38, quant_score: 46, total_time_minutes: 120, varc_time_minutes: 36, dilr_time_minutes: 40, quant_time_minutes: 44, created_at: '2025-02-02T10:00:00Z' },
  { id: 'mock-006', mock_name: 'SimCAT 4', mock_provider: 'IMS', mock_date: '2025-02-09', overall_score: 126, overall_percentile: 85, varc_score: 44, dilr_score: 34, quant_score: 48, total_time_minutes: 120, varc_time_minutes: 38, dilr_time_minutes: 42, quant_time_minutes: 40, created_at: '2025-02-09T10:00:00Z' },
  { id: 'mock-007', mock_name: 'IMS Mock 2', mock_provider: 'IMS', mock_date: '2025-02-16', overall_score: 136, overall_percentile: 89, varc_score: 48, dilr_score: 38, quant_score: 50, total_time_minutes: 120, varc_time_minutes: 35, dilr_time_minutes: 39, quant_time_minutes: 46, created_at: '2025-02-16T10:00:00Z' },
  { id: 'mock-008', mock_name: 'SimCAT 5', mock_provider: 'IMS', mock_date: '2025-02-23', overall_score: 140, overall_percentile: 91, varc_score: 50, dilr_score: 40, quant_score: 50, total_time_minutes: 120, varc_time_minutes: 34, dilr_time_minutes: 38, quant_time_minutes: 48, created_at: '2025-02-23T10:00:00Z' },
  { id: 'mock-009', mock_name: 'CL Mock 2', mock_provider: 'CL', mock_date: '2025-03-02', overall_score: 134, overall_percentile: 88, varc_score: 46, dilr_score: 36, quant_score: 52, total_time_minutes: 120, varc_time_minutes: 36, dilr_time_minutes: 42, quant_time_minutes: 42, created_at: '2025-03-02T10:00:00Z' },
  { id: 'mock-010', mock_name: 'SimCAT 6', mock_provider: 'IMS', mock_date: '2025-03-09', overall_score: 144, overall_percentile: 92, varc_score: 52, dilr_score: 40, quant_score: 52, total_time_minutes: 120, varc_time_minutes: 33, dilr_time_minutes: 37, quant_time_minutes: 50, created_at: '2025-03-09T10:00:00Z' },
  { id: 'mock-011', mock_name: 'IMS Mock 3', mock_provider: 'IMS', mock_date: '2025-03-16', overall_score: 148, overall_percentile: 93, varc_score: 52, dilr_score: 42, quant_score: 54, total_time_minutes: 120, varc_time_minutes: 34, dilr_time_minutes: 36, quant_time_minutes: 50, created_at: '2025-03-16T10:00:00Z' },
  { id: 'mock-012', mock_name: 'SimCAT 7', mock_provider: 'IMS', mock_date: '2025-03-23', overall_score: 152, overall_percentile: 94.5, varc_score: 54, dilr_score: 44, quant_score: 54, total_time_minutes: 120, varc_time_minutes: 33, dilr_time_minutes: 35, quant_time_minutes: 52, created_at: '2025-03-23T10:00:00Z' },
];

function generateLogs(): Omit<QuestionLog, 'user_id'>[] {
  const logs: Omit<QuestionLog, 'user_id'>[] = [];
  let logIndex = 0;

  const topicData: { section: 'VARC' | 'DILR' | 'Quant'; topic: string; subtopic: string | null; baseAccuracy: number; trend: number }[] = [
    { section: 'VARC', topic: 'Reading Comprehension', subtopic: 'Philosophy', baseAccuracy: 0.65, trend: 0.03 },
    { section: 'VARC', topic: 'Reading Comprehension', subtopic: 'History', baseAccuracy: 0.70, trend: 0.02 },
    { section: 'VARC', topic: 'Reading Comprehension', subtopic: 'Science', baseAccuracy: 0.55, trend: -0.02 },
    { section: 'VARC', topic: 'Reading Comprehension', subtopic: 'Economics', baseAccuracy: 0.72, trend: 0.01 },
    { section: 'VARC', topic: 'Reading Comprehension', subtopic: 'Politics', baseAccuracy: 0.60, trend: 0.02 },
    { section: 'VARC', topic: 'Verbal Ability', subtopic: 'Para Jumbles', baseAccuracy: 0.58, trend: 0.04 },
    { section: 'VARC', topic: 'Verbal Ability', subtopic: 'Para Summary', baseAccuracy: 0.62, trend: 0.03 },
    { section: 'VARC', topic: 'Verbal Ability', subtopic: 'Odd One Out', baseAccuracy: 0.68, trend: 0.01 },
    { section: 'DILR', topic: 'Arrangements', subtopic: null, baseAccuracy: 0.50, trend: -0.01 },
    { section: 'DILR', topic: 'Games & Tournament', subtopic: null, baseAccuracy: 0.55, trend: 0.04 },
    { section: 'DILR', topic: 'Routes & Networks', subtopic: null, baseAccuracy: 0.45, trend: 0.02 },
    { section: 'DILR', topic: 'Selection Sets', subtopic: null, baseAccuracy: 0.60, trend: 0.01 },
    { section: 'DILR', topic: 'Venn Diagram', subtopic: null, baseAccuracy: 0.65, trend: 0.02 },
    { section: 'DILR', topic: 'Puzzles', subtopic: null, baseAccuracy: 0.52, trend: 0.03 },
    { section: 'Quant', topic: 'Arithmetic', subtopic: 'Ratio', baseAccuracy: 0.72, trend: 0.03 },
    { section: 'Quant', topic: 'Arithmetic', subtopic: 'Percentages', baseAccuracy: 0.78, trend: 0.01 },
    { section: 'Quant', topic: 'Arithmetic', subtopic: 'Profit & Loss', baseAccuracy: 0.65, trend: 0.02 },
    { section: 'Quant', topic: 'Arithmetic', subtopic: 'SI-CI', baseAccuracy: 0.60, trend: -0.01 },
    { section: 'Quant', topic: 'Arithmetic', subtopic: 'TSD', baseAccuracy: 0.48, trend: -0.02 },
    { section: 'Quant', topic: 'Arithmetic', subtopic: 'Mixtures', baseAccuracy: 0.55, trend: 0.03 },
    { section: 'Quant', topic: 'Arithmetic', subtopic: 'Work & Time', baseAccuracy: 0.62, trend: 0.01 },
    { section: 'Quant', topic: 'Algebra', subtopic: null, baseAccuracy: 0.70, trend: 0.02 },
    { section: 'Quant', topic: 'Geometry', subtopic: null, baseAccuracy: 0.58, trend: 0.05 },
    { section: 'Quant', topic: 'Modern Math', subtopic: null, baseAccuracy: 0.66, trend: 0.01 },
    { section: 'Quant', topic: 'Number System', subtopic: null, baseAccuracy: 0.74, trend: 0.02 },
  ];

  const mistakeTypes: QuestionLog['mistake_type'][] = ['Concept Error', 'Calculation Error', 'Silly Error', 'Time Pressure Error', 'Guessing Error'];
  const difficulties: QuestionLog['difficulty'][] = ['Easy', 'Medium', 'Hard'];

  // Use a seeded random for reproducibility
  let seed = 42;
  function seededRandom() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let mockIdx = 0; mockIdx < DEMO_MOCKS.length; mockIdx++) {
    const mock = DEMO_MOCKS[mockIdx];
    for (const td of topicData) {
      const mockAccuracy = Math.min(0.95, Math.max(0.20, td.baseAccuracy + td.trend * mockIdx + (seededRandom() - 0.5) * 0.08));
      const attempted = Math.floor(3 + seededRandom() * 5);
      const correct = Math.round(attempted * mockAccuracy);
      const wrong = attempted - correct;

      logs.push({
        id: `log-${String(logIndex++).padStart(4, '0')}`,
        mock_id: mock.id,
        section: td.section,
        topic: td.topic,
        subtopic: td.subtopic,
        questions_attempted: attempted,
        questions_correct: correct,
        questions_wrong: wrong,
        time_spent_minutes: parseFloat((attempted * (1.5 + seededRandom() * 2)).toFixed(1)),
        difficulty: difficulties[Math.floor(seededRandom() * 3)],
        mistake_type: wrong > 0 ? mistakeTypes[Math.floor(seededRandom() * 5)] : null,
        date: mock.mock_date,
        created_at: mock.created_at,
      });
    }
  }
  return logs;
}

const DEMO_QUESTION_LOGS = generateLogs();

export function getDemoMocks(): Mock[] {
  return DEMO_MOCKS.map((m) => ({ ...m, user_id: DEMO_USER_ID }));
}

export function getDemoQuestionLogs(): QuestionLog[] {
  return DEMO_QUESTION_LOGS.map((l) => ({ ...l, user_id: DEMO_USER_ID }));
}
