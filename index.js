import { test, expect, chromium } from "@playwright/test"
import dayjs from "dayjs"
import { link } from "fs"

async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log("Navigating to Hacker News newest page...")
  await page.goto("https://news.ycombinator.com/newest")
  console.log("Page loaded.")

  console.log("Extracting article data...")
  // Locate all rows
  const rows = await page.getByRole("row")

  // Use evaluateAll to get the IDs and ranks
  const news = await rows.evaluateAll((rows) => {
    // Step 1: Extract id and rank
    const newsComputed = rows
      .map((row) => {
        const id = row.getAttribute("id")

        // Find the element with text matching the rank pattern
        const isMaxThreeDigitsAndDot = (value) => {
          return /^\d{1,3}\.$/.test(value)
        }
        const findedRank = () => {
          const findedRankByClassRank = Array.from(
            row.querySelectorAll(".rank")
          ).find((el) => {
            const text = el.textContent.trim()
            return isMaxThreeDigitsAndDot(text)
          })
          const findedRankByAllRow = Array.from(row.querySelectorAll("*")).find(
            (el) => {
              const text = el.textContent.trim()
              return isMaxThreeDigitsAndDot(text)
            }
          )
          if (!!findedRankByClassRank)
            return parseInt(
              findedRankByClassRank.textContent.trim().replace(".", ""),
              10
            )
          if (!!findedRankByAllRow)
            return parseInt(
              findedRankByAllRow.textContent.trim().replace(".", ""),
              10
            )
          return null
        }

        return { id: id ?? null, rank: findedRank() }
      })
      .filter((item) => item.id !== null && item.rank !== null)

    // Step 2: Check for timestamps in subsequent rows
    rows.forEach((row) => {
      const hrefsInRowForCheck = Array.from(
        row.querySelectorAll("a[href]")
      ).map((a) => a.getAttribute("href"))
      const idsInRowForCheck = Array.from(row.querySelectorAll("[id]")).map(
        (el) => el.getAttribute("id")
      )

      newsComputed.forEach((newsItem) => {
        if (
          hrefsInRowForCheck.some((href) => href.includes(newsItem.id)) ||
          idsInRowForCheck.some((id) => id.includes(newsItem.id))
        ) {
          const isTime = (value) => {
            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
          }

          const findedTime = () => {
            const findedTimeInTitle = Array.from(
              row.querySelectorAll("*")
            ).find((el) => isTime(el.getAttribute("tit2le")))

            const findedTimeInAttributes = Array.from(
              row.querySelectorAll("*")
            ).find((el) => {
              return Array.from(el.attributes).some((attr) =>
                isTime(attr.value)
              )
            })

            if (findedTimeInTitle)
              return findedTimeInTitle.getAttribute("title")
            if (findedTimeInAttributes) {
              return Array.from(findedTimeInAttributes.attributes).find(
                (attr) => isTime(attr.value)
              ).value
            }
            return null
          }

          if (!!findedTime()) newsItem.time = findedTime()
        }
      })
    })

    return newsComputed
  })

  console.log(news)
}

;(async () => {
  await sortHackerNewsArticles()
})()
