import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Heart,
  Menu,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { fetchCartItems, fetchFavoriteIds } from '@/lib/services';

export default function Navbar() {
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUserState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUserId(user?.id ?? null);

      if (!user) {
        setCartCount(0);
        setFavoriteCount(0);
        return;
      }

      const [cart, favorites] = await Promise.all([
        fetchCartItems(user.id),
        fetchFavoriteIds(user.id),
      ]);

      if (!mounted) return;

      setCartCount(
        cart.reduce(
          (total, item) => total + Math.max(1, item.quantity || 1),
          0,
        ),
      );

      setFavoriteCount(favorites.length);
    }

    loadUserState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function closeMobile() {
    setMobileOpen(false);
  }

  function handleAccount() {
    closeMobile();

    if (userId) {
      navigate('/account');
    } else {
      navigate('/login');
    }
  }

  const navItems = [
    { label: 'Models', to: '/models' },
    { label: 'Studio', to: '/studio' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          to="/"
          onClick={closeMobile}
          className="shrink-0 text-lg font-semibold tracking-[0.18em] text-neutral-950"
        >
          ATELIER LINEA
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm transition ${
                  isActive
                    ? 'text-neutral-950'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            to="/favorites"
            aria-label="Seçilmişlər"
            className="relative flex h-10 w-10 items-center justify-center text-neutral-700 transition hover:text-neutral-950"
          >
            <Heart size={19} strokeWidth={1.7} />

            {favoriteCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] font-medium text-white">
                {favoriteCount > 99 ? '99+' : favoriteCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            aria-label="Səbət"
            className="relative flex h-10 w-10 items-center justify-center text-neutral-700 transition hover:text-neutral-950"
          >
            <ShoppingBag size={19} strokeWidth={1.7} />

            {cartCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] font-medium text-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={handleAccount}
            aria-label={userId ? 'Hesabım' : 'Giriş'}
            className="flex h-10 w-10 items-center justify-center text-neutral-700 transition hover:text-neutral-950"
          >
            <User size={19} strokeWidth={1.7} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center text-neutral-900 md:hidden"
          aria-label={mobileOpen ? 'Menyunu bağla' : 'Menyunu aç'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-6 py-6">
            <nav className="flex flex-col">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `border-b border-neutral-100 py-4 text-sm ${
                      isActive
                        ? 'font-medium text-neutral-950'
                        : 'text-neutral-600'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <Link
                to="/favorites"
                onClick={closeMobile}
                className="flex items-center justify-between border-b border-neutral-100 py-4 text-sm text-neutral-600"
              >
                <span>Seçilmişlər</span>

                {favoriteCount > 0 && (
                  <span className="text-xs text-neutral-400">
                    {favoriteCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                onClick={closeMobile}
                className="flex items-center justify-between border-b border-neutral-100 py-4 text-sm text-neutral-600"
              >
                <span>Səbət</span>

                {cartCount > 0 && (
                  <span className="text-xs text-neutral-400">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={handleAccount}
                className="flex items-center gap-3 py-4 text-left text-sm text-neutral-600"
              >
                <User size={17} />
                {userId ? 'Hesabım' : 'Giriş / Qeydiyyat'}
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}