'use client';
import { useEffect, useState, useMemo } from 'react';
import { Users, Loader2, Search, UserPlus, Settings, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', role: '', departmentId: '', designationId: '', reportsToId: '', salary: { basic: 0, hra: 0, allowances: 0, deductions: 0 } });
  const [error, setError] = useState('');
  const [tenantType, setTenantType] = useState<'EDUCATION' | 'COMPANY'>('EDUCATION');

  // Define dynamic role sets
  const ROLES = {
    COMPANY: [
      { id: 'GLOBAL_ADMIN', label: 'Global Admin (All Access)' },
      { id: 'HR_MANAGER', label: 'HR Manager' },
      { id: 'HR_EXECUTIVE', label: 'HR Executive' },
      { id: 'PAYROLL_ADMIN', label: 'Payroll Admin' },
      { id: 'EXPENSE_MANAGER', label: 'Expense Manager' },
      { id: 'IT_ADMIN', label: 'IT Admin' },
      { id: 'LEARNING_ADMIN', label: 'Learning Admin' },
      { id: 'MANAGER', label: 'Managerial Access' },
      { id: 'EMPLOYEE', label: 'Standard Employee' }
    ],
    EDUCATION: [
      { id: 'ADMIN', label: 'Admin' },
      { id: 'PRINCIPAL', label: 'Principal' },
      { id: 'DIRECTOR', label: 'Director' },
      { id: 'HOD', label: 'Head of Department (HOD)' },
      { id: 'FACULTY', label: 'Faculty' },
      { id: 'STAFF', label: 'Academic Staff' },
      { id: 'NON_TEACHING', label: 'Non-Teaching Support' }
    ]
  };

  const fetchInit = async () => {
    try {
      // Fetch employees
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        if (empData.success) setEmployees(empData.employees);
      }

      // Fetch departments
      const deptRes = await fetch('/api/admin/scheduling/departments');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        if (deptData.success) setDepartments(deptData.departments);
      }

      // Fetch designations
      const desigRes = await fetch('/api/admin/designations');
      if (desigRes.ok) {
        const desigData = await desigRes.json();
        if (desigData.success) setDesignations(desigData.designations);
      }

      // Fetch Me for Tenant Type
      const meRes = await fetch('/api/employees/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.success) {
          const type = meData.employee.tenantType || 'EDUCATION';
          setTenantType(type);
          setForm(f => ({ ...f, role: ROLES[type][ROLES[type].length - 1].id })); // Default to lowest role
        }
      }
    } catch (e) {
      console.error('Initialization error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInit(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/employees', { method: 'POST', body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { 
      setShowModal(false); 
      fetchInit(); 
    } else {
      setError(data.error || 'Failed to onboard personnel');
    }
  };

  const handleOffboard = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to offboard ${name}? This will deactivate their account.`)) return;
    
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchInit();
      } else {
        alert(data.error || 'Failed to offboard employee');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred during offboarding');
    }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return employees.filter(e => 
      (String(e.first_name || '') + ' ' + String(e.last_name || '')).toLowerCase().includes(s) || 
      String(e.email || '').toLowerCase().includes(s) || 
      String(e.university_id || '').toLowerCase().includes(s) ||
      String(e.department_name || '').toLowerCase().includes(s) ||
      String(e.role || '').toLowerCase().includes(s)
    );
  }, [employees, search]);

  return (
    <div className="max-w-auto space-y-6 animate-fade-in">
      <header className="flex justify-between items-center pb-6 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3"><Users className="text-primary" /> Directory</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search..." onChange={e => setSearch(e.target.value)} className="bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:border-primary outline-none transition-all shadow-soft" />
          </div>
          <button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all shadow-soft"><UserPlus size={16} /> Add Employee</button>
        </div>
      </header>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-8 h-8" /></div> :
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(emp => (
            <div 
              key={emp.id} 
              onClick={() => window.location.href = `/employees/${emp.university_id}`}
              className="bg-card border border-border p-5 rounded-2xl flex justify-between items-center hover:border-primary transition-all shadow-soft group cursor-pointer active:scale-[0.98]"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
                  {(emp.first_name?.[0] || '?')}{(emp.last_name?.[0] || '')}
                </div>
                <div>
                  <h3 className="text-foreground font-black text-sm leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">{emp.first_name} {emp.last_name}</h3>
                  <p className="text-muted-foreground text-[10px] font-bold mt-1 uppercase tracking-widest leading-none">{emp.department_name} • <span className="text-primary">{emp.email}</span></p>
                  {emp.reporting_name && <p className="text-primary/70 text-[8px] font-black mt-2 uppercase tracking-tighter">Reports to: {emp.reporting_name}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="bg-muted text-primary text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-[0.1em] border border-border">
                    {ROLES[tenantType].find(r => r.id === emp.role)?.label || emp.role}
                  </span>
                  <p className="text-muted-foreground text-[10px] mt-2 font-mono tracking-widest uppercase font-black leading-none">{emp.university_id}</p>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/employees/${emp.university_id}/edit`;
                  }}
                  className="p-2 hover:bg-primary hover:text-white rounded-lg transition-all text-muted-foreground opacity-0 group-hover:opacity-100"
                >
                  <Settings size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOffboard(emp.university_id, `${emp.first_name} ${emp.last_name}`);
                  }}
                  className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all text-muted-foreground opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      }

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card p-10 rounded-3xl w-full max-w-md border border-border shadow-2xl">
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-4">Onboard Personnel</h2>
            {error && <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-bold rounded-xl">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Terminal ID</label>
                <input placeholder="ID (TFU-xxx)" required onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full bg-muted border border-border px-5 py-4 rounded-xl text-foreground text-sm focus:border-primary outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Personnel Name</label>
                <input placeholder="Full Name" required onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-muted border border-border px-5 py-4 rounded-xl text-foreground text-sm focus:border-primary outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Network Contact</label>
                <input type="email" placeholder="Corporate Email" required onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-muted border border-border px-5 py-4 rounded-xl text-foreground text-sm focus:border-primary outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hierarchy Designation</label>
                <select onChange={e => setForm({ ...form, designationId: e.target.value })} className="w-full bg-muted border border-border px-5 py-4 rounded-xl text-foreground text-sm focus:border-primary outline-none cursor-pointer">
                  <option value="">Select Designation...</option>
                  {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">System Access (Role)</label>
                <select 
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })} 
                  className="w-full bg-muted border border-border px-5 py-4 rounded-xl text-foreground text-sm focus:border-primary outline-none cursor-pointer"
                >
                  {ROLES[tenantType].map(role => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reporting Person (Optional)</label>
                <select onChange={e => setForm({ ...form, reportsToId: e.target.value })} className="w-full bg-muted border border-border px-5 py-4 rounded-xl text-foreground text-sm focus:border-primary outline-none cursor-pointer">
                  <option value="">No Reporting Person...</option>
                  {employees.filter(e => {
                    if (tenantType === 'COMPANY') {
                      return e.role !== 'EMPLOYEE'; // Everyone above standard employee
                    }
                    return e.role !== 'NON_TEACHING'; // Everyone above non-teaching staff
                  }).map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.role})</option>)}
                </select>
              </div>
              {tenantType === 'EDUCATION' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</label>
                  <select onChange={e => setForm({ ...form, departmentId: e.target.value })} className="w-full bg-muted border border-border px-5 py-4 rounded-xl text-foreground text-sm focus:border-primary outline-none cursor-pointer">
                    <option value="">Assign Department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-muted border border-border hover:bg-muted text-muted-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Finalize</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
