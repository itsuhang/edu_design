import { expect, test, type Page } from "@playwright/test";
import { captchaDragPoints, dragCaptcha, solveCaptcha } from "./helpers/captcha";

async function openSmsLogin(page: Page) {
  await page.goto("/#/login");
  await page.locator(".login-tabs .n-tabs-tab").filter({ hasText: "验证码登录" }).click();
}

test("SMS send validates the phone first, and closing CAPTCHA never issues a code", async ({
  page,
}) => {
  await openSmsLogin(page);
  const send = page.getByRole("button", { name: "发送验证码", exact: true });
  await send.click();
  await expect(page.locator(".login-form")).toContainText("请输入有效的 11 位手机号");
  await expect(page.locator(".captcha-modal")).toHaveCount(0);
  await page.getByPlaceholder("请输入手机号").fill("13800138000");
  await send.click();
  const modal = page.locator(".captcha-modal");
  await expect(modal).toContainText("请完成拖拽验证");
  await expect(modal).toHaveCSS("width", "380px");
  await expect(modal).toContainText("原型演示");
  await expect(send).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: /^\d+s 后重试$/ })).toHaveCount(0);
  await modal.getByRole("button", { name: "close", exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(send).toBeEnabled();
  await page.getByPlaceholder("请输入 6 位验证码").fill("123456");
  await page.locator(".consent-row .n-checkbox").click();
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.locator(".login-form")).toContainText("请先获取验证码");
  await send.click();
  await expect(modal.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(send).toBeEnabled();
});

test("failed alignment can be refreshed or retried, and only success starts the countdown", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openSmsLogin(page);
  await page.getByPlaceholder("请输入手机号").fill("13800138000");
  await page.getByRole("button", { name: "发送验证码", exact: true }).click();
  const modal = page.locator(".captcha-modal");
  await dragCaptcha(page, 1);
  await expect(modal.getByRole("status")).toContainText("未对准缺口");
  await expect(modal.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByRole("button", { name: /^\d+s 后重试$/ })).toHaveCount(0);
  await modal.getByRole("button", { name: "刷新拼图", exact: true }).click();
  await expect(modal.getByRole("status")).toContainText("按住滑块");
  await solveCaptcha(page);
  await expect(page.locator(".n-message")).toContainText("演示验证码为 123456");
  await page.getByPlaceholder("请输入 6 位验证码").fill("123456");
  await page.locator(".consent-row .n-checkbox").click();
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.getByRole("heading", { name: "选择您的工作身份" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("resending requires a fresh CAPTCHA and changing the phone invalidates the prior code", async ({
  page,
}) => {
  await page.clock.install();
  await openSmsLogin(page);
  await page.getByPlaceholder("请输入手机号").fill("13800138000");
  await page.getByRole("button", { name: "发送验证码", exact: true }).click();
  await solveCaptcha(page);
  await page.clock.runFor(61000);
  const send = page.getByRole("button", { name: "发送验证码", exact: true });
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.locator(".captcha-modal").getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await solveCaptcha(page);
  await page.getByPlaceholder("请输入手机号").fill("13912345678");
  await expect(send).toBeEnabled();
  await page.getByPlaceholder("请输入 6 位验证码").fill("123456");
  await page.locator(".consent-row .n-checkbox").click();
  await page.getByRole("button", { name: "登 录", exact: true }).click();
  await expect(page.locator(".login-form")).toContainText("请先获取验证码");
});

test("the slider supports keyboard alignment and navigation clears an unfinished challenge", async ({
  page,
}) => {
  await openSmsLogin(page);
  await page.getByPlaceholder("请输入手机号").fill("13800138000");
  await page.getByRole("button", { name: "发送验证码", exact: true }).click();
  await page.goto("/#/select-identity");
  await expect(page.locator(".captcha-modal")).toHaveCount(0);
  await openSmsLogin(page);
  await page.getByRole("button", { name: "发送验证码", exact: true }).click();
  const { ratio } = await captchaDragPoints(page);
  const slider = page.locator(".captcha-modal").getByRole("slider");
  await slider.press("Home");
  for (let index = 0; index < Math.round(ratio * 100); index++) await slider.press("ArrowRight");
  await slider.press("Enter");
  await expect(page.locator(".captcha-modal")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^\d+s 后重试$/ })).toBeDisabled();
});

test.describe("touch CAPTCHA", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("touch dragging supports cancellation and completion without horizontal overflow", async ({
    page,
  }) => {
    await openSmsLogin(page);
    await page.getByPlaceholder("请输入手机号").fill("13800138000");
    await page.getByRole("button", { name: "发送验证码", exact: true }).click();
    const modal = page.locator(".captcha-modal");
    await expect(modal).toBeInViewport();
    await expect(modal).toHaveCSS("width", "358px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const { start, end } = await captchaDragPoints(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: start.x + 25, y: start.y }],
    });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await expect(modal.getByRole("slider")).toHaveAttribute("aria-valuenow", "0");
    await expect(page.getByRole("button", { name: /^\d+s 后重试$/ })).toHaveCount(0);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    for (let index = 1; index <= 12; index++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: start.x + ((end.x - start.x) * index) / 12, y: start.y }],
      });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^\d+s 后重试$/ })).toBeDisabled();
    await cdp.detach();
  });
});
