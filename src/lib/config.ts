export const CONFIG = {
  brand: 'Atelier Linea',
  slogan: 'Designed for the way you create.',
  domain: 'atelierlinea.com',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://atelierlinea.com',
  currency: 'USD',
  currencySymbol: '$',
  contact: {
    phone: '050-581-00-35',
    phoneRaw: '994505810035',
    email: 'ziyavs@code.edu.az',
    instagram: 'https://instagram.com/Atelierlinea_',
    linkedin: 'Ziya Sadıqov',
  },
  storage: {
    previewBucket: 'preview-images',
    filesBucket: 'product-files',
    orderFilesBucket: 'order-files',
  },
  marketplace: {
    pageSize: 24,
    adminPageSize: 20,
  },
};

export const WHATSAPP_NUMBER = CONFIG.contact.phoneRaw;
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;
export const INSTAGRAM_LINK = CONFIG.contact.instagram;
export const EMAIL = CONFIG.contact.email;
export const BRAND_NAME = CONFIG.brand;

export const WHATSAPP_DEFAULT_MESSAGE = encodeURIComponent(
  'Salam! Atelier Linea 3D model xidməti ilə bağlı müraciət edirəm.'
);

export const CATEGORIES = [
  'chairs',
  'armchairs',
  'sofas',
  'tables',
  'beds',
  'desks',
  'cabinets',
  'wardrobes',
  'shelves',
  'tv-units',
  'side-tables',
  'coffee-tables',
  'dining-tables',
] as const;

export const ROOMS = [
  'living-room',
  'bedroom',
  'kitchen',
  'dining-room',
  'office',
  'bathroom',
  'outdoor',
] as const;

export const STYLES = [
  'modern',
  'minimal',
  'contemporary',
  'classic',
  'luxury',
  'scandinavian',
  'industrial',
  'japandi',
  'mid-century',
  'traditional',
] as const;

export const FORMATS = [
  'MAX', 'FBX', 'OBJ', '3DS', 'SKP', 'RVT', 'DWG', 'BLEND', 'GLB', 'USDZ',
] as const;

export const SOFTWARE = [
  '3ds Max', 'Revit', 'AutoCAD', 'SketchUp', 'Blender', 'Cinema 4D', 'Rhino',
] as const;

export const RENDERERS = [
  'Corona', 'V-Ray', 'Lumion', 'Enscape', 'Twinmotion', 'Other',
] as const;

export const PRICE_RANGES = [
  { key: 'free', label: 'Free', min: 0, max: 0 },
  { key: 'under-1', label: 'Under $1', min: 0.01, max: 1 },
  { key: '1-5', label: '$1 – $5', min: 1, max: 5 },
  { key: '5-15', label: '$5 – $15', min: 5, max: 15 },
  { key: '15-plus', label: '$15+', min: 15, max: 999999 },
] as const;

export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'popular', label: 'Popular' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'featured', label: 'Featured' },
] as const;
