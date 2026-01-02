/** @format */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } from 'discord.js';

import type { Message } from 'discord.js';

export class Paginator {
  private index = 0;
  private stopped = false;
  private msg!: Message;
  private processKilled = false;

  private prev = new ButtonBuilder().setCustomId('prev').setLabel('Prev').setStyle(ButtonStyle.Danger);
  private stop = new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Secondary);
  private next = new ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Success);

  constructor(
    private sourceMessage: Message,
    private pages: string[],
    private lang = 'js',
    private timeout = 120_000,
    private killProcess?: () => void
  ) {}

  private isShell(): boolean {
    return this.lang === 'sh';
  }

  private buildRow(): ActionRowBuilder<ButtonBuilder> | null {
    const row = new ActionRowBuilder<ButtonBuilder>();
    const multiplePages = this.pages.length > 1;
    const running = this.isShell() && !this.processKilled;

    if (multiplePages) {
      row.addComponents(
        ButtonBuilder.from(this.prev).setDisabled(this.index === 0),
        ButtonBuilder.from(this.next).setDisabled(this.index === this.pages.length - 1)
      );
    }

    if (running) {
      row.addComponents(ButtonBuilder.from(this.stop));
    }

    return row.components.length > 0 ? row : null;
  }

  private buildComponents() {
    if (this.stopped) return [];
    if (!this.isShell() && this.pages.length <= 1) return [];

    const row = this.buildRow();
    return row ? [row] : [];
  }

  private format(): string {
    const body = this.pages[this.index] ?? '';
    const footer = `\nPage ${this.index + 1}/${this.pages.length}`;
    const content = `\`\`\`${this.lang}\n${body}\n\`\`\`` + footer;

    if (content.length > 2000) return '```Output too large```';
    return content;
  }

  async init() {
    this.msg = await this.sourceMessage.reply({
      content: this.format(),
      components: this.buildComponents()
    });

    const collector = this.msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: this.timeout
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== this.sourceMessage.author.id) {
        return i.reply({
          content: 'Nice try diddy ;-;',
          flags: MessageFlags.Ephemeral
        });
      }

      if (i.customId === 'stop') {
        if (this.isShell() && !this.processKilled) {
          try {
            this.killProcess?.();
          } catch {}
          this.processKilled = true;
        }

        this.stopped = true;
        collector.stop();
        return i.update({ components: [] });
      }

      if (i.customId === 'prev' && this.index > 0) {
        this.index--;
      }

      if (i.customId === 'next' && this.index < this.pages.length - 1) {
        this.index++;
      }

      await i.update({
        content: this.format(),
        components: this.buildComponents()
      });
      return;
    });

    collector.on('end', async () => {
      if (!this.stopped) {
        await this.msg.edit({ components: [] }).catch(() => {});
      }
    });
  }

  updatePages(pages: string[]) {
    this.pages = pages;

    if (this.index >= pages.length) {
      this.index = Math.max(pages.length - 1, 0);
    }

    if (!this.msg || this.stopped) return;

    this.msg
      .edit({
        content: this.format(),
        components: this.buildComponents()
      })
      .catch(() => {});
  }

  markProcessKilled() {
    this.processKilled = true;
    if (!this.msg) return;
    this.msg.edit({ components: [] }).catch(() => {});
  }
}
