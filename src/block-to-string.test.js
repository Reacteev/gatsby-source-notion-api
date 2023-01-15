const test = require('ava');
const blockToString = require('./block-to-string');

test('bold', t => {
  t.is(blockToString.blockToString([
    { text: { content: "bold" }, annotations: { bold: true, color: "default" } }
  ]), "**bold**");
});

test('italic', t => {
  t.is(blockToString.blockToString([
    { text: { content: "italic" }, annotations: { italic: true, color: "default" } }
  ]), "_italic_");
});

test('strikethrough', t => {
  t.is(blockToString.blockToString([
    { text: { content: "strikethrough" }, annotations: { strikethrough: true, color: "default" } }
  ]), "~~strikethrough~~");
});

test('underline', t => {
  t.is(blockToString.blockToString([
    { text: { content: "underline" }, annotations: { underline: true, color: "default" } }
  ]), "<u>underline</u>");
});

test('color', t => {
  t.is(blockToString.blockToString([
    { text: { content: "color" }, annotations: { color: "red" } }
  ]), '<span style="color:red">color</span>');
});

test('background color', t => {
  t.is(blockToString.blockToString([
    { text: { content: "background color" }, annotations: { color: "yellow_background" } }
  ]), '<span style="background-color:yellow">background color</span>');
});

test('caption', t => {
  t.is(blockToString.blockToString([
    { text: { content: "With caption" }, annotations: { color: "default" } }
  ]), "With caption");
});

test('complex caption', t => {
  t.is(blockToString.blockToString([
    { text: { content: "La lég" }, annotations: { color: "default" } },
    { text: { content: "ende " }, annotations: { color: "default" } },
    { text: { content: "de l" }, annotations: { color: "default" } },
    { text: { content: "'ima" }, annotations: { color: "default" } },
    { text: { content: "ge" }, annotations: { color: "default" } }
  ]), "La légende de l'image");
});
