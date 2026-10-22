import { test, expect } from '@playwright/test';
import { lessons } from '../src/data/curriculum.js';

const firstLesson = lessons.find(lesson => lesson.id === 'radar-basics');

test('course library filters by level and searches topics from the header', async ({ page }) => {
  await page.goto('/#courses');
  await expect(page.locator('.course-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Продвинутый', exact: true }).click();
  await expect(page.locator('.course-card')).toHaveCount(4);
  await expect(page.locator('.course-card .level-label')).toHaveText(Array(4).fill('Продвинутый'));
  await page.getByRole('textbox', { name: 'Найти тему', exact: true }).fill('Доплер');
  await expect(page.getByRole('heading', { name: lessons.find(l => l.id === 'doppler').title, exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Найти тему', exact: true }).fill('несуществующий-сигнал');
  await expect(page.getByRole('heading', { name: 'Сигнал не найден' })).toBeVisible();
  await page.getByRole('button', { name: 'Показать все темы' }).click();
  await expect(page.locator('.course-card')).toHaveCount(12);
});

test('material leads to a quiz with explanations and a persistent passing result', async ({ page }) => {
  await page.goto('/#overview');
  await page.getByRole('button', { name: 'Начать обучение', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: firstLesson.title, exact: true })).toBeVisible();
  await expect(page.locator('.reading-section')).toHaveCount(firstLesson.sections.length);
  await page.getByRole('button', { name: 'Прочитано, к тесту' }).click();
  await expect(page).toHaveURL(/#test\/radar-basics$/);
  await expect(page.getByRole('button', { name: 'Проверить ответ' })).toBeDisabled();

  for (let i = 0; i < firstLesson.questions.length; i++) {
    const question = firstLesson.questions[i];
    // One wrong answer verifies remediation while three correct answers earn a pass.
    const selected = i === 0 ? (question.correct + 1) % 4 : question.correct;
    await page.getByRole('radio').nth(selected).check();
    await page.getByRole('button', { name: 'Проверить ответ' }).click();
    await expect(page.getByRole('status')).toContainText(question.explanation);
    await expect(page.getByRole('status')).toContainText(i === 0 ? 'Не совсем' : 'Верно');
    await page.getByRole('button', { name: i === 3 ? 'Посмотреть результат' : 'Следующий вопрос' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Отличный приём!' })).toBeVisible();
  await expect(page.locator('.result-score')).toContainText('3');
  await page.goto('/#progress');
  const row = page.locator('.progress-list > a').filter({ hasText: firstLesson.title });
  await expect(row).toContainText('3/4 · Пройдено');
  await page.reload();
  await expect(row).toContainText('3/4 · Пройдено');
  await expect(page.locator('.progress-stats > div').nth(0)).toContainText('1');
  await expect(page.locator('.progress-stats > div').nth(2)).toContainText('1');
});

test('a failed test can be retried and the best score is retained', async ({ page }) => {
  await page.goto('/#test/radar-basics');
  for (const [i, question] of firstLesson.questions.entries()) {
    await page.getByRole('radio').nth((question.correct + 1) % 4).check();
    await page.getByRole('button', { name: 'Проверить ответ' }).click();
    await page.getByRole('button', { name: i === 3 ? 'Посмотреть результат' : 'Следующий вопрос' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Продолжай исследовать' })).toBeVisible();
  await expect(page.locator('.result-score')).toContainText('0');
  await page.getByRole('button', { name: 'Попробовать снова' }).click();
  for (const [i, question] of firstLesson.questions.entries()) {
    await page.getByRole('radio').nth(question.correct).check();
    await page.getByRole('button', { name: 'Проверить ответ' }).click();
    await page.getByRole('button', { name: i === 3 ? 'Посмотреть результат' : 'Следующий вопрос' }).click();
  }
  await expect(page.locator('.result-score')).toContainText('4');
  await page.goto('/#progress');
  await expect(page.locator('.progress-list > a').first()).toContainText('4/4 · Пройдено');
  await expect(page.locator('.progress-stats > div').nth(2)).toContainText('2');
});

test('bookmarks survive a reload and can be removed from the saved list', async ({ page }) => {
  await page.goto('/#courses');
  await page.getByRole('button', { name: `В избранное: ${firstLesson.title}`, exact: true }).click();
  await page.goto('/#bookmarks');
  await expect(page.locator('.course-card')).toHaveCount(1);
  await expect(page.locator('.course-card')).toContainText(firstLesson.title);
  await page.reload();
  await expect(page.locator('.course-card')).toHaveCount(1);
  await page.getByRole('button', { name: `Удалить из избранного: ${firstLesson.title}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Здесь будут твои находки' })).toBeVisible();
});

test('theme chooser changes the atmosphere and restores it on reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Выбрать оформление' }).click();
  await page.getByRole('button', { name: 'Ультрафиолет', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'violet');
  await expect(page.getByRole('dialog', { name: 'Цветовая тема' })).not.toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'violet');
});

test('glossary explains concepts and links back to the relevant lesson', async ({ page }) => {
  const term = firstLesson.terms[0];
  await page.goto('/#glossary');
  await page.getByRole('textbox', { name: 'Поиск по глоссарию' }).fill(term.term);
  const card = page.locator('.glossary-card').filter({ has: page.getByRole('heading', { name: term.term, exact: true }) }).first();
  await expect(card).toContainText(term.definition);
  await card.getByRole('link').click();
  await expect(page).toHaveURL(/#lesson\/radar-basics$/);
  await expect(page.getByRole('heading', { name: firstLesson.title, exact: true, level: 1 })).toBeVisible();
});

test('lab modes, object distance and animation pause are interactive', async ({ page }) => {
  await page.goto('/#lab');
  await expect(page.locator('.radar-lab')).toHaveClass(/mode-scan/);
  await page.getByRole('button', { name: 'Эхо', exact: true }).click();
  await expect(page.locator('.radar-lab')).toHaveClass(/mode-echo/);
  await expect(page.locator('.radar-lab-detail')).toContainText('R = c');
  const slider = page.getByRole('slider', { name: 'Положение объекта относительно радара' });
  await slider.fill('90');
  await expect(page.locator('.radar-distance-label')).toContainText('Дальше');
  await page.getByRole('button', { name: 'Доплер', exact: true }).click();
  await expect(page.locator('.radar-lab')).toHaveClass(/mode-doppler/);
  await expect(page.locator('.radar-lab-explanation')).toContainText('вдоль луча');
  await page.getByRole('button', { name: 'Приостановить анимацию радара' }).click();
  await expect(page.locator('.radar-lab')).toHaveClass(/is-paused/);
  await expect(page.getByRole('button', { name: 'Продолжить анимацию радара' })).toBeVisible();
});

test('Doppler direction explains higher, lower and unchanged echo frequency', async ({ page }) => {
  await page.goto('/#lab');
  await page.getByRole('button', { name: 'Доплер', exact: true }).click();
  const directions = page.getByRole('group', { name: 'Направление движения объекта' });
  const result = page.locator('.radar-doppler-result');
  await expect(directions.getByRole('button', { name: 'К радару', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(result).toContainText('частота эха выше');
  await expect(page.locator('.radar-wave-label')).toContainText(['Переданный сигнал', 'Эхо: колебания чаще']);
  await directions.getByRole('button', { name: 'От радара', exact: true }).click();
  await expect(result).toContainText('частота эха ниже');
  await expect(page.locator('.radar-wave-comparison')).toContainText('Эхо: колебания реже');
  await directions.getByRole('button', { name: 'Поперёк луча', exact: true }).click();
  await expect(result).toContainText('сдвиг равны нулю');
  await expect(page.locator('.radar-wave-comparison')).toContainText('Эхо: частота та же');
  await page.getByRole('button', { name: 'Приостановить анимацию радара' }).click();
  for (const waveform of await page.locator('.radar-wave-motion').all()) {
    await expect(waveform).toHaveCSS('animation-play-state', 'paused');
  }
  await page.getByRole('button', { name: 'Продолжить анимацию радара' }).click();
  await expect(page.locator('.radar-wave-motion').first()).toHaveCSS('animation-play-state', 'running');
});

test('mobile navigation opens lessons without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  await expect.poll(() => page.locator('.sidebar').evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(0);
  expect(await noOverflow()).toBe(true);
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await page.getByRole('link', { name: 'Программа обучения', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Программа обучения', level: 1 })).toBeVisible();
  await expect(page.locator('.sidebar')).not.toHaveClass(/is-open/);
  expect(await noOverflow()).toBe(true);
  await page.locator('.course-art-link').first().click();
  await expect(page.getByRole('heading', { name: firstLesson.title, exact: true, level: 1 })).toBeVisible();
  expect(await noOverflow()).toBe(true);
  const advanced = lessons.find(lesson => lesson.id === 'coherent-processing');
  await page.goto(`/#lesson/${advanced.id}`);
  await expect(page.getByRole('heading', { name: advanced.title, exact: true, level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Прочитано, к тесту' }).scrollIntoViewIfNeeded();
  expect(await noOverflow()).toBe(true);
});

test('invalid saved data falls back to a working fresh course', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('radar.theme', '"not-a-theme"');
    localStorage.setItem('radar.progress', '{broken-json');
    localStorage.setItem('radar.bookmarks', '{"wrong":"shape"}');
  });
  await page.goto('/#progress');
  await expect(page.getByRole('heading', { name: 'Твой прогресс', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
  await expect(page.locator('.progress-donut')).toContainText('0%');
  await page.goto('/#bookmarks');
  await expect(page.getByRole('heading', { name: 'Здесь будут твои находки' })).toBeVisible();
});

test('unknown lessons provide a useful route back to the course', async ({ page }) => {
  await page.goto('/#lesson/unknown-topic');
  await expect(page.getByRole('heading', { name: 'Кажется, мы потеряли сигнал' })).toBeVisible();
  await page.getByRole('button', { name: 'К программе', exact: true }).click();
  await expect(page.locator('.course-card')).toHaveCount(12);
});

test('malformed URL fragments recover with a useful not-found page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#%E0%A4%A');
  await expect(page.getByRole('heading', { name: 'Кажется, мы потеряли сигнал' })).toBeVisible();
  await page.getByRole('button', { name: 'К программе', exact: true }).click();
  await expect(page.locator('.course-card')).toHaveCount(12);
  expect(errors).toEqual([]);
});
