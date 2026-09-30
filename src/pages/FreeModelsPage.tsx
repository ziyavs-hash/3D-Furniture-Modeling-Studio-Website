import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchProducts } from '@/lib/services';
import type { ProductCardData } from '@/lib/types';

function FreeModelsPage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchProducts({
      page: 1,
      pageSize: 100,
      isFree: true,
      sort: 'newest',
    })
      .then((result) => {
        if (mounted) {
          setProducts(result.items);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <Navbar />

      <main>
        <section className="border-b border-white/10 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1600px]">
            <p className="mb-5 text-[10px] uppercase tracking-[0.3em] text-[#b89b62]">
              Atelier Linea
            </p>

            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-4xl font-light tracking-tight sm:text-5xl lg:text-7xl">
                  Free Models
                </h1>

                <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
                  Professional 3D furniture models available to download
                  without a purchase.
                </p>
              </div>

              <Link
                to="/models"
                className="inline-flex w-fit items-center gap-3 border border-white/15 px-5 py-3 text-[10px] uppercase tracking-[0.18em] transition-colors hover:border-[#b89b62] hover:text-[#b89b62]"
              >
                Browse all models
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-[1600px]">
            {loading ? (
              <div className="py-20 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                Loading free models...
              </div>
            ) : products.length === 0 ? (
              <div className="border border-white/10 py-20 text-center">
                <p className="text-sm text-white/45">
                  No free models are available yet.
                </p>

                <Link
                  to="/models"
                  className="mt-6 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#b89b62]"
                >
                  Browse models
                  <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
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

                      <span className="absolute left-3 top-3 bg-[#b89b62] px-2.5 py-1 text-[8px] font-medium uppercase tracking-[0.15em] text-black">
                        Free
                      </span>
                    </div>

                    <div className="pt-4">
                      <h2 className="truncate text-sm font-medium text-white/90">
                        {product.name}
                      </h2>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[9px] uppercase tracking-[0.14em] text-white/35">
                          {product.category || 'Model'}
                        </span>

                        <span className="text-xs text-[#b89b62]">
                          Free
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

export default FreeModelsPage;