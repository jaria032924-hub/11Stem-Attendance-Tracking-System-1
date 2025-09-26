-- Create attendance table for tracking student attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scan_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  scan_type VARCHAR(10) NOT NULL CHECK (scan_type IN ('in', 'out')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scan_time ON public.attendance(scan_time);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON public.attendance(created_at);

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now since this is an admin system)
-- In a production system with user authentication, these would be more restrictive
CREATE POLICY "Allow all operations on attendance" ON public.attendance
  FOR ALL USING (true) WITH CHECK (true);

-- Add a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_attendance_updated_at 
  BEFORE UPDATE ON public.attendance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
