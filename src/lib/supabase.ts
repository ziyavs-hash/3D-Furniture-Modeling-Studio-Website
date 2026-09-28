import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PortfolioItem = {
  id: string;
  title: string;
  software: string;
  category: string;
  image_url: string;
  before_image_url: string | null;
  after_image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type Order = {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  furniture_category: string | null;
  pinterest_url: string | null;
  description: string | null;
  file_path: string | null;
  status: string;
  created_at: string;
};
