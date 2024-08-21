import { test, expect, chromium } from "@playwright/test"
import dayjs from "dayjs"
import { link } from "fs"
import l from "lodash"

const getNews = async (page) => {
  console.log("Extracting article data...")

  const newsData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr[id]"))
    return rows
      .map((row) => {
        let time = null
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
        let sibling = row.nextElementSibling

        while (sibling && !sibling.getAttribute("id")) {
          const isTime = (value) =>
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)

          const findedTime = () => {
            const findedTimeInTitle = Array.from(
              sibling.querySelectorAll("*")
            ).find((el) => isTime(el.getAttribute("title")))
            const findedTimeInAttributes = Array.from(
              sibling.querySelectorAll("*")
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

          if (findedTime()) {
            time = findedTime()
            break
          }
          sibling = sibling.nextElementSibling
        }
        return { id: id ?? null, rank: findedRank(), time }
      })
      .filter((item) => item.id !== null && item.rank !== null)
  })

  return newsData
}

export const sortHackerNewsArticles = async () => {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()
  page.on("requestfailed", (request) => {
    console.error(
      `REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`
    )
  })

  try {
    console.log("Navigating to Hacker News newest page...")
    const testPage = "https://news.ycombinator.com/newest"
    await page.goto(testPage)

    console.log("Page loaded.")

    let combinedNewsData = []
    let highestRank = 0

    let initialNumber = 1

    const executeUntilTrue = async () => {
      const newNews = await getNews(page)
      if (l.isEmpty(newNews)) {
        console.log("ERROR IN FETCHING DATA")
        return
      }
      if (
        !l.isEmpty(combinedNewsData) &&
        combinedNewsData[0].rank === newNews[0].rank
      ) {
        console.log("ERROR IN PAGE ITERATION")
        return
      }

      combinedNewsData = l.concat(combinedNewsData, newNews)
      highestRank = l.maxBy(combinedNewsData, "rank").rank

      if (highestRank < 100) {
        initialNumber = initialNumber + newNews.length
        console.log("Looking for news on the next page")
        const countMoreButtons = await page
          .getByRole("link", { name: "More", exact: true })
          .count()
        if (countMoreButtons === 1)
          await page.getByRole("link", { name: "More", exact: true }).click()
        if (countMoreButtons != 1)
          await page.goto(`${testPage}?n=${initialNumber}`)

        await page.waitForTimeout(2000) // Wait for new content to load
        await executeUntilTrue()
      } else {
        console.log("Condition met!")
      }
    }

    await executeUntilTrue()

    const newsWithRankLessThan101 = l.filter(
      combinedNewsData,
      (item) => item.rank <= 100
    )
    console.log(newsWithRankLessThan101)

    return newsWithRankLessThan101
  } catch (error) {
    console.error("AN ERROR OCCURRED:", error)
  } finally {
    // await browser.close()
  }
}
;(async () => {
  await sortHackerNewsArticles()
})()

// Test functions
const runTests = async () => {
  const newsWithRankLessThan101 = await sortHackerNewsArticles()

  console.log("Running tests...")

  // Test 1: Check if news array exists
  if (!l.isEmpty(newsWithRankLessThan101)) {
    console.log("Test 1 passed: News array exists.")
  } else {
    console.error("Test 1 failed: News array does not exist.")
  }

  // Test 2: Check if length of newsWithRankLessThan100 is 100
  if (newsWithRankLessThan101.length === 100) {
    console.log("Test 2 passed: Length of news array is 100.")
  } else {
    console.error(
      `Test 2 failed: Length of news array is ${newsWithRankLessThan101.length}.`
    )
  }

  // Test 3: Check if there are news with ranks from 1 to 100
  const ranks = l.map(newsWithRankLessThan101, "rank")
  const allRanksPresent = l.every(l.range(1, 101), (rank) =>
    l.includes(ranks, rank)
  )
  if (allRanksPresent) {
    console.log("Test 3 passed: All ranks from 1 to 100 are present.")
  } else {
    console.error("Test 3 failed: Not all ranks from 1 to 100 are present.")
  }

  // Test 4: Check if articles are sorted from newest to oldest
  const sorted = l.every(newsWithRankLessThan101, (item, index, array) => {
    if (index === 0) return true
    const currentItemDate = dayjs(item.time)
    const previousItemDate = dayjs(array[index - 1].time)
    return (
      currentItemDate.isBefore(previousItemDate) ||
      currentItemDate.isSame(previousItemDate)
    )
  })
  if (sorted) {
    console.log("Test 4 passed: Articles are sorted from newest to oldest.")
  } else {
    console.error("Test 4 failed: Articles are not sorted correctly.")
  }
}

runTests()
