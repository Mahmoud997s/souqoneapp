import { useEffect, useState } from 'react';
import { locationsApi } from '../api/locations';
import { GovernorateRef, WilayaRef } from '../types/location.types';
import { logWarn } from '../utils/safeLog';

let cachedGovernorates: GovernorateRef[] | null = null;
let pendingGovernorates: Promise<GovernorateRef[]> | null = null;

const cachedWilayas = new Map<number, WilayaRef[]>();
const pendingWilayas = new Map<number, Promise<WilayaRef[]>>();

function fetchGovernoratesCached(): Promise<GovernorateRef[]> {
  if (cachedGovernorates !== null) {
    return Promise.resolve(cachedGovernorates);
  }
  if (pendingGovernorates) {
    return pendingGovernorates;
  }

  pendingGovernorates = locationsApi
    .getGovernorates()
    .then((res) => {
      const list = Array.isArray(res) ? res : [];
      cachedGovernorates = list;
      return list;
    })
    .finally(() => {
      pendingGovernorates = null;
    });

  return pendingGovernorates;
}

function fetchWilayasCached(governorateId: number): Promise<WilayaRef[]> {
  const hit = cachedWilayas.get(governorateId);
  if (hit !== undefined) {
    return Promise.resolve(hit);
  }
  const inFlight = pendingWilayas.get(governorateId);
  if (inFlight) {
    return inFlight;
  }

  const req = locationsApi
    .getWilayas(governorateId)
    .then((res) => {
      const list = Array.isArray(res) ? res : [];
      cachedWilayas.set(governorateId, list);
      return list;
    })
    .finally(() => {
      pendingWilayas.delete(governorateId);
    });

  pendingWilayas.set(governorateId, req);
  return req;
}

export interface UseFilterLocationsResult {
  governorates: GovernorateRef[];
  wilayas: WilayaRef[];
}

/**
 * Shared, cached governorates + wilayas loader for filter sheets and quick filter modals.
 * Calls the existing `locationsApi.getGovernorates()` and `locationsApi.getWilayas(governorateId)`
 * endpoints once per session per governorate with single-flight deduplication.
 */
export function useFilterLocations(
  governorateId?: number,
  enabled: boolean = true,
): UseFilterLocationsResult {
  const [governorates, setGovernorates] = useState<GovernorateRef[]>(
    () => cachedGovernorates ?? [],
  );
  const [wilayas, setWilayas] = useState<WilayaRef[]>(() =>
    governorateId ? cachedWilayas.get(governorateId) ?? [] : [],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    fetchGovernoratesCached()
      .then((list) => {
        if (!cancelled) {
          setGovernorates(list);
        }
      })
      .catch((err) => {
        logWarn('useFilterLocations:Gov', err);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!governorateId) {
      setWilayas([]);
      return;
    }

    const hit = cachedWilayas.get(governorateId);
    if (hit !== undefined) {
      setWilayas(hit);
      return;
    }

    let cancelled = false;
    setWilayas([]);

    fetchWilayasCached(governorateId)
      .then((list) => {
        if (!cancelled) {
          setWilayas(list);
        }
      })
      .catch((err) => {
        logWarn('useFilterLocations:Wilaya', err);
      });

    return () => {
      cancelled = true;
    };
  }, [governorateId]);

  return { governorates, wilayas };
}
