import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) {
        navigate('/account', { replace: true });
      }
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const { error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) throw loginError;

        navigate('/account', { replace: true });
        return;
      }

      const { data, error: registerError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (registerError) throw registerError;

      if (data.session) {
        navigate('/account', { replace: true });
      } else {
        setMessage(
          'Qeydiyyat tamamlandı. E-poçt ünvanınıza göndərilən təsdiq linkini yoxlayın.',
        );
      }
    } catch (err) {
      console.error('Authentication error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Əməliyyat zamanı xəta baş verdi.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-16 lg:px-16">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="mb-10 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
            >
              <ArrowLeft size={15} />
              Ana səhifəyə qayıt
            </Link>

            <p className="text-xs font-medium tracking-[0.2em] text-neutral-400">
              ATELIER LINEA
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950">
              {mode === 'login' ? 'Xoş gəlmisiniz' : 'Hesab yaradın'}
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              {mode === 'login'
                ? 'Modellərinizə, sifarişlərinizə və seçilmişlərinizə daxil olun.'
                : 'Atelier Linea hesabınızı yaradaraq modellərinizi və sifarişlərinizi idarə edin.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  E-poçt
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-900"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-neutral-800"
                >
                  Şifrə
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  className="w-full border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-900"
                  placeholder="Minimum 6 simvol"
                />
              </div>

              {error && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-5 text-neutral-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-950 px-6 py-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? 'Gözləyin...'
                  : mode === 'login'
                    ? 'Daxil ol'
                    : 'Qeydiyyatdan keç'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-neutral-500">
              {mode === 'login'
                ? 'Hesabınız yoxdur?'
                : 'Artıq hesabınız var?'}

              <button
                type="button"
                onClick={() => {
                  setMode((current) =>
                    current === 'login' ? 'register' : 'login',
                  );
                  setError('');
                  setMessage('');
                }}
                className="ml-2 font-medium text-neutral-900 underline underline-offset-4"
              >
                {mode === 'login' ? 'Qeydiyyatdan keçin' : 'Daxil olun'}
              </button>
            </div>

            {location.state?.from && (
              <p className="mt-6 text-center text-xs text-neutral-400">
                Davam etmək üçün hesabınıza daxil olun.
              </p>
            )}
          </div>
        </div>

        <div className="hidden bg-neutral-100 lg:block">
          <div className="h-full min-h-[700px]">
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85"
              alt="Atelier Linea interior"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  );
}