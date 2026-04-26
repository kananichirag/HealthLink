'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  submit?: string;
}

type Role = 'DOCTOR' | 'PATIENT' | 'PHARMACY';

const ROLES: { value: Role; label: string; iconPath: string }[] = [
  { value: 'DOCTOR', label: 'Doctor', iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { value: 'PATIENT', label: 'Patient', iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { value: 'PHARMACY', label: 'Pharmacy', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    role: 'DOCTOR' as Role,
    tenantName: '', facilityType: 'Public Hospital', agreed: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const needsTenant = formData.role === 'DOCTOR' || formData.role === 'PHARMACY';

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!formData.name.trim()) e.name = 'Full name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Password must be at least 8 characters long';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((p) => ({ ...p, [name]: val }));
    if (errors[name as keyof FormErrors]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({
        name: formData.name, email: formData.email, password: formData.password,
        role: formData.role,
        ...(needsTenant ? {
          tenantName: formData.tenantName || `${formData.name}'s ${formData.role === 'DOCTOR' ? 'Clinic' : 'Pharmacy'}`,
          tenantType: formData.role === 'PHARMACY' ? 'PHARMACY' : 'CLINIC',
        } : {}),
      });
      router.push('/login');
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const inp = (err?: string): React.CSSProperties => ({
    width: '100%', padding: '10px 14px 10px 36px',
    border: `1px solid ${err ? '#ba1a1a' : '#d1d9d7'}`,
    borderRadius: '10px', fontSize: '14px',
    color: '#181c1c', background: err ? '#fff5f5' : '#ffffff',
    outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  });

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#0f766e';
    e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.12)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>, err?: string) => {
    e.target.style.borderColor = err ? '#ba1a1a' : '#d1d9d7';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#e8edec', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '900px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.14)', background: '#ffffff' }}>

        {/* ── LEFT teal panel ── */}
        <div style={{ width: '320px', flexShrink: 0, background: 'linear-gradient(160deg, #0f766e 0%, #005c55 60%, #004a44 100%)', padding: '36px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '60px', left: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>MediFlow</span>
          </div>

          {/* Headline + testimonial */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '22px', lineHeight: '30px', marginBottom: '12px', letterSpacing: '-0.01em' }}>
              Empowering healthcare through data precision.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: '13px', lineHeight: '20px', marginBottom: '28px' }}>
              Join the network of health professionals and patients managing care with clinical accuracy.
            </p>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(8px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '13px', margin: 0 }}>Dr. Julian Vance</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Chief of Surgery</p>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', lineHeight: '18px', fontStyle: 'italic', margin: 0 }}>
                &ldquo;MediFlow has transformed how we track patient recovery. The interface is intuitive, allowing us to focus on care rather than paperwork.&rdquo;
              </p>
            </div>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', position: 'relative', zIndex: 1 }}>© 2024 MediFlow Health Systems</p>
        </div>

        {/* ── RIGHT form ── */}
        <div style={{ flex: 1, padding: '40px 44px', overflowY: 'auto' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#005c55', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}>1</span>
              </div>
              <div style={{ width: '32px', height: '2px', background: '#d1d9d7', borderRadius: '2px' }} />
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e5e9e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#6e7977', fontSize: '12px', fontWeight: 700 }}>2</span>
              </div>
            </div>
            <Link href="/login" style={{ fontSize: '13px', color: '#0f766e', fontWeight: 500, textDecoration: 'none' }}>
              Already have an account? Sign in
            </Link>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#181c1c', marginBottom: '4px', letterSpacing: '-0.02em' }}>Create your account</h1>
          <p style={{ fontSize: '13px', color: '#3e4947', marginBottom: '24px' }}>Enter your details to get started with the MediFlow platform.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#181c1c', marginBottom: '6px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6e7977', pointerEvents: 'none' }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </span>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe"
                  style={inp(errors.name)} onFocus={onFocus} onBlur={(e) => onBlur(e, errors.name)} />
              </div>
              {errors.name && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#181c1c', marginBottom: '6px' }}>Professional Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6e7977', pointerEvents: 'none' }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john.doe@mediflow.com"
                  style={inp(errors.email)} onFocus={onFocus} onBlur={(e) => onBlur(e, errors.email)} />
              </div>
              {errors.email && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#181c1c', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6e7977', pointerEvents: 'none' }}>
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </span>
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••"
                  style={{ ...inp(errors.password), paddingRight: '40px' }} onFocus={onFocus} onBlur={(e) => onBlur(e, errors.password)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6e7977', padding: 0 }}>
                  {showPassword
                    ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {errors.password && (
                <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="12" height="12" fill="#ba1a1a" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Role pills */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#181c1c', marginBottom: '8px' }}>Select Your Role</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ROLES.map((r) => {
                  const sel = formData.role === r.value;
                  return (
                    <button key={r.value} type="button" onClick={() => setFormData((p) => ({ ...p, role: r.value }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px',
                        border: `1.5px solid ${sel ? '#005c55' : '#d1d9d7'}`,
                        borderRadius: '999px',
                        background: sel ? '#f1f4f3' : '#ffffff',
                        color: sel ? '#005c55' : '#3e4947',
                        fontSize: '13px', fontWeight: sel ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
                        transition: 'all 0.15s',
                      }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={r.iconPath} />
                      </svg>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Professional details */}
            {needsTenant && (
              <div style={{ background: '#f1f4f3', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <svg width="14" height="14" fill="none" stroke="#005c55" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#005c55', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Professional Details</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#3e4947', marginBottom: '5px' }}>
                      {formData.role === 'DOCTOR' ? 'Clinic/Hospital Name' : 'Pharmacy Name'}
                    </label>
                    <input type="text" name="tenantName" value={formData.tenantName} onChange={handleChange}
                      placeholder={formData.role === 'DOCTOR' ? "St. Mary's Medical" : 'MedPlus Pharmacy'}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d9d7', borderRadius: '8px', fontSize: '13px', color: '#181c1c', background: '#fff', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif' }}
                      onFocus={onFocus} onBlur={(e) => onBlur(e)} />
                  </div>
                  <div style={{ width: '140px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#3e4947', marginBottom: '5px' }}>Facility Type</label>
                    <select name="facilityType" value={formData.facilityType} onChange={handleChange}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d9d7', borderRadius: '8px', fontSize: '13px', color: '#181c1c', background: '#fff', outline: 'none', fontFamily: 'Inter, system-ui, sans-serif', cursor: 'pointer' }}
                      onFocus={onFocus} onBlur={(e) => onBlur(e)}>
                      <option>Public Hospital</option>
                      <option>Private Clinic</option>
                      <option>Pharmacy</option>
                      <option>Specialist Centre</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" name="agreed" checked={formData.agreed} onChange={handleChange}
                style={{ width: '15px', height: '15px', marginTop: '2px', accentColor: '#005c55', cursor: 'pointer', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#3e4947', lineHeight: '18px' }}>
                By creating an account, I agree to MediFlow&apos;s{' '}
                <a href="#" style={{ color: '#0f766e', textDecoration: 'none' }}>Terms of Service</a> and{' '}
                <a href="#" style={{ color: '#0f766e', textDecoration: 'none' }}>Privacy Policy</a> regarding clinical data handling.
              </span>
            </label>

            {/* Submit error */}
            {errors.submit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '10px' }}>
                <svg width="14" height="14" fill="#ba1a1a" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <p style={{ fontSize: '13px', color: '#93000a' }}>{errors.submit}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              style={{
                width: '100%', padding: '13px 20px',
                background: isLoading ? '#80d5cb' : '#005c55',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#0f766e'; }}
              onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = '#005c55'; }}>
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
