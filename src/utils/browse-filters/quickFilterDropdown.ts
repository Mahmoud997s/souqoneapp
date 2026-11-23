import { GovernorateRef } from '../../types/location.types';
import { PRICE_RANGES, SORT_OPTIONS, YEARS, CAR_TYPES } from '../../constants/browseFilters';
import { BUS_TYPES } from '../../constants/buses';
import { SERVICE_TYPES, PROVIDER_TYPES, COMMON_SPECIALIZATIONS } from '../../constants/services';
import { applyCarsQuickFilter, CarsFilterState } from './carsBrowseFilters';
import { QuickFilterOption } from '../../components/filters/QuickFilterModal';

export type QuickFilterVertical = 'cars' | 'buses' | 'services';

export type QuickFilterDropdownKind =
  | 'make'
  | 'city'
  | 'governorate'
  | 'year'
  | 'price'
  | 'type'
  | 'busType'
  | 'capacity'
  | 'sort'
  | 'serviceType'
  | 'specialization'
  | 'providerType';

export interface QuickFilterBrandItem {
  id?: string | number;
  name?: string;
  nameAr?: string | null;
  label?: string;
}

export type QuickFilterFieldValue = string | number | boolean | undefined | null | string[];

export interface QuickFilterRecord extends CarsFilterState {
  specializations?: string[];
  [key: string]: QuickFilterFieldValue;
}

interface SortOptionItem {
  id: string;
  label: string;
  sortBy?: string;
  sortOrder?: string;
}

export const BUS_CAPACITIES = [
  { id: '10', value: 10, label: '+ 10 مقاعد' },
  { id: '15', value: 15, label: '+ 15 مقعد' },
  { id: '25', value: 25, label: '+ 25 مقعد' },
  { id: '30', value: 30, label: '+ 30 مقعد' },
  { id: '45', value: 45, label: '+ 45 مقعد' },
  { id: '50', value: 50, label: '+ 50 مقعد' },
] as const;

export const BUS_SORT_OPTIONS: readonly SortOptionItem[] = [
  { id: 'newest', label: 'الأحدث أولاً' },
  { id: 'popular', label: 'الأكثر شيوعاً' },
  { id: 'price_asc', label: 'السعر: الأقل للأعلى' },
  { id: 'price_desc', label: 'السعر: الأعلى للأقل' },
];

export const SERVICE_SORT_OPTIONS: readonly SortOptionItem[] = [
  { id: 'newest', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'desc' },
  { id: 'popular', label: 'الأكثر طلباً', sortBy: 'views', sortOrder: 'desc' },
  { id: 'rating', label: 'الأعلى تقييماً', sortBy: 'rating', sortOrder: 'desc' },
];

const SERVICE_SPECIALIZATIONS_LIST: QuickFilterOption[] = Array.from(
  new Set(Object.values(COMMON_SPECIALIZATIONS).flat()),
).map((spec) => ({ id: spec, label: spec }));

export interface QuickFilterDropdownData {
  title: string;
  options: QuickFilterOption[];
  selectedId?: string;
}

export interface BuildQuickFilterDropdownParams<TFilters extends object> {
  activeDropdown: QuickFilterDropdownKind | string | null;
  filters: TFilters;
  vertical: QuickFilterVertical;
  brands?: QuickFilterBrandItem[];
  governorates?: GovernorateRef[];
}

export function getQuickFilterDropdownTitle(
  activeDropdown: QuickFilterDropdownKind | string | null,
): string {
  switch (activeDropdown) {
    case 'make':
      return 'اختر الماركة';
    case 'city':
    case 'governorate':
      return 'اختر المحافظة';
    case 'year':
      return 'سنة الصنع';
    case 'type':
      return 'الهيكل';
    case 'busType':
      return 'فئة الحافلة';
    case 'capacity':
      return 'سعة الحافلة';
    case 'serviceType':
      return 'نوع الخدمة';
    case 'specialization':
      return 'التخصص';
    case 'providerType':
      return 'نوع المزود';
    case 'sort':
      return 'الترتيب';
    case 'price':
      return 'نطاق السعر';
    default:
      return 'تصفية';
  }
}

function getBrandOptionId(item: QuickFilterBrandItem): string {
  return String(item.id ?? item.name ?? item.label ?? '');
}

