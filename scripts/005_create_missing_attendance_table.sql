-- Create attendance table (missing from previous execution)
-- This script creates the attendance table that should have been created earlier

CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lrn VARCHAR(12) NOT NULL, -- Denormalized for faster queries
  scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scan_location VARCHAR(100) DEFAULT 'School Gate', -- Where the scan happened
  status VARCHAR(20) DEFAULT 'Present', -- Present, Late, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lrn ON public.attendance(lrn);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(DATE(scan_timestamp));
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance(scan_timestamp);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public insert access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public update access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow public delete access to attendance" ON public.attendance;

-- Create policies for attendance table (public access for scanning system)
CREATE POLICY "Allow public read access to attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to attendance" ON public.attendance FOR DELETE USING (true);
