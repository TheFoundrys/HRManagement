SELECT u.id as user_id, u.email, u.name, u.employee_id as user_emp_id_field, e.id as internal_employee_id, e.employee_id as emp_table_emp_id
FROM users u
LEFT JOIN employees e ON u.id = e.user_id;
