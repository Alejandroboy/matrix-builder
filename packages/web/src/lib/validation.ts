// Валидация входа заказа. Расчётная корректность дат проверяется движком
// (parseBirthDate бросает RangeError) — второй схемы валидации нет,
// тот же принцип «один источник истины», что был в Неустойке.
import { computePersonalMatrix } from '@matrix/engine';
import type { OrderInput, ProductType } from './order';

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validateOrderInput(body: Partial<OrderInput>): {
  ok: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const productType = body.productType as ProductType | undefined;

  if (productType !== 'personal' && productType !== 'compatibility') {
    issues.push({ field: 'productType', message: 'personal или compatibility' });
  }
  checkPerson(issues, 'A', body.birthDateA, body.nameA);
  if (productType === 'compatibility') {
    checkPerson(issues, 'B', body.birthDateB, body.nameB);
  }
  return { ok: issues.length === 0, issues };
}

function checkPerson(
  issues: ValidationIssue[],
  suffix: 'A' | 'B',
  birthDate?: string,
  name?: string,
): void {
  if (!name?.trim() || name.trim().length > 60) {
    issues.push({ field: `name${suffix}`, message: 'Имя: 1–60 символов' });
  }
  if (!birthDate) {
    issues.push({ field: `birthDate${suffix}`, message: 'Дата обязательна' });
    return;
  }
  try {
    computePersonalMatrix(birthDate); // и формат, и календарная корректность
  } catch {
    issues.push({ field: `birthDate${suffix}`, message: 'Некорректная дата' });
  }
}
