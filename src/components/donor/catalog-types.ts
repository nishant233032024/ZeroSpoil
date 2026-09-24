export type CuisineOption = {
  id: string;
  slug: string;
  name: string;
  region: string;
};

export type DishOption = {
  id: string;
  slug: string;
  name: string;
  hindiName: string | null;
  cuisineId: string;
  category: string;
  dietType: string;
  defaultStorage: string;
  typicalSafeWindowHours: number;
  perishability: string;
  description: string;
};
