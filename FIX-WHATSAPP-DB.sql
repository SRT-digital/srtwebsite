-- =====================================================
-- FIX: Update WhatsApp number in CMS database
-- Run this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Update contact section's WhatsApp URL to new number
UPDATE public.site_content
SET content = jsonb_set(
  content::jsonb,
  '{whatsappUrl}',
  '"https://wa.me/919092272805"'::jsonb
)
WHERE id = 'contact';

-- Update settings WhatsApp number if exists
UPDATE public.site_content
SET content = jsonb_set(
  content::jsonb,
  '{whatsappNumber}',
  '"919092272805"'::jsonb
)
WHERE id = 'settings';

-- Update phone display in contact section (OLD number for display only)
-- WhatsApp buttons use new number; phone display shows old number for direct calls
UPDATE public.site_content
SET content = jsonb_set(
  content::jsonb,
  '{phone}',
  '"+91 82487 30400"'::jsonb
)
WHERE id = 'contact';

NOTIFY pgrst, 'reload schema';

-- Verify the changes
SELECT id, content FROM public.site_content WHERE id IN ('contact', 'settings');
