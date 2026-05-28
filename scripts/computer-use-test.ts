#!/usr/bin/env tsx
/**
 * Girify Computer Use Test
 *
 * Uses Anthropic's Computer Use API + Playwright to let Claude autonomously
 * interact with Girify in a real browser.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/computer-use-test.ts "Play a full game round"
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/computer-use-test.ts "Verify the leaderboard loads"
 *
 * Requires the dev server to be running: npm run dev
 */

import Anthropic from '@anthropic-ai/sdk';
import { chromium, type Page } from '@playwright/test';

// ─── Config ────────────────────────────────────────────────────────────────
//
// WARNING: Do NOT run this in CI with a staging/production URL.
// With ANTHROPIC_API_KEY set and GIRIFY_URL pointing to a live environment,
// this script will autonomously interact with the app (up to MAX_ITERATIONS=40
// turns) and incur real API costs. Run only locally against a dev server.

const BASE_URL = process.env.GIRIFY_URL ?? 'http://localhost:5173';
const DISPLAY_WIDTH = 1280;
const DISPLAY_HEIGHT = 800;
const MAX_ITERATIONS = 40;

// ─── Types ──────────────────────────────────────────────────────────────────

type ComputerAction =
  | { action: 'screenshot' }
  | { action: 'left_click'; coordinate: [number, number]; text?: string }
  | { action: 'right_click'; coordinate: [number, number] }
  | { action: 'double_click'; coordinate: [number, number] }
  | { action: 'triple_click'; coordinate: [number, number] }
  | { action: 'mouse_move'; coordinate: [number, number] }
  | { action: 'type'; text: string }
  | { action: 'key'; text: string }
  | {
      action: 'scroll';
      coordinate: [number, number];
      scroll_direction: 'up' | 'down' | 'left' | 'right';
      scroll_amount: number;
    }
  | { action: 'wait' }
  | { action: 'zoom'; region: [number, number, number, number] };

// ─── Screenshot helper ──────────────────────────────────────────────────────

async function takeScreenshot(page: Page): Promise<string> {
  const buffer = await page.screenshot({ type: 'png' });
  return buffer.toString('base64');
}

// ─── Action executor ────────────────────────────────────────────────────────

async function executeAction(page: Page, input: ComputerAction): Promise<string> {
  switch (input.action) {
    case 'screenshot': {
      const b64 = await takeScreenshot(page);
      return b64; // returned as image content below
    }

    case 'left_click': {
      const [x, y] = input.coordinate;
      const modifiers: ('Alt' | 'Control' | 'Meta' | 'Shift')[] = [];
      if (input.text === 'shift') modifiers.push('Shift');
      if (input.text === 'ctrl') modifiers.push('Control');
      if (input.text === 'alt') modifiers.push('Alt');
      if (input.text === 'super') modifiers.push('Meta');
      await page.mouse.click(x, y, { modifiers: modifiers.length ? modifiers : undefined });
      return `Clicked at (${x}, ${y})`;
    }

    case 'right_click': {
      const [x, y] = input.coordinate;
      await page.mouse.click(x, y, { button: 'right' });
      return `Right-clicked at (${x}, ${y})`;
    }

    case 'double_click': {
      const [x, y] = input.coordinate;
      await page.mouse.dblclick(x, y);
      return `Double-clicked at (${x}, ${y})`;
    }

    case 'triple_click': {
      const [x, y] = input.coordinate;
      await page.mouse.click(x, y, { clickCount: 3 });
      return `Triple-clicked at (${x}, ${y})`;
    }

    case 'mouse_move': {
      const [x, y] = input.coordinate;
      await page.mouse.move(x, y);
      return `Moved mouse to (${x}, ${y})`;
    }

    case 'type': {
      await page.keyboard.type(input.text);
      return `Typed: "${input.text}"`;
    }

    case 'key': {
      // Convert Anthropic key format to Playwright format
      const key = input.text
        .replace(/\+/g, '+')
        .replace('ctrl', 'Control')
        .replace('cmd', 'Meta')
        .replace('alt', 'Alt')
        .replace('shift', 'Shift')
        .replace('enter', 'Enter')
        .replace('Return', 'Enter')
        .replace('escape', 'Escape')
        .replace('Escape', 'Escape')
        .replace('tab', 'Tab')
        .replace('space', 'Space')
        .replace('backspace', 'Backspace')
        .replace('delete', 'Delete')
        .replace('up', 'ArrowUp')
        .replace('down', 'ArrowDown')
        .replace('left', 'ArrowLeft')
        .replace('right', 'ArrowRight');
      await page.keyboard.press(key);
      return `Pressed key: ${input.text}`;
    }

    case 'scroll': {
      const [x, y] = input.coordinate;
      await page.mouse.move(x, y);
      const deltaX =
        input.scroll_direction === 'right'
          ? 100 * input.scroll_amount
          : input.scroll_direction === 'left'
            ? -100 * input.scroll_amount
            : 0;
      const deltaY =
        input.scroll_direction === 'down'
          ? 100 * input.scroll_amount
          : input.scroll_direction === 'up'
            ? -100 * input.scroll_amount
            : 0;
      await page.mouse.wheel(deltaX, deltaY);
      return `Scrolled ${input.scroll_direction} by ${input.scroll_amount} at (${x}, ${y})`;
    }

    case 'wait': {
      await page.waitForTimeout(1000);
      return 'Waited 1 second';
    }

    case 'zoom': {
      // Zoom isn't a real browser action — take a cropped screenshot instead
      const [x1, y1, x2, y2] = input.region;
      const buffer = await page.screenshot({
        type: 'png',
        clip: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
      });
      return buffer.toString('base64'); // handled as image below
    }

    default:
      return `Unknown action: ${(input as { action: string }).action}`;
  }
}

