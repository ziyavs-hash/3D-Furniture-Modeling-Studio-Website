import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  LogOut,
  Package,
  User,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { fetchFavoriteIds, fetchUserOrders } from '@/lib/services';

type UserInfo = {
  id: string;
  email?: string;
};

export default function AccountPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!currentUser) {
        navigate('/login', { replace: true });
        return;
      }

      setUser({
        id: currentUser.id,
        email: currentUser.email,
      });

      try {
        const [favorites, orders] = await Promise.all([
          fetchFavoriteIds(currentUser.id),
          fetchUserOrders(currentUser.id),
        ]);

        if (!mounted) return;

        setFavoriteCount(favorites.length);
        setOrderCount(orders.length);
      } catch (error) {
        console.error('Failed to load account data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSignOut() {
    setSigningOut(true);

    try {
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to sign out:', error);
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-6 py-24 lg:px-8">
          <div className="h-10 w-48 animate-pulse bg-neutral-100" />

          <div className="mt-10 h-40 animate-pulse bg-neutral-100" />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="h-40 animate-pulse bg-neutral-100" />
            <div className="h-40 animate-pulse bg-neutral-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-6 border-b border-neutral-200 pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-neutral-400">
              ATELIER LINEA
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
              Hesabım
            </h1>

            <p className="mt-3 text-sm text-neutral-500">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-2 self-start border border-neutral-300 px-5 py-3 text-sm text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <LogOut size={16} />

            {signingOut ? 'Çıxılır...' : 'Hesabdan çıx'}
          </button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            to="/favorites"
            className="group border border-neutral-200 p-6 transition hover:border-neutral-900"
          >
            <Heart
              size={21}
              strokeWidth={1.6}
            />

            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-sm text-neutral-500">
                  Seçilmişlər
                </p>

                <p className="mt-1 text-3xl font-semibold text-neutral-950">
                  {favoriteCount}
                </p>
              </div>

              <ArrowRight
                size={19}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>

          <Link
            to="/orders"
            className="group border border-neutral-200 p-6 transition hover:border-neutral-900"
          >
            <Package
              size={21}
              strokeWidth={1.6}
            />

            <div className="mt-8 flex items-end justify-between">
              <div>
                <p className="text-sm text-neutral-500">
                  Sifarişlər
                </p>

                <p className="mt-1 text-3xl font-semibold text-neutral-950">
                  {orderCount}
                </p>
              </div>

              <ArrowRight
                size={19}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </Link>
        </div>

        <div className="mt-10 border border-neutral-200 p-6">
          <div className="flex items-start gap-4">
            <User
              size={20}
              strokeWidth={1.6}
              className="shrink-0"
            />

            <div>
              <h2 className="font-medium text-neutral-900">
                Hesab məlumatları
              </h2>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Bu hesab vasitəsilə satın aldığınız modellərə,
                seçilmişlərə və sifariş tarixçənizə daxil ola
                bilərsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border border-neutral-200 p-6">
          <Link
            to="/models"
            className="group flex items-center justify-between"
          >
            <div>
              <h2 className="font-medium text-neutral-900">
                Yeni modellərə bax
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Atelier Linea kolleksiyasını kəşf edin.
              </p>
            </div>

            <ArrowRight
              size={19}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </main>
  );
}