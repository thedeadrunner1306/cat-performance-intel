export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  target_percentile: number;
  created_at: string;
}

export interface Mock {
  id: string;
  user_id: string;
  mock_name: string;
  mock_provider: string;
  mock_date: string;
  overall_score: number | null;
  overall_percentile: number | null;
  varc_score: number | null;
  dilr_score: number | null;
  quant_score: number | null;
  total_time_minutes: number;
  varc_time_minutes: number | null;
  dilr_time_minutes: number | null;
  quant_time_minutes: number | null;
  notes?: string | null;
  created_at: string;
}

export interface QuestionLog {
  id: string;
  user_id: string;
  mock_id: string | null;
  section: 'VARC' | 'DILR' | 'Quant';
  topic: string;
  subtopic: string | null;
  questions_attempted: number;
  questions_correct: number;
  questions_wrong: number;
  time_spent_minutes: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  mistake_type:
    | 'Concept Error'
    | 'Calculation Error'
    | 'Silly Error'
    | 'Time Pressure Error'
    | 'Guessing Error'
    | null;
  date: string;
  notes?: string | null;
  created_at: string;
}
