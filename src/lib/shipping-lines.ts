export type ShippingLine = {
  id: string;
  name: string;
  description: string;
  initialFee: number; // CNY for the initial weight bracket
  initialCoveredGrams: number; // grams included in the initial fee
  ratePer500g: number; // CNY per 500g after the initial bracket
  operationFee: number; // CNY, flat per person
};

export const SHIPPING_LINES: ShippingLine[] = [
  {
    id: "ems-xn",
    name: "EMS-Preferential Line-XN",
    description: "First 1kg ¥140/500g · then ¥48/500g",
    initialFee: 280, // 140 per 500g for the first kilo = 280
    initialCoveredGrams: 1000,
    ratePer500g: 48,
    operationFee: 8,
  },
  {
    id: "ems-hz",
    name: "EMS Preferential Line-HZ",
    description: "First 500g ¥142 · then ¥48/500g",
    initialFee: 142,
    initialCoveredGrams: 500,
    ratePer500g: 48,
    operationFee: 8,
  },
];
