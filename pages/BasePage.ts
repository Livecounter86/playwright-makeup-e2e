import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly productSkeleton: Locator;
  readonly rewardTooltip: Locator;

  constructor(
    protected readonly page: Page,
    protected readonly isMobile: boolean,
  ) {
    this.productSkeleton = page.locator('.ProductSkeleton__grid');
    this.rewardTooltip = page.locator('.RewardTooltip__tooltip');
  }

  /**
   * expectedQuery is a wait condition, not a filter: without it a response to an earlier action
   * (the "From" request while we wait for "To") would end the wait too early.
   * Start it BEFORE the action and await it after: a fast response can come before a wait started later.
   */
  protected async waitForProducts(expectedQuery: Record<string, string> = {}) {
    await this.page.waitForResponse((resp) => {
      const url = new URL(resp.url());
      return (
        resp.ok() &&
        url.pathname.endsWith('/products/') &&
        Object.entries(expectedQuery).every(([key, value]) => url.searchParams.get(key) === value)
      );
    });
    // After the response the site still re-renders the grid, and actions made at that moment are lost:
    // the "To" value is wiped, a click is ignored. The skeleton stays until the re-render ends.
    await this.productSkeleton.waitFor({ state: 'hidden' });
  }

  async clickAndWaitForProducts(target: Locator, expectedQuery: Record<string, string> = {}) {
    const response = this.waitForProducts(expectedQuery);
    await target.click();
    await response;
  }

  // The reward tooltip pops up at a random moment and covers the elements under it.
  // A locator handler closes it before any action it would block, so no step has to expect it.
  protected async closePopupsWhenShown() {
    await this.page.addLocatorHandler(this.rewardTooltip, async (tooltip) => {
      // the close button has no text: its accessible name is the icon name
      await tooltip.getByRole('button', { name: 'makeup-close-light-outline' }).dispatchEvent('click');
    });
  }
}
