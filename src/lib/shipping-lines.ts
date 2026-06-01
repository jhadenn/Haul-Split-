export type ShippingLine = {
  id: string;
  name: string;
  description: string;
  initialFee: number; // CNY
  ratePer500g: number; // CNY per 500g
};

export const SHIPPING_LINES: ShippingLine[] = [
  { id: "sea-standard", name: "Sea Standard", description: "30–45 days · cheapest", initialFee: 80, ratePer500g: 8 },
  { id: "sea-sensitive", name: "Sea Sensitive", description: "35–50 days · branded items", initialFee: 120, ratePer500g: 12 },
  { id: "air-econ", name: "Air Economy", description: "12–18 days · balanced", initialFee: 150, ratePer500g: 22 },
  { id: "air-express", name: "Air Express", description: "5–9 days · fastest", initialFee: 200, ratePer500g: 35 },
];
