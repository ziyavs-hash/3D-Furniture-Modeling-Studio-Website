import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  ChevronRight,
  Download,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { fetchProducts, formatPrice } from '@/lib/services';
import type { ProductCardData } from '@/lib/types';

const CATEGORY_DATA = [
  {
    name: 'Seating',
    description: 'Chairs, sofas, benches and lounge pieces',
    icon: Box,
  },
  {
    name: 'Tables',
    description: 'Dining, coffee, side and console tables',
    icon: Layers3,
  },
  {
    name: 'Storage',
    description: 'Cabinets, shelving and modular systems',
    icon: Box,
  },
  {
    name: 'Lighting',
    description: 'Pendant, floor, table and architectural lighting',
    icon: Sparkles,
  },
  {
    name: 'Beds',
    description: 'Beds, headboards and bedroom furniture',
    icon: Layers3,
  },
  {
    name: 'Outdoor',
    description: 'Outdoor furniture and architectural pieces',
    icon: Box,
  },
];

const QUICK_CATEGORIES = [
  'Seating',
  'Tables',
  'Lighting',
  'Storage',
  'Beds',
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1400&q=85',
];

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2200&q=90';

function getFallbackImage(index: number) {
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function ProductImage({
  product,
  index,
  className = '',
}: {
  product: ProductCardData;
  index: number;
  className?: string;
}) {
  const [src, setSrc] = useState(
    product.primary_image || getFallbackImage(index),
  );

  useEffect(() => {
    setSrc(product.primary_image || getFallbackImage(index));
  }, [product.primary_image, index]);

  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      onError={() => {
        const fallback = getFallbackImage(index);

        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
      className={className}
    />
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  to = '/models',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-white/45">
          {eyebrow}
        </p>

        <h2 className="text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Link
          to={to}
          className="group inline-flex w-fit items-center gap-2 text-sm text-white/70 transition hover:text-white"
        >
          {action}

          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      )}
    </div>
  );
}

