'use client';

import React from 'react';
import { 
  UserCheck, CalendarOff, Clock, AlertCircle, 
  CalendarDays, Activity, Trophy, Star, Zap, Medal
} from 'lucide-react';

export default function StaffDashboard({ data }: { data: any }) {
  const stats = data?.stats || { 
    presentDays: 0, 
    leaveDays: 0, 
    pendingLeaves: 0,
    lateDays: 0 
  };
  
  const staffCards = [
    { label: 'Present', value: stats.presentDays, icon: UserCheck, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Leaves Taken', value: stats.leaveDays, icon: CalendarOff, color: 'text-primary bg-primary/10' },
    { label: 'Pending', value: stats.pendingLeaves, icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Late', value: stats.lateDays, icon: AlertCircle, color: 'text-danger bg-danger/10' },
  ];

  // Gamification Logic
  const level = Math.floor(stats.presentDays / 20) + 1;
  const xpInCurrentLevel = (stats.presentDays % 20) * 5; // 0-100 scale
  const streak = Math.min(stats.presentDays, 12); // Simulated streak for demo

  const badges = [
    { id: 'early', label: 'Early Bird', icon: Zap, active: stats.lateDays < 2 && stats.presentDays > 5, desc: 'Punctual with minimal late marks' },
    { id: 'consistent', label: 'Consistent', icon: Star, active: stats.presentDays > 50, desc: 'Over 50 days of active service' },
    { id: 'planner', label: 'Planner', icon: CalendarDays, active: stats.leaveDays > 5, desc: 'Efficiently planned time off' },
    { id: 'master', label: 'Pro', icon: Trophy, active: level > 3, desc: 'Reached Level 4 and beyond' },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {staffCards.map((card, i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-2xl shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Gamification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress & Level */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <Trophy className="w-32 h-32 text-primary" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest">
                Career Milestone
              </div>
              <div className="flex items-baseline gap-2">
                 <h2 className="text-6xl font-black text-foreground">{level}</h2>
                 <span className="text-lg font-bold text-muted-foreground uppercase tracking-widest">Level</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs font-medium italic">"Your attendance consistency is building your professional track record."</p>
            </div>

            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Experience Progress</p>
                  <p className="text-2xl font-bold text-foreground">{xpInCurrentLevel}% <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest ml-1">to milestone {level + 1}</span></p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active Streak</p>
                   <div className="flex items-center gap-1.5 justify-end">
                      <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                      <span className="text-xl font-bold text-foreground">{streak} Days</span>
                   </div>
                </div>
              </div>
              <div className="h-4 bg-muted border border-border rounded-full overflow-hidden p-0.5">
                 <div 
                   className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
                   style={{ width: `${xpInCurrentLevel}%` }}
                 />
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-card border border-border p-8 rounded-[2rem] shadow-soft">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Achievements</h2>
            <div className="w-8 h-8 bg-muted rounded-xl flex items-center justify-center">
               <Medal className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all duration-300 gap-3 text-center
                  ${badge.active 
                    ? 'bg-primary/5 border-primary/20 grayscale-0' 
                    : 'bg-muted/50 border-border grayscale opacity-50'}
                `}
              >
                <div className={`p-3 rounded-2xl ${badge.active ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted text-muted-foreground'}`}>
                  <badge.icon className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{badge.label}</p>
                   {badge.active && <p className="text-[8px] text-primary font-bold uppercase tracking-widest mt-0.5">Unlocked</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Log */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="p-5 border-b border-border bg-muted/30 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Attendance</h2>
          </div>
          <div className="divide-y divide-border">
            {(data?.attendance || []).slice(0, 5).map((att: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-foreground">{new Date(att.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  att.status?.toLowerCase() === 'present' ? 'text-emerald-500 bg-emerald-500/10' : 
                  att.status?.toLowerCase() === 'late' ? 'text-amber-500 bg-amber-500/10' : 'text-danger bg-danger/10'
                }`}>
                  {att.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
          <div className="p-5 border-b border-border bg-muted/30 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Leave Requests</h2>
          </div>
          <div className="divide-y divide-border">
            {(data?.leaves || []).slice(0, 5).map((leave: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-foreground uppercase tracking-tight">{leave.leaveType}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  leave.status === 'approved' ? 'text-emerald-500 bg-emerald-500/10' : 
                  leave.status === 'rejected' ? 'text-danger bg-danger/10' : 'text-amber-500 bg-amber-500/10'
                }`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
