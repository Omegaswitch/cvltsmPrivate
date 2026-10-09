/** Where the set is sold, by region. Add a vendor's name (and link) as each is confirmed. */
export interface Vendor { name: string; href?: string }

export const VENDORS: { region: string; vendors: Vendor[] }[] = [
  { region: 'North America', vendors: [] },
  { region: 'Europe', vendors: [] },
  { region: 'Asia', vendors: [] },
  { region: 'Oceania', vendors: [] },
];
