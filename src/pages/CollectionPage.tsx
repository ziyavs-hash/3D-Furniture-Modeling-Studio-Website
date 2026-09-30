import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  fetchCollectionBySlug,
  fetchProducts,
  formatPrice,
} from '@/lib/services';
import type { Collection, ProductCardData } from '@/lib/types';

function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);

      const currentCollection = await fetchCollectionBySlug(slug);

      if (!mounted) return;

      if (!currentCollection || !currentCollection.published) {
        setCollection(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      setCollection(currentCollection);

      const result = await fetchProducts({
        collectionSlug: slug,
        page: 1,
        pageSize: 100,
        sort: 'newest',
      });

      if (mounted) {
        setProducts(result.items);
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white">
        <Navbar />

        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="text-xs uppercase tracking-[0.2em] text-white/40">
            Loading...
          </span>
        </div>

        <Footer />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-white">
        <Navbar />

        <main className="mx-auto flex min-h-[65vh] max-w-[1600px] flex-col items-center justify-center px-5 text-center sm:px-8 lg:px-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#b89b62]">
            Collection
          </p>

          <h1 className="mt-5 text-4xl font-light tracking-tight">
            Collection not found
          </h1>

          <Link
            to="/collections"
            className="mt-8 inline-flex items-center gap-2 border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.18em] transition-colors hover:border-[#b89b62] hover:text-[#b89b62]"
          >
            <ArrowLeft size={14} />
            Back to collections
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <Navbar />

      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-[1600px] lg:grid-cols-2">
            <div className="flex flex-col justify-center px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
              <Link
                to="/collections"
                className="mb-10 inline-flex w-fit items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-[#b89b62]"
              >
                <ArrowLeft size={14} />
                All collections
              </Link>

              <p className="text-[10px] uppercase tracking-[0.3em] text-[#b89b62]">
                Curated Collection
              </p>

              <h1 className="mt-5 text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl">
                {collection.name}
              </h1>

              {collection.description && (
                <p className="mt-6 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
                  {collection.description}
                </p>
              )}

              <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-white/30">
                {products.length}{' '}
                {products.length === 1 ? 'model' : 'models'}
              </p>
            </div>

            <div className="aspect-[16/10] bg-[#151516] lg:aspect-auto">
              {collection.cover_image_url ? (
                <img
                  src={collection.cover_image_url}
                  alt={collection.name}
                  className="h-full min-h-[320px] w-full object-cover lg:min-h-[520px]"
                />
              ) : (
                <div className="flex h-full min-h-[320px] items-center justify-center text-xs uppercase tracking-[0.2em] text-white/20 lg:min-h-[520px]">
                  Atelier Linea
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-[1600px]">
            {products.length === 0 ? (
              <div className="border border-white/10 py-20 text-center">
                <p className="text-sm text-white/40">
                  No models are available in this collection yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/models/${product.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#151516]">
                      {product.primary_image ? (
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.2em] text-white/20">
                          No preview
                        </div>
                      )}

                      {product.is_free && (
                        <span className="absolute left-3 top-3 bg-[#b89b62] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] text-black">
                          Free
                        </span>
                      )}
                    </div>

                    <div className="pt-4">
                      <h2 className="truncate text-sm font-medium text-white/90">
                        {product.name}
                      </h2>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[9px] uppercase tracking-[0.14em] text-white/35">
                          {product.category || 'Model'}
                        </span>

                        <span className="text-xs text-white/70">
                          {product.is_free
                            ? 'Free'
                            : formatPrice(product.price, false)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CollectionPage;