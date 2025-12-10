'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, CreditCard, Package, CheckCircle } from 'lucide-react';
import OrderSuccess from '@/components/OrderSuccess';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, checkout, isLoading: cartLoading } = useCart();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        // Redirect to homepage if not logged in
        router.push('/');
        return;
      }

      setUser(data.user);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handlePlaceOrder = async () => {
    setIsCheckingOut(true);
    setError(null);

    const result = await checkout();

    if (result.success && result.orderId) {
      setOrderId(result.orderId);
      setCheckoutSuccess(true);
    } else {
      setError(result.error || 'Checkout failed');
    }

    setIsCheckingOut(false);
  };

  if (checkoutSuccess && orderId) {
    return <OrderSuccess />;
  }

  if (isLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

 
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center py-12">
            <CardContent>
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle className="text-2xl mb-2">Your cart is empty</CardTitle>
              <p className="text-muted-foreground mb-6">
                Add items to your cart before checking out
              </p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const shipping = cart.totalPrice >= 50 ? 0 : 5;
  const total = cart.totalPrice + shipping;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/cart">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Review */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items ({cart.totalItems} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.items.map((item) => {
                    const discountedPrice = item.discount_percentage > 0
                      ? item.price * (1 - item.discount_percentage / 100)
                      : item.price;

                    return (
                      <div key={item.product_id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image
                            src={item.thumbnail || '/placeholder.png'}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold line-clamp-1">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold">${discountedPrice.toFixed(2)}</span>
                            {item.discount_percentage > 0 && (
                              <>
                                <span className="text-xs text-muted-foreground line-through">
                                  ${item.price.toFixed(2)}
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                  -{item.discount_percentage}%
                                </Badge>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Qty: {item.quantity}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold">${(discountedPrice * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary & Payment */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">${cart.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-green-600">
                        {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                    {cart.totalPrice < 50 && (
                      <p className="text-xs text-muted-foreground">
                        Add ${(50 - cart.totalPrice).toFixed(2)} more for free shipping
                      </p>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                    <p className="font-semibold mb-1">Secure Checkout</p>
                    <p className="text-xs text-blue-700">
                      Your order information is encrypted and secure
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  {error && (
                    <div className="w-full bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? 'Processing...' : 'Place Order'}
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/cart">Back to Cart</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
