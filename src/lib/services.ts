import { supabase } from './supabase';
import { CONFIG } from './config';
import type {
  Product,
  ProductImage,
  ProductFile,
  ProductCardData,
  Collection,
} from './types';

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
    category,
    room,
    style,
    format,
    software,
    renderer,
    priceRange,
    search,
    sort = 'newest',
    isFree,
    featured,
    trending,
    newRelease,
    collectionSlug,
  } = params;

  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('products')
    .select(
      'id, name, slug, price, is_free, category, room, style, formats, software, renderer, featured, trending, new_release, created_at, published, view_count',
      { count: 'exact' }
    )
    .eq('published', true);

  // ------------------------------------------------------------
  // Collection filter
  // ------------------------------------------------------------

  if (collectionSlug) {
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collectionSlug)
      .eq('published', true)
      .maybeSingle();

    if (!collection) {
      return {
        items: [],
        total: 0,
      };
    }

    const { data: collectionProducts } = await supabase
      .from('product_collections')
      .select('product_id')
      .eq('collection_id', collection.id);

    const collectionProductIds =
      collectionProducts?.map((item) => item.product_id) ?? [];

    if (collectionProductIds.length === 0) {
      return {
        items: [],
        total: 0,
      };
    }

    query = query.in('id', collectionProductIds);
  }

  // ------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------

  if (category) {
    query = query.eq('category', category);
  }

  if (room) {
    query = query.eq('room', room);
  }

  if (style) {
    query = query.eq('style', style);
  }

  if (format) {
    query = query.contains('formats', [format]);
  }

  if (software) {
    query = query.contains('software', [software]);
  }

  if (renderer) {
    query = query.contains('renderer', [renderer]);
  }

  if (isFree === true) {
    query = query.eq('is_free', true);
  }

  if (featured === true) {
    query = query.eq('featured', true);
  }

  if (trending === true) {
    query = query.eq('trending', true);
  }

  if (newRelease === true) {
    query = query.eq('new_release', true);
  }

  // ------------------------------------------------------------
  // Price
  // ------------------------------------------------------------

  if (priceRange) {
    const range = CONFIG_PRICE_RANGES[priceRange];

    if (range) {
      if (priceRange === 'free') {
        query = query.eq('is_free', true);
      } else if (priceRange === '15-plus') {
        query = query.gte('price', range.min);
      } else {
        query = query
          .gte('price', range.min)
          .lte('price', range.max);
      }
    }
  }

  // ------------------------------------------------------------
  // Search
  // ------------------------------------------------------------

  if (search?.trim()) {
    const safeSearch = sanitizeSearch(search);

    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%,style.ilike.%${safeSearch}%`
      );
    }
  }

  // ------------------------------------------------------------
  // Sorting
  // ------------------------------------------------------------

  switch (sort) {
    case 'price-asc':
      query = query.order('price', {
        ascending: true,
      });
      break;

    case 'price-desc':
      query = query.order('price', {
        ascending: false,
      });
      break;

    case 'featured':
      query = query
        .order('featured', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        });
      break;

    case 'popular':
      query = query
        .order('view_count', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        });
      break;

    case 'newest':
    default:
      query = query.order('created_at', {
        ascending: false,
      });
      break;
  }

  // ------------------------------------------------------------
  // Pagination
  // ------------------------------------------------------------

  query = query.range(
    offset,
    offset + pageSize - 1
  );

  const { data, error, count } = await query;

  if (error || !data) {
    return {
      items: [],
      total: 0,
    };
  }

  const products = data as unknown as Partial<Product>[];

  const productIds = products
    .map((product) => product.id)
    .filter(Boolean) as string[];

  // ------------------------------------------------------------
  // Primary images
  // ------------------------------------------------------------

  const imageMap: Record<string, string> = {};

  if (productIds.length > 0) {
    const { data: images } = await supabase
      .from('product_images')
      .select('product_id, image_url, sort_order')
      .in('product_id', productIds)
      .order('sort_order', {
        ascending: true,
      });

    if (images) {
      for (const image of images) {
        if (!imageMap[image.product_id]) {
          imageMap[image.product_id] = image.image_url;
        }
      }
    }
  }

  return {
    items: products.map((product) =>
      mapToCardData(product, imageMap)
    ),
    total: count ?? 0,
  };
}

// ============================================================
// Price Ranges
// ============================================================

const CONFIG_PRICE_RANGES: Record<
  string,
  { min: number; max: number }
> = {
  free: {
    min: 0,
    max: 0,
  },

  'under-1': {
    min: 0.01,
    max: 1,
  },

  '1-5': {
    min: 1,
    max: 5,
  },

  '5-15': {
    min: 5,
    max: 15,
  },

  '15-plus': {
    min: 15,
    max: 999999,
  },
};

// ============================================================
// Search Helpers
// ============================================================

function sanitizeSearch(value: string): string {
  return value
    .trim()
    .replace(/\\/g, '')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, ' ')
    .replace(/\(/g, ' ')
    .replace(/\)/g, ' ')
    .replace(/\./g, ' ');
}

// ============================================================
// Product Card Mapping
// ============================================================

function mapToCardData(
  product: Partial<Product>,
  imageMap: Record<string, string>
): ProductCardData {
  return {
    id: product.id ?? '',
    name: product.name ?? '',
    slug: product.slug ?? '',
    price: product.price ?? 0,
    is_free: product.is_free ?? false,
    category: product.category ?? null,
    room: product.room ?? null,
    style: product.style ?? null,
    formats: product.formats ?? [],
    software: product.software ?? [],
    featured: product.featured ?? false,
    trending: product.trending ?? false,
    new_release: product.new_release ?? false,
    created_at: product.created_at ?? '',
    primary_image: product.id
      ? imageMap[product.id] ?? null
      : null,
  };
}

// ============================================================
// Product Detail
// ============================================================

export async function fetchProductBySlug(
  slug: string
): Promise<{
  product: Product | null;
  images: ProductImage[];
  files: ProductFile[];
}> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error || !data) {
    return {
      product: null,
      images: [],
      files: [],
    };
  }

  const product = data as Product;

  const [imageResult, fileResult] = await Promise.all([
    supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', {
        ascending: true,
      }),

    supabase
      .from('product_files')
      .select(
        'id, product_id, file_format, file_name, file_size, is_zip, sort_order, created_at'
      )
      .eq('product_id', product.id)
      .order('sort_order', {
        ascending: true,
      }),
  ]);

  return {
    product,
    images:
      (imageResult.data as ProductImage[]) ?? [],
    files:
      (fileResult.data as ProductFile[]) ?? [],
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
    .order('sort_order', {
      ascending: true,
    });

  if (error || !data) {
    return [];
  }

  return data as Collection[];
}

export async function fetchCollectionBySlug(
  slug: string
): Promise<Collection | null> {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Collection;
}

// ============================================================
// Favorites Services
// ============================================================

export async function fetchFavoriteIds(
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data.map((favorite) => favorite.product_id);
}

export async function isFavorite(
  userId: string,
  productId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  return !!data;
}

export async function addFavorite(
  userId: string,
  productId: string
): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: userId,
      product_id: productId,
    });

  if (error && error.code !== '23505') {
    throw error;
  }
}

export async function removeFavorite(
  userId: string,
  productId: string
): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    throw error;
  }
}

// ============================================================
// Cart Services
// ============================================================

export type CartItem = {
  product_id: string;
  quantity: number;
};

export type CartProductItem = {
  product: Product;
  quantity: number;
};

export async function fetchCartItems(
  userId: string
): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity ?? 1,
  }));
}

export async function fetchCartProducts(
  userId: string
): Promise<Product[]> {
  const items = await fetchCartItems(userId);

  if (items.length === 0) {
    return [];
  }

  const productIds = items.map(
    (item) => item.product_id
  );

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('published', true);

  if (error || !data) {
    return [];
  }

  return data as Product[];
}

export async function fetchCartProductItems(
  userId: string
): Promise<CartProductItem[]> {
  const cartItems = await fetchCartItems(userId);

  if (cartItems.length === 0) {
    return [];
  }

  const productIds = cartItems.map(
    (item) => item.product_id
  );

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)
    .eq('published', true);

  if (error || !data) {
    return [];
  }

  const productMap = new Map<string, Product>();

  for (const product of data as Product[]) {
    productMap.set(product.id, product);
  }

  return cartItems
    .map((item) => {
      const product = productMap.get(
        item.product_id
      );

      if (!product) {
        return null;
      }

      return {
        product,
        quantity: item.quantity,
      };
    })
    .filter(
      (
        item
      ): item is CartProductItem =>
        item !== null
    );
}

export async function addToCart(
  userId: string,
  productId: string
): Promise<void> {
  const {
    data: existing,
    error: existingError,
  } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return;
  }

  const { error } = await supabase
    .from('cart_items')
    .insert({
      user_id: userId,
      product_id: productId,
      quantity: 1,
    });

  if (error && error.code !== '23505') {
    throw error;
  }
}

// ============================================================
// Cart Quantity Update
// ============================================================

export async function updateCartQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<void> {
  const safeQuantity = Math.max(
    1,
    Math.floor(quantity)
  );

  const { error } = await supabase
    .from('cart_items')
    .update({
      quantity: safeQuantity,
    })
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    throw error;
  }
}

export async function incrementCartQuantity(
  userId: string,
  productId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const currentQuantity =
    data?.quantity ?? 0;

  if (currentQuantity === 0) {
    await addToCart(
      userId,
      productId
    );
    return;
  }

  await updateCartQuantity(
    userId,
    productId,
    currentQuantity + 1
  );
}

export async function decrementCartQuantity(
  userId: string,
  productId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const currentQuantity =
    data?.quantity ?? 0;

  if (currentQuantity <= 1) {
    await removeFromCart(
      userId,
      productId
    );
    return;
  }

  await updateCartQuantity(
    userId,
    productId,
    currentQuantity - 1
  );
}

export async function removeFromCart(
  userId: string,
  productId: string
): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    throw error;
  }
}

export async function clearCart(
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

// ============================================================
// Entitlement Services
// ============================================================

export async function fetchEntitlementIds(
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('entitlements')
    .select('product_id')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data.map(
    (entitlement) =>
      entitlement.product_id
  );
}

export async function hasEntitlement(
  userId: string,
  productId: string
): Promise<boolean> {
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

export type CreateOrderItem = {
  product_id: string;
  product_name: string;
  price: number;
};

export async function createOrder(
  userId: string,
  items: CreateOrderItem[]
): Promise<string | null> {
  if (!userId || items.length === 0) {
    return null;
  }

  const orderNumber =
    `AL-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

  const total = items.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        Number(item.price) || 0
      ),
    0
  );

  const { data, error } =
    await supabase
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

  if (error || !data) {
    return null;
  }

  const orderItems = items.map(
    (item) => ({
      order_id: data.id,
      product_id: item.product_id,
      product_name:
        item.product_name,
      price: Math.max(
        0,
        Number(item.price) || 0
      ),
      currency: 'USD',
    })
  );

  const { error: itemsError } =
    await supabase
      .from('order_items')
      .insert(orderItems);

  if (itemsError) {
    await supabase
      .from('marketplace_orders')
      .delete()
      .eq('id', data.id);

    return null;
  }

  return data.id;
}

