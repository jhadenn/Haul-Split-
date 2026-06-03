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
    description: "First 500g ¥140 · then ¥38/500g",
    initialFee: 140, // first 500g only
    initialCoveredGrams: 500,
    ratePer500g: 38,
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
