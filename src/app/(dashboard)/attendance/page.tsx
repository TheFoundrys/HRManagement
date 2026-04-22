'use client';
import { useEffect, useState } from 'react';
import { Clock, Filter, Loader2, Fingerprint } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/authStore';
import { hasPermission } from '@/lib/auth/rbac';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const isAdmin = hasPermission(user?.role || '', 'MANAGE_ATTENDANCE');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('');
  const [msg, setMsg] = useState<{ t: 'success' | 'error', c: string } | null>(null);

  const fetchRecords = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const queryParams = new URLSearchParams();
      if (isAdmin) {
        queryParams.append('date', date);
      } else {
        // Fetch current month for employee history
        queryParams.append('month', currentMonth.toString());
        queryParams.append('year', currentYear.toString());
        queryParams.append('employeeId', user?.employeeId || '');
      }
      
      if (status) queryParams.append('status', status);

      const [attRes, setRes] = await Promise.all([
        fetch(`/api/attendance?${queryParams.toString()}`),
        fetch('/api/admin/attendance/settings')
      ]);
      const [attData, setData] = await Promise.all([attRes.json(), setRes.json()]);
      if (attData.success) setRecords(attData.attendance);
      if (setData.success) setMode(setData.settings.attendance_mode);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchRecords();
    
    // Auto-refresh every 5 seconds for live hours if viewing today
    const isToday = date === new Date().toISOString().split('T')[0];
    if (isToday) {
      const interval = setInterval(() => fetchRecords(true), 5000);
      return () => clearInterval(interval);
    }
  }, [date, status, user]);

  const clock = async () => {
    if (!user) return;
    const res = await fetch('/api/attendance/ingest', {
      method: 'POST', body: JSON.stringify({ sourceType: 'web', employeeId: user.employeeId, tenantId: user.tenantId })
    });
    if ((await res.json()).success) fetchRecords();
  };

  const [processing, setProcessing] = useState(false);

  const processBiometric = async () => {
    try {
      setProcessing(true);
      setMsg(null);
      const res = await fetch('/api/attendance/process', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setMsg({ t: 'success', c: data.message || 'Biometric logs processed successfully.' });
        fetchRecords(true);
        setTimeout(() => setMsg(null), 5000);
      } else {
        setMsg({ t: 'error', c: data.error || 'Failed to process logs.' });
      }
    } catch (e) {
      console.error(e);
      setMsg({ t: 'error', c: 'Network error during biometric sync.' });
    } finally {
      setProcessing(false);
    }
  };

  const fmt = (t: string) => t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const hasIn = records.some(r => r.checkIn);
  const hasOut = records.some(r => r.checkOut);

  return (
    <div className="max-w-auto space-y-6 animate-fade-in">
      <header className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Clock className="text-primary" /> Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">{records.length} records • {new Date(date).toDateString()}</p>
        </div>

        {isAdmin ? (
          <div className="flex gap-3">
            <a href="/attendance/terminal" className="px-5 py-2 bg-muted hover:bg-muted text-foreground border border-border rounded-xl text-sm font-bold transition-all shadow-soft">Scanner Terminal</a>
            <button 
              onClick={processBiometric} 
              disabled={processing}
              className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-sm shadow-soft shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> 
                  Processing...
                </div>
              ) : 'Process Logs'}
            </button>
          </div>
        ) : (
          date === new Date().toISOString().split('T')[0] && (
            mode === 'BIOMETRIC' ? (
              <div className="px-5 py-2.5 bg-amber-500/10 text-amber-600 rounded-xl flex gap-2 text-sm font-bold border border-amber-500/20"><Fingerprint size={18} /> Biometric Restricted</div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => clock()} disabled={hasIn || loading} className="px-6 py-2 bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-xl text-sm font-bold transition-all shadow-soft shadow-primary/20">Clock In</button>
                <button onClick={() => clock()} disabled={!hasIn || hasOut || loading} className="px-6 py-2 bg-muted border border-border disabled:text-muted-foreground text-foreground rounded-xl text-sm font-bold transition-all">Clock Out</button>
              </div>
            )
          )
        )}
      </header>
      
      {msg && (
        <div className={`p-4 rounded-2xl border animate-slide-down flex items-center justify-between gap-4 ${msg.t === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
           <p className="text-[10px] font-black uppercase tracking-widest leading-none">{msg.c}</p>
           <button onClick={() => setMsg(null)} className="text-[10px] uppercase font-black opacity-50 hover:opacity-100">Dismiss</button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 p-5 bg-card border border-border rounded-2xl items-center shadow-soft">
        <Filter className="text-muted-foreground" size={18} />
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Date:</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:border-primary outline-none transition-all" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Filter {isAdmin ? 'Department' : 'History'}:</span>
          <select value={status} onChange={e => setStatus(e.target.value)} className="bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground capitalize focus:border-primary outline-none transition-all cursor-pointer">
            <option value="">All Statuses</option>
            {['Present', 'Absent', 'Late', 'Half-Day', 'On-Leave'].map(s => <option key={s.toLowerCase()} value={s.toLowerCase()}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Present', id: 'PRESENT' },
          { label: 'Absent', id: 'ABSENT' },
          { label: 'Late', id: 'LATE' },
          { label: 'Half-Day', id: 'HALF_DAY' },
          { label: 'On-Leave', id: 'ON_LEAVE' }
        ].map((s) => (
          <div key={s.id} className="bg-card border border-border rounded-2xl p-5 text-center shadow-soft">
            <p className="text-3xl font-black text-foreground">
              {records.filter((r) => r.status?.toUpperCase() === s.id).length}
            </p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-8 h-8" /></div> : (
        isAdmin ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-foreground">
                <thead className="bg-muted border-b border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  <tr>{['Employee ID', 'Terminal ID', 'Full Name', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Method'].map(h => <th key={h} className="p-5">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.length ? records.map(r => (
                    <tr key={r.id || r.employeeId} className="hover:bg-muted/30 transition-colors">
                      <td className="p-5 font-mono text-primary text-xs font-bold">{r.employeeId}</td>
                      <td className="p-5 font-mono text-muted-foreground text-xs">{r.deviceUserId}</td>
                      <td className="p-5 font-bold">{r.firstName} {r.lastName}</td>
                      <td className="p-5 font-bold">{fmt(r.checkIn)}</td>
                      <td className="p-5 text-muted-foreground">{fmt(r.checkOut)}</td>
                      <td className="p-5 text-muted-foreground"><span className="bg-muted px-2 py-1 rounded-md text-[10px] font-bold border border-border">{Number(r.workingHours || 0).toFixed(1)}h</span></td>
                      <td className="p-5">
                         <span className={`font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg ${r.status === 'present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                           {r.status}
                         </span>
                      </td>
                      <td className="p-5 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{r.source}</td>
                    </tr>
                  )) : <tr><td colSpan={8} className="p-12 text-center text-muted-foreground italic">No attendance records documented for this date.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Work History Feed</h2>
               <div className="h-[1px] flex-1 mx-6 bg-border" />
               <p className="text-[10px] text-primary font-black uppercase tracking-widest">Monthly Summary</p>
            </div>
            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-soft">
               <div className="divide-y divide-border">
                  {records.length ? records.map(r => (
                    <div key={r.id || r.employeeId} className="p-8 hover:bg-muted/30 transition-all group flex items-center justify-between gap-6">
                       <div className="flex items-center gap-8 flex-1">
                          {/* Date Block */}
                          <div className="w-24 text-center">
                             <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                             <p className="text-2xl font-black text-foreground mt-1">{new Date(r.date).getDate()}</p>
                             <p className="text-[10px] text-primary font-bold uppercase tracking-tight">{new Date(r.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                          </div>

                          <div className="h-10 w-[1px] bg-border" />

                          {/* Shift Info */}
                          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-8">
                             <div>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Check In</p>
                                <p className="text-sm font-bold text-foreground">{fmt(r.checkIn)}</p>
                             </div>
                             <div>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Check Out</p>
                                <p className="text-sm font-bold text-foreground">{fmt(r.checkOut)}</p>
                             </div>
                             <div className="hidden lg:block">
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mb-1.5">Duration</p>
                                <p className="text-sm font-black text-primary uppercase">{Number(r.workingHours || 0).toFixed(1)} Hours</p>
                             </div>
                          </div>
                       </div>

                       {/* Status & Method */}
                       <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                             <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none">Method</p>
                             <p className="text-[10px] font-bold text-foreground uppercase mt-1">{r.source}</p>
                          </div>
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border min-w-[100px] text-center ${r.status === 'present' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                             {r.status}
                          </span>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center">
                       <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">No activity documented for this month</p>
                    </div>
                  )}
               </div>
            </div>
            
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2rem] flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                   <Clock size={28} />
                </div>
                <div>
                   <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Attendance Records Verified</h4>
                   <p className="text-xs text-muted-foreground font-medium mt-1">Your logs are automatically recorded and verified through the office biometric scanner.</p>
                </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}