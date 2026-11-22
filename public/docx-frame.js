window.addEventListener('message', async (event) => {
  const port = event.ports[0];
  if (event.source !== window.parent ||
      event.data?.type !== 'render-docx' || !port) return;

  try {
    const detached = document.implementation.createHTMLDocument();
    const body = detached.createElement('div');
    const styles = detached.createElement('div');
    const options = {
      className: 'docx',
      useBase64URL: true,
      hideWrapperOnPrint: true,
      ignoreLastRenderedPageBreak: false,
      renderAltChunks: false,
      renderChanges: false,
      renderComments: false,
    };
    const word = await window.docx.parseAsync(event.data.file, options);
    // The renderer splits on explicit break runs but skips direct paragraph page breaks.
    const paragraphs = word.documentPart.body.children;
    for (const paragraph of paragraphs.slice(1)) {
      if (paragraph.type === 'paragraph' && paragraph.pageBreakBefore) {
        paragraph.children.unshift({ type: 'run', children: [{ type: 'break', break: 'page' }] });
      }
    }
    await window.docx.renderDocument(word, body, styles, options);

    port.postMessage({
      markup: body.innerHTML,
      css: Array.from(styles.querySelectorAll('style'), (style) => style.textContent).join('\n'),
    });
  } catch {
    port.postMessage({ error: true });
  } finally {
    port.close();
  }
});

window.parent.postMessage('salpa-docx-ready', '*');
