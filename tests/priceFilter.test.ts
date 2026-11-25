import { test, expect } from '../fixtures/fixtures';
import { MAX_PAGES_TO_CHECK, PRICE_PRESET } from '../test-data/priceFilter';

test.describe('Price Filter Tests', () => {
  test.beforeEach(async ({ page, homePage }) => {
    await homePage.goto();
    await homePage.openRandomCategory();
    // Shown in the report next to the test title, so a failed run can be reproduced
    test.info().annotations.push({ type: 'category', description: page.url() });
  });

  test('show only products within the preset price range', { tag: '@desktop-only' }, async ({ categoryPage }) => {
    // The last argument is not a filter: it is the query the click must send to the products API
    await categoryPage.clickAndWaitForProducts(categoryPage.pricePresetButton(PRICE_PRESET.label), {
      priceFrom: String(PRICE_PRESET.from),
      priceTo: String(PRICE_PRESET.to),
    });
    await expect(categoryPage.priceToInput, '"To" input should show the upper bound of the preset').toHaveValue(
      String(PRICE_PRESET.to),
    );
    await expect(categoryPage.priceFromInput, '"From" input should show the lower bound of the preset').toHaveValue(
      String(PRICE_PRESET.from),
    );
    await categoryPage.sortControl.click();
    await categoryPage.clickAndWaitForProducts(categoryPage.sortCheapestFirstOption, { sort: 'priceAsc' });
    await expect(categoryPage.sortControl, 'Sort control should show the "cheapest first" option').toContainText(
      'Від найдешевших',
    );

    // The first page, then the last one
    await categoryPage.expectAllPricesInRange({ from: PRICE_PRESET.from, to: PRICE_PRESET.to, sortedAsc: true });
    const lastPage = await categoryPage.getTotalPages();
    await categoryPage.goToPage(lastPage);
    await categoryPage.expectAllPricesInRange({ from: PRICE_PRESET.from, to: PRICE_PRESET.to, sortedAsc: true });
  });

  test('should show only products within a random "From" / "To" price range', async ({ categoryPage, randomRange }) => {
    await categoryPage.setPriceRange(randomRange);
    // A random 10 ₴ range can have no products in a small category; then it is widened by 100 ₴ on both sides
    const range = await categoryPage.widenPriceRangeIfNoProducts(randomRange);
    await expect(
      categoryPage.priceFilteredTag(range),
      `Applied filter tag "Від ${range.from} До ${range.to}" should be shown`,
    ).toBeVisible();
    await categoryPage.expectAllPricesInRangeOnPages(range, MAX_PAGES_TO_CHECK);
  });

  test('should show only products not more than a random "To" price', async ({ categoryPage, randomPriceTo }) => {
    await categoryPage.setPriceRange({ to: randomPriceTo });
    await expect(
      categoryPage.priceFilteredTag({ to: randomPriceTo }),
      `Applied filter tag "До ${randomPriceTo}" should be shown`,
    ).toBeVisible();
    await categoryPage.expectAllPricesInRange({ to: randomPriceTo });
  });
});