function ProductCard({
  product,
  index,
  featured = false,
}: {
  product: ProductCardData;
  index: number;
  featured?: boolean;
}) {
  return (
    <Link
      to={`/models/${product.slug}`}
      className="group block overflow-hidden border border-white/10 bg-white/[0.025] transition hover:border-white/25"
    >
      <div
        className={`relative overflow-hidden bg-[#151517] ${
          featured ? 'aspect-[4/5]' : 'aspect-[4/3]'
        }`}
      >
        <ProductImage
          product={product}
          index={index}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />

        {product.is_free && (
          <div className="absolute left-4 top-4 border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md">
            Free
          </div>
        )}

        {product.new_release && (
          <div className="absolute right-4 top-4 border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md">
            New
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-medium text-white">
              {product.name}
            </p>

            <p className="mt-1 truncate text-xs text-white/50">
              {[product.category, product.style]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          <span className="shrink-0 text-sm text-white/85">
            {formatPrice(product.price, product.is_free)}
          </span>
        </div>
      </div>

      <div className="flex min-h-[56px] items-center justify-between px-4 py-4">
        <div className="flex flex-wrap gap-1.5">
          {product.formats.slice(0, 3).map((format) => (
            <span
              key={format}
              className="border border-white/10 px-2 py-1 text-[10px] text-white/40"
            >
              {format}
            </span>
          ))}

          {product.formats.length > 3 && (
            <span className="px-1 py-1 text-[10px] text-white/25">
              +{product.formats.length - 3}
            </span>
          )}
        </div>

        <ChevronRight
          size={16}
          className="shrink-0 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-white"
        />
      </div>
    </Link>
  );
}

function HomePage() {
  const navigate = useNavigate();

  const [featuredModels, setFeaturedModels] = useState<
    ProductCardData[]
  >([]);

  const [freeModels, setFreeModels] = useState<
    ProductCardData[]
  >([]);

  const [heroImage, setHeroImage] = useState(HERO_FALLBACK);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHomeProducts() {
      setLoading(true);

      try {
        const [featuredResult, freeResult] = await Promise.all([
          fetchProducts({
            page: 1,
            pageSize: 8,
            sort: 'featured',
          }),
          fetchProducts({
            page: 1,
            pageSize: 6,
            isFree: true,
            sort: 'newest',
          }),
        ]);

        if (cancelled) return;

        setFeaturedModels(featuredResult.items);
        setFreeModels(freeResult.items);

        const firstImage = featuredResult.items.find(
          (item) => item.primary_image,
        )?.primary_image;

        if (firstImage) {
          setHeroImage(firstImage);
        }
      } catch {
        if (!cancelled) {
          setFeaturedModels([]);
          setFreeModels([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHomeProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = () => {
    const value = search.trim();

    if (!value) {
      navigate('/models');
      return;
    }

    navigate(`/models?search=${encodeURIComponent(value)}`);
  };

  const handleCategory = (category: string) => {
    navigate(`/models?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-[#09090a] text-white">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09090a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-6 sm:px-10 lg:px-16">
          <Link
            to="/"
            className="text-base font-light tracking-[0.22em] sm:text-lg"
          >
            ATELIER LINEA
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/"
              className="text-sm text-white transition"
            >
              Home
            </Link>

            <Link
              to="/models"
              className="text-sm text-white/55 transition hover:text-white"
            >
              3D Models
            </Link>

            <Link
              to="/studio"
              className="text-sm text-white/55 transition hover:text-white"
            >
              Studio
            </Link>
          </nav>

          <Link
            to="/models"
            className="hidden border border-white/15 px-4 py-2.5 text-xs uppercase tracking-[0.16em] transition hover:border-white/40 sm:block"
          >
            Browse Library
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[760px] overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(9,9,10,0.95) 0%, rgba(9,9,10,0.70) 42%, rgba(9,9,10,0.18) 100%), url("${heroImage}")`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#09090a] via-transparent to-black/20" />

        <div className="relative mx-auto flex min-h-[760px] max-w-[1500px] items-end px-6 pb-20 pt-32 sm:px-10 lg:px-16">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-white/15 bg-black/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/65 backdrop-blur-md">
              <Sparkles size={14} />
              Digital Furniture Library
            </div>

            <h1 className="max-w-4xl text-5xl font-medium leading-[0.95] tracking-[-0.055em] text-white sm:text-6xl lg:text-8xl">
              Furniture models
              <br />
              for serious visual work.
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              A curated digital library of production-ready
              3D furniture models for architects, interior
              designers and visualization artists.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/models"
                className="group inline-flex items-center justify-center gap-3 bg-white px-6 py-3.5 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Explore 3D Models

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/models?free=true"
                className="inline-flex items-center justify-center gap-3 border border-white/20 bg-black/20 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/10"
              >
                Explore Free Models
                <Download size={17} />
              </Link>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-2 gap-6 border-t border-white/15 pt-6 sm:grid-cols-4">
              <div>
                <p className="text-2xl font-medium">250+</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/40">
                  Models
                </p>
              </div>

              <div>
                <p className="text-2xl font-medium">8</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/40">
                  Languages
                </p>
              </div>

              <div>
                <p className="text-2xl font-medium">10+</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/40">
                  Formats
                </p>
              </div>

              <div>
                <p className="text-2xl font-medium">24/7</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/40">
                  Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="border-b border-white/10 bg-[#0d0d0f]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-6 py-7 sm:px-10 lg:flex-row lg:items-center lg:px-16">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            className="flex flex-1 items-center gap-3 border border-white/10 bg-white/[0.03] px-4 py-3.5"
          >
            <Search size={18} className="text-white/35" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search furniture models, styles, formats..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />

            <button
              type="submit"
              className="hidden border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.14em] transition hover:border-white/40 sm:block"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2 overflow-x-auto">
            {QUICK_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleCategory(item)}
                className="whitespace-nowrap border border-white/10 px-4 py-3 text-xs text-white/55 transition hover:border-white/30 hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
        <SectionHeader
          eyebrow="Selected models"
          title="Featured furniture"
          description="A selection of highly detailed digital furniture assets designed for professional visualization workflows."
          action="View all models"
          to="/models"
        />

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[4/5] bg-white/[0.04]" />
                <div className="mt-4 h-4 w-2/3 bg-white/[0.04]" />
                <div className="mt-3 h-3 w-1/3 bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : featuredModels.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredModels.slice(0, 4).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                featured
              />
            ))}
          </div>
        ) : (
          <div className="border border-white/10 p-12 text-center">
            <p className="text-sm text-white/40">
              Featured models will appear here when products are
              added to the library.
            </p>

            <Link
              to="/models"
              className="mt-6 inline-flex items-center gap-2 border border-white/15 px-5 py-3 text-sm transition hover:border-white/40"
            >
              Browse models
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* CATEGORIES */}
      <section className="border-y border-white/10 bg-[#0d0d0f]">
        <div className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
          <SectionHeader
            eyebrow="Browse library"
            title="Shop by category"
            description="Explore the library by furniture type and find the assets that fit your next project."
            action="Browse all models"
            to="/models"
          />

          <div className="grid border-l border-t border-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_DATA.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() =>
                    handleCategory(category.name)
                  }
                  className="group min-h-[190px] border-b border-r border-white/10 p-7 text-left transition hover:bg-white/[0.035]"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center border border-white/10 text-white/50">
                      <Icon size={18} />
                    </span>

                    <ArrowRight
                      size={18}
                      className="text-white/25 transition-all group-hover:translate-x-1 group-hover:text-white"
                    />
                  </div>

                  <h3 className="mt-8 text-xl font-medium">
                    {category.name}
                  </h3>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/40">
                    {category.description}
                  </p>

                  <p className="mt-5 text-xs uppercase tracking-[0.14em] text-white/30">
                    Browse category
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
        <SectionHeader
          eyebrow="Curated collections"
          title="Designed as a visual library."
          description="Collections bring together furniture with a common visual language, material direction or architectural context."
          action="Explore models"
          to="/models"
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <Link
            to="/models?style=Minimal"
            className="group relative min-h-[500px] overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85"
              alt="Quiet Forms"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-7">
              <p className="text-2xl font-medium">
                Quiet Forms
              </p>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                A curated selection of restrained furniture with
                clean geometry and architectural presence.
              </p>

              <span className="mt-6 inline-flex items-center gap-2 text-sm text-white">
                Explore collection
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>

          <Link
            to="/models?style=Contemporary"
            className="group relative min-h-[500px] overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85"
              alt="Soft Geometry"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-7">
              <p className="text-2xl font-medium">
                Soft Geometry
              </p>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                Organic silhouettes, softened edges and tactile
                forms for contemporary interiors.
              </p>

              <span className="mt-6 inline-flex items-center gap-2 text-sm text-white">
                Explore collection
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>

          <Link
            to="/models?style=Modern"
            className="group relative min-h-[500px] overflow-hidden"
          >
            <img
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85"
              alt="Architectural Living"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-7">
              <p className="text-2xl font-medium">
                Architectural Living
              </p>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/55">
                Furniture selected for sophisticated residential
                and hospitality visualizations.
              </p>

              <span className="mt-6 inline-flex items-center gap-2 text-sm text-white">
                Explore collection
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* FREE MODELS */}
      <section className="border-y border-white/10 bg-[#0d0d0f]">
        <div className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
          <SectionHeader
            eyebrow="Free library"
            title="Start with free models."
            description="Download selected assets and experience the Atelier Linea workflow before building your full library."
            action="View all free models"
            to="/models?free=true"
          />

          {freeModels.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {freeModels.slice(0, 3).map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="border border-white/10 p-12 text-center">
              <p className="text-sm text-white/40">
                Free models will appear here when they are
                added to the library.
              </p>

              <Link
                to="/models?free=true"
                className="mt-6 inline-flex items-center gap-2 border border-white/15 px-5 py-3 text-sm transition hover:border-white/40"
              >
                Browse free models
                <Download size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* PROFESSIONAL WORKFLOW */}
      <section className="mx-auto max-w-[1500px] px-6 py-24 sm:px-10 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.28em] text-white/40">
              Built for professionals
            </p>

            <h2 className="max-w-3xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              More than a model library.
              <br />
              A production workflow.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">
              Every model is structured around real
              visualization workflows: clean geometry, organized
              files, practical formats and clear technical
              information.
            </p>

            <Link
              to="/studio"
              className="mt-8 inline-flex items-center gap-2 border border-white/15 px-5 py-3 text-sm transition hover:border-white/35 hover:bg-white/[0.04]"
            >
              Learn about the studio
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            <div className="bg-[#0d0d0f] p-7">
              <Box className="text-white/60" size={22} />

              <h3 className="mt-8 text-lg font-medium">
                Production ready
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Organized assets prepared for professional
                visualization pipelines.
              </p>
            </div>

            <div className="bg-[#0d0d0f] p-7">
              <Layers3 className="text-white/60" size={22} />

              <h3 className="mt-8 text-lg font-medium">
                Multiple formats
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Flexible delivery across major 3D and CAD
                workflows.
              </p>
            </div>

            <div className="bg-[#0d0d0f] p-7">
              <ShieldCheck className="text-white/60" size={22} />

              <h3 className="mt-8 text-lg font-medium">
                Secure delivery
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/40">
                Protected digital assets and controlled download
                access.
              </p>
            </div>

            <div className="bg-[#0d0d0f] p-7">
              <Sparkles className="text-white/60" size={22} />

              <h3 className="mt-8 text-lg font-medium">
                Curated quality
              </h3>

              <p className="mt-3 text-sm leading-6 text-white/40">
                A focused library rather than an unfiltered model
                warehouse.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-[1500px] px-6 py-28 text-center sm:px-10 lg:px-16">
          <p className="text-xs uppercase tracking-[0.28em] text-white/35">
            Atelier Linea
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-medium tracking-[-0.04em] sm:text-5xl lg:text-7xl">
            Build better visualizations
            <br />
            with better assets.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
            Explore the library and find production-ready
            furniture models for your next project.
          </p>

          <Link
            to="/models"
            className="mt-9 inline-flex items-center gap-3 bg-white px-7 py-4 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Explore 3D Models
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#070708]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-6 py-8 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-16">
          <p className="text-xs tracking-[0.16em] text-white/35">
            © 2026 Atelier Linea. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link
              to="/models"
              className="text-xs text-white/40 transition hover:text-white"
            >
              3D Models
            </Link>

            <Link
              to="/studio"
              className="text-xs text-white/40 transition hover:text-white"
            >
              Studio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;