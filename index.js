import { chromium } from "@playwright/test"
import dayjs from "dayjs"
import l from "lodash"

const extractNewsData = async (page) => {
  console.log("Extracting article data...")

  const newsData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr[id]"))
    return rows
      .map((row) => {
        const id = row.getAttribute("id")
        // Find the element with text matching the rank pattern
        const isMaxThreeDigitsAndDot = (value) => /^\d{1,3}\.$/.test(value)
        const findRank = () => {
          const rankByClass = Array.from(row.querySelectorAll(".rank")).find(
            (el) => {
              const text = el.textContent.trim()
              return isMaxThreeDigitsAndDot(text)
            }
          )
          const rankByAllElements = Array.from(row.querySelectorAll("*")).find(
            (el) => {
              const text = el.textContent.trim()
              return isMaxThreeDigitsAndDot(text)
            }
          )
          if (!!rankByClass)
            return parseInt(rankByClass.textContent.trim().replace(".", ""), 10)
          if (!!rankByAllElements)
            return parseInt(
              rankByAllElements.textContent.trim().replace(".", ""),
              10
            )
          return null
        }

        const findTimeInsideSibling = (sibling) => {
          if (!!sibling && !sibling.getAttribute("id")) {
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

            if (!!findedTime()) return findedTime()
            return findTimeInsideSibling(row.nextElementSibling)
          }
          return null
        }

        return {
          id: id ?? null,
          rank: findRank(),
          time: findTimeInsideSibling(row.nextElementSibling),
        }
      })
      .filter((item) => item.id !== null && item.rank !== null)
  })

  return newsData
}

export const fetchAndSortHackerNewsArticles = async () => {
  const browser = await chromium.launch({ headless: true })
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

    let allNewsData = []
    let highestRank = 0
    let initialNumber = 1

    const fetchNewsUntilConditionMet = async () => {
      const newNews = await extractNewsData(page)
      if (l.isEmpty(newNews)) {
        console.log("ERROR IN FETCHING DATA")
        return
      }
      if (!l.isEmpty(allNewsData) && allNewsData[0].rank === newNews[0].rank) {
        console.log("ERROR IN PAGE ITERATION")
        return
      }

      allNewsData = l.concat(allNewsData, newNews)
      highestRank = l.maxBy(allNewsData, "rank").rank

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
        await fetchNewsUntilConditionMet()
      } else {
        console.log("Condition met!")
      }
    }

    await fetchNewsUntilConditionMet()

    const newsWithRankLessThan101 = l.filter(
      allNewsData,
      (item) => item.rank <= 100
    )
    console.log(newsWithRankLessThan101)

    return newsWithRankLessThan101
  } catch (error) {
    console.error("AN ERROR OCCURRED:", error)
  } finally {
    await browser.close()
  }
}

const runTests = async () => {
  const latest100News = await fetchAndSortHackerNewsArticles()

  console.log("Running tests...")

  // Test 1: Verify news array existence
  if (!l.isEmpty(latest100News)) {
    console.log("Test 1 passed: News array exists.")
  } else {
    console.error("Test 1 failed: News array does not exist.")
  }

  // Test 2: Verify length of latest100News is 100
  if (latest100News.length === 100) {
    console.log("Test 2 passed: Length of news array is 100.")
  } else {
    console.error(
      `Test 2 failed: Length of news array is ${latest100News.length}.`
    )
  }

  // Test 3: Verify ranks from 1 to 100 are present
  const ranks = l.map(latest100News, "rank")
  const allRanksPresent = l.every(l.range(1, 101), (rank) =>
    l.includes(ranks, rank)
  )
  if (allRanksPresent) {
    console.log("Test 3 passed: All ranks from 1 to 100 are present.")
  } else {
    console.error("Test 3 failed: Not all ranks from 1 to 100 are present.")
  }

  // Test 4: Verify ranks are sequential from 1 to 100
  const ranksInCorrectOrder = l.every(
    latest100News,
    (item, index) => item.rank === index + 1
  )
  if (ranksInCorrectOrder) {
    console.log("Test 4 passed: Ranks are sequential from 1 to 100.")
  } else {
    console.error("Test 4 failed: Ranks are not sequential from 1 to 100.")
  }

  // Test 5: Verify articles are sorted from newest to oldest
  const sorted = l.every(latest100News, (item, index, array) => {
    if (index === 0) return true
    const currentItemDate = dayjs(item.time)
    const previousItemDate = dayjs(array[index - 1].time)
    return (
      currentItemDate.isBefore(previousItemDate) ||
      currentItemDate.isSame(previousItemDate)
    )
  })
  if (sorted) {
    console.log("Test 5 passed: Articles are sorted from newest to oldest.")
  } else {
    console.error("Test 5 failed: Articles are not sorted correctly.")
  }
}

runTests()

// ;(async () => {
//   await fetchAndSortHackerNewsArticles()
// })()
