-- Career Coach Chat History Table
CREATE TABLE IF NOT EXISTS public.career_coach_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  profession VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career Coach Messages Table
CREATE TABLE IF NOT EXISTS public.career_coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.career_coach_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock Interview Sessions Table
CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  profession VARCHAR(255) NOT NULL,
  job_title VARCHAR(255),
  difficulty_level VARCHAR(50) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  total_questions INT DEFAULT 0,
  questions_answered INT DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  duration_minutes INT,
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock Interview Questions Table
CREATE TABLE IF NOT EXISTS public.mock_interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  question_number INT NOT NULL,
  question_text TEXT NOT NULL,
  profession VARCHAR(255) NOT NULL,
  difficulty_level VARCHAR(50),
  category VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mock Interview Responses Table
CREATE TABLE IF NOT EXISTS public.mock_interview_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.mock_interview_questions(id) ON DELETE CASCADE,
  user_response TEXT NOT NULL,
  ai_feedback TEXT,
  score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.career_coach_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interview_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_coach_chats
CREATE POLICY "Users can view their own chats" ON public.career_coach_chats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chats" ON public.career_coach_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" ON public.career_coach_chats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" ON public.career_coach_chats
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for career_coach_messages
CREATE POLICY "Users can view messages from their chats" ON public.career_coach_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.career_coach_chats
      WHERE id = chat_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chats" ON public.career_coach_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.career_coach_chats
      WHERE id = chat_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for mock_interview_sessions
CREATE POLICY "Users can view their own sessions" ON public.mock_interview_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions" ON public.mock_interview_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.mock_interview_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for mock_interview_questions
CREATE POLICY "Users can view questions from their sessions" ON public.mock_interview_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mock_interview_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for mock_interview_responses
CREATE POLICY "Users can view responses from their sessions" ON public.mock_interview_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mock_interview_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert responses in their sessions" ON public.mock_interview_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mock_interview_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_career_coach_chats_user_id ON public.career_coach_chats(user_id);
CREATE INDEX idx_career_coach_messages_chat_id ON public.career_coach_messages(chat_id);
CREATE INDEX idx_mock_interview_sessions_user_id ON public.mock_interview_sessions(user_id);
CREATE INDEX idx_mock_interview_questions_session_id ON public.mock_interview_questions(session_id);
CREATE INDEX idx_mock_interview_responses_session_id ON public.mock_interview_responses(session_id);
