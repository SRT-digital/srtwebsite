-- =====================================================
-- FIX: Add missing columns to blog_posts table
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS excerpt TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS read_time TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS featured_image TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Refresh schema cache (optional but recommended)
NOTIFY pgrst, 'reload schema';
