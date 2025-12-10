
export interface RawCartItem {
  product_id: string;
  quantity: number;
}

export interface CartItem {
  product_id: string;
  quantity: number;

  title: string;
  price: number;
  thumbnail: string;
  stock: number;
  discount_percentage: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}
