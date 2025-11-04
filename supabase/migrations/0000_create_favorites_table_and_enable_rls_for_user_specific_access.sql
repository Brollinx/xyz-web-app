-- Create the favorites table
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id), -- No ON DELETE CASCADE to protect auth.users
  product_id UUID NOT NULL REFERENCES public.products(id), -- No ON DELETE CASCADE to protect public.products
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the favorites table (REQUIRED for security)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to select their own favorites
CREATE POLICY "Authenticated users can view their own favorites" ON public.favorites
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own favorites
CREATE POLICY "Authenticated users can insert their own favorites" ON public.favorites
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own favorites
CREATE POLICY "Authenticated users can delete their own favorites" ON public.favorites
FOR DELETE TO authenticated USING (auth.uid() = user_id);