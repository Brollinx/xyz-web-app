ALTER TABLE public.favorites
ADD COLUMN store_id UUID REFERENCES public.stores(id);

-- Update existing RLS policies to include store_id if necessary (though not strictly required for user_id-based RLS)
-- No changes needed for existing RLS as they are based on user_id, not store_id.