import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("https://news.ycombinator.com/newest")
  expect(page).toBeDefined
})

test.describe("extract page", () => {
  test("1=1", () => {
    expect(1).toBe(1)
  })
})
test("has title", async ({ page }) => {
  await page.goto("https://playwright.dev/")

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/)
})

test("get started link", async ({ page }) => {
  await page.goto("https://playwright.dev/")

  // Click the get started link.
  await page.getByRole("link", { name: "Get started" }).click()

  // Expects page to have a heading with the name of Installation.
  await expect(
    page.getByRole("heading", { name: "Installation" })
  ).toBeVisible()
})

// await page.getByRole("link", { name: "More" }).click()

// // Find time in the next row
// const nextRow = row.nextElementSibling
// if (nextRow) {
//   const timeElement = nextRow.querySelector(".age a")
//   if (timeElement) {
//     const timeText = timeElement.innerText.trim()
//     if (dayjs(timeText, "YYYY-MM-DDTHH:mm:ss", true).isValid()) {
//       time = timeText
//     }
//   }
// }

// console.log("Articles extracted:")
// articles.forEach((article, index) => {
//   console.log(
//     `${index + 1}. ID: ${article.id}, existedUpId: ${
//       article.existedUpId
//     }, existedHrefId: ${article.existedHrefId}, Time: ${article.time}`
//   )
// })
//
