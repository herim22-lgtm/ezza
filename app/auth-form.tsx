'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const isSignup = mode === 'signup';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);
    setNeedsConfirmation(false);

    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push('/dashboard');
          router.refresh();
          return;
        }
        setMessage('Account created. Check your email to confirm your account, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setIsError(true);
      setNeedsConfirmation(errorMessage.toLowerCase().includes('email not confirmed'));
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function resendConfirmation() {
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const { error } = await createClient().auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/login?confirmed=1` },
      });
      if (error) throw error;
      setNeedsConfirmation(false);
      setMessage('A new confirmation email was sent. Open the newest email and click the link.');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Could not resend the email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authShell">
      <Link className="authBrand" href="/"><span className="mark">E</span><b>Ezza</b></Link>
      <section className="authCard">
        <p className="eyebrow">{isSignup ? 'START YOUR JOURNEY' : 'WELCOME BACK'}</p>
        <h1>{isSignup ? 'Create your account' : 'Log in to Ezza'}</h1>
        <p className="authIntro">{isSignup ? 'Start making clearer money decisions today.' : 'Your financial dashboard is waiting.'}</p>
        <form onSubmit={submit}>
          {isSignup && <label>Full name<input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>}
          <label>Email address<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
          <label>Password<input required minLength={6} type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>
          {message && <div className={isError ? 'authMessage error' : 'authMessage success'}>{message}</div>}
          {needsConfirmation && <button className="authResend" type="button" disabled={loading || !email} onClick={resendConfirmation}>Resend confirmation email</button>}
          <button className="authSubmit" disabled={loading}>{loading ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}</button>
        </form>
        <p className="authSwitch">{isSignup ? 'Already have an account?' : 'New to Ezza?'} <Link href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create account'}</Link></p>
      </section>
    </main>
  );
}
