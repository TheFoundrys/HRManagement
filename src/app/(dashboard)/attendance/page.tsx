'use client';
import { useEffect, useState } from 'react';
import { Clock, Filter, Loader2, Fingerprint, Calendar, ArrowRight, User, Timer, LogIn, LogOut, Zap, ShieldCheck } from 'lucide-react';
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
      const queryParams = new URLSearchParams();
      if (isAdmin) {
        queryParams.append('date', date);
      } else {
        const now = new Date();
        queryParams.append('month', (now.getMonth() + 1).toString());
        queryParams.append('year', now.getFullYear().toString());
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

  const fmt = (t: string) => t ? new Date(t).toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'Asia/Kolkata' 
  }) : '—';

  const getStatusStyle = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'present': return 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10';
      case 'late': return 'bg-amber-500/5 text-amber-600 border-amber-500/10';
      case 'absent': return 'bg-rose-500/5 text-rose-600 border-rose-500/10';
      default: return 'bg-slate-500/5 text-slate-600 border-slate-500/10';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
            <span className="p-3 bg-indigo-600 text-white rounded-[1.25rem] shadow-2xl shadow-indigo-200">
              <Clock size={28} strokeWidth={2.5} />
            </span>
            Attendance
          </h1>
          <p className="text-slate-400 text-sm font-semibold flex items-center gap-2 pl-1">
            <Calendar size={14} className="text-indigo-500" /> {new Date(date).toLocaleDateString('en-IN', { dateStyle: 'full' })}
          </p>
        </div>

        <div className="flex w-full sm:w-auto gap-4">
          {!isAdmin && date === new Date().toISOString().split('T')[0] && mode !== 'BIOMETRIC' && (
            <div className="flex w-full gap-4">
              <button onClick={clock} className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">Clock In</button>
              <button onClick={clock} className="flex-1 px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95">Clock Out</button>
            </div>
          )}
          {isAdmin && (
             <a href="/attendance/terminal" className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all">Launch Kiosk</a>
          )}
        </div>
      </header>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Present', id: 'PRESENT', color: 'text-emerald-500' },
          { label: 'Absent', id: 'ABSENT', color: 'text-rose-500' },
          { label: 'Late', id: 'LATE', color: 'text-amber-500' },
          { label: 'Half Day', id: 'HALF_DAY', color: 'text-sky-500' },
          { label: 'On Leave', id: 'ON_LEAVE', color: 'text-indigo-500' }
        ].map(s => (
          <div key={s.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-indigo-500/20">
            <p className={`text-4xl font-black ${s.color} tracking-tighter`}>
              {records.filter(r => r.status?.toUpperCase() === s.id).length}
            </p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm items-center">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><Filter size={18} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">Refine View</p>
          </div>
          <div className="h-[1px] w-full sm:w-12 bg-slate-100 hidden sm:block" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {isAdmin && (
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 ring-indigo-500/10 transition-all" />
            )}
            <select value={status} onChange={e => setStatus(e.target.value)} className="bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-bold outline-none cursor-pointer appearance-none">
              <option value="">All Statuses</option>
              {['Present', 'Absent', 'Late', 'Half-Day', 'On-Leave'].map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* History Feed */}
        <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {records.length ? records.map(r => (
              <div key={r.id || r.employeeId} className="p-6 sm:p-10 hover:bg-slate-50/50 transition-all flex flex-col lg:flex-row items-center justify-between gap-8 group">
                {/* Date & Identity */}
                <div className="flex items-center gap-8 w-full lg:w-auto">
                  <div className="w-16 sm:w-20 text-center flex flex-col items-center">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{new Date(r.date).getDate()}</span>
                    <div className="h-1 w-4 bg-slate-100 rounded-full mt-2" />
                  </div>
                  
                  <div className="h-12 w-[1px] bg-slate-100 hidden sm:block" />

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-sm">
                      {isAdmin ? (r.firstName?.[0] || 'U') : <User size={20} />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm tracking-tight">{isAdmin ? `${r.firstName} ${r.lastName}` : 'Standard Shift'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{r.employeeId || 'System ID'}</p>
                    </div>
                  </div>
                </div>

                {/* Time Flow (STAKED ON MOBILE TO PREVENT OVERLAP) */}
                <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-16 w-full lg:w-auto py-6 lg:py-0 border-y lg:border-0 border-slate-50">
                  <div className="flex flex-row sm:flex-col items-center sm:items-start gap-4 sm:gap-0 w-full sm:w-auto">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest sm:mb-2 flex items-center gap-1 min-w-[70px] sm:min-w-0"><LogIn size={10} className="text-emerald-500" /> In</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{fmt(r.checkIn)}</p>
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-center opacity-20">
                    <ArrowRight size={20} className="text-slate-900" />
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-0 w-full sm:w-auto">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest sm:mb-2 flex items-center gap-1 min-w-[70px] sm:min-w-0 justify-start sm:justify-end"><LogOut size={10} className="text-rose-500" /> Out</p>
                    <p className="text-lg font-black text-slate-900 tracking-tight">{fmt(r.checkOut)}</p>
                  </div>
                </div>

                {/* Duration & Status */}
                <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto">
                   <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl border border-indigo-100/50">
                        <Timer size={14} strokeWidth={3} />
                        <span className="text-xs font-black tracking-tight">{Number(r.workingHours || 0).toFixed(1)} HRS</span>
                      </div>
                      {Number(r.workingHours || 0) > 9 && (
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1.5 flex items-center gap-1"><Zap size={8} fill="currentColor" /> Overtime Active</p>
                      )}
                   </div>
                   
                   <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border ${getStatusStyle(r.status)}`}>
                     {r.status}
                   </span>
                </div>
              </div>
            )) : (
              <div className="py-32 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Calendar size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity documentation found for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-slate-900 p-8 rounded-[3rem] flex flex-col sm:flex-row items-center gap-8 overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
           <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-500">
             <ShieldCheck size={32} className="text-indigo-400" />
           </div>
           <div className="text-center sm:text-left relative z-10">
              <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">Authenticated Infrastructure</h4>
              <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xl">
                Attendance metrics are cryptographically verified through hardware-level biometric nodes and spatial-temporal constraints. Any discrepancies are automatically flagged for institutional review.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}