export function buildQuickFilterDropdownData<TFilters extends object>({
  activeDropdown,
  filters,
  vertical,
  brands = [],
  governorates = [],
}: BuildQuickFilterDropdownParams<TFilters>): QuickFilterDropdownData | null {
  if (!activeDropdown) return null;

  const currentFilters = (filters || {}) as TFilters & QuickFilterRecord;
  const title = getQuickFilterDropdownTitle(activeDropdown);

  switch (activeDropdown) {
    case 'make': {
      const options: QuickFilterOption[] = brands.map((item) => ({
        id: getBrandOptionId(item),
        label: item.nameAr || item.name || item.label || String(item.id ?? ''),
      }));
      const matched = brands.find(
        (item) =>
          (currentFilters.makeId != null &&
            item.id != null &&
            String(currentFilters.makeId) === String(item.id)) ||
          (currentFilters.make != null && item.name != null && currentFilters.make === item.name) ||
          (currentFilters.make != null &&
            item.id != null &&
            currentFilters.make === String(item.id)),
      );
      return {
        title,
        options,
        selectedId: matched ? getBrandOptionId(matched) : undefined,
      };
    }

    case 'city':
    case 'governorate': {
      const options: QuickFilterOption[] = governorates.map((g) => ({
        id: String(g.id),
        label: g.nameAr,
      }));
      const matched = governorates.find(
        (g) => currentFilters.governorateId === g.id || currentFilters.city === g.nameAr,
      );
      return {
        title,
        options,
        selectedId: matched ? String(matched.id) : undefined,
      };
    }

    case 'year': {
      const options: QuickFilterOption[] = YEARS.map((y) => ({
        id: String(y),
        label: String(y),
      }));
      return {
        title,
        options,
        selectedId:
          currentFilters.yearMin != null ? String(currentFilters.yearMin) : undefined,
      };
    }

    case 'price': {
      const options: QuickFilterOption[] = PRICE_RANGES.map((p) => ({
        id: p.id,
        label: p.label,
      }));
      const matched = PRICE_RANGES.find(
        (p) => currentFilters.priceMax === (p.max ? String(p.max) : '9999999'),
      );
      return {
        title,
        options,
        selectedId: matched?.id,
      };
    }

    case 'type': {
      const options: QuickFilterOption[] = CAR_TYPES.map((t) => ({
        id: t.id.toUpperCase(),
        label: t.name,
      }));
      const selectedId =
        typeof currentFilters.bodyType === 'string'
          ? currentFilters.bodyType.toUpperCase()
          : undefined;
      return { title, options, selectedId };
    }

    case 'busType': {
      const options: QuickFilterOption[] = BUS_TYPES.map((t) => ({
        id: t.id,
        label: t.label,
      }));
      return {
        title,
        options,
        selectedId: typeof currentFilters.busType === 'string' ? currentFilters.busType : undefined,
      };
    }

    case 'capacity': {
      const options: QuickFilterOption[] = BUS_CAPACITIES.map((c) => ({
        id: c.id,
        label: c.label,
      }));
      const matched = BUS_CAPACITIES.find(
        (c) =>
          currentFilters.capacity === c.value ||
          currentFilters.minCapacity === c.value ||
          currentFilters.capacityMin === c.value,
      );
      return {
        title,
        options,
        selectedId: matched?.id,
      };
    }

    case 'serviceType': {
      const options: QuickFilterOption[] = SERVICE_TYPES.map((t) => ({
        id: t.id,
        label: t.label,
      }));
      return {
        title,
        options,
        selectedId:
          typeof currentFilters.serviceType === 'string'
            ? currentFilters.serviceType
            : undefined,
      };
    }

    case 'specialization': {
      const currentSpecs = Array.isArray(currentFilters.specializations)
        ? currentFilters.specializations
        : [];
      const matched = SERVICE_SPECIALIZATIONS_LIST.find(
        (s) => currentFilters.specialization === s.id || currentSpecs.includes(s.id),
      );
      return {
        title,
        options: SERVICE_SPECIALIZATIONS_LIST,
        selectedId: matched?.id,
      };
    }

    case 'providerType': {
      const options: QuickFilterOption[] = PROVIDER_TYPES.map((p) => ({
        id: p.id,
        label: p.label,
      }));
      return {
        title,
        options,
        selectedId:
          typeof currentFilters.providerType === 'string'
            ? currentFilters.providerType
            : undefined,
      };
    }

    case 'sort': {
      const source: readonly SortOptionItem[] =
        vertical === 'buses'
          ? BUS_SORT_OPTIONS
          : vertical === 'services'
            ? SERVICE_SORT_OPTIONS
            : SORT_OPTIONS;
      const options: QuickFilterOption[] = source.map((item) => ({
        id: item.id,
        label: item.label,
      }));
      const matched = source.find((item) =>
        vertical === 'buses'
          ? currentFilters.sort === item.id || (!currentFilters.sort && item.id === 'newest')
          : currentFilters.sortBy === item.sortBy && currentFilters.sortOrder === item.sortOrder,
      );
      return {
        title,
        options,
        selectedId: matched?.id,
      };
    }

    default:
      return { title, options: [] };
  }
}

export interface ApplyQuickFilterDropdownParams<TFilters extends object> {
  activeDropdown: QuickFilterDropdownKind | string;
  optionId: string;
  filters: TFilters;
  vertical: QuickFilterVertical;
  brands?: QuickFilterBrandItem[];
  governorates?: GovernorateRef[];
}

export function applyQuickFilterDropdownSelection<TFilters extends object>({
  activeDropdown,
  optionId,
  filters,
  vertical,
  brands = [],
  governorates = [],
}: ApplyQuickFilterDropdownParams<TFilters>): TFilters {
  const currentFilters = (filters || {}) as TFilters & QuickFilterRecord;
  const mergePatch = (patch: Partial<QuickFilterRecord>): TFilters =>
    Object.assign({}, currentFilters, patch) as TFilters;

  switch (activeDropdown) {
    case 'make': {
      const item = brands.find((b) => getBrandOptionId(b) === optionId);
      if (!item) return filters;

      if (vertical === 'cars') {
        const isSameMake = String(item.id) === String(currentFilters.makeId);
        if (isSameMake) {
          return mergePatch({
            makeId: item.id ? String(item.id) : undefined,
            make: item.name || (item.id ? String(item.id) : undefined),
          });
        }
        const brandName = item.name || (item.id ? String(item.id) : undefined);
        return applyCarsQuickFilter(
          currentFilters,
          'make',
          String(item.id),
          brandName,
        ) as TFilters;
      }

      return mergePatch({
        makeId: item.id ? String(item.id) : undefined,
        make: item.name || (item.id ? String(item.id) : undefined),
      });
    }

    case 'city':
    case 'governorate': {
      const gov = governorates.find((g) => String(g.id) === optionId);
      if (!gov) return filters;
      return mergePatch({
        governorateId: gov.id,
        governorate: gov.nameAr,
        city: gov.nameAr,
        wilayaId: undefined,
      });
    }

    case 'year':
      return mergePatch({ yearMin: optionId, yearMax: optionId });

    case 'price': {
      const range = PRICE_RANGES.find((p) => p.id === optionId);
      if (!range) return filters;
      return mergePatch({
        priceMin: String(range.min),
        priceMax: range.max ? String(range.max) : '9999999',
      });
    }

    case 'type':
      return mergePatch({ bodyType: optionId.toUpperCase() });

    case 'busType':
      return mergePatch({ busType: optionId });

    case 'capacity': {
      const cap = BUS_CAPACITIES.find((c) => c.id === optionId);
      if (!cap) return filters;
      return mergePatch({
        capacity: cap.value,
        minCapacity: cap.value,
        capacityMin: cap.value,
      });
    }

    case 'serviceType':
      return mergePatch({ serviceType: optionId });

    case 'specialization':
      return mergePatch({
        specialization: optionId,
        specializations: [optionId],
      });

    case 'providerType':
      return mergePatch({ providerType: optionId });

    case 'sort': {
      if (vertical === 'buses') {
        return mergePatch({ sort: optionId });
      }
      const source: readonly SortOptionItem[] =
        vertical === 'services' ? SERVICE_SORT_OPTIONS : SORT_OPTIONS;
      const item = source.find((s) => s.id === optionId);
      if (!item) return filters;
      return mergePatch({ sortBy: item.sortBy, sortOrder: item.sortOrder });
    }

    default:
      return filters;
  }
}
