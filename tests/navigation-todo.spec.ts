import { expect, test } from "@playwright/test";

test("desktop sidebar scrolls to the last menu item and support on short screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 360 });
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "工作空间导航" });
  await expect(navigation).toBeVisible();
  expect(await navigation.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  await navigation.hover();
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => navigation.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  const announcement = navigation.getByText("公告", { exact: true });
  await announcement.scrollIntoViewIfNeeded();
  await expect(announcement).toBeInViewport();
  await announcement.click();
  await expect(page.getByRole("heading", { name: "公告", exact: true })).toBeVisible();
  const help = navigation.getByRole("button", { name: "帮助与支持", exact: true });
  await help.scrollIntoViewIfNeeded();
  await expect(help).toBeInViewport();
  await help.click();
  await expect(page.locator(".standard-modal")).toContainText("关于综合教育平台");
});

test("mobile navigation drawer scrolls to and selects the bottom option", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 320 });
  await page.goto("/");
  await page.getByRole("button", { name: "折叠导航", exact: true }).click();
  const drawer = page.locator(".navigation-drawer");
  const body = drawer.locator(".n-drawer-body-content-wrapper");
  await expect(drawer).toBeVisible();
  await expect
    .poll(() => body.evaluate((element) => element.scrollHeight > element.clientHeight))
    .toBe(true);
  await body.hover();
  await page.mouse.wheel(0, 1000);
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  const announcement = drawer.getByText("公告", { exact: true });
  await expect(announcement).toBeInViewport();
  await announcement.click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "公告", exact: true })).toBeVisible();
});

test("file management is absent from navigation, search, settings, and direct routes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".sidebar .n-menu")).not.toContainText("文件中心");
  await expect(page.locator(".sidebar .n-menu")).not.toContainText("我的文件");
  await page.getByRole("button", { name: "搜索页面", exact: true }).click();
  await page.getByPlaceholder("搜索页面名称或页面编号，如 C03").fill("文件");
  await expect(page.locator(".search-modal")).toContainText("没有找到匹配页面");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "界面设置", exact: true }).click();
  await expect(page.locator(".n-drawer .search-result")).toHaveCount(8);
  await expect(page.locator(".n-drawer .search-results")).not.toContainText("我的文件");
  await page.goto("/#/files");
  await page.reload();
  await expect(page.getByRole("heading", { name: "消息中心", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "我的文件", exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "折叠导航", exact: true }).click();
  await expect(page.locator(".navigation-drawer")).not.toContainText("文件中心");
  await expect(page.locator(".navigation-drawer")).not.toContainText("我的文件");
});

test("every todo has a jump button that opens the requested placeholder without changing state", async ({
  page,
}) => {
  await page.goto("/#/messages/todo");
  const rows = page.locator(".n-data-table-tbody .n-data-table-tr");
  await expect(rows).toHaveCount(7);
  await expect(page.getByRole("button", { name: "跳转", exact: true })).toHaveCount(7);
  const counter = page
    .locator(".message-tabs .n-tabs-tab")
    .filter({ hasText: "待处理" })
    .locator(".tab-count");
  await expect(counter).toHaveText("6");
  for (let index = 0; index < 7; index++) {
    await rows.nth(index).getByRole("button", { name: "跳转", exact: true }).click();
    const modal = page.locator(".todo-jump-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("目标页面跳转待实现");
    await modal.getByRole("button", { name: "我知道了", exact: true }).click();
    await expect(modal).toHaveCount(0);
    await expect(page).toHaveURL(/#\/messages\/todo$/);
    await expect(counter).toHaveText("6");
  }
});

test("todo jump remains reachable on mobile without horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/messages/todo");
  const jump = page.getByRole("button", { name: "跳转", exact: true }).first();
  await jump.scrollIntoViewIfNeeded();
  await expect(jump).toBeInViewport();
  await jump.click();
  const modal = page.locator(".todo-jump-modal");
  await expect(modal).toContainText("目标页面跳转待实现");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await modal.getByRole("button", { name: "我知道了", exact: true }).click();
  await expect(modal).toHaveCount(0);
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`message pages omit summary panels and retain list controls at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const [path, heading, tab] of [
      ["/messages/inbox", "消息中心", "全部消息"],
      ["/messages/todo", "我的待办", "全部事项"],
      ["/messages/announcements", "公告", "全部公告"],
    ]) {
      await page.goto(`/#${path}`);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(page.locator(".stats-grid, .stat-card")).toHaveCount(0);
      await expect(page.getByText("平台与学校公告", { exact: true })).toHaveCount(0);
      await expect(
        page.locator(".message-tabs .n-tabs-tab").filter({ hasText: tab }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "查询", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "重置", exact: true })).toBeVisible();
    }
  });
}
