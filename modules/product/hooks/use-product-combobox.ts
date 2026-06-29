import * as React from "react";
import { getServicesAction } from "../../booking/actions/booking-actions";
import { toast } from "sonner";

export function useProductCombobox(branchId?: string) {
  const [open, setOpen] = React.useState(false);
  const [services, setServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchServices() {
      if (!branchId) return;
      setLoading(true);
      const res = await getServicesAction(branchId);
      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.data) {
        setServices(res.data);
      }
      setLoading(false);
    }
    fetchServices();
  }, [branchId]);

  return {
    open,
    setOpen,
    services,
    loading
  };
}
