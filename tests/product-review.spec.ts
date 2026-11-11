import { expect, test } from "@playwright/test";

test("forgot password is marked as an undocumented recommendation with the requested formatting", async ({
  page,
}) => {
  await page.goto("/#/login");
  const entry = page.getByRole("button", { name: "忘记密码？（缺！）", exact: true });
  await expect(entry).toBeVisible();
  await expect(page.locator(".requirement-gap-marker")).toHaveCount(1);
  const marker = entry.locator(".requirement-gap-marker");
  await expect(marker).toHaveCSS("border-top-width", "3px");
  await expect(marker).toHaveCSS("border-right-width", "3px");
  await expect(marker).toHaveCSS("border-bottom-width", "3px");
  await expect(marker).toHaveCSS("border-left-width", "3px");
  await expect(marker).toHaveCSS("border-top-style", "solid");
  await expect(marker).toHaveCSS("border-top-color", "rgb(255, 0, 0)");
  await expect(marker.locator(".n-text")).toHaveCSS("font-weight", "700");

  await page.getByPlaceholder("请输入手机号").fill("13800138000");
  await entry.click();
  const review = page.locator(".password-recovery-review");
  await expect(review).toBeVisible();
  await expect(review).toContainText("文档缺项 · 建议补充 · 待产品确认");
  await expect(review).toContainText("C01-01 登录文档未定义密码找回流程");
  await expect(review).toContainText("P15-01");
  await expect(review).toContainText("当前未实现密码找回，也不会调用接口");
  await expect(review).toContainText("找回方式");
  await expect(review).toContainText("安全规则");
  await expect(review).toContainText("完成行为");
  await expect(review).toContainText("需求补齐");
  await review.getByRole("button", { name: "关闭提示", exact: true }).click();
  await expect(review).toHaveCount(0);
  await expect(page.getByPlaceholder("请输入手机号")).toHaveValue("13800138000");
  await expect(page.locator(".consent-row .n-checkbox")).not.toHaveClass(/n-checkbox--checked/);

  await page.locator(".login-tabs .n-tabs-tab").filter({ hasText: "验证码登录" }).click();
  await expect(entry).toHaveCount(0);
  await page.goto("/#/account/password");
  await expect(page.locator(".requirement-gap-marker")).toHaveCount(0);
});

test("the review marker and dialog fit on a narrow login screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/login");
  const entry = page.getByRole("button", { name: "忘记密码？（缺！）", exact: true });
  await expect(entry).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await entry.click();
  await expect(page.locator(".password-recovery-review")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "关闭提示", exact: true }).click();
  await expect(entry).toBeVisible();
});
