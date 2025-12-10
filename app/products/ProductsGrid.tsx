'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Package, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discount_percentage: number;
  thumbnail: string;
  category: string;
  brand: string;
  stock: number;
  images: string[];
}

interface ProductsGridProps {
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

const ProductsGrid = ({ products, currentPage, totalPages, totalCount }: ProductsGridProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, addToCart } = useCart();
  const [loadingProduct, setLoadingProduct] = useState<number | null>(null);

  const isInCart = (productId: number) => {
    return cart.items.some(item => item.product_id === productId.toString());
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoadingProduct(productId);
    try {
      await addToCart(productId.toString(), 1);
    } finally {
      setLoadingProduct(null);
    }
  };

  const handleOrderNow = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const inCart = isInCart(productId);
    
    if (!inCart) {
      setLoadingProduct(productId);
      try {
        await addToCart(productId.toString(), 1);
      } finally {
        setLoadingProduct(null);
      }
    }
    
    router.push('/checkout');
  };

  const handleViewCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/cart');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div>
      {/* Products Grid */}
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {products.map((product) => {
              const inCart = isInCart(product.id);
              const isLoading = loadingProduct === product.id;
              
              return (
                <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  <Link href={`/products/${product.id}`} className="flex-1 flex flex-col">
                    <div className="relative h-64 overflow-hidden bg-muted">
                      <Image
                        src={product.thumbnail || '/placeholder.png'}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        {product.discount_percentage > 0 && (
                          <Badge variant="destructive" className="shadow-md">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                      </div>
                      {product.stock < 10 && product.stock > 0 && (
                        <Badge variant="secondary" className="absolute top-3 left-3 shadow-md bg-orange-500 text-white hover:bg-orange-600">
                          Only {product.stock} left
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-3 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {product.category}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">{product.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                    </CardHeader>
                  </Link>

                  <CardFooter className="pt-0">
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>
                        {product.brand && (
                          <div className="text-xs text-muted-foreground">{product.brand}</div>
                        )}
                      </div>
                      
                      {inCart ? (
                        <Button 
                          size="sm" 
                          onClick={handleViewCart}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          View Cart
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={(e) => handleAddToCart(e, product.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Adding...' : 'Add to Cart'}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    <Button
                      key={index}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...'}
                      className={page === '...' ? 'cursor-default' : ''}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <div className="sm:hidden">
                  <Button variant="outline" size="sm" disabled>
                    {currentPage} / {totalPages}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Page Info */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {totalCount} total products
          </div>
        </>
      ) : (
        <Card className="text-center py-16">
          <CardContent className="pt-6">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No products found</CardTitle>
            <CardDescription>Try adjusting your filters to see more results</CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductsGrid;