# Hacker News Sorting Validator

## Project Goal

This project automates the validation of the sorting order for the latest 100 articles on [Hacker News](https://news.ycombinator.com/newest). It ensures that the articles are displayed from newest to oldest, as expected.

## Main Functionality

- Navigates to the Hacker News "newest" page using Playwright.
- Extracts article data (rank, id, timestamp) for at least the first 100 articles.
- Validates that:
  - Exactly 100 articles are collected.
  - Ranks from 1 to 100 are present and sequential.
  - Articles are sorted from newest to oldest by timestamp.
- Provides clear test output for each validation step.

## Interesting Aspects

- Uses Playwright for browser automation and robust data extraction.
- Handles pagination to ensure exactly 100 articles are collected.
- Utilizes `lodash` for concise and reliable data manipulation.
- Employs `dayjs` for date parsing and comparison.
- Fully automated and headless, suitable for CI pipelines or local QA validation.

## Stack

- Node.js
- Playwright
- Lodash
- Dayjs

---
