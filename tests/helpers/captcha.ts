import { expect, type Page } from "@playwright/test";

export async function captchaDragPoints(page: Page, fraction?: number) {
  const modal = page.locator(".captcha-modal");
  const slider = modal.getByRole("slider");
  await expect(slider).toBeVisible();
  await slider.hover();
  const geometry = await slider.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const track = element.parentElement!;
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      travel: track.clientWidth - (element as HTMLElement).offsetWidth,
    };
  });
  const transform = await modal.locator(".captcha-target").getAttribute("transform");
  // This is an intentionally client-side prototype puzzle, not a CAPTCHA service.
  const target = Number(transform?.match(/translate\(([\d.]+)/)?.[1]);
  const ratio = fraction ?? (target - 10) / 244;
  return {
    start: { x: geometry.x, y: geometry.y },
    end: { x: geometry.x + geometry.travel * ratio, y: geometry.y },
    ratio,
  };
}

export async function dragCaptcha(page: Page, fraction?: number) {
  const { start, end } = await captchaDragPoints(page, fraction);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 20 });
  await page.mouse.up();
}

export async function solveCaptcha(page: Page) {
  await dragCaptcha(page);
  await expect(page.locator(".captcha-modal")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^\d+s 后重试$/ })).toBeDisabled();
}
