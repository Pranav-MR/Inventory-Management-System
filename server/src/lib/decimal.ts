import type { Decimal } from '@prisma/client/runtime/library';

export function decimalToNumber(value: Decimal | null | undefined): number | null {
  return value == null ? null : Number(value);
}
