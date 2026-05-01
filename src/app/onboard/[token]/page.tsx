'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Loader2, AlertTriangle, Upload, X, FileText, User, Mail, Phone, MapPin, Calendar, Heart, Shield } from 'lucide-react';

type LinkStatus = 'loading' | 'valid' | 'expired' | 'already_submitted' | 'revoked' | 'invalid' | 'error';

interface EmployeeInfo {
  firstName: string;
  lastName: string;
  email: string;
}

const DOC_FIELDS = [
  { key: 'aadharPan', label: 'Aadhar / PAN Card', icon: Shield },
  { key: 'payslips', label: 'Previous Payslips', icon: FileText },
  { key: 'educationalCertificates', label: 'Educational Certificates', icon: FileText },
  { key: 'previousOfferLetter', label: 'Previous Offer Letter', icon: FileText },
  { key: 'relievingExperienceLetters', label: 'Relieving / Experience Letters', icon: FileText },
  { key: 'appraisalHikeLetters', label: 'Appraisal / Hike Letters', icon: FileText },
  { key: 'photo', label: 'Passport Photo', icon: User },
  { key: 'resume', label: 'Resume / CV', icon: FileText },
];

export default function OnboardPage() {
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<LinkStatus>('loading');
  const [linkType, setLinkType] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '',
    currentAddress: '', permanentAddress: '',
    dateOfBirth: '', emergencyContact: '', bloodGroup: ''
  });
  const [files, setFiles] = useState<Record<string, File | null>>({});

  useEffect(() => {
    if (!token) return;
    fetch(`/api/onboarding/validate/${token}`)
      .then(r => r.json())
      .then(data => {
        setStatus(data.status);
        setLinkType(data.linkType || 'generic');
        setTenantName(data.tenantName || '');
        if (data.employee) {
          setEmployee(data.employee);
          setForm(prev => ({
            ...prev,
            firstName: data.employee.firstName || '',
            lastName: data.employee.lastName || '',
            email: data.employee.email || ''
          }));
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleFileChange = (docKey: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [docKey]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    Object.entries(files).forEach(([k, f]) => { if (f) formData.append(k, f); });

    try {
      const res = await fetch(`/api/onboarding/submit/${token}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-neutral-400 text-sm font-medium">Validating your link...</p>
        </div>
      </div>
    );
  }

  // Error / expired / invalid states
  if (status !== 'valid') {
    const messages: Record<string, { title: string; desc: string }> = {
      expired: { title: 'Link Expired', desc: 'This onboarding link has expired. Please contact HR for a new one.' },
      already_submitted: { title: 'Already Submitted', desc: 'Onboarding details have already been submitted via this link.' },
      revoked: { title: 'Link Revoked', desc: 'This link has been deactivated by HR.' },
      invalid: { title: 'Invalid Link', desc: 'This onboarding link is not valid.' },
      error: { title: 'Error', desc: 'Something went wrong. Please try again later.' },
    };
    const msg = messages[status] || messages.error;
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111118] border border-neutral-800 p-10 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{msg.title}</h1>
          <p className="text-neutral-400 text-sm">{msg.desc}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111118] border border-neutral-800 p-10 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Submitted Successfully</h1>
          <p className="text-neutral-400 text-sm">Your onboarding details have been received. HR will review them and get back to you.</p>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto p-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-2">
            {tenantName || 'HRMS'} • Employee Onboarding
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
            Complete Your Onboarding
          </h1>
          <p className="text-neutral-500 text-xs">
            {linkType === 'specific' 
              ? 'Please verify your details and upload the required documents.'
              : 'Fill in your personal details and upload the required documents.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Details */}
          <section className="bg-[#111118] border border-neutral-800 p-8">
            <h2 className="text-sm font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
              <User size={16} className="text-blue-400" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">First Name *</label>
                <input required value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Last Name *</label>
                <input required value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Phone Number</label>
                <input value={form.phoneNumber} onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Blood Group</label>
                <select value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Emergency Contact</label>
                <input value={form.emergencyContact} onChange={e => setForm(p => ({ ...p, emergencyContact: e.target.value }))}
                  className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-[#111118] border border-neutral-800 p-8">
            <h2 className="text-sm font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
              <MapPin size={16} className="text-blue-400" /> Address
            </h2>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Current Address</label>
                <textarea value={form.currentAddress} onChange={e => setForm(p => ({ ...p, currentAddress: e.target.value }))}
                  rows={2} className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-1.5">Permanent Address</label>
                <textarea value={form.permanentAddress} onChange={e => setForm(p => ({ ...p, permanentAddress: e.target.value }))}
                  rows={2} className="w-full bg-[#0a0a0f] border border-neutral-700 px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>
            </div>
          </section>

          {/* Document Uploads */}
          <section className="bg-[#111118] border border-neutral-800 p-8">
            <h2 className="text-sm font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
              <Upload size={16} className="text-blue-400" /> Document Uploads
            </h2>
            <p className="text-[10px] text-neutral-500 mb-6">Accepted: PDF, DOC, DOCX, JPG, PNG • Max 10MB per file</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOC_FIELDS.map(doc => (
                <div key={doc.key} className="border border-neutral-800 bg-[#0a0a0f] p-4">
                  <label className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider block mb-3 flex items-center gap-2">
                    <doc.icon size={12} className="text-blue-400" /> {doc.label}
                  </label>
                  {files[doc.key] ? (
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                      <FileText size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-300 truncate flex-1">{files[doc.key]!.name}</span>
                      <button type="button" onClick={() => handleFileChange(doc.key, null)} className="text-neutral-500 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 border border-dashed border-neutral-700 px-3 py-4 cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all">
                      <Upload size={14} className="text-neutral-500" />
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">Choose File</span>
                      <input type="file" className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={e => handleFileChange(doc.key, e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 px-6 py-4 text-red-400 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Onboarding Details'}
          </button>
        </form>
      </div>
    </div>
  );
}
