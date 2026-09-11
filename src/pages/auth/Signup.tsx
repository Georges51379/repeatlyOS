import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const { configured } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase
      .from('signup_requests')
      .insert({ full_name: fullName.trim(), email: email.trim() });
    setSubmitting(false);
    if (insertError) {
      setError(
        insertError.code === '23505'
          ? 'There is already a pending request for this email.'
          : insertError.message,
      );
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
          <h1 className="text-white font-semibold text-lg mb-2">Request submitted</h1>
          <p className="text-slate-400 text-sm mb-5">
            Thanks, {fullName.trim().split(' ')[0] || 'there'}. Your account request is pending
            approval. We'll email <span className="text-white">{email}</span> once it's reviewed,
            with a link to sign in and set up a passkey.
          </p>
          <Link
            to="/"
            className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-white font-bold text-lg">RepeatlyOS</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-white font-semibold text-lg mb-1">Register your business</h1>
          <p className="text-slate-500 text-sm mb-5">
            Submit your name and email — a RepeatlyOS admin reviews every request before you can
            sign in.
          </p>

          {!configured && (
            <div className="mb-4 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Supabase is not configured yet. Copy <code>.env.example</code> to{' '}
              <code>.env</code> and set your project URL/anon key before this works.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Full name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Ahmad Khalil"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="you@business.com"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !configured}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit for approval'}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-5 text-center">
            Already approved?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-slate-600 hover:text-slate-400">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
