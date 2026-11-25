import { Page, Locator, expect, test } from '@playwright/test';
import { BasePage } from './BasePage';

export type PriceRange = { from?: number; to?: number };

export class CategoryPage extends BasePage {
  readonly priceFromInput: Locator;
  readonly priceToInput: Locator;
  readonly productPrices: Locator;
  readonly activePage: Locator;
  readonly lastPageButton: Locator;
  readonly sortControl: Locator;
  readonly paginationPages: Locator;
  readonly priceFilteredTag: (range: PriceRange) => Locator;
  readonly sortCheapestFirstOption: Locator;
  readonly pricePresetButton: (label: string) => Locator;
  readonly mobileFilterButton: Locator;
  readonly mobileApplyFilterButton: Locator;

  constructor(page: Page, isMobile: boolean) {
    super(page, isMobile);
    this.sortControl = page.locator('.Products__controls');
    this.priceFromInput = page.locator('.PriceSelector__field').filter({ hasText: 'Від' }).locator('input');
    this.priceToInput = page.locator('.PriceSelector__field').filter({ hasText: 'До' }).locator('input');
    this.productPrices = page
      .locator('.Products__cards')
      .locator('> .ProductCard__cardContainer')
      .locator('.Price__priceCurrent');
    this.activePage = page.locator('.Pagination__isActive');
    // its text is the number of pages; read it after the products update: pagination is stale while they load
    this.paginationPages = page.locator('.Pagination__page');
    this.lastPageButton = this.paginationPages.last();
    this.priceFilteredTag = ({ from, to }) => {
      const parts: string[] = [];
      if (from !== undefined) parts.push(`Від ${from}`);
      if (to !== undefined) parts.push(`До ${to}`);
      return page.getByRole('button', { name: parts.join(' ') });
    };
    this.sortCheapestFirstOption = page.getByRole('button', { name: 'Від найдешевших' });
    this.pricePresetButton = (label: string) => page.getByRole('button', { name: label });
    this.mobileApplyFilterButton = page.getByRole('button', { name: 'Застосувати' });
    this.mobileFilterButton = page.getByRole('button', { name: 'Фільтр' });
  }

  // Inputs are filled one by one, each awaiting its response: a re-render after "From" wipes "To" if typed too early.
  async setPriceRange({ from, to }: PriceRange) {
    if (this.isMobile) await this.mobileFilterButton.click();
    if (from !== undefined) await this.fillPriceInput(this.priceFromInput, 'priceFrom', from);
    if (to !== undefined) await this.fillPriceInput(this.priceToInput, 'priceTo', to);
    if (this.isMobile) await this.mobileApplyFilterButton.click();
  }

  // A narrow random range can have no products in a small category.
  // Then the range is widened by 100 ₴ on both sides and applied again. Returns the range that is in effect.
  async widenPriceRangeIfNoProducts({ from, to }: Required<PriceRange>) {
    if ((await this.getPrices()).length > 0) return { from, to };
    // shown in the report, so a widened range is visible and not mistaken for the original one
    test.info().annotations.push({ type: 'range widened', description: `no products from ${from} to ${to}` });
    const widened = { from: from - 100, to: to + 100 };
    await this.setPriceRange(widened);
    return widened;
  }

  private async fillPriceInput(input: Locator, param: 'priceFrom' | 'priceTo', value: number) {
    const response = this.waitForProducts({ [param]: String(value) });
    await input.fill(String(value));
    // the site applies the filter on blur, not while typing
    await input.blur();
    await response;
  }

  // The last pagination button shows the number of pages. When all products fit one page, there is no pagination.
  async getTotalPages(): Promise<number> {
    // allInnerTexts() does not wait; innerText() would wait for a missing pagination until the timeout
    const lastPageText = await this.lastPageButton.allInnerTexts();
    return Number(lastPageText[0] ?? 1);
  }

  async getPrices(): Promise<number[]> {
    // reads the grid as it is right now, without waiting: callers that need settled prices poll it
    const texts = await this.productPrices.allTextContents();
    // the text has spaces between thousands and the "₴" sign, so only the digits are kept
    return texts.map((text) => Number(text.replace(/\D/g, '')));
  }

  // Waits until the grid shows products and checks that all product prices on the page are within the range.
  async expectAllPricesInRange({ from = 0, to = Infinity, sortedAsc = false }: PriceRange & { sortedAsc?: boolean }) {
    const message = `All product prices should be from ${from} to ${to}` + (sortedAsc ? ' and sorted ascending' : '');
    // poll instead of one read: the grid can still be updating.
    // hasProducts: an empty grid has no prices out of range and would pass without it.
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
    // exact match: hasText '1' alone would also match the buttons 10–19
    await this.paginationPages.filter({ hasText: new RegExp(`^${pageNumber}$`) }).click();
    // the site sometimes ignores a click: fail here with a clear message instead of checking the old page
    await expect(this.activePage, `Page ${pageNumber} should become the active page`).toHaveText(String(pageNumber));
    // the new page is still loading: wait until the skeleton disappears, so the previous page's prices are not read
    await this.productSkeleton.waitFor({ state: 'hidden' });
  }

  async expectAllPricesInRangeOnPages(range: PriceRange, maxPages: number) {
    const pagesToCheck = Math.min(await this.getTotalPages(), maxPages);
    for (let pageNumber = 1; pageNumber <= pagesToCheck; pageNumber++) {
      if (pageNumber > 1) await this.goToPage(pageNumber);
      await this.expectAllPricesInRange(range);
    }
  }
}