export async function fetchUserOrders(
  userId: string
) {
  const { data, error } =
    await supabase
      .from('marketplace_orders')
      .select(`
        id,
        order_number,
        total_amount,
        currency,
        status,
        created_at,
        order_items(
          id,
          product_id,
          product_name,
          price,
          currency
        )
      `)
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      });

  if (error || !data) {
    return [];
  }

  const productIds = Array.from(
    new Set(
      data.flatMap((order) =>
        (order.order_items ?? []).map(
          (item) => item.product_id
        )
      )
    )
  );

  const fileMap = new Map<
    string,
    string
  >();

  if (productIds.length > 0) {
    const { data: files } =
      await supabase
        .from('product_files')
        .select(
          'id, product_id, sort_order'
        )
        .in(
          'product_id',
          productIds
        )
        .order('sort_order', {
          ascending: true,
        });

    for (const file of files ?? []) {
      if (!fileMap.has(file.product_id)) {
        fileMap.set(
          file.product_id,
          file.id
        );
      }
    }
  }

  return data.map((order) => ({
    ...order,
    order_items:
      (order.order_items ?? []).map(
        (item) => ({
          ...item,
          download_file_id:
            fileMap.get(
              item.product_id
            ) ?? null,
        })
      ),
  }));
}

// ============================================================
// Download Services
// ============================================================

