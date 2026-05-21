-- =====================================================
-- FIX: RLS blocking admin panel updates
-- Error: "new row violates row-level security policy for table site_content"
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Disable RLS on all admin-managed tables (admin uses anon key)
ALTER TABLE public.site_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.popups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views DISABLE ROW LEVEL SECURITY;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('site_content','blog_posts','form_submissions','popups','page_views');
