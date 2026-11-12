import { Page, Locator } from '@playwright/test';
import { closePopupsWhenShown } from '../../helpers/popups';

export class HomePage {
  readonly categoryLinks: Locator;

  constructor(private readonly page: Page) {
    // товарні категорії головного меню; «Бренди» ведуть не на список товарів, тому відбір іде за адресою посилання
    this.categoryLinks = page.locator('.Menu__menu').locator('.Menu__item[href*="/categorys/"]');
  }

  /** Випадкова категорія з меню — щоб тести не залежали від конкретної категорії та її назви. */
  async randomCategoryLink(): Promise<Locator> {
    const count = await this.categoryLinks.count();
    return this.categoryLinks.nth(Math.floor(Math.random() * count));
  }

  async goto() {
    await closePopupsWhenShown(this.page);
    await this.page.goto('/ua/');
    // Банер cookie з'являється, лише коли сторінка вже реагує на кліки.
    // Клік по меню раніше за це дає звичайний перехід сторінки без запиту товарів, якого чекає тест.
    await this.page.getByRole('button', { name: 'Погоджуюсь' }).click();
  }
}
