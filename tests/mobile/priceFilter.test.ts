import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/mobile/HomePage';
import { CategoryPage } from '../../pages/mobile/CategoryPage';
import { clickAndWaitForProducts } from '../../helpers/waitForProducts';

test.describe('Price Filter Tests', () => {
  let categoryPage: CategoryPage;
  let priceTo: number;
  let priceFrom: number;

  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    categoryPage = new CategoryPage(page);
    await homePage.goto();
    await homePage.menuButton.click();
    await expect(homePage.categoryLinks, 'Menu should list product categories').not.toHaveCount(0);
    await (await homePage.randomCategoryLink()).click();
    await clickAndWaitForProducts(page, homePage.allProductsLink);
    // Shown in the report next to the test title, so a failed run can be reproduced
    test.info().annotations.push({ type: 'category', description: page.url() });
  });

  test('should show only products within a random "From" / "To" price range', async ({ page }) => {
    priceFrom = categoryPage.randomPrice(101, 4999);
    priceTo = priceFrom + 10;
    await categoryPage.filterButton.click();
    await categoryPage.setPriceRange({ from: priceFrom, to: priceTo });
    await categoryPage.applyFilterButton.click();
    // A random 10 ₴ range can have no products in a small category; then it is widened by 100 ₴ on both sides
    const range = await categoryPage.widenPriceRangeIfNoProducts({ from: priceFrom, to: priceTo });
    await expect(
      page.getByRole('button', { name: `Від ${range.from} До ${range.to}` }),
      `Applied filter tag "Від ${range.from} До ${range.to}" should be shown`,
    ).toBeVisible();
    await categoryPage.expectAllPricesInRange(range);
    // The last pagination button shows the number of pages. When all products fit one page, there is no pagination
    const lastPageText = await categoryPage.lastPageButton.allInnerTexts();
    const totalPages = Number(lastPageText[0] ?? 1);
    // Page 1 is checked above. Cheap ranges can have 30+ pages, so at most 5 pages are checked
    for (let pageNumber = 2; pageNumber <= Math.min(totalPages, 5); pageNumber++) {
      await categoryPage.goToPage(pageNumber);
      await categoryPage.expectAllPricesInRange(range);
    }
  });

  test('should show only products not more expensive than a random "To" price', async ({ page }) => {
    priceTo = categoryPage.randomPrice(30, 100);
    await categoryPage.filterButton.click();
    await categoryPage.setPriceRange({ to: priceTo });
    await categoryPage.applyFilterButton.click();
    await expect(
      page.getByRole('button', { name: `До ${priceTo}` }),
      `Applied filter tag "До ${priceTo}" should be shown`,
    ).toBeVisible();
    await categoryPage.expectAllPricesInRange({ to: priceTo });
  });
});
