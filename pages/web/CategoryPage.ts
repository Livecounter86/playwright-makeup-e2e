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
    // показує вибране сортування; клік відкриває список варіантів
    this.sortControl = page.locator('.Products__controls');
    this.priceFromInput = page.locator('.PriceSelector__field').filter({ hasText: 'Від' }).locator('input');
    this.priceToInput = page.locator('.PriceSelector__field').filter({ hasText: 'До' }).locator('input');
    // «>» — лише картки самої сітки: всередині неї є ще каруселі з рекламними товарами
    this.productPrices = page
      .locator('.Products__cards')
      .locator('> .ProductCard__cardContainer')
      .locator('.Price__priceCurrent');
    this.activePage = page.locator('.Pagination__isActive');
    // текст кнопки = кількість сторінок; читати після оновлення товарів, бо під час завантаження пагінація ще стара
    this.lastPageButton = page.locator('.Pagination__page').last();
  }

  /** Випадкова ціна від min до max включно — щоб тести не залежали від конкретних значень. */
  randomPrice(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Вводить межі ціни; межу, яку не задано, не чіпає.
   * Поля заповнюються по черзі з очікуванням відповіді: перемальовка після «Від» стирає «До», введене зарано.
   */
  async setPriceRange({ from, to }: PriceRange) {
    if (from !== undefined) await this.fillPriceInput(this.priceFromInput, 'priceFrom', from);
    if (to !== undefined) await this.fillPriceInput(this.priceToInput, 'priceTo', to);
  }

  /**
   * У вузькому випадковому діапазоні невеликої категорії товарів може не бути.
   * Тоді діапазон розширюється на 100 ₴ в обидва боки й застосовується знову. Повертає діапазон, який діє в результаті.
   */
  async widenPriceRangeIfNoProducts({ from, to }: Required<PriceRange>) {
    if ((await this.getPrices()).length > 0) return { from, to };
    test.info().annotations.push({ type: 'range widened', description: `no products from ${from} to ${to}` });
    const widened = { from: from - 100, to: to + 100 };
    await this.setPriceRange(widened);
    return widened;
  }

  /** Фільтр застосовується, коли поле втрачає фокус. */
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

  /**
   * Чекає, доки сітка покаже товари, і перевіряє, що ціни всіх товарів на сторінці в межах діапазону.
   * Незадана межа не обмежує; sortedAsc: true додатково вимагає, щоб ціни йшли за зростанням.
   */
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

  /** Сайт іноді ігнорує клік по пагінації, тому клік повторюється, доки сторінка не стане активною. */
  async goToPage(pageNumber: number) {
    const pageButton = this.page.locator('.Pagination__page', { hasText: new RegExp(`^${pageNumber}$`) });
    await expect(async () => {
      await pageButton.click();
      await expect(this.activePage, `Page ${pageNumber} should become the active page`).toHaveText(String(pageNumber), {
        timeout: 3_000,
      });
    }, `Page ${pageNumber} should open after clicking its pagination button`).toPass({ timeout: 15_000 });
    // нова сторінка ще вантажиться: чекаємо, доки зникне «скелет», щоб не прочитати ціни попередньої
    await this.page.locator('.ProductSkeleton__grid').waitFor({ state: 'hidden' });
  }
}
