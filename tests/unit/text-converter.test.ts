import assert from 'node:assert/strict';
import test from 'node:test';
import { TextConverter, type TextFormat } from '../../src/lib/converters/text-converter';

async function convert(name: string, contents: string, format: TextFormat) {
  const result = await TextConverter.convert(new File([contents], name), { format });
  return result.text();
}

test('CSV records keep quoted line breaks, quotes and leading spaces', async () => {
  const result = await convert('table.csv', '\uFEFFid,comment\r\n1,"  первая\r\n\"\"вторая\"\""\r\n', 'json');
  assert.deepEqual(JSON.parse(result), [{ id: '1', comment: '  первая\r\n"вторая"' }]);
});

test('all CSV exports use whole records', async () => {
  const input = 'id,note\n1,"one\ntwo"\n';
  assert.match(await convert('a.csv', input, 'md'), /one<br>two/);
  assert.match(await convert('a.csv', input, 'html'), /<td>one\ntwo<\/td>/);
  assert.match(await convert('a.csv', input, 'xml'), /<note>one\ntwo<\/note>/);
  assert.equal(await convert('a.csv', input, 'txt'), 'id\tnote\n1\tone\ntwo');
});

test('CSV with ambiguous columns fails with a readable error', async () => {
  await assert.rejects(convert('a.csv', 'id,id\n1,2', 'json'), /уникальными/);
  await assert.rejects(convert('a.csv', 'id,note\n1,2,3', 'json'), /количество столбцов/);
});

test('JSON to CSV keeps columns introduced after the first row', async () => {
  const result = await convert('objects.json',
    '[{"id":1},{"id":2,"comment":"сохранить","value":{"nested":true}}]', 'csv');
  assert.equal(result, 'id,comment,value\n1,,\n2,сохранить,"{""nested"":true}"');
});

test('YAML to JSON preserves nested data and rejects invalid input', async () => {
  const yaml = 'title: Salpa\nenabled: true\noptions:\n  - one\n  - two\n';
  assert.deepEqual(JSON.parse(await convert('settings.yml', yaml, 'json')), {
    title: 'Salpa', enabled: true, options: ['one', 'two'],
  });
  await assert.rejects(convert('settings.yaml', 'items: [', 'json'), /YAML/);
});

test('Markdown exports render markup and keep raw HTML as text', async () => {
  const html = await convert('sample.md', '# Заголовок\n\n<aside>Пример</aside>', 'html');
  assert.match(html, /<h1>Заголовок<\/h1>/);
  assert.match(html, /&lt;aside&gt;/);
});
