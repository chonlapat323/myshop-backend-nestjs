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

export interface ShippingAddress {
  full_name: string;
  address_line: string;
  city: string;
  zip_code: string;
  country: string;
  phone_number: string | null;
  state: string | null;
}

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
  shipping_address: ShippingAddress;
};
