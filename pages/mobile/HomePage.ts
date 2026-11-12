import { Page, Locator } from '@playwright/test';
import { closePopupsWhenShown } from '../../helpers/popups';

export class HomePage {
  readonly menuButton: Locator;
  readonly categoryLinks: Locator;
  readonly allProductsLink: Locator;

  constructor(private readonly page: Page) {
    this.menuButton = page.locator('.MenuButton__menu');
    const menu = page.locator('.MenuModal__content');
    // товарні категорії меню; «Бренди», «Акції» тощо ведуть не на список товарів, тому відбір іде за адресою посилання.
    // visible: у меню є ще приховані пункти підменю
    this.categoryLinks = menu.locator('.MenuModal__item[href*="/categorys/"]').filter({ visible: true });
    // категорія відкриває підменю; у каталог веде його пункт «Всі товари»
    this.allProductsLink = menu.getByRole('link', { name: 'Всі товари' });
  }

  /** Випадкова категорія з меню — щоб тести не залежали від конкретної категорії та її назви. */
  async randomCategoryLink(): Promise<Locator> {
    const count = await this.categoryLinks.count();
    return this.categoryLinks.nth(Math.floor(Math.random() * count));
  }

  async goto() {
    await closePopupsWhenShown(this.page);
    await this.page.goto('/ua/');
    // Банер cookie з'являється, лише коли сторінка вже реагує на кліки, а на телефоні ще й перекриває «Застосувати».
    // Клік по меню раніше за це дає звичайний перехід сторінки без запиту товарів, якого чекає тест.
    await this.page.getByRole('button', { name: 'Погоджуюсь' }).click();
  }
}
