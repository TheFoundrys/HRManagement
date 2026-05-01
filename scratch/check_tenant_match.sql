SELECT u.tenant_id, e.id as emp_id 
FROM users u 
JOIN employees e ON e.user_id = u.id 
WHERE e.id = '37d7e569-ee61-446a-b1fa-40c7742a6263';
