const { test, expect } = require("@playwright/test");

const topLevelPages = [
  { name: "Projects", path: "/projects.html", h1: "Design Portfolio" },
  { name: "Research", path: "/research.html", h1: "Research & Publications" },
  { name: "Experience", path: "/experience.html", h1: "Engineering Experience" },
  { name: "Books", path: "/books.html", h1: "Luke's Library" },
  { name: "Social", path: "/social.html", h1: "Latest Updates" },
  { name: "Contact", path: "/contact/", h1: "Contact" }
];

const seoPages = [
  "/",
  "/projects.html",
  "/research.html",
  "/experience.html",
  "/books.html",
  "/social.html",
  "/project-bone.html",
  "/project-nab.html",
  "/project-pendulum.html",
  "/project-srd.html",
  "/contact/"
];

function createErrorTracker(page, ignoredMessages = []) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignoredMessages.some((pattern) => pattern.test(text))) return;
    consoleErrors.push(text);
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return () => {
    expect(consoleErrors, `Console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
    expect(pageErrors, `Page errors:\n${pageErrors.join("\n")}`).toEqual([]);
  };
}

async function expectExactlyOneH1(page, expectedText) {
  const headings = page.locator("h1");
  await expect(headings).toHaveCount(1);
  await expect(headings.first()).toContainText(expectedText);
}

test("homepage loads with navigation and core assets", async ({ page, request, baseURL }) => {
  const assertNoErrors = createErrorTracker(page);
  const response = await page.goto("/");
  expect(response && response.ok()).toBeTruthy();

  await expect(page).toHaveTitle(/Luke Schwaninger/);
  await expect(page.locator("nav[aria-label='Primary navigation']")).toBeVisible();
  await expect(page.locator("#main")).toBeVisible();
  await expectExactlyOneH1(page, "Luke Schwaninger");

  const stylesheetHref = await page.locator("link[rel='stylesheet']").first().getAttribute("href");
  expect(stylesheetHref).toBeTruthy();
  const stylesheetResponse = await request.get(new URL(stylesheetHref, baseURL).toString());
  expect(stylesheetResponse.ok()).toBeTruthy();

  const faviconHref = await page.locator("link[rel='icon']").first().getAttribute("href");
  expect(faviconHref).toBeTruthy();
  const faviconResponse = await request.get(new URL(faviconHref, baseURL).toString());
  expect(faviconResponse.ok()).toBeTruthy();

  const profileImage = page.locator("img.profile-photo");
  await expect(profileImage).toBeVisible();
  const naturalWidth = await profileImage.evaluate((img) => img.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);

  assertNoErrors();
});

test("desktop navigation links reach major pages", async ({ page }) => {
  const assertNoErrors = createErrorTracker(page);
  await page.goto("/");

  for (const destination of topLevelPages) {
    await page.locator(".nav-links a", { hasText: destination.name }).click();
    await expect(page).toHaveURL(new RegExp(`${destination.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    await expectExactlyOneH1(page, destination.h1);
    await page.locator(".brand").click();
    await expect(page).toHaveURL(/\/$/);
  }

  assertNoErrors();
});

test("public pages expose required SEO metadata", async ({ page }) => {
  for (const path of seoPages) {
    const assertNoErrors = path === "/social.html"
      ? () => {}
      : createErrorTracker(page, [/Failed to load resource/i]);

    const response = await page.goto(path);
    expect(response && response.ok(), `Expected ${path} to load`).toBeTruthy();

    await expect(page.locator("html")).toHaveAttribute("lang", /.+/);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("meta[name='description']")).toHaveCount(1);
    await expect(page.locator("meta[name='viewport']")).toHaveCount(1);
    await expect(page.locator("link[rel='canonical']")).toHaveCount(1);
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /index,follow/i);

    const robotsContent = await page.locator("meta[name='robots']").getAttribute("content");
    expect(robotsContent.toLowerCase()).not.toContain("noindex");

    const missingAltImages = await page.locator("img:not([alt])").count();
    expect(missingAltImages, `${path} contains images missing alt attributes`).toBe(0);

    assertNoErrors();
  }
});

test.describe("responsive smoke tests", () => {
  test("mobile navigation remains accessible", async ({ page }) => {
    const assertNoErrors = createErrorTracker(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const toggle = page.locator(".nav-toggle");
    await expect(toggle).toBeVisible();
    await toggle.click();

    await expect(page.locator(".nav-panel")).toBeVisible();
    await page.locator(".nav-links a", { hasText: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact\/$/);
    await expect(page.locator(".contact-actions")).toBeVisible();

    assertNoErrors();
  });

  test("desktop project page layout and media remain accessible", async ({ page }) => {
    const assertNoErrors = createErrorTracker(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/project-pendulum.html");

    await expectExactlyOneH1(page, "Inverted Pendulum Control System");
    await expect(page.locator(".project-video-embed iframe")).toBeVisible();
    await expect(page.locator(".return-button")).toBeVisible();

    assertNoErrors();
  });
});
