import { expect, test } from "@playwright/test";
import { solveCaptcha } from "./helpers/captcha";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("all eight active routes render without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    ["/messages/inbox", "消息中心"],
    ["/messages/todo", "我的待办"],
    ["/messages/announcements", "公告"],
    ["/account/profile", "个人中心"],
    ["/account/password", "个人中心"],
    ["/account/sessions", "个人中心"],
    ["/login", "欢迎回来"],
    ["/select-identity", "选择您的工作身份"],
  ];
  for (const [route, heading] of routes) {
    await page.goto(`/#${route}`);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("inbox keyword, type, date, reset, and pagination work", async ({ page }) => {
  const tableRows = page.locator(".n-data-table-tbody .n-data-table-tr");
  await expect(tableRows).toHaveCount(8);
  await page.locator(".n-pagination-item").filter({ hasText: /^2$/ }).click();
  await expect(tableRows.first()).toContainText("教学研讨会");
  await page.getByPlaceholder("搜索标题或内容").fill("微信");
  await page.getByRole("button", { name: "查询", exact: true }).click();
  await expect(tableRows).toHaveCount(2);
  await page.getByPlaceholder("搜索标题或内容").fill("没有这个消息");
  await page.getByRole("button", { name: "查询", exact: true }).click();
  await expect(tableRows).toHaveCount(0);
  await page.getByRole("button", { name: "重置", exact: true }).click();
  await expect(tableRows).toHaveCount(8);
  await page.locator(".filter-form .n-base-selection").click();
  await page
    .locator(".n-base-select-option")
    .filter({ hasText: /^安全提醒$/ })
    .click();
  await page.getByRole("button", { name: "查询", exact: true }).click();
  await expect(tableRows).toHaveCount(4);
  await page.getByRole("button", { name: "重置", exact: true }).click();
  await page.getByPlaceholder("开始日期").fill("2026-11-06");
  await page.getByPlaceholder("结束日期").fill("2026-11-06");
  await page.getByPlaceholder("结束日期").press("Enter");
  await page.getByRole("heading", { name: "消息中心", exact: true }).click();
  await page.getByRole("button", { name: "查询", exact: true }).click();
  await expect(tableRows).toHaveCount(3);
});

test("batch read and detail read update all unread counters", async ({ page }) => {
  const unreadCounter = page
    .locator(".message-tabs .n-tabs-tab")
    .filter({ hasText: "未读消息" })
    .locator(".tab-count");
  const checkboxes = page.locator(".n-data-table-tbody .n-checkbox");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await page.getByRole("button", { name: "标记已读", exact: true }).click();
  await expect(unreadCounter).toHaveText("6");
  await page.getByRole("button", { name: "查看", exact: true }).nth(2).click();
  await expect(page.locator(".n-drawer")).toContainText("研学活动备案已审核通过");
  await expect(unreadCounter).toHaveText("5");
  await page.locator(".n-drawer").getByRole("button", { name: "关闭", exact: true }).click();
  await page.getByRole("button", { name: "全部已读", exact: true }).click();
  await expect(unreadCounter).toHaveText("0");
  await page.locator(".message-tabs .n-tabs-tab").filter({ hasText: "未读消息" }).click();
  await expect(page.locator(".n-data-table-tbody .n-data-table-tr")).toHaveCount(0);
});

test("todos require a handling opinion and update the pending count", async ({ page }) => {
  await page.goto("/#/messages/todo");
  await page.getByRole("button", { name: "去处理", exact: true }).first().click();
  await page.getByRole("button", { name: "确认处理", exact: true }).click();
  await expect(page.locator(".n-modal")).toContainText("请填写处理意见");
  await page.getByPlaceholder("请输入核验结果或处理意见").fill("材料完整，资质有效，同意通过。");
  await page.getByRole("button", { name: "确认处理", exact: true }).click();
  await expect(page.locator(".n-modal")).toHaveCount(0);
  await expect(
    page.locator(".message-tabs .n-tabs-tab").filter({ hasText: "待处理" }).locator(".tab-count"),
  ).toHaveText("5");
  await expect(page.locator(".n-data-table-tbody .n-data-table-tr").first()).toContainText(
    "已处理",
  );
});

test("profile edit validates nickname and updates global identity", async ({ page }) => {
  await page.goto("/#/account/profile");
  await page.getByRole("button", { name: "编辑资料", exact: true }).click();
  await page.getByPlaceholder("请输入 2–30 个字符").fill("林");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.locator(".n-modal")).toContainText("昵称长度应为");
  await page.getByPlaceholder("请输入 2–30 个字符").fill("林晓老师");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await expect(page.locator(".n-modal")).toHaveCount(0);
  await expect(page.locator(".user-trigger")).toContainText("林晓老师");
  await expect(page.locator(".profile-descriptions")).toContainText("林晓老师");
});

test("phone change verifies both old and new phone and invalidates other sessions", async ({
  page,
}) => {
  await page.goto("/#/account/profile");
  await page.getByRole("button", { name: "更换手机号", exact: true }).click();
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await expect(page.locator(".n-modal")).toContainText("请先获取验证码");
  await page.getByRole("button", { name: "获取验证码", exact: true }).click();
  await page.getByPlaceholder("请输入 6 位验证码").fill("123456");
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.getByPlaceholder("请输入新的 11 位手机号").fill("13912345678");
  await page.getByRole("button", { name: "获取验证码", exact: true }).click();
  await page.getByPlaceholder("请输入 6 位验证码").fill("123456");
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.locator(".profile-descriptions")).toContainText("139 **** 5678");
  await page.goto("/#/account/sessions");
  await expect(page.getByRole("heading", { name: "当前有 1 台设备处于登录状态" })).toBeVisible();
});

