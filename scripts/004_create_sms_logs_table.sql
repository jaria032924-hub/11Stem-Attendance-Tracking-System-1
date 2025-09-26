-- Create SMS logs table to track notification history
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  provider VARCHAR(50) NOT NULL,
  message_id VARCHAR(255), -- Provider's message ID
  error_message TEXT, -- Error details if failed
  sent_at TIMESTAMP WITH TIME ZONE, -- When message was successfully sent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for SMS logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_student_id ON public.sms_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON public.sms_logs(phone_number);

-- Enable Row Level Security
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS logs table (public access for the system)
CREATE POLICY "Allow public read access to sms_logs" ON public.sms_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to sms_logs" ON public.sms_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to sms_logs" ON public.sms_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to sms_logs" ON public.sms_logs FOR DELETE USING (true);
