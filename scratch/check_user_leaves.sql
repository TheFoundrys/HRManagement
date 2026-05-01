SELECT lb.*, lt.code 
FROM leave_balances lb 
JOIN leave_types lt ON lb.leave_type_id = lt.id 
WHERE lb.employee_id = '37d7e569-ee61-446a-b1fa-40c7742a6263';
