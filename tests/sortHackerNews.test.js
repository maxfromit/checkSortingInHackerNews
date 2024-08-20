import { test, expect } from "@playwright/test"
import { sortHackerNewsArticles } from "../index" // Adjust the path if necessary
import l from "lodash"
import dayjs from "dayjs"

let newsWithRankLessThan100

test.describe("Hacker News Articles Sorting Tests", () => {
  // Fetch data once before all tests
  test.beforeAll(async () => {
    newsWithRankLessThan100 = await sortHackerNewsArticles()
  })

  test("Check if news array exists", async () => {
    expect(!l.isEmpty(newsWithRankLessThan100)).toBe(true)
  })

  test("Check if length of newsWithRankLessThan100 is 100", async () => {
    expect(newsWithRankLessThan100.length).toBe(100)
  })

  test("Check if there are news with ranks from 1 to 100", async () => {
    const ranks = l.map(newsWithRankLessThan100, "rank")
    const allRanksPresent = l.every(l.range(1, 101), (rank) =>
      l.includes(ranks, rank)
    )
    expect(allRanksPresent).toBe(true)
  })

  test("Check if articles are sorted from newest to oldest", async () => {
    const sorted = l.every(newsWithRankLessThan100, (item, index, array) => {
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
