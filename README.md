# Playwright MAKEUP E2E

[![Playwright Tests](https://github.com/Livecounter86/playwright-makeup-e2e/actions/workflows/playwright.yml/badge.svg)](https://github.com/Livecounter86/playwright-makeup-e2e/actions/workflows/playwright.yml)

Автотести на Playwright і TypeScript для сайту [makeup.com.ua](https://makeup.com.ua).
Тести перевіряють фільтр за діапазоном цін на сторінках категорій у десктопній і мобільній версіях.

## Встановлення

Потрібен Node.js 20 або новіший.

```bash
git clone https://github.com/Livecounter86/playwright-makeup-e2e.git
cd playwright-makeup-e2e
npm ci
npx playwright install --with-deps chromium webkit
```

## Оточення

За замовчуванням тести запускаються на проді `https://makeup.com.ua`.

Щоб запустити їх на іншому оточенні (наприклад, на дев), скопіюйте шаблон і вкажіть адресу в `BASE_URL`:

```bash
cp .env.example .env
```

```
BASE_URL=https://адреса-дев-оточення
```

## Запуск

```bash
npm test                                  # усі тести
npx playwright test tests/web             # тільки десктоп
npx playwright test tests/mobile          # тільки мобільна версія
npx playwright test --project=chromium    # один браузер: chromium, webkit, "Mobile Chrome", "Mobile Safari"
npx playwright test --headed              # з відкритим браузером
npx playwright show-report                # звіт останнього запуску
```

## Запуск у GitHub Actions

Тести запускаються на проді автоматично при push і pull request у `main`.

Запустити вручну: вкладка **Actions** → **Playwright Tests** → **Run workflow**.
Звіт можна завантажити внизу сторінки запуску, у розділі **Artifacts** (`playwright-report`).
