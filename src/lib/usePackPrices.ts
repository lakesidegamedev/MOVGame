// Pack prices for copy outside the Store (landing page, guide). Every number
// comes from the Lakeside platform catalog answered in this session; there is
// no bundled or remembered fallback. `ready` is false until the platform has
// answered, and the copy then shows no number at all.

import { useCatalog } from "./useCatalog";
import { countryPriceLabel, priceLabel, COMPLETE_ID, type CatalogState } from "./storeModel";

export interface PackPrices {
  /** The live catalog answered in this session. */
  ready: boolean;
  /** Still asking (false once it answered or gave up). */
  loading: boolean;
  /** "$0.99" for a pack, or null when no live price is known. */
  label: (packId: string) => string | null;
  /** One country pack ("$0.99", or "from $0.99" when they differ), or null. */
  country: string | null;
  /** The Complete Collection, or null. */
  complete: string | null;
  /** Ask the platform again. */
  retry: () => void;
}

export function packPricesFrom(catalog: CatalogState, retry: () => void = () => {}): PackPrices {
  return {
    ready: catalog.status === "ready",
    loading: catalog.status === "loading",
    label: (packId) => priceLabel(packId, catalog),
    country: countryPriceLabel(catalog),
    complete: priceLabel(COMPLETE_ID, catalog),
    retry,
  };
}

export function usePackPrices(): PackPrices {
  const { catalog, reload } = useCatalog();
  return packPricesFrom(catalog, reload);
}
