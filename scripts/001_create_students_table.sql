-- Create students table to store basic student information
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lrn VARCHAR(12) UNIQUE NOT NULL, -- Learner Reference Number (12 digits)
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(10) NOT NULL,
  section VARCHAR(50) NOT NULL,
  parent_phone VARCHAR(20), -- For SMS notifications
  student_phone VARCHAR(20), -- Optional student phone
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on LRN for fast barcode scanning lookups
CREATE INDEX IF NOT EXISTS idx_students_lrn ON public.students(lrn);

-- Create index on grade and section for filtering
CREATE INDEX IF NOT EXISTS idx_students_grade_section ON public.students(grade, section);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policies for students table (public access for scanning system)
CREATE POLICY "Allow public read access to students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to students" ON public.students FOR DELETE USING (true);
