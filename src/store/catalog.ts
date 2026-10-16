import data from './data.json';

export type Product = {
  id: string;
  title: string;
  brand: string;
  price: number;
  image: string;
  tags: string[];
};

// Мок-каталог из data.json. Замени на запрос к своей БД / API магазина.
export const PRODUCTS: Product[] = data as Product[];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string, maxPrice?: number): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return PRODUCTS.filter((p) => {
    const hay = (p.title + ' ' + p.tags.join(' ')).toLowerCase();
    const okQuery = words.length === 0 || words.some((w) => hay.includes(w));
    const okPrice = maxPrice == null || p.price <= maxPrice;
    return okQuery && okPrice;
  });
}
