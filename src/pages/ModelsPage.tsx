import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Heart,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import { fetchProducts } from '@/lib/services';
import type { ProductCardData } from '@/lib/types';

const PAGE_SIZE = 24;

const CATEGORIES = [
  'Seating',
  'Tables',
  'Storage',
  'Lighting',
  'Beds',
  'Outdoor',
];

const ROOMS = [
  'Living Room',
  'Dining Room',
  'Bedroom',
  'Office',
  'Kitchen',
  'Outdoor',
];

const STYLES = [
  'Modern',
  'Contemporary',
  'Minimal',
  'Classic',
  'Industrial',
  'Scandinavian',
];

const FORMATS = [
  'MAX',
  'FBX',
  'OBJ',
  '3DS',
  'SKP',
  'RVT',
  'DWG',
  'BLEND',
];

const SOFTWARE = [
  '3ds Max',
  'Revit',
  'AutoCAD',
  'SketchUp',
  'Blender',
];

const RENDERERS = [
  'Corona',
  'V-Ray',
  'Lumion',
  'Cycles',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'featured', label: 'Featured' },
  { value: 'popular', label: 'Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

function ModelsPage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [room, setRoom] = useState('');
  const [style, setStyle] = useState('');
  const [format, setFormat] = useState('');
  const [software, setSoftware] = useState('');
  const [renderer, setRenderer] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [sort, setSort] = useState('newest');

  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError('');

      const result = await fetchProducts({
        page,
        pageSize: PAGE_SIZE,
        search: search || null,
        category: category || null,
        room: room || null,
        style: style || null,
        format: format || null,
        software: software || null,
        renderer: renderer || null,
        isFree: isFree ? true : null,
        sort,
      });

      if (cancelled) return;

      setProducts(result.items);
      setTotal(result.total);
      setLoading(false);
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    search,
    category,
    room,
    style,
    format,
    software,
    renderer,
    isFree,
    sort,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    category,
    room,
    style,
    format,
    software,
    renderer,
    isFree,
    sort,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const toggleFavorite = (productId: string) => {
    setFavoriteIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setRoom('');
    setStyle('');
    setFormat('');
    setSoftware('');
    setRenderer('');
    setIsFree(false);
    setSort('newest');
    setPage(1);
  };

  const hasFilters =
    search ||
    category ||
    room ||
    style ||
    format ||
    software ||
    renderer ||
    isFree;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0b]/95 backdrop-blur-xl">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-10 h-20 flex items-center justify-between">
          <Link
            to="/"
            className="text-lg sm:text-xl tracking-[0.22em] font-light"
          >
            ATELIER LINEA
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-sm text-white/55 hover:text-white transition"
            >
              Home
            </Link>

            <Link
              to="/models"
              className="text-sm text-white"
            >
              3D Models
            </Link>

            <Link
              to="/studio"
              className="text-sm text-white/55 hover:text-white transition"
            >
              Studio
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-white/10">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-24">
          <div className="max-w-4xl">
            <div className="text-xs uppercase tracking-[0.35em] text-white/35 mb-6">
              Atelier Linea Marketplace
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-light tracking-tight leading-[0.95]">
              3D Models
            </h1>

            <p className="mt-7 max-w-2xl text-base lg:text-lg leading-8 text-white/50">
              Premium 3D furniture models and digital design
              assets created for architects, interior designers,
              visualization artists and creative professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="border-b border-white/10">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-10 py-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search 3D models..."
                className="w-full h-14 bg-white/[0.03] border border-white/10 pl-12 pr-4 outline-none text-sm placeholder:text-white/25 focus:border-white/30 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden h-14 px-5 border border-white/10 flex items-center justify-center gap-2 text-sm"
            >
              <SlidersHorizontal size={17} />
              Filters
            </button>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className="h-14 lg:w-56 bg-white/[0.03] border border-white/10 px-4 text-sm text-white outline-none"
            >
              {SORT_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#111113]"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-10 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-10">
          {/* Desktop filters */}
          <aside className="hidden lg:block">
            <FilterPanel
              category={category}
              setCategory={setCategory}
              room={room}
              setRoom={setRoom}
              style={style}
              setStyle={setStyle}
              format={format}
              setFormat={setFormat}
              software={software}
              setSoftware={setSoftware}
              renderer={renderer}
              setRenderer={setRenderer}
              isFree={isFree}
              setIsFree={setIsFree}
              clearFilters={clearFilters}
              hasFilters={!!hasFilters}
            />
          </aside>

          {/* Products */}
          <section>
            <div className="flex items-center justify-between mb-7">
              <div className="text-sm text-white/40">
                {loading
                  ? 'Loading models...'
                  : `${total} models`}
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-white/45 hover:text-white transition"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-white/[0.04]" />
                      <div className="h-4 bg-white/[0.04] mt-4 w-2/3" />
                      <div className="h-3 bg-white/[0.04] mt-3 w-1/3" />
                    </div>
                  )
                )}
              </div>
            )}

            {!loading && error && (
              <div className="border border-red-500/20 bg-red-500/5 p-8 text-center">
                <p className="text-red-300/80 text-sm">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="border border-white/10 p-14 text-center">
                <h2 className="text-2xl font-light">
                  No models found
                </h2>

                <p className="text-white/40 mt-3 text-sm">
                  Try changing your search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-7 px-6 py-3 border border-white/15 hover:border-white/40 transition text-sm"
                >
                  Reset filters
                </button>
              </div>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-12">
                  {products.map((product) => {
                    const isFavorite =
                      favoriteIds.includes(product.id);

                    return (
                      <article
                        key={product.id}
                        className="group"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#111113] border border-white/10">
                          {product.primary_image ? (
                            <img
                              src={product.primary_image}
                              alt={product.name}
                              className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                              No preview
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              toggleFavorite(product.id)
                            }
                            aria-label={
                              isFavorite
                                ? 'Remove from favorites'
                                : 'Add to favorites'
                            }
                            className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center border backdrop-blur-md transition ${
                              isFavorite
                                ? 'bg-white text-black border-white'
                                : 'bg-black/40 border-white/15 text-white hover:border-white/50'
                            }`}
                          >
                            <Heart
                              size={17}
                              fill={
                                isFavorite
                                  ? 'currentColor'
                                  : 'none'
                              }
                            />
                          </button>

                          {product.is_free && (
                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-white text-black text-[10px] uppercase tracking-[0.18em]">
                              Free
                            </div>
                          )}

                          {product.new_release && (
                            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/70 backdrop-blur text-white text-[10px] uppercase tracking-[0.18em] border border-white/10">
                              New
                            </div>
                          )}
                        </div>

                        <div className="pt-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-lg font-light group-hover:text-white/75 transition">
                                {product.name}
                              </h2>

                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-white/35">
                                {product.category && (
                                  <span>
                                    {product.category}
                                  </span>
                                )}

                                {product.style && (
                                  <span>
                                    {product.style}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-sm whitespace-nowrap">
                              {product.is_free ||
                              product.price === 0
                                ? 'Free'
                                : `$${product.price.toFixed(
                                    2
                                  )}`}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-5">
                            <div className="flex gap-1.5 flex-wrap">
                              {product.formats
                                .slice(0, 3)
                                .map((item) => (
                                  <span
                                    key={item}
                                    className="text-[10px] px-2 py-1 border border-white/10 text-white/35"
                                  >
                                    {item}
                                  </span>
                                ))}

                              {product.formats.length > 3 && (
                                <span className="text-[10px] px-2 py-1 text-white/25">
                                  +{product.formats.length - 3}
                                </span>
                              )}
                            </div>

                            <Link
                              to={`/models/${product.slug}`}
                              className="text-xs uppercase tracking-[0.16em] border-b border-white/25 pb-1 hover:border-white hover:text-white transition"
                            >
                              View Model
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-16">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(1, current - 1)
                        )
                      }
                      className="w-11 h-11 border border-white/10 flex items-center justify-center disabled:opacity-25 hover:border-white/40 transition"
                    >
                      <ChevronLeft size={17} />
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({
                        length: Math.min(totalPages, 7),
                      }).map((_, index) => {
                        const pageNumber = index + 1;

                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() =>
                              setPage(pageNumber)
                            }
                            className={`w-11 h-11 text-xs border transition ${
                              page === pageNumber
                                ? 'bg-white text-black border-white'
                                : 'border-white/10 text-white/50 hover:border-white/40'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={page === totalPages}
                      onClick={() =>
                        setPage((current) =>
                          Math.min(
                            totalPages,
                            current + 1
                          )
                        )
                      }
                      className="w-11 h-11 border border-white/10 flex items-center justify-center disabled:opacity-25 hover:border-white/40 transition"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* Mobile filters */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() =>
              setMobileFiltersOpen(false)
            }
          />

          <div className="absolute right-0 top-0 h-full w-[88%] max-w-md bg-[#0d0d0f] border-l border-white/10 overflow-y-auto">
            <div className="sticky top-0 bg-[#0d0d0f] border-b border-white/10 px-5 h-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter size={17} />
                <span className="text-sm">
                  Filters
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(false)
                }
                className="w-10 h-10 flex items-center justify-center border border-white/10"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5">
              <FilterPanel
                category={category}
                setCategory={setCategory}
                room={room}
                setRoom={setRoom}
                style={style}
                setStyle={setStyle}
                format={format}
                setFormat={setFormat}
                software={software}
                setSoftware={setSoftware}
                renderer={renderer}
                setRenderer={setRenderer}
                isFree={isFree}
                setIsFree={setIsFree}
                clearFilters={clearFilters}
                hasFilters={!!hasFilters}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  category,
  setCategory,
  room,
  setRoom,
  style,
  setStyle,
  format,
  setFormat,
  software,
  setSoftware,
  renderer,
  setRenderer,
  isFree,
  setIsFree,
  clearFilters,
  hasFilters,
}: {
  category: string;
  setCategory: (value: string) => void;
  room: string;
  setRoom: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  format: string;
  setFormat: (value: string) => void;
  software: string;
  setSoftware: (value: string) => void;
  renderer: string;
  setRenderer: (value: string) => void;
  isFree: boolean;
  setIsFree: (value: boolean) => void;
  clearFilters: () => void;
  hasFilters: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          Filters
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-white/35 hover:text-white transition"
          >
            Reset
          </button>
        )}
      </div>

      <FilterGroup
        title="Category"
        value={category}
        options={CATEGORIES}
        onChange={setCategory}
      />

      <FilterGroup
        title="Room"
        value={room}
        options={ROOMS}
        onChange={setRoom}
      />

      <FilterGroup
        title="Style"
        value={style}
        options={STYLES}
        onChange={setStyle}
      />

      <FilterGroup
        title="Format"
        value={format}
        options={FORMATS}
        onChange={setFormat}
      />

      <FilterGroup
        title="Software"
        value={software}
        options={SOFTWARE}
        onChange={setSoftware}
      />

      <FilterGroup
        title="Renderer"
        value={renderer}
        options={RENDERERS}
        onChange={setRenderer}
      />

      <div className="pt-6 mt-6 border-t border-white/10">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-white/65">
            Free models only
          </span>

          <button
            type="button"
            onClick={() => setIsFree(!isFree)}
            className={`w-11 h-6 rounded-full transition relative ${
              isFree
                ? 'bg-white'
                : 'bg-white/10'
            }`}
            aria-label="Toggle free models"
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full transition ${
                isFree
                  ? 'left-6 bg-black'
                  : 'left-1 bg-white/50'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="pb-6 mb-6 border-b border-white/10">
      <label className="block text-xs uppercase tracking-[0.15em] text-white/35 mb-3">
        {title}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full h-11 bg-white/[0.03] border border-white/10 px-3 text-sm text-white outline-none focus:border-white/30"
      >
        <option value="" className="bg-[#111113]">
          All {title}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-[#111113]"
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelsPage;