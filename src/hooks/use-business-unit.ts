import { BU_IDS } from '@/lib/store';

export function useBusinessUnit(unit: 'tek' | 'strategies'): string {
  return BU_IDS[unit];
}
