-- profiles: anon can read approved rows (RLS handles row-level), authenticated can do everything
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- profile_languages / profile_experiences: same pattern
GRANT SELECT ON public.profile_languages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_languages TO authenticated;

GRANT SELECT ON public.profile_experiences TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_experiences TO authenticated;

-- inquiries: anyone can insert (contact form), authenticated can read their own
GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;

-- companies: authenticated can read
GRANT SELECT ON public.companies TO anon, authenticated;
