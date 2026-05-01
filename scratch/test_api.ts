const employeeId = '37d7e569-ee61-446a-b1fa-40c7742a6263';
const url = `http://localhost:3000/api/leave/balances?employeeId=${employeeId}`;

async function test() {
  try {
    const res = await fetch(url, {
      headers: {
        'Cookie': 'auth-token=...' // I don't have the token easily, but I can use run-sql to simulate.
      }
    });
    // ...
  } catch (e) {}
}
