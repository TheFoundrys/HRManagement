'use client';
import { useEffect, useState, useMemo } from 'react';
import { Users, Loader2, Search, UserPlus, Settings, Trash2, Building2, UserCheck, ShieldCheck, ArrowRight, UserCircle2 } from 'lucide-react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', role: '', departmentId: '', designationId: '', reportsToId: '', salary: { basic: 0, hra: 0, allowances: 0, deductions: 0 } });
  const [error, setError] = useState('');
  const [tenantType, setTenantType] = useState<'EDUCATION' | 'COMPANY'>('COMPANY');

  // Define dynamic role sets
  const ROLES = {
    COMPANY: [
      { id: 'GLOBAL_ADMIN', label: 'Global Admin' },
      { id: 'HR_MANAGER', label: 'HR Manager' },
      { id: 'HR_EXECUTIVE', label: 'HR Executive' },
      { id: 'PAYROLL_ADMIN', label: 'Payroll Admin' },
      { id: 'MANAGER', label: 'Manager' },
      { id: 'EMPLOYEE', label: 'Standard Employee' }
    ],
    EDUCATION: [
      { id: 'ADMIN', label: 'Administrator' },
      { id: 'PRINCIPAL', label: 'Principal' },
      { id: 'HOD', label: 'Dept. Head' },
      { id: 'FACULTY', label: 'Faculty' },
      { id: 'STAFF', label: 'Academic Staff' },
      { id: 'NON_TEACHING', label: 'Support Staff' }
    ]
  };

  const fetchInit = async () => {
    try {
      const empRes = await fetch('/api/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        if (empData.success) setEmployees(empData.employees);
      }

      const deptRes = await fetch('/api/admin/scheduling/departments');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        if (deptData.success) setDepartments(deptData.departments);
      }

      const desigRes = await fetch('/api/admin/designations');
      if (desigRes.ok) {
        const desigData = await desigRes.json();
        if (desigData.success) setDesignations(desigData.designations);
      }

      const meRes = await fetch('/api/employees/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.success) {
          const type = meData.employee.tenantType || 'COMPANY';
          setTenantType(type);
          setForm(f => ({ ...f, role: ROLES[type][ROLES[type].length - 1].id }));
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
      setError(data.error || 'Failed to add employee');
    }
  };

  const handleOffboard = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently offboard ${name}?`)) return;
    try {
      const res = await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchInit();
      else alert(data.error || 'Offboarding failed');
    } catch (e) {
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

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    departments: [...new Set(employees.map(e => e.department_id))].length
  }), [employees]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in p-6">
      {/* Dynamic Command Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Users className="w-8 h-8" />
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Employee Directory</h1>
          </div>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] ml-11 opacity-70">
            {tenantType === 'COMPANY' ? 'Employee Directory & Access Management' : 'Institutional Identity & Access Management'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input 
              type="text" 
              placeholder="Search by name, ID or department..." 
              onChange={e => setSearch(e.target.value)} 
              className="bg-card/50 backdrop-blur-md border border-border rounded-2xl pl-12 pr-6 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-xl min-w-[320px]" 
            />
          </div>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95"
          >
            <UserPlus size={18} /> Add Employee
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Employees', value: stats.total, icon: Users, color: 'text-blue-500' },
          { label: 'Active Employees', value: stats.active, icon: UserCheck, color: 'text-emerald-500' },
          { label: 'Departments', value: stats.departments, icon: Building2, color: 'text-amber-500' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-card border border-border p-5 rounded-3xl flex items-center gap-5 shadow-soft hover:border-primary/30 transition-all group">
            <div className={`p-4 rounded-2xl bg-muted/50 ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{stat.label}</p>
              <h4 className="text-2xl font-black text-foreground mt-1 tabular-nums">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading employee data...</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* List View - Ultra High Density */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Employee</th>
                  <th className="px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Department & Role</th>
                  <th className="px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Access Control</th>
                  <th className="px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Employee ID</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(emp => (
                  <tr 
                    key={emp.id} 
                    className="hover:bg-primary/5 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/employees/${emp.university_id}`}
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-11 h-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-sm uppercase group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                          {emp.is_active && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full shadow-lg" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-sm text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{emp.first_name} {emp.last_name}</p>
                          <p className="text-muted-foreground text-[10px] font-bold tracking-wide">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 size={12} className="text-muted-foreground" />
                          <span className="text-[11px] font-black text-foreground/80 uppercase">{emp.department_name || 'General'}</span>
                        </div>
                        {emp.reporting_name && (
                          <div className="flex items-center gap-2">
                            <UserCircle2 size={10} className="text-primary/50" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Under: {emp.reporting_name}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                        <ShieldCheck size={14} className="text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                          {ROLES[tenantType].find(r => r.id === emp.role)?.label || emp.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground font-black tracking-widest uppercase">
                      {emp.university_id}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); window.location.href = `/employees/${emp.university_id}/edit`; }}
                          className="p-2 ml-2 bg-muted hover:bg-primary hover:text-white rounded-xl transition-all"
                        >
                          <Settings size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOffboard(emp.university_id, `${emp.first_name} ${emp.last_name}`); }}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ArrowRight size={16} className="text-primary ml-2" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-black text-foreground/70 uppercase">No Matches Found</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 px-12">
                We couldn't find any employees matching your search criteria. <br/> Try refining your query.
              </p>
            </div>
          )}
          
          <div className="bg-muted/20 px-8 py-4 border-t border-border flex justify-between items-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Showing {filtered.length} Employees</p>
            <div className="flex gap-2">
              <button disabled className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-[9px] font-black uppercase opacity-50 cursor-not-allowed">Previous</button>
              <button disabled className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-[9px] font-black uppercase opacity-50 cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Modern System Onboarding */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-md transition-all animate-fade-in" onClick={() => setShowModal(false)} />
          <div className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="h-2 w-full bg-primary" />
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Add Employee</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Create new {tenantType === 'COMPANY' ? 'employee' : 'institutional'} profile</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <UserPlus className="rotate-45" size={24} />
                </button>
              </div>

              {error && <div className="p-4 mb-6 bg-red-500/10 border-l-4 border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-r-lg">{error}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Employee ID</label>
                    <input 
                      placeholder="e.g. TF-001" 
                      required 
                      onChange={e => setForm({ ...form, employeeId: e.target.value })} 
                      className="w-full bg-muted/30 border border-border px-5 py-4 rounded-2xl text-foreground text-sm focus:border-primary outline-none transition-all hover:bg-muted/50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                    <input 
                      placeholder="Legal full name" 
                      required 
                      onChange={e => setForm({ ...form, name: e.target.value })} 
                      className="w-full bg-muted/30 border border-border px-5 py-4 rounded-2xl text-foreground text-sm focus:border-primary outline-none transition-all hover:bg-muted/50" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{tenantType === 'COMPANY' ? 'Corporate' : 'Institutional'} Email</label>
                  <input 
                    type="email" 
                    placeholder={tenantType === 'COMPANY' ? 'name@company.com' : 'name@institution.com'}
                    required 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    className="w-full bg-muted/30 border border-border px-5 py-4 rounded-2xl text-foreground text-sm focus:border-primary outline-none transition-all hover:bg-muted/50" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Department</label>
                    <select 
                      onChange={e => setForm({ ...form, departmentId: e.target.value })} 
                      className="w-full bg-muted/30 border border-border px-5 py-4 rounded-2xl text-foreground text-sm focus:border-primary outline-none cursor-pointer hover:bg-muted/50 transition-all"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Reporting Manager</label>
                    <select 
                      onChange={e => setForm({ ...form, reportsToId: e.target.value })} 
                      className="w-full bg-muted/30 border border-border px-5 py-4 rounded-2xl text-foreground text-sm focus:border-primary outline-none cursor-pointer hover:bg-muted/50 transition-all"
                    >
                      <option value="">Select Manager</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Job Title</label>
                    <select 
                      onChange={e => setForm({ ...form, designationId: e.target.value })} 
                      className="w-full bg-muted/30 border border-border px-5 py-4 rounded-2xl text-foreground text-sm focus:border-primary outline-none cursor-pointer hover:bg-muted/50 transition-all"
                    >
                      <option value="">Select Designation</option>
                      {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">System Role</label>
                    <select 
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })} 
                      className="w-full bg-muted/30 border border-border px-5 py-4 rounded-2xl text-foreground text-sm focus:border-primary outline-none cursor-pointer hover:bg-muted/50 transition-all"
                    >
                      {ROLES[tenantType].map(role => (
                        <option key={role.id} value={role.id}>{role.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-4 bg-muted border border-border text-muted-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-2 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Save Employee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
