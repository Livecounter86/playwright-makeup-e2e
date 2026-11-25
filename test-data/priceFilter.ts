export const PRICE_PRESET = { label: '250 ₴ - 500 ₴', from: 250, to: 500 };
export const RANDOM_RANGE = { min: 101, max: 4999, width: 10 };
export const RANDOM_PRICE_TO = { min: 30, max: 100 };

export const MAX_PAGES_TO_CHECK = 15; // Cheap ranges can have 30+ pages: checking all of them exceeds the test timeout

export function randomPrice(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