export async function getSecureDownloadUrl(
  productId: string,
  fileId: string
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token =
    session?.access_token;

  if (!token) {
    return null;
  }

  let resolvedFileId = fileId;

  const { data: realFile } =
    await supabase
      .from('product_files')
      .select('id')
      .eq('id', fileId)
      .eq('product_id', productId)
      .maybeSingle();

  if (!realFile) {
    const { data: fallbackFile } =
      await supabase
        .from('product_files')
        .select('id')
        .eq('product_id', productId)
        .order('sort_order', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

    if (!fallbackFile) {
      return null;
    }

    resolvedFileId =
      fallbackFile.id;
  }

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  const url =
    `${supabaseUrl}/functions/v1/secure-download`;

  try {
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          fileId: resolvedFileId,
        }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const result =
      await response.json();

    return result?.url ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// Admin Services
// ============================================================

export async function fetchAllProductsAdmin(
  params: {
    page?: number;
    pageSize?: number;
    search?: string | null;
    status?:
      | 'all'
      | 'published'
      | 'draft'
      | 'featured'
      | 'free'
      | null;
  }
): Promise<{
  items: Product[];
  total: number;
}> {
  const {
    page = 1,
    pageSize =
      CONFIG.marketplace.adminPageSize,
    search,
    status = 'all',
  } = params;

  const offset =
    (page - 1) * pageSize;

  let query = supabase
    .from('products')
    .select('*', {
      count: 'exact',
    })
    .order('created_at', {
      ascending: false,
    });

  if (search?.trim()) {
    const safeSearch =
      sanitizeSearch(search);

    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,slug.ilike.%${safeSearch}%,category.ilike.%${safeSearch}%`
      );
    }
  }

  if (status === 'published') {
    query = query.eq(
      'published',
      true
    );
  } else if (status === 'draft') {
    query = query.eq(
      'published',
      false
    );
  } else if (status === 'featured') {
    query = query.eq(
      'featured',
      true
    );
  } else if (status === 'free') {
    query = query.eq(
      'is_free',
      true
    );
  }

  query = query.range(
    offset,
    offset + pageSize - 1
  );

  const {
    data,
    error,
    count,
  } = await query;

  if (error) {
    return {
      items: [],
      total: 0,
    };
  }

  return {
    items:
      (data as Product[]) ?? [],
    total: count ?? 0,
  };
}

export async function adminCreateProduct(
  input: {
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
  }
): Promise<Product | null> {
  const { data: slugResult } =
    await supabase.rpc(
      'generate_unique_slug',
      {
        base_text: input.name,
        existing_id: null,
      }
    );

  const slug =
    slugResult as string;

  if (!slug) {
    return null;
  }

  const { data, error } =
    await supabase
      .from('products')
      .insert({
        name: input.name,
        slug,
        description:
          input.description ?? null,
        price: input.is_free
          ? 0
          : Math.max(
              0,
              Number(input.price) || 0
            ),
        is_free:
          input.is_free,
        category:
          input.category ?? null,
        room:
          input.room ?? null,
        style:
          input.style ?? null,
        formats:
          input.formats ?? [],
        software:
          input.software ?? [],
        renderer:
          input.renderer ?? [],
        published:
          input.published,
        featured:
          input.featured ?? false,
        trending:
          input.trending ?? false,
        new_release:
          input.new_release ?? false,
      })
      .select('*')
      .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

export async function adminUpdateProduct(
  id: string,
  input: Partial<Product>
): Promise<boolean> {
  const { error } =
    await supabase
      .from('products')
      .update(input)
      .eq('id', id);

  return !error;
}

export async function adminDeleteProduct(
  id: string
): Promise<boolean> {
  const { error } =
    await supabase
      .from('products')
      .delete()
      .eq('id', id);

  return !error;
}

export async function adminUploadPreviewImage(
  productId: string,
  file: File,
  sortOrder: number
): Promise<string | null> {
  const ext =
    file.name.split('.').pop();

  const fileName =
    `${productId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from(
      CONFIG.storage.previewBucket
    )
    .upload(fileName, file);

  if (uploadError) {
    return null;
  }

  const {
    data: urlData,
  } = supabase.storage
    .from(
      CONFIG.storage.previewBucket
    )
    .getPublicUrl(fileName);

  const { error: dbError } =
    await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        image_url:
          urlData.publicUrl,
        alt_text: null,
        sort_order: sortOrder,
      });

  if (dbError) {
    await supabase.storage
      .from(
        CONFIG.storage.previewBucket
      )
      .remove([fileName]);

    return null;
  }

  return urlData.publicUrl;
}

export async function adminDeleteProductImage(
  imageId: string,
  imageUrl: string
): Promise<boolean> {
  let filePath: string | null =
    null;

  try {
    const url = new URL(imageUrl);

    const marker =
      `/storage/v1/object/public/${CONFIG.storage.previewBucket}/`;

    const index =
      url.pathname.indexOf(marker);

    if (index !== -1) {
      filePath =
        url.pathname.slice(
          index + marker.length
        );
    }
  } catch {
    filePath = null;
  }

  if (filePath) {
    await supabase.storage
      .from(
        CONFIG.storage.previewBucket
      )
      .remove([filePath]);
  }

  const { error } =
    await supabase
      .from('product_images')
      .delete()
      .eq('id', imageId);

  return !error;
}

export async function adminUploadProductFile(
  productId: string,
  file: File,
  fileFormat: string,
  isZip: boolean,
  sortOrder: number
): Promise<boolean> {
  const ext =
    file.name.split('.').pop();

  const fileName =
    `${productId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

  const {
    error: uploadError,
  } = await supabase.storage
    .from(
      CONFIG.storage.filesBucket
    )
    .upload(fileName, file);

  if (uploadError) {
    return false;
  }

  const { error: dbError } =
    await supabase
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

  if (dbError) {
    await supabase.storage
      .from(
        CONFIG.storage.filesBucket
      )
      .remove([fileName]);

    return false;
  }

  return true;
}

export async function adminDeleteProductFile(
  fileId: string,
  storagePath: string
): Promise<boolean> {
  await supabase.storage
    .from(
      CONFIG.storage.filesBucket
    )
    .remove([storagePath]);

  const { error } =
    await supabase
      .from('product_files')
      .delete()
      .eq('id', fileId);

  return !error;
}

export async function adminFetchProductImages(
  productId: string
): Promise<ProductImage[]> {
  const { data } =
    await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', {
        ascending: true,
      });

  return (
    (data as ProductImage[]) ??
    []
  );
}

export async function adminFetchProductFiles(
  productId: string
): Promise<ProductFile[]> {
  const { data } =
    await supabase
      .from('product_files')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', {
        ascending: true,
      });

  return (
    (data as ProductFile[]) ??
    []
  );
}

export async function adminUpdateImageOrder(
  images: {
    id: string;
    sort_order: number;
  }[]
): Promise<void> {
  for (const image of images) {
    const { error } =
      await supabase
        .from('product_images')
        .update({
          sort_order:
            image.sort_order,
        })
        .eq('id', image.id);

    if (error) {
      throw error;
    }
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
  const [
    totalR,
    publishedR,
    draftsR,
    freeR,
    featuredR,
    recentOrdersR,
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('products')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('published', true),

    supabase
      .from('products')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('published', false),

    supabase
      .from('products')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('is_free', true),

    supabase
      .from('products')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('featured', true),

    supabase
      .from('marketplace_orders')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .gte(
        'created_at',
        new Date(
          Date.now() -
            30 * 24 * 60 * 60 * 1000
        ).toISOString()
      ),
  ]);

  return {
    total:
      totalR.count ?? 0,

    published:
      publishedR.count ?? 0,

    drafts:
      draftsR.count ?? 0,

    free:
      freeR.count ?? 0,

    featured:
      featuredR.count ?? 0,

    recentOrders:
      recentOrdersR.count ?? 0,
  };
}

// ============================================================
// Formatting
// ============================================================

export function formatPrice(
  price: number,
  isFree: boolean
): string {
  if (
    isFree ||
    price === 0
  ) {
    return 'Free';
  }

  return `$${price.toFixed(2)}`;
}