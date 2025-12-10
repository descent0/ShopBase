import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductsGrid from "./ProductsGrid";
import CategoryChips from "./CategoryChips";
import MobileFilters from "./FIlterSidebar";


interface SearchParams {
  page?: string;
  categories?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;
  
  // Pagination
  const page = Number(params.page) || 1;
  const itemsPerPage = 30;
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  // Build the query with filters
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  // Category filter
  if (params.categories) {
    const categories = params.categories.split(',').filter(Boolean);
    if (categories.length > 0) {
      query = query.in('category', categories);
    }
  }

  // Price range filter
  if (params.minPrice) {
    query = query.gte('price', Number(params.minPrice));
  }
  if (params.maxPrice) {
    query = query.lte('price', Number(params.maxPrice));
  }

  // Search filter
  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  // Apply pagination and ordering
  query = query.range(from, to).order('id', { ascending: true });

  const { data: products, count, error } = await query;

  if (error) {
    console.error('Error fetching products:', error);
  }

  // Get all unique categories
  const { data: allProducts } = await supabase
    .from('products')
    .select('category');

  const categories = Array.from(
    new Set(allProducts?.map((p) => p.category).filter(Boolean))
  ).sort();

  // Get price range
  const { data: priceData } = await supabase
    .from('products')
    .select('price')
    .order('price', { ascending: true });

  const minPrice = priceData?.[0]?.price || 0;
  const maxPrice = priceData?.[priceData.length - 1]?.price || 10000;

  const totalPages = count ? Math.ceil(count / itemsPerPage) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
      
        {/* Top Horizontal Category Chips */}
        <CategoryChips categories={categories} />

        <div className="flex gap-6">
          {/* Filters - Sheet component for all screen sizes */}
          <MobileFilters 
            categories={categories}
            minPrice={minPrice}
            maxPrice={maxPrice}
          />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ProductsGrid
              products={products || []}
              currentPage={page}
              totalPages={totalPages}
              totalCount={count || 0}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
