'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { CartItem, Cart, RawCartItem } from '@/lib/types/cart';

interface CartContextType {
  cart: Cart;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: () => Promise<{ success: boolean; orderId?: string; error?: string }>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'shopping_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    totalItems: 0,
    totalPrice: 0
  });

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // PRICE CALCULATION
  const calculateTotals = (items: CartItem[]): Cart => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = items.reduce((s, i) => {
      const price =
        i.discount_percentage > 0
          ? i.price * (1 - i.discount_percentage / 100)
          : i.price;
      return s + price * i.quantity;
    }, 0);

    return { items, totalItems, totalPrice };
  };

  // RAW → HYDRATED (PRODUCTS TABLE)
  const hydrateRawCart = async (rawItems: RawCartItem[]) => {
    if (!rawItems.length) {
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
      return;
    }

    const ids = rawItems.map(i => i.product_id);

    const { data, error } = await supabase
      .from('products')
      .select('id, title, price, thumbnail, stock, discount_percentage')
      .in('id', ids);

    if (error || !data) return;

    const hydrated: CartItem[] = rawItems.map(raw => {
      const product = data.find(p => p.id === raw.product_id)!;

      return {
        product_id: raw.product_id,
        quantity: raw.quantity,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        stock: product.stock,
        discount_percentage: product.discount_percentage
      };
    });

    setCart(calculateTotals(hydrated));
  };

  // DB → LOCAL SYNC (YOUR BUG FIX)
  const syncDbToLocal = (rawItems: RawCartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(rawItems));
  };

  // LOAD LOCAL CART (GUEST)
  const loadLocalCart = useCallback(async () => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const raw = stored ? (JSON.parse(stored) as RawCartItem[]) : [];
    await hydrateRawCart(raw);
  }, []);

  //  LOAD DB CART (USER)
  const loadDbCart = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('cart')
      .select('product_id, quantity')
      .eq('user_id', userId);

    if (error || !data) return;

    const raw = data as RawCartItem[];

    await hydrateRawCart(raw);

    // THIS IS THE LINE THAT FIXES YOUR ISSUE
    syncDbToLocal(raw);
  }, []);

  // LOCAL → DB SYNC (ON LOGIN)
  const syncLocalToDb = useCallback(async (userId: string) => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return;

    const raw = JSON.parse(stored) as RawCartItem[];

    if (raw.length) {
      await supabase.from('cart').upsert(
        raw.map(item => ({
          user_id: userId,
          product_id: item.product_id,
          quantity: item.quantity
        })),
        { onConflict: 'user_id,product_id' }
      );
    }

    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // INITIAL LOAD
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (data.user) {
        await syncLocalToDb(data.user.id);
        await loadDbCart(data.user.id);
      } else {
        await loadLocalCart();
      }

      setIsLoading(false);
    };

    init();
  }, [loadLocalCart, loadDbCart, syncLocalToDb]);

  // ADD TO CART
  const addToCart = async (productId: string, quantity = 1) => {
    if (user) {
      await supabase.from('cart').upsert(
        { user_id: user.id, product_id: productId, quantity },
        { onConflict: 'user_id,product_id' }
      );

      await loadDbCart(user.id);
    } else {
      const raw: RawCartItem[] =
        JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');

      const existing = raw.find(i => i.product_id === productId);
      if (existing) existing.quantity += quantity;
      else raw.push({ product_id: productId, quantity });

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(raw));
      await loadLocalCart();
    }
  };

  const removeFromCart = async (productId: string) => {
    if (user) {
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      await loadDbCart(user.id);
    } else {
      const raw: RawCartItem[] =
        JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');

      const updated = raw.filter(i => i.product_id !== productId);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
      await loadLocalCart();
    }
  };

  
  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);

    if (user) {
      await supabase
        .from('cart')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      await loadDbCart(user.id);
    } else {
      const raw: RawCartItem[] =
        JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');

      raw.forEach(i => {
        if (i.product_id === productId) i.quantity = quantity;
      });

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(raw));
      await loadLocalCart();
    }
  };

  
  const clearCart = async () => {
    if (user) {
      await supabase.from('cart').delete().eq('user_id', user.id);
      await loadDbCart(user.id);
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
      setCart({ items: [], totalItems: 0, totalPrice: 0 });
    }
  };

  // CHECKOUT
  const checkout = async () => {
    try {
      // Must be logged in to checkout
      if (!user) {
        return { success: false, error: 'Please log in to checkout' };
      }

      // Cart must have items
      if (cart.items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      // Calculate order total (with shipping)
      const shipping = cart.totalPrice >= 50 ? 0 : 5;
      const totalAmount = cart.totalPrice + shipping;

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'pending',
          items: cart.items.map(item => ({
            product_id: item.product_id,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            discount_percentage: item.discount_percentage
          }))
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        return { success: false, error: 'Failed to create order' };
      }

      // Clear cart from Supabase
      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Cart deletion error:', deleteError);
      }

      // Clear localStorage
      localStorage.removeItem(CART_STORAGE_KEY);

      // Clear cart state
      setCart({ items: [], totalItems: 0, totalPrice: 0 });

      return { success: true, orderId: orderData.id };
    } catch (error) {
      console.error('Checkout error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        isLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
