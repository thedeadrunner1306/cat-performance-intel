-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  target_percentile INTEGER DEFAULT 99,
  exam_year INTEGER DEFAULT 2026,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to automatically create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, target_percentile, exam_year)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Aspirant'),
    99, 
    2026
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create practice_sessions table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  section TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  attempted INTEGER NOT NULL CHECK (attempted >= 0),
  correct INTEGER NOT NULL CHECK (correct >= 0),
  wrong INTEGER NOT NULL CHECK (wrong >= 0),
  time_spent_minutes DECIMAL NOT NULL CHECK (time_spent_minutes >= 0),
  difficulty TEXT,
  source TEXT,
  confidence INTEGER,
  notes TEXT,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT correct_attempted_check CHECK (correct + wrong <= attempted)
);

-- Enable RLS for practice_sessions
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own sessions" ON public.practice_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 3. Create mocks table
CREATE TABLE IF NOT EXISTS public.mocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  mock_name TEXT NOT NULL,
  mock_provider TEXT NOT NULL,
  mock_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score DECIMAL NOT NULL,
  percentile DECIMAL,
  varc_score DECIMAL NOT NULL,
  dilr_score DECIMAL NOT NULL,
  quant_score DECIMAL NOT NULL,
  varc_attempted INTEGER NOT NULL,
  varc_correct INTEGER NOT NULL,
  varc_wrong INTEGER NOT NULL,
  varc_time DECIMAL NOT NULL,
  dilr_sets_seen INTEGER NOT NULL,
  dilr_sets_attempted INTEGER NOT NULL,
  dilr_sets_completed INTEGER NOT NULL,
  dilr_time DECIMAL NOT NULL,
  quant_attempted INTEGER NOT NULL,
  quant_correct INTEGER NOT NULL,
  quant_wrong INTEGER NOT NULL,
  quant_time DECIMAL NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for mocks
ALTER TABLE public.mocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own mocks" ON public.mocks
  FOR ALL USING (auth.uid() = user_id);

-- 4. Create mock_topic_breakdown table
CREATE TABLE IF NOT EXISTS public.mock_topic_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_id UUID NOT NULL REFERENCES public.mocks ON DELETE CASCADE,
  section TEXT NOT NULL,
  topic TEXT NOT NULL,
  attempted INTEGER NOT NULL CHECK (attempted >= 0),
  correct INTEGER NOT NULL CHECK (correct >= 0),
  wrong INTEGER NOT NULL CHECK (wrong >= 0),
  marks_gained DECIMAL NOT NULL,
  marks_lost DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for mock_topic_breakdown
ALTER TABLE public.mock_topic_breakdown ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD breakdowns of their own mocks" ON public.mock_topic_breakdown
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.mocks 
      WHERE public.mocks.id = public.mock_topic_breakdown.mock_id 
      AND public.mocks.user_id = auth.uid()
    )
  );

-- 5. Create generated_insights table
CREATE TABLE IF NOT EXISTS public.generated_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for generated_insights
ALTER TABLE public.generated_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generated insights" ON public.generated_insights
  FOR ALL USING (auth.uid() = user_id);

-- 6. Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE UNIQUE DEFAULT auth.uid(),
  theme TEXT DEFAULT 'dark',
  target_percentile INTEGER DEFAULT 99,
  preferred_mock_provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);
