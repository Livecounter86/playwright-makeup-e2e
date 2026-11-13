import { Page, Locator } from '@playwright/test';
import { closePopupsWhenShown } from '../../helpers/popups';

export class HomePage {
  readonly menuButton: Locator;
  readonly categoryLinks: Locator;
  readonly allProductsLink: Locator;

  constructor(private readonly page: Page) {
    this.menuButton = page.locator('.MenuButton__menu');
    const menu = page.locator('.MenuModal__content');
    this.categoryLinks = menu.locator('.MenuModal__item[href*="/categorys/"]').filter({ visible: true });
    this.allProductsLink = menu.getByRole('link', { name: 'Всі товари' });
  }

  async randomCategoryLink(): Promise<Locator> {
    const count = await this.categoryLinks.count();
    return this.categoryLinks.nth(Math.floor(Math.random() * count));
  }

  async goto() {
    await closePopupsWhenShown(this.page);
    await this.page.goto('/ua/');
    // The cookie banner appears only once the page reacts to clicks; on a phone it also covers the "Apply" button.
    // Clicking the menu earlier causes a full page navigation without the products request the test waits for.
    await this.page.getByRole('button', { name: 'Погоджуюсь' }).click();
  }
}
