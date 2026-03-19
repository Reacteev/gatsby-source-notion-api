const path = require("path")
const fs = require("fs")
const { getPages } = require("./src/notion-api/get-pages")
const { notionBlockToMarkdown } = require("./src/transformers/notion-block-to-markdown")
const { getNotionPageProperties } = require("./src/transformers/get-page-properties")
const { getNotionPageTitle } = require("./src/transformers/get-page-title")
const YAML = require("yaml")

const NOTION_NODE_TYPE = "Notion"

// Directory where Notion content is written as .md files for gatsby-plugin-mdx v5.
// MDX v5 only processes File nodes sourced by gatsby-source-filesystem.
const CONTENT_DIR = path.join(process.cwd(), '.cache', 'notion-content')

// Cache fetched pages between onPreBootstrap (writes files) and sourceNodes (creates metadata nodes)
const pagesByConfig = new Map()

exports.onPreBootstrap = async (
	{ reporter, cache },
	{ token, databaseId, nodeSuffix = '', propsToFrontmatter = true, lowerTitleLevel = true, frontmatterMapping = (frontmatter) => frontmatter, filter, absolutePath = () => 'index.fr.md' },
) => {
	const pages = await getPages({ token, databaseId, filter }, reporter, cache)
	const sourceDir = path.join(CONTENT_DIR, nodeSuffix || 'default')
	fs.mkdirSync(sourceDir, { recursive: true })

	const processedPages = []

	pages.forEach((page) => {
		const title = getNotionPageTitle(page)
		const properties = getNotionPageProperties(page)
		let markdown = notionBlockToMarkdown(page, lowerTitleLevel)

		if (propsToFrontmatter) {
			const frontmatter = frontmatterMapping(Object.keys(properties).reduce(
				(acc, key) => ({
					...acc,
					[key]: properties[key].value?.remoteImage ?? properties[key].value,
				}),
				{ title, cover: page.cover },
			), reporter)

			markdown = "---\n".concat(YAML.stringify(frontmatter)).concat("\n---\n\n").concat(markdown)
		}

		if (title && title !== '') {
			const fileName = absolutePath(properties)
			const pageDir = path.join(sourceDir, page.id)
			const filePath = path.join(pageDir, fileName)
			fs.mkdirSync(pageDir, { recursive: true })
			fs.writeFileSync(filePath, markdown)

			processedPages.push({ page, title, properties, markdown, fileName })
		}
	})

	// Cache for sourceNodes
	pagesByConfig.set(databaseId, processedPages)
}

exports.sourceNodes = async (
	{ actions, createContentDigest, createNodeId },
	{ databaseId, nodeSuffix = '', absolutePath = () => 'index.fr.md' },
) => {
	const processedPages = pagesByConfig.get(databaseId) || []

	processedPages.forEach(({ page, title, properties, markdown }) => {
		actions.createNode({
			id: createNodeId(`${NOTION_NODE_TYPE}${nodeSuffix}-${page.id}`),
			title,
			properties,
			archived: page.archived,
			createdAt: page.created_time,
			updatedAt: page.last_edited_time,
			markdownString: markdown,
			raw: page,
			json: JSON.stringify(page),
			parent: null,
			children: [],
			internal: {
				type: `${NOTION_NODE_TYPE}${nodeSuffix}`,
				mediaType: "text/markdown",
				content: markdown,
				contentDigest: createContentDigest(page),
			},
			absolutePath: absolutePath(properties),
		})
	})
}
