import { supabase } from './supabase';
import { CONFIG } from './config';
import type { Product, ProductImage, ProductFile, ProductCardData, Collection } from './types';

// ============================================================
// Product Services
// ============================================================

export async function fetchProducts(params: {
  page?: number;
  pageSize?: number;
  category?: string | null;
  room?: string | null;
  style?: string | null;
  format?: string | null;
  software?: string | null;
  renderer?: string | null;
  priceRange?: string | null;
  search?: string | null;
  sort?: string | null;
  isFree?: boolean | null;
  featured?: boolean | null;
  trending?: boolean | null;
  newRelease?: boolean | null;
  collectionSlug?: string | null;
}): Promise<{ items: ProductCardData[]; total: number }> {
  const {
    page = 1,
    pageSize = CONFIG.marketplace.pageSize,
    category, room, style, format, software, renderer,
    priceRange, search, sort = 'newest',
    isFree, featured, trending, newRelease, collectionSlug,
  } = params;

  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('products')
    .select('id, name, slug, price, is_free, category, room, style, formats, software, featured, trending, new_release, created_at, published', { count: 'exact' })
    .eq('published', true);

  if (category) query = query.eq('category', category);
  if (room) query = query.eq('room', room);
  if (style) query = query.eq('style', style);
  if (format) query = query.contains('formats', [format]);
  if (software) query = query.contains('software', [software]);
  if (renderer) query = query.contains('renderer', [renderer]);
  if (isFree === true) query = query.eq('is_free', true);
  if (featured === true) query = query.eq('featured', true);
  if (trending === true) query = query.eq('trending', true);
  if (newRelease === true) query = query.eq('new_release', true);

  if (priceRange) {
    const range = CONFIG_PRICE_RANGES[priceRange];
    if (range) {
      if (priceRange === 'free') {
        query = query.eq('is_free', true);
      } else {
        query = query.gte('price', range.min).lte('price', range.max);
      }
    }
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%,style.ilike.%${search}%`);
  }

  switch (sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'featured':
      query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'popular':
      query = query.order('view_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return { items: [], total: 0 };

  const products = data as unknown as Partial<Product>[];
  const productIds = products.map((p) => p.id);

  let imageMap: Record<string, string> = {};
  if (productIds.length > 0) {
    const { data: images } = await supabase
      .from('product_images')
      .select('product_id, image_url, sort_order')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true });

    if (images) {
      for (const img of images) {
        if (!imageMap[img.product_id]) {
          imageMap[img.product_id] = img.image_url;
        }
      }
    }
  }

  let collectionProductIds: string[] | null = null;
  if (collectionSlug) {
    const { data: coll } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collectionSlug)
      .eq('published', true)
      .maybeSingle();

    if (coll) {
      const { data: pcData } = await supabase
        .from('product_collections')
        .select('product_id')
        .eq('collection_id', coll.id);
      collectionProductIds = pcData?.map((pc) => pc.product_id) ?? [];
      const filtered = products.filter((p) => p.id && collectionProductIds.includes(p.id));
      return {
        items: filtered.map((p) => mapToCardData(p, imageMap)),
        total: filtered.length,
      };
    }
    return { items: [], total: 0 };
  }

  return {
    items: products.map((p) => mapToCardData(p, imageMap)),
    total: count ?? 0,
  };
}

const CONFIG_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  'free': { min: 0, max: 0 },
  'under-1': { min: 0.01, max: 1 },
  '1-5': { min: 1, max: 5 },
  '5-15': { min: 5, max: 15 },
  '15-plus': { min: 15, max: 999999 },
};

function mapToCardData(p: Partial<Product>, imageMap: Record<string, string>): ProductCardData {
  return {
    id: p.id!,
    name: p.name!,
    slug: p.slug!,
    price: p.price ?? 0,
    is_free: p.is_free ?? false,
    category: p.category ?? null,
    room: p.room ?? null,
    style: p.style ?? null,
    formats: p.formats ?? [],
    software: p.software ?? [],
    featured: p.featured ?? false,
    trending: p.trending ?? false,
    new_release: p.new_release ?? false,
    created_at: p.created_at ?? '',
    primary_image: p.id ? imageMap[p.id] ?? null : null,
  };
}

// ============================================================
// Product Detail
// ============================================================

export async function fetchProductBySlug(slug: string): Promise<{ product: Product | null; images: ProductImage[]; files: ProductFile[] }> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error || !data) return { product: null, images: [], files: [] };

  const product = data as Product;

  const [imgResult, fileResult] = await Promise.all([
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_files')
      .select('id, product_id, file_format, file_name, file_size, is_zip, sort_order, created_at')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true),
  ]);

  return {
    product,
    images: (imgResult.data as ProductImage[]) ?? [],
    files: (fileResult.data as ProductFile[]) ?? [],
  };
}

// ============================================================
// Collection Services
// ============================================================

export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data as Collection[];
}

export async function fetchCollectionBySlug(slug: string): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as Collection;
}

// ============================================================
// Favorites Services
// ============================================================

export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map((f) => f.product_id);
}

export async function isFavorite(userId: string, productId: string): Promise<boolean> {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  return !!data;
}

export async function addFavorite(userId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, product_id: productId });
  if (error && error.code !== '23505') throw error;
}

export async function removeFavorite(userId: string, productId: string): Promise<void> {
  await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
}

// ============================================================
// Cart Services
// ============================================================

export async function fetchCartItems(userId: string): Promise<{ product_id: string; quantity: number }[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data;
}

export async function addToCart(userId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .insert({ user_id: userId, product_id: productId, quantity: 1 });
  if (error && error.code !== '23505') throw error;
}

export async function removeFromCart(userId: string, productId: string): Promise<void> {
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
}

export async function clearCart(userId: string): Promise<void> {
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
}

// ============================================================
// Entitlement Services
// ============================================================

export async function fetchEntitlementIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('entitlements')
    .select('product_id')
    .eq('user_id', userId);
  if (error || !data) return [];
  return data.map((e) => e.product_id);
}

export async function hasEntitlement(userId: string, productId: string): Promise<boolean> {
  const { data } = await supabase
    .from('entitlements')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();
  return !!data;
}

// ============================================================
// Order Services
// ============================================================

export async function createOrder(
  userId: string,
  items: { product_id: string; product_name: string; price: number }[]
): Promise<string | null> {
  const orderNumber = `AL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const total = items.reduce((sum, i) => sum + i.price, 0);

  const { data, error } = await supabase
    .from('marketplace_orders')
    .insert({
      user_id: userId,
      order_number: orderNumber,
      total_amount: total,
      currency: 'USD',
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) return null;

  const orderId = data.id;
  const orderItems = items.map((i) => ({
    order_id: orderId,
    product_id: i.product_id,
    product_name: i.product_name,
    price: i.price,
    currency: 'USD',
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) return null;
  return orderId;
}

export async function fetchUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('marketplace_orders')
    .select(`
      id, order_number, total_amount, currency, status, created_at,
      order_items(id, product_id, product_name, price)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data;
}

// ============================================================
// Download Services
// ============================================================

export async function getSecureDownloadUrl(productId: string, fileId: string): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return null;

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/secure-download`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, fileId }),
    });

    if (!resp.ok) return null;
    const result = await resp.json();
    return result.url ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// Admin Services
// ============================================================

export async function fetchAllProductsAdmin(params: {
  page?: number;
  pageSize?: number;
  search?: string | null;
  status?: 'all' | 'published' | 'draft' | 'featured' | 'free' | null;
}): Promise<{ items: Product[]; total: number }> {
  const { page = 1, pageSize = CONFIG.marketplace.adminPageSize, search, status = 'all' } = params;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,category.ilike.%${search}%`);
  }

  if (status === 'published') query = query.eq('published', true);
  else if (status === 'draft') query = query.eq('published', false);
  else if (status === 'featured') query = query.eq('featured', true);
  else if (status === 'free') query = query.eq('is_free', true);

  query = query.range(offset, offset + pageSize - 1);
  const { data, error, count } = await query;
  if (error) return { items: [], total: 0 };
  return { items: (data as Product[]) ?? [], total: count ?? 0 };
}

export async function adminCreateProduct(input: {
  name: string;
  description?: string;
  price: number;
  is_free: boolean;
  category?: string;
  room?: string;
  style?: string;
  formats?: string[];
  software?: string[];
  renderer?: string[];
  published: boolean;
  featured?: boolean;
  trending?: boolean;
  new_release?: boolean;
}): Promise<Product | null> {
  const { data: slugResult } = await supabase.rpc('generate_unique_slug', {
    base_text: input.name,
    existing_id: null,
  });
  const slug = slugResult as string;

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      slug,
      description: input.description ?? null,
      price: input.is_free ? 0 : input.price,
      is_free: input.is_free,
      category: input.category ?? null,
      room: input.room ?? null,
      style: input.style ?? null,
      formats: input.formats ?? [],
      software: input.software ?? [],
      renderer: input.renderer ?? [],
      published: input.published,
      featured: input.featured ?? false,
      trending: input.trending ?? false,
      new_release: input.new_release ?? false,
    })
    .select('*')
    .single();

  if (error) return null;
  return data as Product;
}

export async function adminUpdateProduct(id: string, input: Partial<Product>): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update(input)
    .eq('id', id);
  return !error;
}

export async function adminDeleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  return !error;
}

export async function adminUploadPreviewImage(productId: string, file: File, sortOrder: number): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(CONFIG.storage.previewBucket)
    .upload(fileName, file);

  if (uploadError) return null;

  const { data: urlData } = supabase.storage
    .from(CONFIG.storage.previewBucket)
    .getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      image_url: urlData.publicUrl,
      alt_text: null,
      sort_order: sortOrder,
    });

  if (dbError) return null;
  return urlData.publicUrl;
}

export async function adminDeleteProductImage(imageId: string, imageUrl: string): Promise<boolean> {
  const url = new URL(imageUrl);
  const pathMatch = url.pathname.match(`/preview-images/(.*)`);
  const filePath = pathMatch ? pathMatch[1] : null;

  if (filePath) {
    await supabase.storage.from(CONFIG.storage.previewBucket).remove([filePath]);
  }
  const { error } = await supabase.from('product_images').delete().eq('id', imageId);
  return !error;
}

export async function adminUploadProductFile(
  productId: string,
  file: File,
  fileFormat: string,
  isZip: boolean,
  sortOrder: number,
): Promise<boolean> {
  const ext = file.name.split('.').pop();
  const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(CONFIG.storage.filesBucket)
    .upload(fileName, file);

  if (uploadError) return false;

  const { error: dbError } = await supabase
    .from('product_files')
    .insert({
      product_id: productId,
      file_format: fileFormat,
      storage_path: fileName,
      file_name: file.name,
      file_size: file.size,
      is_zip: isZip,
      sort_order: sortOrder,
    });

  return !dbError;
}

export async function adminDeleteProductFile(fileId: string, storagePath: string): Promise<boolean> {
  await supabase.storage.from(CONFIG.storage.filesBucket).remove([storagePath]);
  const { error } = await supabase.from('product_files').delete().eq('id', fileId);
  return !error;
}

export async function adminFetchProductImages(productId: string): Promise<ProductImage[]> {
  const { data } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  return (data as ProductImage[]) ?? [];
}

export async function adminFetchProductFiles(productId: string): Promise<ProductFile[]> {
  const { data } = await supabase
    .from('product_files')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  return (data as ProductFile[]) ?? [];
}

export async function adminUpdateImageOrder(images: { id: string; sort_order: number }[]): Promise<void> {
  for (const img of images) {
    await supabase.from('product_images').update({ sort_order: img.sort_order }).eq('id', img.id);
  }
}

export async function adminFetchDashboardStats(): Promise<{
  total: number;
  published: number;
  drafts: number;
  free: number;
  featured: number;
  recentOrders: number;
}> {
  const [totalR, publishedR, draftsR, freeR, featuredR] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('published', false),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_free', true),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('featured', true),
  ]);

  return {
    total: totalR.count ?? 0,
    published: publishedR.count ?? 0,
    drafts: draftsR.count ?? 0,
    free: freeR.count ?? 0,
    featured: featuredR.count ?? 0,
    recentOrders: 0,
  };
}

export function formatPrice(price: number, isFree: boolean): string {
  if (isFree || price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}
