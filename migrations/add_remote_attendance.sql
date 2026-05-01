-- Remote Attendance (WFH) Support Migration

ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS remote_metadata JSONB DEFAULT '{}';

-- Index for filtering remote vs on-site
CREATE INDEX IF NOT EXISTS idx_attendance_is_remote ON attendance(is_remote);
