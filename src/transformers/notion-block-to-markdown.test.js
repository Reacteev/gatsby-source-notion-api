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

test('table', t => {
  t.is(notionBlockToMarkdown(
    { type: "table", table: { table_width: 2, has_column_header: true, has_row_header: true }, children: [
      { type: "table_row", table_row: { cells: [
        [{ type: "text", text: { content: "Header column and row" }, annotations: { color: "default" }}],
        [{ type: "text", text: { content: "Header column" }, annotations: { color: "default" }}],
      ]}},
      { type: "table_row", table_row: { cells: [
        [{ type: "text", text: { content: "Header row" }, annotations: { color: "default" }}],
        [{ type: "text", text: { content: "Cell" }, annotations: { color: "default" }}],
      ]}}
    ]}
  ), "\n| Header column and row | Header column |\n| --- | --- |\n| Header row | Cell |\n");
});

test('unsupported', t => {
  t.is(notionBlockToMarkdown(
    { type: "unsupported", unsupported: {}}
  ), "\n<!-- This block type 'unsupported' is not supported yet. -->\n");
});

