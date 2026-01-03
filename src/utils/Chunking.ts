/** @format */

const MAX_PAGE_SIZE = 1900;

export function Chunking(text: string) {
  if (!text) return [''];

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const chunks: string[] = [];

  let buffer = '';

  for (const line of lines) {
    const next = buffer ? buffer + '\n' + line : line;

    if (line.length >= MAX_PAGE_SIZE) {
      if (buffer.trim().length) {
        chunks.push(buffer.trimEnd());
        buffer = '';
      }

      chunks.push(line);
      continue;
    }

    if (next.length > MAX_PAGE_SIZE) {
      if (buffer.trim().length) {
        chunks.push(buffer.trimEnd());
      }
      buffer = line;
      continue;
    }

    buffer = next;
  }

  if (buffer.trim().length) {
    chunks.push(buffer.trimEnd());
  }

  return chunks;
}
