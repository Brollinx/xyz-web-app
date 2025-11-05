ALTER TABLE public.favorites
ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN currency_symbol TEXT DEFAULT '$';