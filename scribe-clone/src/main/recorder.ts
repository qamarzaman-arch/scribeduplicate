import { uIOhook } from 'uiohook-napi';
// Fallback for different build environments or older versions
const hook = uIOhook || require('uiohook-napi').uIOhook;
import screenshot from 'screenshot-desktop';
import activeWin from 'active-win';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { RecordingStep, RecordingProcess } from '../common/types';
import { app } from 'electron';
import { AIService } from './ai-service';

export class Recorder {
  public isRecording: boolean = false;
  private currentProcess: RecordingProcess | null = null;
  private screenshotsDir: string;
  private lastActionTime: number = 0;
  private actionThreshold: number = 500; // ms

  constructor() {
    this.screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  public async startRecording(title: string = 'New Recording') {
    this.currentProcess = {
      id: uuidv4(),
      title,
      created_at: Date.now(),
      steps: [],
    };
    this.isRecording = true;

    hook.on('click', (e) => this.handleAction('click', { x: e.x, y: e.y }));
    hook.on('keydown', (e) => this.handleAction('keypress', { key: e.keycode.toString() }));

    hook.start();
    console.log('Recording started');
  }

  public stopRecording(): RecordingProcess | null {
    this.isRecording = false;
    hook.stop();
    hook.removeAllListeners();

    if (this.currentProcess) {
      // Apply Smart Grouping to captured steps
      this.currentProcess.steps = AIService.smartGroupActions(this.currentProcess.steps);
    }

    const process = this.currentProcess;
    this.currentProcess = null;
    console.log('Recording stopped');
    return process;
  }

  private async handleAction(type: RecordingStep['action_type'], metadata: any) {
    if (!this.isRecording || !this.currentProcess) return;

    // Advanced privacy masking: mask keys if we detect sensitive context OR common patterns
    if (type === 'keypress' && metadata.key) {
      const win = await activeWin();
      const title = win?.title.toLowerCase() || '';

      // Masking based on window context
      const isSensitiveContext = ['password', 'login', 'sign in', 'billing', 'credit card'].some(word => title.includes(word));

      // Masking based on content patterns (if metadata contains full text from smart grouping)
      const emailPattern = /\S+@\S+\.\S+/;
      const phonePattern = /\d{10,12}/;
      const isSensitiveContent = emailPattern.test(metadata.key) || phonePattern.test(metadata.key);

      if (isSensitiveContext || isSensitiveContent) {
        metadata.key = '****';
      }
    }

    const now = Date.now();
    if (now - this.lastActionTime < this.actionThreshold) return;
    this.lastActionTime = now;

    try {
      const win = await activeWin();
      const screenshotPath = await this.takeScreenshot(win);

      let step: RecordingStep = {
        id: uuidv4(),
        process_id: this.currentProcess.id,
        step_number: this.currentProcess.steps.length + 1,
        action_type: type,
        description: '', // Will be enhanced by AI
        screenshot_path: screenshotPath,
        timestamp: now,
        metadata: {
          ...metadata,
          window_title: win?.title,
          app_name: win?.owner.name,
          url: win && 'url' in win ? (win as any).url : undefined,
        },
      };

      step.description = await AIService.generateDescription(step);
      this.currentProcess.steps.push(step);
      // Emit event to renderer if needed
    } catch (err) {
      console.error('Error capturing action:', err);
    }
  }

  private async takeScreenshot(windowInfo?: any): Promise<string> {
    const filename = `screenshot-${Date.now()}.jpg`;
    const filepath = path.join(this.screenshotsDir, filename);

    try {
      // Improved multi-monitor support: capture the screen where the active window is located
      let screenId: any = undefined;
      if (windowInfo && windowInfo.bounds) {
        const screens = await screenshot.listDisplays();
        // Find the screen that contains the window's top-left corner
        const targetScreen = screens.find(s =>
          windowInfo.bounds.x >= s.offsetX &&
          windowInfo.bounds.x < s.offsetX + s.width &&
          windowInfo.bounds.y >= s.offsetY &&
          windowInfo.bounds.y < s.offsetY + s.height
        );
        if (targetScreen) screenId = targetScreen.id;
      }

      const imgBuffer = await screenshot({ format: 'jpg', screen: screenId });
      await sharp(imgBuffer)
        .resize(1280) // Resize for efficiency
        .jpeg({ quality: 80 })
        .toFile(filepath);
    } catch (err) {
      console.error('Screenshot capture failed, using placeholder:', err);
      // Create a solid color placeholder if capture fails (robustness)
      await sharp({ create: { width: 1280, height: 720, channels: 3, background: { r: 240, g: 240, b: 240 } } })
        .jpeg()
        .toFile(filepath);
    }

    return filepath;
  }
}
