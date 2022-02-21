const fetch = require("node-fetch")
const { errorMessage } = require("../error-message")
const { getBlocks } = require("./get-blocks")

exports.getPages = async ({ token, databaseId, notionVersion = "2021-08-16", filter }, reporter) => {
  let hasMore = !!databaseId
  let startCursor = ""
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`
  const body = {
    page_size: 100,
  }
  if (filter) {
    body.filter = filter;
  }

  const pages = []

  while (hasMore) {
    if (startCursor) {
      body.start_cursor = startCursor
    }

    try {
      const result = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Notion-Version": notionVersion,
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json())

      startCursor = result.next_cursor
      hasMore = result.has_more

      for (let page of result.results) {
        page.children = await getBlocks({ id: page.id, token, notionVersion }, reporter)

        pages.push(page)
      }
    } catch (e) {
      reporter.panic(errorMessage)
    }
  }

  return pages
}
