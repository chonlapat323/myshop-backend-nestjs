export type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  product: {
    product_image: {
      url: string;
      is_main: boolean;
    }[];
  };
};

export type Order = {
  id: number;
  userId: number;
  order_number: string;
  total_price: number;
  order_status: string;
  created_at?: string;
  tracking_number?: string | null;
  user_name?: string | null;
  items: OrderItem[];
};
