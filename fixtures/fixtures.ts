import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { CategoryPage, PriceRange } from '../pages/CategoryPage';
import { RANDOM_RANGE, RANDOM_PRICE_TO, randomPrice } from '../test-data/priceFilter';

type Fixtures = {
  homePage: HomePage;
  categoryPage: CategoryPage;
  randomRange: Required<PriceRange>;
  randomPriceTo: number;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page, isMobile }, use) => {
    await use(new HomePage(page, isMobile));
  },
  categoryPage: async ({ page, isMobile }, use) => {
    await use(new CategoryPage(page, isMobile));
  },
  // eslint-disable-next-line no-empty-pattern
  randomRange: async ({}, use, testInfo) => {
    const from = randomPrice(RANDOM_RANGE.min, RANDOM_RANGE.max);
    const range = { from, to: from + RANDOM_RANGE.width };
    testInfo.annotations.push({type: 'random range', description: `${range.from} - ${range.to}`});
    await use(range);
  },
  // eslint-disable-next-line no-empty-pattern
  randomPriceTo: async ({}, use, testInfo) => {
    const priceTo = (randomPrice(RANDOM_PRICE_TO.min, RANDOM_PRICE_TO.max));
    testInfo.annotations.push({type: 'random price to', description: String(priceTo) });
    await use(priceTo);
  },
});

export { expect } from '@playwright/test';
