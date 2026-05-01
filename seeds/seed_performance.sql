-- Seed Performance Data
DO $$
DECLARE
    t_id UUID;
    c_id UUID;
    e1_id UUID;
    e2_id UUID;
BEGIN
    -- Get a tenant
    SELECT id INTO t_id FROM tenants LIMIT 1;
    
    -- Create a cycle
    INSERT INTO performance_cycles (tenant_id, name, start_date, end_date)
    VALUES (t_id, 'Q4 2025 Performance Review', '2025-10-01', '2025-12-31')
    RETURNING id INTO c_id;
    
    -- Get some employees
    SELECT id INTO e1_id FROM employees WHERE tenant_id = t_id LIMIT 1;
    SELECT id INTO e2_id FROM employees WHERE tenant_id = t_id OFFSET 1 LIMIT 1;
    
    -- Insert reviews
    IF e1_id IS NOT NULL THEN
        INSERT INTO performance_reviews (tenant_id, employee_id, cycle_id, score, feedback_summary, status)
        VALUES (t_id, e1_id, c_id, 4.5, 'Excellent performance this quarter.', 'completed');
    END IF;
    
    IF e2_id IS NOT NULL THEN
        INSERT INTO performance_reviews (tenant_id, employee_id, cycle_id, score, feedback_summary, status)
        VALUES (t_id, e2_id, c_id, 3.8, 'Shows great potential, needs to work on communication.', 'in_progress');
    END IF;

END $$;
