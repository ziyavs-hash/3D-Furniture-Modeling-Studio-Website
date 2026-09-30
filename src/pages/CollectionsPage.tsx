import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { fetchCollections } from '@/lib/services';
import type { Collection } from '@/lib/types';

function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchCollections()
      .then((data) => {
        if (mounted) {
          setCollections(data.filter((collection) => collection.published));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
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

            <h1 className="max-w-4xl text-4xl font-light tracking-tight sm:text-5xl lg:text-7xl">
              Collections
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
              Curated collections of professional 3D furniture models and
              digital design assets.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-[1600px]">
            {loading ? (
              <div className="py-20 text-center text-xs uppercase tracking-[0.2em] text-white/40">
                Loading collections...
              </div>
            ) : collections.length === 0 ? (
              <div className="border border-white/10 py-20 text-center">
                <p className="text-sm text-white/50">
                  No collections available yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collection/${collection.slug}`}
                    className="group overflow-hidden border border-white/10 bg-white/[0.02] transition-colors hover:border-[#b89b62]/60"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-[#151516]">
                      {collection.cover_image_url ? (
                        <img
                          src={collection.cover_image_url}
                          alt={collection.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-white/20">
                          Atelier Linea
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-5 p-6">
                      <div>
                        <h2 className="text-xl font-light tracking-wide">
                          {collection.name}
                        </h2>

                        {collection.description && (
                          <p className="mt-3 line-clamp-2 text-xs leading-6 text-white/45">
                            {collection.description}
                          </p>
                        )}
                      </div>

                      <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 transition-colors group-hover:border-[#b89b62] group-hover:text-[#b89b62]">
                        <ArrowRight size={16} strokeWidth={1.5} />
                      </span>
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

export default CollectionsPage;