test("wechat unbind requires OTP, and bind requires simulated authorization", async ({ page }) => {
  await page.goto("/#/account/profile");
  await page.getByRole("button", { name: "解绑", exact: true }).click();
  await page.getByRole("button", { name: "获取验证码", exact: true }).click();
  await page.getByPlaceholder("请输入 6 位验证码").fill("123456");
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.getByRole("button", { name: "立即绑定", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "立即绑定", exact: true }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.locator(".n-modal")).toContainText("请先完成模拟微信授权");
  await page.getByRole("button", { name: "模拟微信授权", exact: true }).click();
  await page.getByRole("button", { name: "确认", exact: true }).click();
  await expect(page.getByRole("button", { name: "解绑", exact: true })).toBeVisible();
});

test("password requirements apply, new password works, other sessions expire", async ({ page }) => {
  await page.goto("/#/account/password");
  await page.getByPlaceholder("请输入当前密码").fill("wrong");
  await page.getByPlaceholder("请输入 10–64 位新密码").fill("short");
  await page.getByRole("button", { name: "确认修改", exact: true }).click();
  await expect(page.locator(".password-form")).toContainText("原密码不正确");
  await expect(page.locator(".password-form")).toContainText("新密码不符合安全要求");
  await page.getByPlaceholder("请输入当前密码").fill("Edu@2026Demo");
  await page.getByPlaceholder("请输入 10–64 位新密码").fill("NewEdu@2026Secure");
  await page.getByPlaceholder("请再次输入新密码").fill("NewEdu@2026Secure");
  await page.getByRole("button", { name: "确认修改", exact: true }).click();
  await expect(page.getByPlaceholder("请输入当前密码")).toHaveValue("");
  await page.goto("/#/account/sessions");
  await expect(page.getByRole("heading", { name: "当前有 1 台设备处于登录状态" })).toBeVisible();
  await page.goto("/#/login");
  await page.getByRole("button", { name: "填入演示账号", exact: true }).click();
  await expect(page.getByPlaceholder("请输入密码")).toHaveValue("NewEdu@2026Secure");
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.getByRole("heading", { name: "选择您的工作身份" })).toBeVisible();
});

test("session sign-out requires confirmation and all devices returns to login", async ({
  page,
}) => {
  await page.goto("/#/account/sessions");
  await page
    .locator(".n-data-table-tbody .n-data-table-tr")
    .nth(1)
    .getByRole("button", { name: "退出", exact: true })
    .click();
  await page.getByRole("button", { name: "确认退出", exact: true }).click();
  await expect(page.getByRole("heading", { name: "当前有 2 台设备处于登录状态" })).toBeVisible();
  await page.getByRole("button", { name: "全部退出", exact: true }).click();
  await page.getByRole("button", { name: "确认退出", exact: true }).click();
  await expect(page.getByRole("heading", { name: "欢迎回来" })).toBeVisible();
});

test("login validation, demo account, identity choice, and scope switching work", async ({
  page,
}) => {
  await page.goto("/#/login");
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.locator(".auth-form-card")).toContainText("请输入有效的 11 位手机号");
  await expect(page.locator(".auth-form-card")).toContainText("请先阅读并同意");
  await page.getByRole("button", { name: "填入演示账号", exact: true }).click();
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await page.locator(".identity-card").nth(2).click();
  await page.getByRole("button", { name: "进入工作空间", exact: true }).click();
  await expect(page.locator(".identity-top")).toHaveText("学校管理员");
  await expect(
    page.locator(".message-tabs .n-tabs-tab").filter({ hasText: "全部消息" }).locator(".tab-count"),
  ).toHaveText("22");
  await page.goto("/#/select-identity");
  await page.locator(".identity-card").first().click();
  await page.getByRole("button", { name: "进入工作空间", exact: true }).click();
  await expect(
    page.locator(".message-tabs .n-tabs-tab").filter({ hasText: "全部消息" }).locator(".tab-count"),
  ).toHaveText("24");
});

test("mobile layout has no horizontal overflow and menu navigates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "消息中心", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "折叠导航", exact: true }).click();
  await page
    .locator(".navigation-drawer")
    .getByRole("menuitem", { name: /^我的待办/ })
    .click();
  await expect(page.getByRole("heading", { name: "我的待办", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("SMS login validates the sent code and QR login handles expiry and refresh", async ({
  page,
}) => {
  await page.goto("/#/login");
  await page.locator(".login-tabs .n-tabs-tab").filter({ hasText: "验证码登录" }).click();
  await page.getByPlaceholder("请输入手机号").fill("13800138000");
  await page.locator(".consent-row .n-checkbox").click();
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.locator(".auth-form-card")).toContainText("请先获取验证码");
  await page.getByRole("button", { name: "发送验证码", exact: true }).click();
  await solveCaptcha(page);
  await page.getByPlaceholder("请输入 6 位验证码").fill("000000");
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.locator(".auth-form-card")).toContainText("验证码错误");
  await page.getByPlaceholder("请输入 6 位验证码").fill("123456");
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.getByRole("heading", { name: "选择您的工作身份" })).toBeVisible();
  await page.goto("/#/messages/inbox");
  await page.clock.install();
  await page.goto("/#/login");
  await page.locator(".login-tabs .n-tabs-tab").filter({ hasText: "微信扫码" }).click();
  await page.clock.runFor(121000);
  await expect(page.getByRole("button", { name: "刷新二维码", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "刷新二维码", exact: true }).click();
  await expect(page.locator(".qr-login")).toContainText("120 秒后过期");
  await page.locator(".consent-row .n-checkbox").click();
  await page.getByRole("button", { name: "模拟扫码授权登录", exact: true }).click();
  await page.clock.runFor(500);
  await expect(page.getByRole("heading", { name: "选择您的工作身份" })).toBeVisible();
});
