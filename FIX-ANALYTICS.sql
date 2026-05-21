-- =====================================================
-- FIX: Analytics not tracking page views
-- Adds missing columns to page_views table
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. Add all columns the tracker writes
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS page TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS device TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS screen_width INTEGER;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS screen_height INTEGER;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS scroll_depth INTEGER DEFAULT 0;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS time_on_page INTEGER DEFAULT 0;

-- 2. Disable RLS so anon users can insert page views
ALTER TABLE public.page_views DISABLE ROW LEVEL SECURITY;

-- 3. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- 4. Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'page_views'
ORDER BY ordinal_position;
