import { Page, Locator } from '@playwright/test';

/**
 * Чекає відповідь API зі списком товарів і завершення перемальовки сітки.
 * expectedQuery — це не фільтр, а умова очікування: параметри, які мають бути в адресі запиту (порядок не важливий).
 * Викликати ДО дії, яка відправляє запит, а результат чекати після неї.
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
  // Після відповіді сайт ще перемальовує сторінку, і дії в цей момент губляться: стирається «До», ігнорується клік.
  // Під час завантаження замість сітки показано «скелет», тому чекаємо, доки він зникне.
  await page.locator('.ProductSkeleton__grid').waitFor({ state: 'hidden' });
}

/** Клікає й чекає запит товарів, який цей клік має відправити (див. waitForProductsResponse). */
export async function clickAndWaitForProducts(page: Page, target: Locator, expectedQuery: Record<string, string> = {}) {
  const response = waitForProductsResponse(page, expectedQuery);
  await target.click();
  await response;
}
