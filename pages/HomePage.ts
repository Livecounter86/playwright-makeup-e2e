import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly mobileMenuButton: Locator;
  readonly categoryLinks: Locator;
  readonly mobileAllProductsLink: Locator;
  readonly cookieAcceptButton: Locator;
  readonly mobileCategoryLinks: Locator;

  constructor(page: Page, isMobile: boolean) {
    super(page, isMobile);
    this.mobileMenuButton = page.locator('.MenuButton__menu');
    const mobileMenu = page.locator('.MenuModal__content');
    // "categorys" is the site's own spelling in category URLs, not a typo
    this.mobileCategoryLinks = mobileMenu.locator('.MenuModal__item[href*="/categorys/"]').filter({ visible: true });
    this.mobileAllProductsLink = mobileMenu.getByRole('link', { name: 'Всі товари' });
    this.cookieAcceptButton = page.getByRole('button', { name: 'Погоджуюсь' });
    this.categoryLinks = page.locator('.Menu__menu').locator('.Menu__item[href*="/categorys/"]');
  }

  private async randomCategoryLink(links: Locator): Promise<Locator> {
    const count = await links.count();
    return links.nth(Math.floor(Math.random() * count));
  }

  private async randomCategoryMobile() {
    await this.mobileMenuButton.click();
    await expect(this.mobileCategoryLinks, 'Menu should list product categories').not.toHaveCount(0);
    await (await this.randomCategoryLink(this.mobileCategoryLinks)).click();
    await this.clickAndWaitForProducts(this.mobileAllProductsLink);
  }

  private async randomCategoryDesktop() {
    await expect(this.categoryLinks, 'Menu should list product categories').not.toHaveCount(0);
    await this.clickAndWaitForProducts(await this.randomCategoryLink(this.categoryLinks));
  }

  async openRandomCategory() {
    if (this.isMobile) await this.randomCategoryMobile();
    else await this.randomCategoryDesktop();
  }

  async goto() {
    await this.closePopupsWhenShown();
    await this.page.goto('/ua/');
    // The cookie banner appears only once the page reacts to clicks; on a phone it also covers the "Apply" button.
    // Clicking the menu earlier causes a full page navigation without the products request the test waits for.
    await this.cookieAcceptButton.click();
  }
}
