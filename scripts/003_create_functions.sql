-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for students table
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
