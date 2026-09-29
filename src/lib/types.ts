export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  preferred_language: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  is_free: boolean;
  category: string | null;
  room: string | null;
  style: string | null;
  formats: string[];
  software: string[];
  renderer: string[];
  license_type: string;
  compatibility: string | null;
  geometry_info: string | null;
  texture_info: string | null;
  file_info: string | null;
  polygon_count: string | null;
  texture_resolution: string | null;
  dimensions: string | null;
  units: string;
  software_version: string | null;
  renderer_version: string | null;
  material_count: string | null;
  production_ready: boolean;
  published: boolean;
  featured: boolean;
  trending: boolean;
  new_release: boolean;
  view_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
};

export type ProductFile = {
  id: string;
  product_id: string;
  file_format: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  is_zip: boolean;
  sort_order: number;
  created_at: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
};

export type MarketplaceOrder = {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  currency: string;
  status: 'pending' | 'payment_processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  payment_provider: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  currency: string;
  created_at: string;
};

export type Entitlement = {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  source: 'purchase' | 'free_download' | 'admin_grant';
  created_at: string;
};

export type DownloadLog = {
  id: string;
  user_id: string;
  product_id: string;
  product_file_id: string | null;
  file_format: string | null;
  created_at: string;
};

export type ProductWithImages = Product & {
  product_images: ProductImage[];
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  is_free: boolean;
  category: string | null;
  room: string | null;
  style: string | null;
  formats: string[];
  software: string[];
  featured: boolean;
  trending: boolean;
  new_release: boolean;
  created_at: string;
  primary_image: string | null;
};
