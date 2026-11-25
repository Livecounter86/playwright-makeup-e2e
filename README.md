# Playwright MAKEUP E2E

[![Playwright Tests](https://github.com/Livecounter86/playwright-makeup-e2e/actions/workflows/playwright.yml/badge.svg)](https://github.com/Livecounter86/playwright-makeup-e2e/actions/workflows/playwright.yml)

Автотести на Playwright і TypeScript для сайту [makeup.com.ua](https://makeup.com.ua).
Тести перевіряють фільтр «Ціна» на сторінках категорій у десктопній і мобільній версіях:

- пресет «250 ₴ - 500 ₴» із сортуванням від найдешевших (тільки десктоп);
- випадковий діапазон «Від – До»;
- випадкову верхню межу «До».

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

## Структура

```text
pages/       page objects: BasePage (очікування товарів, закриття спливаючої підказки), HomePage, CategoryPage
fixtures/    фікстури: page objects і випадкові тестові дані
test-data/   константи: пресет ціни, межі випадкових цін, скільки сторінок перевіряти
tests/       один набір тестів для десктопної і мобільної версій
```

Відмінності мобільної версії (меню, панель фільтрів) обробляють page objects через `isMobile`, тому тести однакові для всіх проєктів.
Тест пресета має тег `@desktop-only` і в мобільних проєктах не запускається.

## Запуск

```bash
npm test                                                                  # усі тести
npx playwright test --project=chromium --project=webkit                   # тільки десктоп
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"   # тільки мобільна версія
npx playwright test --grep @desktop-only                                  # тільки тести, яких немає в мобільній версії
npx playwright test --headed                                              # з відкритим браузером
npx playwright show-report                                                # звіт останнього запуску
```

## Що варто знати

- Категорія і ціни щоразу випадкові. Категорію видно в анотації `category` у звіті, тож падіння можна відтворити на тій самій сторінці.
- Якщо у випадковому діапазоні немає товарів, його розширено на 100 ₴ в обидва боки. Про це у звіті є анотація `range widened`.
- Перевіряється не більше 15 сторінок результатів: у дешевих діапазонах буває 30+ сторінок, і повна перевірка не вміщується в таймаут.
- Частина падінь — справжні баги сайту: ціна на картці не потрапляє в діапазон фільтра. Тести їх не обходять і падають навмисно.

## Запуск у GitHub Actions

Тести запускаються на проді автоматично при push і pull request у `main`.

Запустити вручну: вкладка **Actions** → **Playwright Tests** → **Run workflow**.
Звіт можна завантажити внизу сторінки запуску, у розділі **Artifacts** (`playwright-report`).

Кнопка **Run workflow** доступна лише тим, хто має доступ на запис до репозиторію. Щоб запустити тести у своєму GitHub:

1. Натисніть **Fork** угорі сторінки репозиторію і створіть копію.
2. У своїй копії відкрийте вкладку **Actions** і натисніть **I understand my workflows, go ahead and enable them**.
3. Виберіть **Playwright Tests** → **Run workflow**.
