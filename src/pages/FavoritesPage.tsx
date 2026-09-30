import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Trash2,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import {
  fetchFavoriteIds,
  fetchProducts,
  formatPrice,
  removeFavorite,
} from '@/lib/services';
import type { ProductCardData } from '@/lib/types';

export default function FavoritesPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<
    ProductCardData[]
  >([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      setLoading(true);
      setError('');

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate('/models');
          return;
        }

        const favoriteIds =
          await fetchFavoriteIds(user.id);

        if (!active) {
          return;
        }

        if (favoriteIds.length === 0) {
          setProducts([]);
          return;
        }

        const result =
          await fetchProducts({
            page: 1,
            pageSize: Math.max(
              favoriteIds.length,
              100,
            ),
          });

        if (!active) {
          return;
        }

        const favoriteSet =
          new Set(favoriteIds);

        const favoriteProducts =
          result.items.filter((product) =>
            favoriteSet.has(product.id),
          );

        setProducts(favoriteProducts);
      } catch (err) {
        console.error(
          'Failed to load favorites:',
          err,
        );

        if (active) {
          setError(
            'Seçilmişlər yüklənərkən xəta baş verdi.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleRemove(
    productId: string,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate('/models');
      return;
    }

    const previousProducts = products;

    setRemoving(productId);

    setProducts((current) =>
      current.filter(
        (product) =>
          product.id !== productId,
      ),
    );

    try {
      await removeFavorite(
        user.id,
        productId,
      );
    } catch (err) {
      console.error(
        'Failed to remove favorite:',
        err,
      );

      setProducts(previousProducts);
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 h-8 w-52 animate-pulse rounded bg-black/5" />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-red-600">
            {error}
          </p>

          <Link
            to="/models"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f1f1d] px-5 py-3 text-sm font-medium text-white"
          >
            <ArrowLeft size={16} />
            Modellərə qayıt
          </Link>
        </div>
      </main>
    );
  }

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <Heart
              size={30}
              strokeWidth={1.5}
            />
          </div>

          <h1 className="mt-6 text-3xl font-semibold">
            Seçilmişlər boşdur
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-black/55">
            Bəyəndiyiniz modelləri ürək işarəsi ilə
            seçilmişlərə əlavə edin.
          </p>

          <Link
            to="/models"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1f1f1d] px-6 py-3 text-sm font-medium text-white"
          >
            <ArrowLeft size={16} />
            Modellərə bax
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <Link
            to="/models"
            className="mb-4 inline-flex items-center gap-2 text-sm text-black/55 transition hover:text-black"
          >
            <ArrowLeft size={16} />
            Modellərə qayıt
          </Link>

          <h1 className="text-4xl font-semibold tracking-tight">
            Seçilmişlər
          </h1>

          <p className="mt-2 text-sm text-black/50">
            {products.length} məhsul
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <Link
                to={`/models/${product.slug}`}
                className="relative block aspect-[4/3] overflow-hidden bg-[#eee]"
              >
                <img
                  src={
                    product.primary_image ??
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'
                  }
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </Link>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    to={`/models/${product.slug}`}
                    className="line-clamp-2 font-medium transition hover:opacity-60"
                  >
                    {product.name}
                  </Link>

                  <button
                    type="button"
                    disabled={
                      removing === product.id
                    }
                    onClick={() =>
                      handleRemove(product.id)
                    }
                    className="shrink-0 text-black/40 transition hover:text-red-600 disabled:opacity-40"
                    aria-label="Seçilmişlərdən sil"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-black/45">
                    {product.category ??
                      '3D Model'}
                  </span>

                  <span className="font-medium">
                    {formatPrice(
                      product.price,
                      product.is_free,
                    )}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}