/** @format */

export class CodeBlock {
  static construct(content: string, lang?: string) {
    const language: string = lang ?? '';
    const safeContent = content.replaceAll('```', '\\`\\`\\`');
    return ['```' + language, safeContent, '```'].join('\n');
  }

  static parse(input: string) {
    const match = input.match(/^```(\w+)?\n([\s\S]*?)\n```$/);
    if (!match) return null;

    const lang: string = match[1] ?? '';
    const content = match[2];

    return { lang, content };
  }
}
