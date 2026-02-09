import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return new Response(JSON.stringify({ error: "Failed to list buckets", details: bucketsError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Check if journal-images bucket exists
    const journalBucket = buckets?.find(b => b.name === 'journal-images');
    
    let files = null;
    let filesError = null;
    
    if (journalBucket) {
      // List files in the bucket
      const result = await supabase.storage.from('journal-images').list('images', { limit: 100 });
      files = result.data;
      filesError = result.error;
    }

    return new Response(JSON.stringify({
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      journalBucketExists: !!journalBucket,
      journalBucketPublic: journalBucket?.public,
      files: files,
      filesError: filesError,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
