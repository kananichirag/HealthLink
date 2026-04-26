'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, setToken } from '@/lib/api';

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const response = await login({ email: formData.email, password: formData.password });
      setToken(response.access_token);
      router.push('/dashboard');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrors({ submit: msg.includes('401') || msg.includes('Invalid') ? 'Invalid email or password' : msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#e8edec',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Outer card */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: '860px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          background: '#ffffff',
        }}
      >
        {/* LEFT — teal panel */}
        <div
          style={{
            width: '340px',
            flexShrink: 0,
            background: 'linear-gradient(160deg, #0f766e 0%, #005c55 60%, #004a44 100%)',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative circle */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }}
          />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '17px', letterSpacing: '-0.01em' }}>MediFlow</span>
          </div>

          {/* Middle content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2
              style={{
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '22px',
                lineHeight: '30px',
                marginBottom: '12px',
                letterSpacing: '-0.01em',
              }}
            >
              Healthcare made seamless.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '13px', lineHeight: '20px', marginBottom: '24px' }}>
              Advanced clinical management tools designed for modern healthcare professionals.
            </p>

            {/* Stethoscope image placeholder */}
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.25)',
                height: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(0,92,85,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                }}
              />
              <svg width="64" height="64" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ position: 'relative', zIndex: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
              {/* Small badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', position: 'relative', zIndex: 1 }}>
            © 2024 MediFlow Health Systems
          </p>
        </div>

        {/* RIGHT — form */}
        <div style={{ flex: 1, padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#181c1c', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '13px', color: '#3e4947', marginBottom: '32px' }}>
            Please enter your clinical credentials to continue.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#181c1c', marginBottom: '6px' }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="julian.vance@mediflow.com"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  border: `1px solid ${errors.email ? '#ba1a1a' : '#d1d9d7'}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#181c1c',
                  background: errors.email ? '#fff5f5' : '#ffffff',
                  outline: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0f766e'; e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.12)'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.email ? '#ba1a1a' : '#d1d9d7'; e.target.style.boxShadow = 'none'; }}
              />
              {errors.email && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#181c1c' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password
                </label>
                <a href="#" style={{ fontSize: '12px', color: '#0f766e', fontWeight: 500, textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 42px 11px 14px',
                    border: `1px solid ${errors.password ? '#ba1a1a' : '#d1d9d7'}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#181c1c',
                    background: errors.password ? '#fff5f5' : '#ffffff',
                    outline: 'none',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#0f766e'; e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.password ? '#ba1a1a' : '#d1d9d7'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6e7977', padding: 0 }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  border: '1.5px solid #bdc9c6',
                  cursor: 'pointer',
                  accentColor: '#005c55',
                }}
              />
              <span style={{ fontSize: '13px', color: '#3e4947' }}>Remember this device for 30 days</span>
            </label>

            {/* Submit error */}
            {errors.submit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#ffdad6', border: '1px solid #ba1a1a', borderRadius: '10px' }}>
                <svg width="14" height="14" fill="#ba1a1a" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p style={{ fontSize: '13px', color: '#93000a' }}>{errors.submit}</p>
              </div>
            )}

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: isLoading ? '#80d5cb' : '#005c55',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'background 0.15s',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => { if (!isLoading) (e.currentTarget).style.background = '#0f766e'; }}
              onMouseLeave={(e) => { if (!isLoading) (e.currentTarget).style.background = '#005c55'; }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Bottom links */}
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#3e4947', marginTop: '24px' }}>
            Don&apos;t have a professional account?{' '}
            <Link href="/signup" style={{ color: '#005c55', fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>

          {/* Security badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '24px' }}>
            {['HIPAA Compliant', 'AES-256 Encryption'].map((badge) => (
              <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg width="12" height="12" fill="none" stroke="#6e7977" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span style={{ fontSize: '11px', color: '#6e7977' }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
