import { Page, Locator, expect, test } from '@playwright/test';
import { waitForProductsResponse } from '../../helpers/waitForProducts';

export type PriceRange = { from?: number; to?: number };

export class CategoryPage {
  readonly priceFromInput: Locator;
  readonly priceToInput: Locator;
  readonly productPrices: Locator;
  readonly activePage: Locator;
  readonly lastPageButton: Locator;
  readonly sortControl: Locator;

  constructor(private readonly page: Page) {
    this.sortControl = page.locator('.Products__controls');
    this.priceFromInput = page.locator('.PriceSelector__field').filter({ hasText: 'Від' }).locator('input');
    this.priceToInput = page.locator('.PriceSelector__field').filter({ hasText: 'До' }).locator('input');
    this.productPrices = page
      .locator('.Products__cards')
      .locator('> .ProductCard__cardContainer')
      .locator('.Price__priceCurrent');
    this.activePage = page.locator('.Pagination__isActive');
    this.lastPageButton = page.locator('.Pagination__page').last();
  }

  // A random price from min to max inclusive
  randomPrice(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async setPriceRange({ from, to }: PriceRange) {
    if (from !== undefined) await this.fillPriceInput(this.priceFromInput, 'priceFrom', from);
    if (to !== undefined) await this.fillPriceInput(this.priceToInput, 'priceTo', to);
  }

  // A narrow random range can have no products in a small category.
  // Then the range is widened by 100 ₴ on both sides and applied again. Returns the range that is in effect.
  async widenPriceRangeIfNoProducts({ from, to }: Required<PriceRange>) {
    if ((await this.getPrices()).length > 0) return { from, to };
    test.info().annotations.push({ type: 'range widened', description: `no products from ${from} to ${to}` });
    const widened = { from: from - 100, to: to + 100 };
    await this.setPriceRange(widened);
    return widened;
  }

  private async fillPriceInput(input: Locator, param: 'priceFrom' | 'priceTo', value: number) {
    const response = waitForProductsResponse(this.page, { [param]: String(value) });
    await input.fill(String(value));
    await input.blur();
    await response;
  }

  async getPrices(): Promise<number[]> {
    const texts = await this.productPrices.allTextContents();
    return texts.map((text) => Number(text.replace(/\D/g, '')));
  }

  // Waits until the grid shows products and checks that all product prices on the page are within the range.
  async expectAllPricesInRange({ from = 0, to = Infinity, sortedAsc = false }: PriceRange & { sortedAsc?: boolean }) {
    const message = `All product prices should be from ${from} to ${to}` + (sortedAsc ? ' and sorted ascending' : '');
    await expect
      .poll(
        async () => {
          const prices = await this.getPrices();
          return {
            hasProducts: prices.length > 0,
            outOfRange: prices.filter((price) => price < from || price > to),
            isSorted: !sortedAsc || prices.every((price, i) => i === 0 || prices[i - 1] <= price),
          };
        },
        { message },
      )
      .toEqual({ hasProducts: true, outOfRange: [], isSorted: true });
  }

  async goToPage(pageNumber: number) {
    await this.page.locator('.Pagination__page', { hasText: new RegExp(`^${pageNumber}$`) }).click();
    await expect(this.activePage, `Page ${pageNumber} should become the active page`).toHaveText(String(pageNumber));
    // the new page is still loading: wait until the skeleton disappears, so the previous page's prices are not read
    await this.page.locator('.ProductSkeleton__grid').waitFor({ state: 'hidden' });
  }
}
