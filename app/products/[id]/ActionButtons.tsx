'use client';

import { Button } from "@/components/ui/button";
import { ShoppingCart, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const { addToCart, cart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  const isInCart = cart.items.some(i => i.product_id === productId);

  const handleAdd = async () => {
    setIsAdding(true);
    await addToCart(productId, 1);
    setIsAdding(false);
  };

  return (
    <div className="flex gap-4 pt-4">
      {isInCart ? (
        <Button onClick={() => router.push('/cart')}>
          <ShoppingBag className="mr-2 h-5 w-5" />
          View Cart
        </Button>
      ) : (
        <Button disabled={stock === 0 || isAdding} onClick={handleAdd}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </Button>
      )}
    </div>
  );
}
