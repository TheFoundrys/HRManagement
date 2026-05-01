-- Seed sample performance data for TECHOPTIMA
-- Tenant ID: eb254a90-1f18-4ffa-bfab-0f113c5e0462
-- Employee ID: 37d7e569-ee61-446a-b1fa-40c7742a6263

INSERT INTO performance_cycles (tenant_id, name, start_date, end_date, status)
VALUES ('eb254a90-1f18-4ffa-bfab-0f113c5e0462', 'Q2 2026 Annual Review', '2026-04-01', '2026-06-30', 'active')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    cycle_id UUID;
    emp_id UUID := '37d7e569-ee61-446a-b1fa-40c7742a6263';
    t_id UUID := 'eb254a90-1f18-4ffa-bfab-0f113c5e0462';
BEGIN
    SELECT id INTO cycle_id FROM performance_cycles WHERE name = 'Q2 2026 Annual Review' LIMIT 1;

    -- Add a review
    INSERT INTO performance_reviews (tenant_id, cycle_id, employee_id, reviewer_id, score, feedback_summary, status)
    VALUES (t_id, cycle_id, emp_id, emp_id, 4.5, 'Excellent progress on the platform architecture. Proactive in resolving critical system blockers.', 'completed')
    ON CONFLICT DO NOTHING;

    -- Add some goals
    INSERT INTO performance_goals (tenant_id, employee_id, title, description, progress, status, target_date)
    VALUES 
    (t_id, emp_id, 'Remote Clock-in Implementation', 'Develop and deploy a web-based attendance tracking system.', 100, 'completed', '2026-05-15'),
    (t_id, emp_id, 'Multitenant Role Architecture', 'Migrate static roles to a dynamic blueprint system.', 80, 'open', '2026-05-30'),
    (t_id, emp_id, 'Performance Dashboard UI', 'Create a high-density dashboard for tracking institutional excellence.', 90, 'open', '2026-06-10');
END $$;