// ─── Main agent loop ─────────────────────────────────────────────────────────

async function run(prompt: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log(`\n🌍 Launching browser → ${BASE_URL}`);
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  await page.setViewportSize({ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Give the page a moment to render
  await page.waitForTimeout(1500);

  console.log(`🤖 Task: "${prompt}"\n`);

  // Take initial screenshot
  const initialScreenshot = await takeScreenshot(page);

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: initialScreenshot },
        },
        {
          type: 'text',
          text: `You are testing the Girify web app (a Barcelona street geography quiz). The browser is already open at ${BASE_URL}.\n\nTask: ${prompt}\n\nAfter each action, take a screenshot to verify the result before proceeding. Be methodical.`,
        },
      ],
    },
  ];

  const tools: Anthropic.Beta.BetaToolUnionParam[] = [
    {
      type: 'computer_20251124',
      name: 'computer',
      display_width_px: DISPLAY_WIDTH,
      display_height_px: DISPLAY_HEIGHT,
    },
  ];

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`── Iteration ${iterations}/${MAX_ITERATIONS} ──`);

    const response = await client.beta.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      tools,
      messages,
      betas: ['computer-use-2025-11-24'],
      system:
        'You are an expert QA tester for web applications. Interact with the browser precisely and verify each step. When you complete the task, summarize what you found.',
    });

    // Append Claude's response to history
    messages.push({ role: 'assistant', content: response.content });

    // Collect tool calls
    const toolResults: Anthropic.Beta.BetaToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        console.log(`💬 Claude: ${block.text}`);
      }

      if (block.type === 'tool_use' && block.name === 'computer') {
        const input = block.input as ComputerAction;
        console.log(
          `🖱  Action: ${input.action}${
            'coordinate' in input ? ` @ (${input.coordinate.join(', ')})` : ''
          }${'text' in input && input.action !== 'left_click' ? ` "${input.text}"` : ''}`
        );

        try {
          const result = await executeAction(page, input);

          // Wait for UI to settle after clicks
          if (input.action !== 'screenshot' && input.action !== 'zoom' && input.action !== 'wait') {
            await page.waitForTimeout(400);
          }

          // For screenshot/zoom, result is base64 — return as image
          if (input.action === 'screenshot' || input.action === 'zoom') {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/png', data: result },
                },
              ],
            });
          } else {
            // For other actions, take a screenshot automatically so Claude can see the result
            const afterScreenshot = await takeScreenshot(page);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: [
                { type: 'text', text: result },
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/png', data: afterScreenshot },
                },
              ],
            });
          }
        } catch (err) {
          console.error(`  ❌ Action failed:`, err);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: `Error: ${err instanceof Error ? err.message : String(err)}`,
            is_error: true,
          });
        }
      }
    }

    // If no tool calls → Claude is done
    if (toolResults.length === 0) {
      console.log('\n✅ Task complete.');
      break;
    }

    messages.push({ role: 'user', content: toolResults });
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn(`\n⚠️  Reached max iterations (${MAX_ITERATIONS}). Stopping.`);
  }

  console.log('\nPress Ctrl+C to close the browser, or it will close in 10s...');
  await page.waitForTimeout(10_000);
  await browser.close();
}

// ─── Entry point ─────────────────────────────────────────────────────────────

const prompt =
  process.argv.slice(2).join(' ') ||
  'Take a screenshot and describe what you see on the Girify homepage';

run(prompt).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
