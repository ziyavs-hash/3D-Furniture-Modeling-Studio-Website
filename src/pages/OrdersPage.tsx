import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Package,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import {
  fetchUserOrders,
  getSecureDownloadUrl,
} from '@/lib/services';

type OrderItem = {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  download_file_id?: string | null;
  product?: {
    name?: string;
    slug?: string;
    primary_image?: string | null;
  } | null;
};

type Order = {
  id: string;
  order_number?: string;
  status?: string | null;
  total_amount?: number;
  currency?: string;
  created_at: string;
  order_items?: OrderItem[];
};

export default function OrdersPage() {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState<Order[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState('');
  const [downloadLoading, setDownloadLoading] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError('');

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        const result =
          await fetchUserOrders(user.id);

        if (!active) {
          return;
        }

        setOrders(result as Order[]);
      } catch (err) {
        console.error(
          'Failed to load orders:',
          err,
        );

        if (active) {
          setError(
            'Sifarişlər yüklənərkən xəta baş verdi.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleDownload(
    productId: string,
    fileId: string,
    downloadId: string,
  ) {
    setDownloadLoading(downloadId);
    setError('');

    try {
      const url =
        await getSecureDownloadUrl(
          productId,
          fileId,
        );

      if (!url) {
        throw new Error(
          'Download URL yaradılmadı.',
        );
      }

      window.open(
        url,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (err) {
      console.error(
        'Failed to download file:',
        err,
      );

      setError(
        'Fayl endirilə bilmədi. Bir qədər sonra yenidən cəhd edin.',
      );
    } finally {
      setDownloadLoading(null);
    }
  }

  function formatOrderDate(
    value: string,
  ) {
    return new Intl.DateTimeFormat(
      'az-AZ',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    ).format(new Date(value));
  }

  function formatOrderStatus(
    status?: string | null,
  ) {
    switch (status) {
      case 'paid':
        return 'Ödənilib';

      case 'completed':
        return 'Tamamlanıb';

      case 'pending':
        return 'Gözləyir';

      case 'cancelled':
        return 'Ləğv edilib';

      case 'refunded':
        return 'Geri qaytarılıb';

      default:
        return status ?? 'Naməlum';
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 h-8 w-48 animate-pulse rounded bg-black/5" />

          <div className="space-y-5">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error && orders.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-red-600">
            {error}
          </p>

          <Link
            to="/account"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f1f1d] px-5 py-3 text-sm font-medium text-white"
          >
            <ArrowLeft size={16} />
            Hesaba qayıt
          </Link>
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] px-6 py-12 text-[#1f1f1d]">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <Package
              size={30}
              strokeWidth={1.5}
            />
          </div>

          <h1 className="mt-6 text-3xl font-semibold">
            Hələ sifariş yoxdur
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-black/55">
            Satın aldığınız modellər və yükləmələr
            burada görünəcək.
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
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <Link
            to="/account"
            className="mb-4 inline-flex items-center gap-2 text-sm text-black/55 transition hover:text-black"
          >
            <ArrowLeft size={16} />
            Hesaba qayıt
          </Link>

          <h1 className="text-4xl font-semibold tracking-tight">
            Sifarişlərim
          </h1>

          <p className="mt-2 text-sm text-black/50">
            Aldığınız rəqəmsal məhsullar.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-black/40">
                    Sifariş
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    {order.order_number ??
                      order.id}
                  </h2>

                  <p className="mt-1 text-sm text-black/45">
                    {formatOrderDate(
                      order.created_at,
                    )}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-black/40">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatOrderStatus(
                      order.status,
                    )}
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    $
                    {Number(
                      order.total_amount ?? 0,
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {(order.order_items ?? []).map(
                  (item, index) => {
                    const itemKey =
                      item.id ??
                      `${order.id}-${item.product_id}-${index}`;

                    const fileId =
                      item.download_file_id;

                    const productName =
                      item.product_name ??
                      item.product?.name ??
                      'Digital model';

                    const canDownload =
                      Boolean(
                        fileId &&
                          item.product_id,
                      );

                    return (
                      <div
                        key={itemKey}
                        className="flex flex-col gap-4 rounded-xl bg-[#faf9f6] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black/5">
                            {item.product
                              ?.primary_image ? (
                              <img
                                src={
                                  item.product
                                    .primary_image
                                }
                                alt={
                                  productName
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package
                                size={20}
                                className="text-black/35"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {productName}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/45">
                              <span>
                                Miqdar:{' '}
                                {item.quantity ??
                                  1}
                              </span>

                              <span>
                                $
                                {Number(
                                  item.price ??
                                    0,
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {canDownload ? (
                          <button
                            type="button"
                            disabled={
                              downloadLoading ===
                              itemKey
                            }
                            onClick={() =>
                              handleDownload(
                                item.product_id,
                                fileId!,
                                itemKey,
                              )
                            }
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#1f1f1d] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Download
                              size={15}
                            />

                            {downloadLoading ===
                            itemKey
                              ? 'Hazırlanır...'
                              : 'Yüklə'}
                          </button>
                        ) : (
                          <span className="text-xs text-black/40">
                            Fayl hazır deyil
                          </span>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}