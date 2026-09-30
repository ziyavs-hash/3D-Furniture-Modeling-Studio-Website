import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Loader2,
  ShoppingBag,
  ZoomIn,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import {
  addFavorite,
  addToCart,
  fetchCartItems,
  fetchProductBySlug,
  fetchProducts,
  formatPrice,
  getSecureDownloadUrl,
  hasEntitlement,
  isFavorite,
  removeFavorite,
} from '@/lib/services';

import type {
  Product,
  ProductFile,
  ProductImage,
  ProductCardData,
} from '@/lib/types';

type MessageType = 'success' | 'error' | 'info';

type ActionMessage = {
  type: MessageType;
  text: string;
} | null;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85';

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes <= 0) return 'Unknown size';

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getImageUrl(image: ProductImage) {
  return image.image_url || FALLBACK_IMAGE;
}

function getFileLabel(file: ProductFile) {
  const format = file.file_format?.toUpperCase();

  if (format) {
    return format;
  }

  if (file.file_name) {
    const parts = file.file_name.split('.');

    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
  }

  return 'FILE';
}

function ProductCard({
  product,
}: {
  product: ProductCardData;
}) {
  return (
    <Link
      to={`/models/${product.slug}`}
      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        <img
          src={product.primary_image || FALLBACK_IMAGE}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        {product.is_free && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm">
            FREE
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-neutral-900">
          {product.name}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-500">
            {product.category || '3D Model'}
          </span>

          <span className="font-semibold text-neutral-900">
            {formatPrice(product.price, product.is_free)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [files, setFiles] = useState<ProductFile[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<
    ProductCardData[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [favorite, setFavorite] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [message, setMessage] = useState<ActionMessage>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ============================================================
  // Load product
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);
      setNotFound(false);
      setSelectedImage(0);
      setMessage(null);

      try {
        const result = await fetchProductBySlug(slug);

        if (cancelled) return;

        if (!result.product) {
          setProduct(null);
          setImages([]);
          setFiles([]);
          setRelatedProducts([]);
          setNotFound(true);
          setLoading(false);
          return;
        }

        const loadedProduct = result.product;

        setProduct(loadedProduct);
        setImages(result.images || []);
        setFiles(result.files || []);

        try {
          const related = await fetchProducts({
            category: loadedProduct.category || undefined,
            page: 1,
            pageSize: 8,
          });

          if (!cancelled) {
            const filtered = related.items.filter(
              (item) => item.id !== loadedProduct.id,
            );

            setRelatedProducts(filtered.slice(0, 4));
          }
        } catch (error) {
          console.error('Related products error:', error);

          if (!cancelled) {
            setRelatedProducts([]);
          }
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (error) {
        if (cancelled) return;

        console.error('Product loading error:', error);

        setLoadError(
          'The product could not be loaded. Please try again.',
        );

        setProduct(null);
        setImages([]);
        setFiles([]);
        setRelatedProducts([]);
        setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ============================================================
  // Authentication
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      setAuthLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setUserId(user?.id ?? null);
      } catch (error) {
        console.error('Auth loading error:', error);

        if (mounted) {
          setUserId(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================
  // Load user-specific product state
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function loadUserState() {
      const currentProduct = product;

      if (!currentProduct?.id || !userId) {
        setFavorite(false);
        setInCart(false);
        setPurchased(false);
        return;
      }

      try {
        const [
          favoriteState,
          cartItems,
          entitlementState,
        ] = await Promise.all([
          isFavorite(userId, currentProduct.id),
          fetchCartItems(userId),
          hasEntitlement(userId, currentProduct.id),
        ]);

        if (cancelled) return;

        setFavorite(favoriteState);

        setInCart(
          cartItems.some(
            (item) => item.product_id === currentProduct.id,
          ),
        );

        setPurchased(entitlementState);
      } catch (error) {
        if (cancelled) return;

        console.error('User product state error:', error);
      }
    }

    loadUserState();

    return () => {
      cancelled = true;
    };
  }, [product?.id, userId]);

  // ============================================================
  // Reset user state on logout
  // ============================================================

  useEffect(() => {
    if (!userId) {
      setFavorite(false);
      setInCart(false);
      setPurchased(false);
    }
  }, [userId]);

  // ============================================================
  // Image helpers
  // ============================================================

  const currentImage = images[selectedImage] || null;
  const imageCount = images.length;

  const nextImage = () => {
    if (!imageCount) return;

    setSelectedImage((current) =>
      current >= imageCount - 1 ? 0 : current + 1,
    );
  };

  const previousImage = () => {
    if (!imageCount) return;

    setSelectedImage((current) =>
      current <= 0 ? imageCount - 1 : current - 1,
    );
  };

  // ============================================================
  // Login requirement
  // ============================================================

  const requireLogin = () => {
    setMessage({
      type: 'info',
      text:
        'Please log in to use Favorites, Cart, and Downloads.',
    });
  };

  // ============================================================
  // Favorite
  // ============================================================

  const handleFavorite = async () => {
    const currentProduct = product;

    if (
      !currentProduct ||
      authLoading ||
      favoriteLoading
    ) {
      return;
    }

    if (!userId) {
      requireLogin();
      return;
    }

    const previousValue = favorite;

    setFavorite(!previousValue);
    setFavoriteLoading(true);
    setMessage(null);

    try {
      if (previousValue) {
        await removeFavorite(
          userId,
          currentProduct.id,
        );

        setMessage({
          type: 'success',
          text: 'Removed from Favorites.',
        });
      } else {
        await addFavorite(
          userId,
          currentProduct.id,
        );

        setMessage({
          type: 'success',
          text: 'Added to Favorites.',
        });
      }
    } catch (error) {
      console.error('Favorite error:', error);

      setFavorite(previousValue);

      setMessage({
        type: 'error',
        text:
          'Favorites could not be updated. Please try again.',
      });
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ============================================================
  // Secure download
  // ============================================================

  const handleDownload = async () => {
    const currentProduct = product;

    if (
      !currentProduct ||
      authLoading ||
      downloadLoading
    ) {
      return;
    }

    if (!userId) {
      requireLogin();
      return;
    }

    if (!files.length) {
      setMessage({
        type: 'error',
        text:
          'No downloadable file is available for this model yet.',
      });
      return;
    }

    setDownloadLoading(true);
    setMessage(null);

    try {
      const firstFile = files[0];

      const url = await getSecureDownloadUrl(
        currentProduct.id,
        firstFile.id,
      );

      if (!url) {
        setMessage({
          type: 'error',
          text:
            'The download link could not be generated.',
        });
        return;
      }

      window.location.assign(url);
    } catch (error) {
      console.error('Download error:', error);

      setMessage({
        type: 'error',
        text:
          'Download failed. Please try again.',
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // ============================================================
  // Add to cart
  // ============================================================

  const handleAddToCart = async () => {
    const currentProduct = product;

    if (
      !currentProduct ||
      authLoading ||
      cartLoading
    ) {
      return;
    }

    if (!userId) {
      requireLogin();
      return;
    }

    if (currentProduct.is_free) {
      await handleDownload();
      return;
    }

    if (purchased) {
      await handleDownload();
      return;
    }

    if (inCart) {
      setMessage({
        type: 'info',
        text:
          'This model is already in your cart.',
      });
      return;
    }

    const previousValue = inCart;

    setInCart(true);
    setCartLoading(true);
    setMessage(null);

    try {
      await addToCart(
        userId,
        currentProduct.id,
      );

      setMessage({
        type: 'success',
        text: 'Added to Cart.',
      });
    } catch (error) {
      console.error('Cart error:', error);

      setInCart(previousValue);

      setMessage({
        type: 'error',
        text:
          'The model could not be added to your cart.',
      });
    } finally {
      setCartLoading(false);
    }
  };

  // ============================================================
  // Primary CTA
  // ============================================================

  const primaryAction = useMemo(() => {
    const currentProduct = product;

    if (!currentProduct) {
      return {
        label: 'Loading...',
        type: 'loading' as const,
      };
    }

    if (downloadLoading) {
      return {
        label: 'Preparing download...',
        type: 'download' as const,
      };
    }

    if (purchased) {
      return {
        label: 'Download Purchased',
        type: 'download' as const,
      };
    }

    if (currentProduct.is_free) {
      return {
        label: 'Download Free Model',
        type: 'download' as const,
      };
    }

    if (inCart) {
      return {
        label: 'Already in Cart',
        type: 'cart' as const,
      };
    }

    return {
      label: `Add to Cart · ${formatPrice(
        currentProduct.price,
        currentProduct.is_free,
      )}`,
      type: 'cart' as const,
    };
  }, [
    product,
    purchased,
    inCart,
    downloadLoading,
  ]);

  // ============================================================
  // Loading
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="flex items-center gap-3 text-neutral-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading model...</span>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================
  // Not found
  // ============================================================

  if (notFound) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Model not found
          </h1>

          <p className="mt-3 text-neutral-500">
            The model you are looking for does not
            exist or is no longer available.
          </p>

          <Link
            to="/models"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to 3D Models
          </Link>
        </div>
      </main>
    );
  }

  // ============================================================
  // Load error
  // ============================================================

  if (loadError || !product) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-3xl font-semibold text-neutral-900">
            Something went wrong
          </h1>

          <p className="mt-3 text-neutral-500">
            {loadError ||
              'The product could not be loaded.'}
          </p>

          <Link
            to="/models"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to 3D Models
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Header */}
      <div className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <Link
            to="/models"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to 3D Models
          </Link>
        </div>
      </div>

      {/* Main product */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)] lg:gap-16">
          {/* Gallery */}
          <div>
            <div className="relative overflow-hidden rounded-3xl bg-neutral-100">
              {currentImage ? (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxOpen(true)
                  }
                  className="group relative block aspect-[4/3] w-full cursor-zoom-in"
                  aria-label="Open image viewer"
                >
                  <img
                    src={getImageUrl(
                      currentImage,
                    )}
                    alt={
                      currentImage.alt_text ||
                      product.name
                    }
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
                    onError={(event) => {
                      event.currentTarget.src =
                        FALLBACK_IMAGE;
                    }}
                  />

                  <div className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition group-hover:scale-105">
                    <ZoomIn className="h-5 w-5" />
                  </div>
                </button>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center">
                  <img
                    src={FALLBACK_IMAGE}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {imageCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={previousImage}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition hover:bg-white"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition hover:bg-white"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-5 left-5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                    {selectedImage + 1} / {imageCount}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {imageCount > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() =>
                      setSelectedImage(index)
                    }
                    className={`aspect-[4/3] overflow-hidden rounded-xl border-2 bg-neutral-100 ${
                      selectedImage === index
                        ? 'border-neutral-900'
                        : 'border-transparent'
                    }`}
                    aria-label={`Select image ${
                      index + 1
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={
                        image.alt_text ||
                        `${product.name} preview ${
                          index + 1
                        }`
                      }
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.src =
                          FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product information */}
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              {product.is_free && (
                <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                  FREE
                </span>
              )}

              {product.featured && (
                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
                  Featured
                </span>
              )}

              {product.new_release && (
                <span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
                  New Release
                </span>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
              {product.name}
            </h1>

            <div className="mt-6 flex items-end justify-between gap-6">
              <div>
                <div className="text-3xl font-semibold text-neutral-950">
                  {formatPrice(
                    product.price,
                    product.is_free,
                  )}
                </div>

                {purchased && (
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-green-700">
                    <Check className="h-4 w-4" />
                    You already own this model
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleFavorite}
                disabled={
                  favoriteLoading ||
                  authLoading
                }
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
                  favorite
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 hover:text-neutral-900'
                }`}
                aria-label={
                  favorite
                    ? 'Remove from Favorites'
                    : 'Add to Favorites'
                }
              >
                {favoriteLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Heart
                    className="h-5 w-5"
                    fill={
                      favorite
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                  message.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : message.type === 'error'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Primary action */}
            <div className="mt-8">
              {inCart &&
              !purchased &&
              !product.is_free ? (
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Link
                    to="/cart"
                    className="flex items-center justify-center gap-3 rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    View Cart
                  </Link>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="rounded-2xl border border-neutral-200 px-5 py-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-950"
                  >
                    In Cart
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={
                    primaryAction.type ===
                    'download'
                      ? handleDownload
                      : handleAddToCart
                  }
                  disabled={
                    authLoading ||
                    favoriteLoading ||
                    cartLoading ||
                    downloadLoading ||
                    primaryAction.type ===
                      'loading'
                  }
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cartLoading ||
                  downloadLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : primaryAction.type ===
                    'download' ? (
                    <Download className="h-5 w-5" />
                  ) : (
                    <ShoppingBag className="h-5 w-5" />
                  )}

                  {primaryAction.label}
                </button>
              )}
            </div>

            {/* Trust information */}
            <div className="mt-8 grid gap-3 border-y border-neutral-200 py-6">
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Check className="h-4 w-4 text-neutral-900" />
                Professional 3D model
              </div>

              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Check className="h-4 w-4 text-neutral-900" />
                Digital download
              </div>

              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <Check className="h-4 w-4 text-neutral-900" />
                Secure file delivery
              </div>
            </div>

            {/* Product details */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-950">
                Product Details
              </h2>

              <dl className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200">
                {product.category && (
                  <div className="flex justify-between gap-5 py-4">
                    <dt className="text-sm text-neutral-500">
                      Category
                    </dt>

                    <dd className="text-right text-sm font-medium text-neutral-900">
                      {product.category}
                    </dd>
                  </div>
                )}

                {product.room && (
                  <div className="flex justify-between gap-5 py-4">
                    <dt className="text-sm text-neutral-500">
                      Room
                    </dt>

                    <dd className="text-right text-sm font-medium text-neutral-900">
                      {product.room}
                    </dd>
                  </div>
                )}

                {product.style && (
                  <div className="flex justify-between gap-5 py-4">
                    <dt className="text-sm text-neutral-500">
                      Style
                    </dt>

                    <dd className="text-right text-sm font-medium text-neutral-900">
                      {product.style}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Formats */}
            {product.formats?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-neutral-950">
                  Formats
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {product.formats.map(
                    (format) => (
                      <span
                        key={format}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700"
                      >
                        {format.toUpperCase()}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Software */}
            {product.software?.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-neutral-950">
                  Software
                </h2>

                <div className="mt-4 flex flex-wrap gap-2">
                  {product.software.map(
                    (software) => (
                      <span
                        key={software}
                        className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700"
                      >
                        {software}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Included files */}
            {files.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-neutral-950">
                  Included Files
                </h2>

                <div className="mt-4 space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-neutral-900">
                          {file.file_name ||
                            'Model file'}
                        </div>

                        <div className="mt-1 text-xs text-neutral-500">
                          {formatFileSize(
                            file.file_size,
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-600">
                        {getFileLabel(file)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <section className="mt-20 max-w-4xl border-t border-neutral-200 pt-12">
            <h2 className="text-2xl font-semibold text-neutral-950">
              About this model
            </h2>

            <div className="mt-5 whitespace-pre-line text-base leading-8 text-neutral-600">
              {product.description}
            </div>
          </section>
        )}
      </section>

      {/* Related models */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Explore more
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
                  Related Models
                </h2>
              </div>

              <Link
                to="/models"
                className="hidden text-sm font-medium text-neutral-700 hover:text-neutral-950 sm:block"
              >
                View all models →
              </Link>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map(
                (relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                  />
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={() =>
            setLightboxOpen(false)
          }
        >
          <button
            type="button"
            onClick={() =>
              setLightboxOpen(false)
            }
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900"
            aria-label="Close image viewer"
          >
            ×
          </button>

          <img
            src={getImageUrl(currentImage)}
            alt={
              currentImage.alt_text ||
              product.name
            }
            className="max-h-[90vh] max-w-[95vw] object-contain"
            onClick={(event) =>
              event.stopPropagation()
            }
            onError={(event) => {
              event.currentTarget.src =
                FALLBACK_IMAGE;
            }}
          />

          {imageCount > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  previousImage();
                }}
                className="absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-900"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  nextImage();
                }}
                className="absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-900"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </main>
  );
}