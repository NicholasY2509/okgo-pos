import * as React from "react";
import { getAllProductsListAction } from "../actions/product-action";
import { toast } from "sonner";

export function useGlobalProductCombobox() {
  const [open, setOpen] = React.useState(false);
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const res = await getAllProductsListAction();
      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.data) {
        setProducts(res.data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return {
    open,
    setOpen,
    products,
    loading
  };
}
