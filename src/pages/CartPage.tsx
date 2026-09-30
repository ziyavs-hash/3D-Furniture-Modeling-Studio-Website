import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import {
  clearCart,
  fetchCartItems,
  fetchProducts,
  formatPrice,
  removeFromCart,
  updateCartQuantity,
} from '@/lib/services';
import type { ProductCardData } from '@/lib/types';

type CartRow = {
  product: ProductCardData;
  quantity: number;
};

export default function CartPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadCart() {
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

        const cartItems = await fetchCartItems(user.id);

        if (!active) {
          return;
        }

        if (cartItems.length === 0) {
          setRows([]);
          return;
        }

        const productIds = cartItems.map(
          (item) => item.product_id,
        );

        const result = await fetchProducts({
          page: 1,
          pageSize: Math.max(productIds.length, 50),
        });

        if (!active) {
          return;
        }

        const productMap = new Map<string, ProductCardData>();

        for (const product of result.items) {
          productMap.set(product.id, product);
        }

        const nextRows = cartItems
          .map((item) => {
            const product = productMap.get(item.product_id);

            if (!product) {
              return null;
            }

            return {
              product,
              quantity: item.quantity,
            };
          })
          .filter(
            (item): item is CartRow =>
              item !== null,
          );

        setRows(nextRows);
      } catch (err) {
        console.error('Failed to load cart:', err);

        if (active) {
          setError(
            'Səbət yüklənərkən xəta baş verdi. Bir qədər sonra yenidən cəhd edin.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      active = false;
    };
  }, [navigate]);

  const subtotal = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum +
          (row.product.is_free
            ? 0
            : row.product.price) *
            row.quantity,
        0,
      ),
    [rows],
  );

  async function updateQuantity(
    productId: string,
    nextQuantity: number,
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate('/models');
      return;
    }

    if (nextQuantity <= 0) {
      await handleRemove(productId);
      return;
    }

    const previousRows = rows;

    setUpdating(productId);

    setRows((current) =>
      current.map((row) =>
        row.product.id === productId
          ? {
              ...row,
              quantity: nextQuantity,
            }
          : row,
      ),
    );

    try {
      await updateCartQuantity(
        user.id,
        productId,
        nextQuantity,
      );
    } catch (err) {
      console.error(
        'Failed to update cart quantity:',
        err,
      );

      setRows(previousRows);
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemove(productId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate('/models');
      return;
    }

    const previousRows = rows;

    setRemoving(productId);

    setRows((current) =>
      current.filter(
        (row) => row.product.id !== productId,
      ),
    );

    try {
      await removeFromCart(
        user.id,
        productId,
      );
    } catch (err) {
      console.error(
        'Failed to remove cart item:',
        err,
      );

      setRows(previousRows);
    } finally {
      setRemoving(null);
    }
  }

  async function handleClear() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate('/models');
      return;
    }

    const previousRows = rows;

    setClearing(true);
    setRows([]);

    try {
      await clearCart(user.id);
    } catch (err) {
      console.error(
        'Failed to clear cart:',
        err,
      );

      setRows(previousRows);
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 h-8 w-48 animate-pulse rounded bg-black/5" />

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl bg-white"
                />
              ))}
            </div>

            <div className="h-72 animate-pulse rounded-2xl bg-white" />
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

  if (rows.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <ShoppingBag
              size={30}
              strokeWidth={1.5}
            />
          </div>

          <h1 className="mt-6 text-3xl font-semibold">
            Səbətiniz boşdur
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-black/55">
            Bəyəndiyiniz modelləri səbətə əlavə edin
            və alışınızı burada tamamlayın.
          </p>

          <Link
            to="/models"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#1f1f1d] px-6 py-3 text-sm font-medium text-white transition hover:bg-black"
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
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/models"
              className="mb-4 inline-flex items-center gap-2 text-sm text-black/55 transition hover:text-black"
            >
              <ArrowLeft size={16} />
              Modellərə qayıt
            </Link>

            <h1 className="text-4xl font-semibold tracking-tight">
              Səbət
            </h1>
          </div>

          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/65 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={15} />
            {clearing
              ? 'Təmizlənir...'
              : 'Səbəti təmizlə'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {rows.map((row) => {
              const isUpdating =
                updating === row.product.id;
              const isRemoving =
                removing === row.product.id;

              return (
                <article
                  key={row.product.id}
                  className="flex flex-col gap-5 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <Link
                    to={`/models/${row.product.slug}`}
                    className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-[#eee] sm:w-36"
                  >
                    <img
                      src={
                        row.product.primary_image ??
                        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'
                      }
                      alt={row.product.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/models/${row.product.slug}`}
                      className="line-clamp-2 text-lg font-medium transition hover:opacity-60"
                    >
                      {row.product.name}
                    </Link>

                    <p className="mt-2 text-sm text-black/50">
                      {formatPrice(
                        row.product.price,
                        row.product.is_free,
                      )}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
                    <div className="flex items-center rounded-full border border-black/10 bg-[#faf9f6]">
                      <button
                        type="button"
                        disabled={
                          isUpdating ||
                          isRemoving
                        }
                        onClick={() =>
                          updateQuantity(
                            row.product.id,
                            row.quantity - 1,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Miqdarı azalt"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="min-w-8 text-center text-sm font-medium">
                        {row.quantity}
                      </span>

                      <button
                        type="button"
                        disabled={
                          isUpdating ||
                          isRemoving
                        }
                        onClick={() =>
                          updateQuantity(
                            row.product.id,
                            row.quantity + 1,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Miqdarı artır"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={
                        isRemoving ||
                        isUpdating
                      }
                      onClick={() =>
                        handleRemove(
                          row.product.id,
                        )
                      }
                      className="inline-flex items-center gap-2 text-xs text-black/45 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                      {isRemoving
                        ? 'Silinir...'
                        : 'Sil'}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">
              Sifariş xülasəsi
            </h2>

            <div className="mt-6 space-y-4 border-b border-black/10 pb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">
                  Məhsul sayı
                </span>

                <span>
                  {rows.reduce(
                    (sum, row) =>
                      sum + row.quantity,
                    0,
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-black/50">
                  Ara cəm
                </span>

                <span>
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="font-medium">
                Ümumi
              </span>

              <span className="text-xl font-semibold">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              disabled
              className="mt-6 w-full cursor-not-allowed rounded-full bg-black/10 px-5 py-3.5 text-sm font-medium text-black/40"
            >
              Checkout tezliklə
            </button>

            <p className="mt-3 text-center text-xs leading-5 text-black/40">
              Təhlükəsiz ödəniş sistemi hazırlanır.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}