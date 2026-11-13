import { Page, Locator } from '@playwright/test';

/**
 * Waits for the products API response and for the grid to finish re-rendering.
 * expectedQuery is not a filter but a wait condition: the parameters the request URL must contain (in any order).
 * Call it BEFORE the action that sends the request, and await the result after the action.
 */
export async function waitForProductsResponse(page: Page, expectedQuery: Record<string, string> = {}) {
  await page.waitForResponse((resp) => {
    const url = new URL(resp.url());
    return (
      resp.ok() &&
      url.pathname.endsWith('/products/') &&
      Object.entries(expectedQuery).every(([key, value]) => url.searchParams.get(key) === value)
    );
  });
  // After the response the site still re-renders the page. Actions made at that moment are lost:
  // the "To" value is wiped, a click is ignored.
  // A skeleton replaces the grid while products load, so we wait until it disappears.
  await page.locator('.ProductSkeleton__grid').waitFor({ state: 'hidden' });
}

/** Clicks and waits for the products request this click must send (see waitForProductsResponse). */
export async function clickAndWaitForProducts(page: Page, target: Locator, expectedQuery: Record<string, string> = {}) {
  const response = waitForProductsResponse(page, expectedQuery);
  await target.click();
  await response;
}
