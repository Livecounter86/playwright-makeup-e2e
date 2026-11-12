import { Page } from '@playwright/test';

export async function closePopupsWhenShown(page: Page) {
  await page.addLocatorHandler(page.locator('.RewardTooltip__tooltip'), async (tooltip) => {
    await tooltip.getByRole('button', { name: 'makeup-close-light-outline' }).dispatchEvent('click');
  });
}
