-- Complete attendance system database setup
-- This script creates all missing components for the attendance system

-- Create attendance table if it doesn't exist
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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for students table (if not exists)
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get today's attendance for a student
CREATE OR REPLACE FUNCTION get_todays_attendance(student_lrn VARCHAR)
RETURNS TABLE (
    attendance_id UUID,
    scan_timestamp TIMESTAMP WITH TIME ZONE,
    scan_location VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.scan_timestamp,
        a.scan_location,
        a.status
    FROM public.attendance a
    WHERE a.lrn = student_lrn
    AND DATE(a.scan_timestamp) = CURRENT_DATE
    ORDER BY a.scan_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if student already scanned today
CREATE OR REPLACE FUNCTION has_scanned_today(student_lrn VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.attendance 
        WHERE lrn = student_lrn 
        AND DATE(scan_timestamp) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get attendance statistics
CREATE OR REPLACE FUNCTION get_attendance_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_students BIGINT,
    present_students BIGINT,
    absent_students BIGINT,
    attendance_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(DISTINCT s.id) as total,
            COUNT(DISTINCT a.student_id) as present
        FROM public.students s
        LEFT JOIN public.attendance a ON s.id = a.student_id 
            AND DATE(a.scan_timestamp) = target_date
    )
    SELECT 
        stats.total,
        stats.present,
        (stats.total - stats.present) as absent,
        CASE 
            WHEN stats.total > 0 THEN ROUND((stats.present::NUMERIC / stats.total::NUMERIC) * 100, 2)
            ELSE 0
        END as rate
    FROM stats;
END;
$$ LANGUAGE plpgsql;
