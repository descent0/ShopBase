import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ArrowLeft, Package, Truck, Shield } from "lucide-react";
import Link from "next/link";
import AddToCartButton from "./ActionButtons";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !product) {
    notFound();
  }

  const discountedPrice = product.discount_percentage > 0 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  const images = product.images && Array.isArray(product.images) 
    ? product.images 
    : [product.thumbnail];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Back Button */}
        <Link href="/products">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <Image
                src={product.thumbnail || '/placeholder.png'}
                alt={product.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {product.discount_percentage > 0 && (
                <Badge variant="destructive" className="absolute top-4 right-4 text-lg px-3 py-1">
                  -{product.discount_percentage}% OFF
                </Badge>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((image: string, index: number) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-md bg-muted border-2 hover:border-primary cursor-pointer transition">
                    <Image
                      src={image || '/placeholder.png'}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 25vw, 12vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              <Badge variant="outline" className="mb-3 capitalize">
                {product.category}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.title}</h1>
              {product.brand && (
                <p className="text-lg text-muted-foreground">by {product.brand}</p>
              )}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-semibold">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground">({product.rating_count || 0} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">${discountedPrice.toFixed(2)}</span>
                {product.discount_percentage > 0 && (
                  <span className="text-2xl text-muted-foreground line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
              {product.discount_percentage > 0 && (
                <p className="text-green-600 font-medium">
                  You save ${(product.price - discountedPrice).toFixed(2)} ({product.discount_percentage}%)
                </p>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <Badge variant={product.stock < 10 ? "destructive" : "default"} className="text-sm">
                    {product.stock < 10 ? `Only ${product.stock} left` : 'In Stock'}
                  </Badge>
                </div>
              ) : (
                <Badge variant="secondary" className="text-sm">Out of Stock</Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            {/* Add to Cart */}
            
               <AddToCartButton
  productId={product.id}
  stock={product.stock}
/>

            
            

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Free Delivery</p>
                    <p className="text-sm text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Fast Shipping</p>
                    <p className="text-sm text-muted-foreground">2-5 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Warranty</p>
                    <p className="text-sm text-muted-foreground">1 year manufacturer warranty</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            {(product.weight || product.dimensions) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {product.weight && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight</span>
                      <span className="font-medium">{product.weight} kg</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dimensions</span>
                      <span className="font-medium">
                        {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.depth} cm
                      </span>
                    </div>
                  )}
                  {product.warranty_information && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warranty</span>
                      <span className="font-medium">{product.warranty_information}</span>
                    </div>
                  )}
                  {product.shipping_information && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">{product.shipping_information}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
