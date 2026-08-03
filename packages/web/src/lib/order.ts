/** Цены. Одно место на всё приложение. */
export const PRICE_KOPECKS = {
  personal: 290_00,
  compatibility: 390_00,
} as const;

export type ProductType = keyof typeof PRICE_KOPECKS;

/** Полный вход заказа. Для personal поля B отсутствуют. */
export interface OrderInput {
  productType: ProductType;
  birthDateA: string; // 'YYYY-MM-DD'
  nameA: string;
  birthDateB?: string;
  nameB?: string;
}
