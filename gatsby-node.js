const path = require("path")
const fs = require("fs")
const { getPages } = require("./src/notion-api/get-pages")
const { notionBlockToMarkdown } = require("./src/transformers/notion-block-to-markdown")
const { getNotionPageProperties } = require("./src/transformers/get-page-properties")
const { getNotionPageTitle } = require("./src/transformers/get-page-title")
const YAML = require("yaml")

const fetch = require("node-fetch")

const NOTION_NODE_TYPE = "Notion"

// Download remote images referenced in markdown and replace URLs with local paths.
// Notion uses signed S3 URLs that expire, so images must be downloaded at build time.
async function downloadImages(markdown, pageDir) {
	const imageRegex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g
	let match
	let result = markdown
	let imageIndex = 0

	const downloads = []
	while ((match = imageRegex.exec(markdown)) !== null) {
		const [fullMatch, alt, url] = match
		const ext = url.match(/\.(jpe?g|png|gif|webp|svg)/i)?.[1] || 'jpg'
		const localName = `image-${imageIndex++}.${ext}`
		const localPath = path.join(pageDir, localName)
		downloads.push({ fullMatch, alt, url, localName, localPath })
	}

	await Promise.all(downloads.map(async ({ url, localPath }) => {
		try {
			const response = await fetch(url)
			if (response.ok) {
				const buffer = await response.buffer()
				fs.writeFileSync(localPath, buffer)
			}
		} catch (e) {
			// Image download failed — URL will remain in markdown
		}
	}))

	for (const { fullMatch, alt, localName, localPath } of downloads) {
		if (fs.existsSync(localPath)) {
			result = result.replace(fullMatch, `![${alt}](./${localName})`)
		}
	}

	return result
}

// Escape characters that MDX v2 interprets as JSX (< and {) in markdown body.
// Preserves code blocks (``` and inline `), HTML comments, and frontmatter.
function escapeMdxSyntax(markdown) {
	const lines = markdown.split('\n')
	let inCodeBlock = false
	let inFrontmatter = false
	let frontmatterCount = 0

	return lines.map((line) => {
		if (line.trim() === '---') {
			frontmatterCount++
			if (frontmatterCount <= 2) inFrontmatter = !inFrontmatter
			return line
		}
		if (inFrontmatter) return line

		if (line.trim().startsWith('```')) {
			inCodeBlock = !inCodeBlock
			return line
		}
		if (inCodeBlock) return line

		return line
			// Remove unsupported Notion components
			.replace(/<\/?IssueLink(\s[^>]*)?>/g, '')
			// Remove HTML comments entirely
			.replace(/<!--[\s\S]*?-->/g, '')
			// Escape < that is not part of a valid tag
			.replace(/<(?![a-zA-Z/])/g, '\\<')
			// Escape { that MDX v2 interprets as JSX expressions (must run before style conversion)
			.replace(/(?<!\\)\{/g, '\\{')
			// Convert HTML style="prop:val; ..." to JSX style={{prop: 'val', ...}}
			.replace(/style="([^"]*)"/g, (_, css) => {
				const jsxProps = css.split(';').filter(Boolean).map((decl) => {
					const [prop, ...valParts] = decl.split(':')
					const camelProp = prop.trim().replace(/-([a-z])/g, (__, c) => c.toUpperCase())
					return `${camelProp}: '${valParts.join(':').trim()}'`
				}).join(', ')
				return `style={{${jsxProps}}}`
			})
			// Replace Notion layout components with styled divs (after { escaping to keep {{}} intact)
			.replace(/<ColumnList>/g, '<div style={{display: "flex", gap: "1rem"}}>')
			.replace(/<\/ColumnList>/g, '</div>')
			.replace(/<Column>/g, '<div style={{flex: 1}}>')
			.replace(/<\/Column>/g, '</div>')
	}).join('\n')
}

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

	for (const page of pages) {
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
			// Escape MDX v2 syntax characters in the markdown body
			markdown = escapeMdxSyntax(markdown)
			const fileName = absolutePath(properties)
			const pageDir = path.join(sourceDir, page.id)
			const filePath = path.join(pageDir, fileName)
			fs.mkdirSync(pageDir, { recursive: true })

			// Download remote images to local files (Notion S3 URLs expire)
			markdown = await downloadImages(markdown, pageDir)

			fs.writeFileSync(filePath, markdown)

			processedPages.push({ page, title, properties, markdown, fileName })
		}
	}

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
			id: `${NOTION_NODE_TYPE}${nodeSuffix}-${page.id}`,
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
