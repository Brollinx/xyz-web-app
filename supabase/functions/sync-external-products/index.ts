import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock external API data for demonstration
// In a real scenario, this would be a call to your actual external POS API
const mockExternalProducts = (storeId: string) => [
  {
    external_id: `ext-prod-001-${storeId}`,
    name: `External Product A for Store ${storeId.substring(0, 4)}`,
    description: "A fantastic product from an external POS.",
    category: "Electronics",
    price: 29.99,
    stock_quantity: Math.floor(Math.random() * 100) + 1, // Random stock
    image_url: "https://picsum.photos/id/237/200/300",
    barcode: `BARCODE001-${storeId.substring(0, 4)}`,
  },
  {
    external_id: `ext-prod-002-${storeId}`,
    name: `External Product B for Store ${storeId.substring(0, 0)}`,
    description: "Another great item from the external system.",
    category: "Home Goods",
    price: 15.50,
    stock_quantity: Math.floor(Math.random() * 50) + 1,
    image_url: "https://picsum.photos/id/238/200/300",
    barcode: `BARCODE002-${storeId.substring(0, 4)}`,
  },
  {
    external_id: `ext-prod-003-${storeId}`,
    name: `External Product C for Store ${storeId.substring(0, 4)}`,
    description: "A new product to be added.",
    category: "Books",
    price: 9.99,
    stock_quantity: Math.floor(Math.random() * 200) + 1,
    image_url: "https://picsum.photos/id/239/200/300",
    barcode: `BARCODE003-${storeId.substring(0, 4)}`,
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    // This allows bypassing RLS for server-side operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    console.log("Starting product synchronization...");

    // Fetch all active stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, store_name')
      .eq('is_active', true);

    if (storesError) {
      console.error("Error fetching stores:", storesError);
      return new Response(JSON.stringify({ error: storesError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!stores || stores.length === 0) {
      console.log("No active stores found to sync products for.");
      return new Response(JSON.stringify({ message: "No active stores found." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let totalUpserted = 0;
    for (const store of stores) {
      console.log(`Syncing products for store: ${store.store_name} (${store.id})`);

      // Simulate fetching products from an external API for this store
      const externalProducts = mockExternalProducts(store.id);
      console.log(`Fetched ${externalProducts.length} products from external API for store ${store.id}`);

      for (const extProduct of externalProducts) {
        const { data: existingProducts, error: fetchError } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('source', 'external_pos') // Assuming 'external_pos' as the source identifier
          .eq('source_product_id', extProduct.external_id);

        if (fetchError) {
          console.error(`Error checking for existing product ${extProduct.external_id}:`, fetchError);
          continue;
        }

        const productData = {
          store_id: store.id,
          name: extProduct.name,
          description: extProduct.description,
          category: extProduct.category,
          price: extProduct.price,
          stock_quantity: extProduct.stock_quantity,
          image_url: extProduct.image_url,
          barcode: extProduct.barcode,
          is_active: true, // Assume external products are active by default
          source: 'external_pos',
          source_product_id: extProduct.external_id,
          source_updated_at: new Date().toISOString(), // Track when it was last synced
        };

        if (existingProducts && existingProducts.length > 0) {
          // Product exists, update it
          const { error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('id', existingProducts[0].id);

          if (updateError) {
            console.error(`Error updating product ${extProduct.name} (ID: ${existingProducts[0].id}):`, updateError);
          } else {
            console.log(`Updated product: ${extProduct.name} (ID: ${existingProducts[0].id})`);
            totalUpserted++;
          }
        } else {
          // Product is new, insert it
          const { error: insertError } = await supabase
            .from('products')
            .insert(productData);

          if (insertError) {
            console.error(`Error inserting new product ${extProduct.name}:`, insertError);
          } else {
            console.log(`Inserted new product: ${extProduct.name}`);
            totalUpserted++;
          }
        }
      }
    }

    console.log(`Product synchronization completed. Total upserted: ${totalUpserted}`);
    return new Response(JSON.stringify({ message: `Product synchronization successful. Total upserted: ${totalUpserted}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Unhandled error during product synchronization:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});