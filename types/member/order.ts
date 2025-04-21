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
  order_number: string;
  total_price: number;
  status: string;
  created_at?: string;
  items: OrderItem[]; // ✅ เปลี่ยนชื่อให้สอดคล้องกับ frontend
};
