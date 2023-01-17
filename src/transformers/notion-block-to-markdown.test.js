const test = require('ava');
const { notionBlockToMarkdown } = require('./notion-block-to-markdown');

test('paragraph', t => {
  t.is(notionBlockToMarkdown(
    { type: "paragraph", paragraph: { text: [{ text: { content: "paragraph" }, annotations: { color: "default" }}]}}
  ), "\nparagraph\n");
});

test('heading_1', t => {
  t.is(notionBlockToMarkdown(
    { type: "heading_1", heading_1: { text: [{ text: { content: "heading_1" }, annotations: { color: "default" }}]}}
  ), "\n# heading_1\n");
});

test('heading_2', t => {
  t.is(notionBlockToMarkdown(
    { type: "heading_2", heading_2: { text: [{ text: { content: "heading_2" }, annotations: { color: "default" }}]}}
  ), "\n## heading_2\n");
});

test('heading_3', t => {
  t.is(notionBlockToMarkdown(
    { type: "heading_3", heading_3: { text: [{ text: { content: "heading_3" }, annotations: { color: "default" }}]}}
  ), "\n### heading_3\n");
});

test('to_do unchecked', t => {
  t.is(notionBlockToMarkdown(
    { type: "to_do", to_do: { text: [{ text: { content: "to_do" }, annotations: { color: "default" }}]}}
  ), "- [ ]  to_do\n");
});

test('to_do checked', t => {
  t.is(notionBlockToMarkdown(
    { type: "to_do", to_do: { checked: true, text: [{ text: { content: "to_do" }, annotations: { color: "default" }}]}}
  ), "- [x]  to_do\n");
});

test('bulleted_list_item', t => {
  t.is(notionBlockToMarkdown(
    { type: "bulleted_list_item", bulleted_list_item: { text: [{ text: { content: "bulleted_list_item" }, annotations: { color: "default" }}]},
      children: [{type: "bulleted_list_item", bulleted_list_item: { text: [{ text: { content: "bulleted_list_item_children" }, annotations: { color: "default" }}]}}]
    }
  ), "* bulleted_list_item\n  \n  * bulleted_list_item_children\n");
});

test('numbered_list_item', t => {
  t.is(notionBlockToMarkdown(
    { type: "numbered_list_item", numbered_list_item: { text: [{ text: { content: "numbered_list_item" }, annotations: { color: "default" }}]},
      children: [{type: "numbered_list_item", numbered_list_item: { text: [{ text: { content: "numbered_list_item_children" }, annotations: { color: "default" }}]}}]
    }
  ), "1. numbered_list_item\n  \n  1. numbered_list_item_children\n");
});

test('code', t => {
  t.is(notionBlockToMarkdown(
    { type: "code", code: { language: "shell", text: [{ text: { content: "code" }, annotations: { color: "default" }}]}}
  ), "\n``` shell\ncode\n```\n\n");
});

test('quote', t => {
  t.is(notionBlockToMarkdown(
    { type: "quote", quote: { text: [{ text: { content: "quote" }, annotations: { color: "default" }}]}}
  ), "\n> quote\n");
});

test('divider', t => {
  t.is(notionBlockToMarkdown({ type: "divider" }), "\n---\n");
});

const table = { type: "table", table: { table_width: 3, has_column_header: false, has_row_header: false }, children: [
  { type: "table_row", table_row: { cells: [
    [{ type: "text", text: { content: "Header column and row" }, annotations: { color: "default" }}],
    [{ type: "text", text: { content: "Header column A" }, annotations: { color: "default" }}],
    [{ type: "text", text: { content: "Header column B" }, annotations: { color: "default" }}],
  ]}},
  { type: "table_row", table_row: { cells: [
    [{ type: "text", text: { content: "Header row 1" }, annotations: { color: "default" }}],
    [{ type: "text", text: { content: "Cell A1" }, annotations: { color: "default" }}],
    [{ type: "text", text: { content: "Cell B1" }, annotations: { color: "default" }}],
  ]}},
  { type: "table_row", table_row: { cells: [
    [{ type: "text", text: { content: "Header row 2" }, annotations: { color: "default" }}],
    [{ type: "text", text: { content: "Cell A2" }, annotations: { color: "default" }}],
    [{ type: "text", text: { content: "Cell B2" }, annotations: { color: "default" }}],
  ]}}
]};
test('table no header', t => {
  t.is(notionBlockToMarkdown(table),
    // Not possible not to have header without formating, Notion has more feature on it.
    "\n| Header column and row | Header column A | Header column B |\n| --- | --- | --- |\n| Header row 1 | Cell A1 | Cell B1 |\n| Header row 2 | Cell A2 | Cell B2 |\n"
  );
});
test('table column header', t => {
  table.table.has_column_header = true;
  table.table.has_row_header = false;
  t.is(notionBlockToMarkdown(table),
    // Not possible not to have header without formating, Notion has more feature on it.
    "\n| Header column and row | Header column A | Header column B |\n| --- | --- | --- |\n| **Header row 1** | Cell A1 | Cell B1 |\n| **Header row 2** | Cell A2 | Cell B2 |\n"
  );
});
test('table row header', t => {
  table.table.has_column_header = false;
  table.table.has_row_header = true;
  t.is(notionBlockToMarkdown(table),
    "\n| Header column and row | Header column A | Header column B |\n| --- | --- | --- |\n| Header row 1 | Cell A1 | Cell B1 |\n| Header row 2 | Cell A2 | Cell B2 |\n"
  );
});
test('table column and row header', t => {
  table.table.has_column_header = true;
  table.table.has_row_header = true;
  t.is(notionBlockToMarkdown(table),
    "\n| Header column and row | Header column A | Header column B |\n| --- | --- | --- |\n| **Header row 1** | Cell A1 | Cell B1 |\n| **Header row 2** | Cell A2 | Cell B2 |\n"
  );
});

test('unsupported', t => {
  t.is(notionBlockToMarkdown(
    { type: "unsupported", unsupported: {}}
  ), "\n<!-- This block type 'unsupported' is not supported yet. -->\n");
});
