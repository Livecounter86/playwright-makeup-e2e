import { Page, Locator } from '@playwright/test';
import { closePopupsWhenShown } from '../../helpers/popups';

export class HomePage {
  readonly categoryLinks: Locator;

  constructor(private readonly page: Page) {
    this.categoryLinks = page.locator('.Menu__menu').locator('.Menu__item[href*="/categorys/"]');
  }

  async randomCategoryLink(): Promise<Locator> {
    const count = await this.categoryLinks.count();
    return this.categoryLinks.nth(Math.floor(Math.random() * count));
  }

  async goto() {
    await closePopupsWhenShown(this.page);
    await this.page.goto('/ua/');
    await this.page.getByRole('button', { name: 'Погоджуюсь' }).click();
  }
}
