import { test, expect } from "@playwright/test"
import { fetchAndSortHackerNewsArticles } from "../index" // Adjust the path if necessary
import l from "lodash"
import dayjs from "dayjs"

let latest100News

test.describe("Hacker News Articles Sorting", () => {
  // Fetch data once before all tests
  test.beforeAll(async () => {
    latest100News = await fetchAndSortHackerNewsArticles()
  })

  test("Verify news array existence", async () => {
    expect(!l.isEmpty(latest100News)).toBe(true)
  })

  test("Verify length of latest100News is 100", async () => {
    expect(latest100News.length).toBe(100)
  })

  test("Verify ranks from 1 to 100 are present", async () => {
    const ranks = l.map(latest100News, "rank")
    const allRanksPresent = l.every(l.range(1, 101), (rank) =>
      l.includes(ranks, rank)
    )
    expect(allRanksPresent).toBe(true)
  })

  test("Verify ranks are sequential from 1 to 100", async () => {
    const ranksInCorrectOrder = l.every(
      latest100News,
      (item, index) => item.rank === index + 1
    )
    expect(ranksInCorrectOrder).toBe(true)
  })

  test("Verify articles are sorted from newest to oldest", async () => {
    const sorted = l.every(latest100News, (item, index, array) => {
      if (index === 0) return true
      const currentItemDate = dayjs(item.time)
      const previousItemDate = dayjs(array[index - 1].time)
      return (
        currentItemDate.isBefore(previousItemDate) ||
        currentItemDate.isSame(previousItemDate)
      )
    })
    expect(sorted).toBe(true)
  })
})
