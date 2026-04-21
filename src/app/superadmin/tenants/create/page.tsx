'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, User, CheckCircle2, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function CreateTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    tenantType: 'EDUCATION',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create tenant');

      router.push('/superadmin/tenants');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <Link 
        href="/superadmin/tenants" 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group w-fit"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold">Back to Tenants</span>
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-foreground tracking-tight">Onboard New Tenant</h1>
        <p className="text-muted-foreground flex items-center gap-2">
           Initialize a fresh siloed environment for a new organization.
           <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500/20" />
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Information */}
          <div className="bg-card p-8 rounded-3xl border border-border shadow-xl space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <Building2 className="w-24 h-24 rotate-12" />
             </div>
             
            <h2 className="text-xl font-black flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">1</span>
                Company Details
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Company Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    name="name"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-card px-11 py-3.5 rounded-2xl outline-none transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Initial Admin Account */}
          <div className="bg-card p-8 rounded-3xl border border-border shadow-xl space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <User className="w-24 h-24 -rotate-12" />
             </div>

            <h2 className="text-xl font-black flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 text-sm">2</span>
                Default Admin
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                  <input
                    required
                    name="adminName"
                    placeholder="John Doe"
                    value={formData.adminName}
                    onChange={handleChange}
                    className="w-full bg-muted/40 border-2 border-transparent focus:border-amber-500/20 focus:bg-card px-11 py-3.5 rounded-2xl outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                  <input
                    required
                    type="email"
                    name="adminEmail"
                    placeholder="admin@acme.com"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className="w-full bg-muted/40 border-2 border-transparent focus:border-amber-500/20 focus:bg-card px-11 py-3.5 rounded-2xl outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Initial Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
                  <input
                    required
                    type="password"
                    name="adminPassword"
                    placeholder="••••••••"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    className="w-full bg-muted/40 border-2 border-transparent focus:border-amber-500/20 focus:bg-card px-11 py-3.5 rounded-2xl outline-none transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Type Selection */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-xl space-y-6">
          <h2 className="text-xl font-black flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 text-sm">3</span>
            Organization Type
          </h2>
          <p className="text-sm text-muted-foreground ml-10">This selects the default roles and structure for the new environment.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setFormData({ ...formData, tenantType: 'EDUCATION' })}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 group ${
                formData.tenantType === 'EDUCATION' 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : 'border-transparent bg-muted/40 hover:bg-muted/60'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                formData.tenantType === 'EDUCATION' ? 'bg-indigo-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted'
              }`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">Educational Institution</h3>
                <p className="text-xs text-muted-foreground">Schools, Universities, Colleges</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-4 transition-all ${
                formData.tenantType === 'EDUCATION' ? 'border-indigo-500 bg-white' : 'border-muted'
              }`} />
            </div>

            <div 
              onClick={() => setFormData({ ...formData, tenantType: 'COMPANY' })}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 group ${
                formData.tenantType === 'COMPANY' 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : 'border-transparent bg-muted/40 hover:bg-muted/60'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                formData.tenantType === 'COMPANY' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted'
              }`}>
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">Corporate Company</h3>
                <p className="text-xs text-muted-foreground">Offices, Factories, Startups</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-4 transition-all ${
                formData.tenantType === 'COMPANY' ? 'border-emerald-500 bg-white' : 'border-muted'
              }`} />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            {error}
          </div>
        )}

        <button
          disabled={loading}
          type="submit"
          className={`w-full py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/20
            ${loading ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-primary/30 active:scale-95'}
          `}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Initialize Cloud Environment
              <CheckCircle2 className="w-5 h-5 fill-primary-foreground/20" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
