const uiohookNapi = require('uiohook-napi');
const hook = uiohookNapi.uIOhook || uiohookNapi.default || uiohookNapi;
import activeWin from 'active-win';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { RecordingStep, RecordingProcess } from '../common/types';
import { app, desktopCapturer, screen as electronScreen } from 'electron';
import { AIService } from './ai-service';

/**
 * Advanced Recorder with:
 * - Continuous screen buffer (pre-captures screenshots on a timer)
 * - Instant step creation using the latest buffer
 * - Click highlighting baked into screenshots via sharp SVG composite
 * - Fault-tolerant design: each substep fails independently
 */
export class Recorder {
  public isRecording: boolean = false;
  private currentProcess: RecordingProcess | null = null;
  private screenshotsDir: string;
  private lastActionTime: number = 0;
  private actionThreshold: number = 300; // ms - lowered for fast users

  // Continuous screenshot buffer
  private screenBuffer: Buffer | null = null;
  private bufferInterval: ReturnType<typeof setInterval> | null = null;
  private bufferWidth: number = 1920;
  private bufferHeight: number = 1080;

  constructor() {
    this.screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  /**
   * Continuously captures the screen into a buffer so screenshots are available instantly.
   */
  private startScreenBuffer() {
    // Capture immediately once
    this.captureScreenToBuffer();

    // Then capture every 250ms
    this.bufferInterval = setInterval(() => {
      this.captureScreenToBuffer();
    }, 250);
  }

  private stopScreenBuffer() {
    if (this.bufferInterval) {
      clearInterval(this.bufferInterval);
      this.bufferInterval = null;
    }
    this.screenBuffer = null;
  }

  private async captureScreenToBuffer() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      });

      if (sources.length > 0) {
        const thumbnail = sources[0].thumbnail;
        if (!thumbnail.isEmpty()) {
          this.screenBuffer = thumbnail.toPNG();

          // Get actual dimensions from the buffer for accuracy
          try {
            const meta = await sharp(this.screenBuffer).metadata();
            this.bufferWidth = meta.width || 1920;
            this.bufferHeight = meta.height || 1080;
          } catch {
            // Use defaults
          }
        }
      }
    } catch (err) {
      // Don't log every failure - buffer capture is best-effort
    }
  }

  public async startRecording(title: string = 'New Recording') {
    console.log('[Recorder] startRecording called. hook type:', typeof hook, 'hook.on type:', typeof hook?.on);

    if (!hook || typeof hook.on !== 'function') {
      console.error('[Recorder] uiohook-napi engine not properly initialized. hook:', hook);
      throw new Error('Recording engine failed to initialize. Please check system permissions.');
    }

    this.currentProcess = {
      id: uuidv4(),
      title,
      created_at: Date.now(),
      steps: [],
    };
    this.isRecording = true;
    this.lastActionTime = 0;

    // Start continuous screen buffer
    this.startScreenBuffer();

    try {
      hook.removeAllListeners();

      hook.on('click', (e: any) => {
        console.log('[Recorder] click event received:', e.x, e.y);
        this.handleAction('click', { x: e.x, y: e.y }).catch((err: any) =>
          console.error('[Recorder] Unhandled error in click handler:', err)
        );
      });
      hook.on('keydown', (e: any) => {
        console.log('[Recorder] keydown event received:', e.keycode);
        this.handleAction('keypress', { key: e.keycode.toString() }).catch((err: any) =>
          console.error('[Recorder] Unhandled error in keydown handler:', err)
        );
      });

      hook.start();
      console.log('[Recorder] Hook started successfully. Recording is active.');
    } catch (err) {
      console.error('[Recorder] Failed to start uiohook engine:', err);
      this.isRecording = false;
      this.stopScreenBuffer();
      throw err;
    }
  }

  public stopRecording(): RecordingProcess | null {
    console.log('[Recorder] stopRecording called. Steps captured so far:', this.currentProcess?.steps.length ?? 0);
    this.isRecording = false;
    this.stopScreenBuffer();

    if (hook && typeof hook.stop === 'function') {
      try {
        hook.stop();
        hook.removeAllListeners();
      } catch (err) {
        console.error('[Recorder] Error stopping uiohook engine:', err);
      }
    }

    if (this.currentProcess) {
      console.log('[Recorder] Raw steps before smart grouping:', this.currentProcess.steps.length);
      this.currentProcess.steps = AIService.smartGroupActions(this.currentProcess.steps);
      console.log('[Recorder] Steps after smart grouping:', this.currentProcess.steps.length);
    }

    const process = this.currentProcess;
    this.currentProcess = null;
    console.log('[Recorder] Recording stopped. Returning process with', process?.steps.length ?? 0, 'steps');
    return process;
  }

  private async handleAction(type: RecordingStep['action_type'], metadata: any) {
    if (!this.isRecording || !this.currentProcess) return;
    const processRef = this.currentProcess;

    const now = Date.now();
    if (now - this.lastActionTime < this.actionThreshold) return;
    this.lastActionTime = now;

    console.log(`[Recorder] handleAction called: type=${type}`);

    // STEP 1: Grab the pre-buffered screenshot IMMEDIATELY (this is instant)
    const instantBuffer = this.screenBuffer;

    // Get active window info (non-fatal)
    let win: any = null;
    try {
      win = await activeWin();
      if (!win) {
        console.warn('[Recorder] activeWin() returned null');
      } else {
        console.log(`[Recorder] activeWin focus: ${win.owner?.name || 'Unknown App'} - ${win.title || 'Untitled Window'}`);
      }
    } catch (err: any) {
      console.warn('[Recorder] activeWin() failed:', err.message || err);
    }

    const windowTitle = win?.title || 'Active Window';
    const appName = win?.owner?.name || 'Application';

    // Privacy masking for keypresses
    if (type === 'keypress' && metadata.key) {
      const title = win?.title?.toLowerCase() || '';
      const isSensitiveContext = ['password', 'login', 'sign in', 'billing', 'credit card'].some(word => title.includes(word));
      const emailPattern = /\S+@\S+\.\S+/;
      const phonePattern = /\d{10,12}/;
      const isSensitiveContent = emailPattern.test(metadata.key) || phonePattern.test(metadata.key);
      if (isSensitiveContext || isSensitiveContent) {
        metadata.key = '****';
      }
    }

    // STEP 3: Save the screenshot with optional click highlight
    let screenshotPath = '';
    try {
      screenshotPath = await this.saveScreenshot(
        instantBuffer,
        type === 'click' ? metadata : null
      );
    } catch (err) {
      console.warn('[Recorder] Screenshot save failed (non-fatal):', err);
    }

    // STEP 4: Build the step
    const step: RecordingStep = {
      id: uuidv4(),
      process_id: processRef.id,
      step_number: processRef.steps.length + 1,
      action_type: type,
      description: '',
      screenshot_path: screenshotPath,
      timestamp: now,
      metadata: {
        ...metadata,
        window_title: windowTitle,
        app_name: appName,
        url: win && 'url' in win ? (win as any).url : undefined,
      },
    };

    // STEP 5: Generate description (non-fatal)
    try {
      step.description = await AIService.generateDescription(step);
    } catch (err) {
      console.warn('[Recorder] AI description failed (non-fatal):', err);
      step.description = `${type} action in ${step.metadata.app_name || 'application'}`;
    }

    processRef.steps.push(step);
    console.log(`[Recorder] Step captured! Total steps: ${processRef.steps.length}, screenshot: ${screenshotPath ? 'YES' : 'NO'}`);
  }

  /**
   * Saves a screenshot from the pre-captured buffer.
   * If the buffer is null, takes a fresh capture as fallback.
   * Optionally draws a click highlight on the image.
   */
  private async saveScreenshot(
    buffer: Buffer | null,
    clickMetadata?: { x: number; y: number } | null
  ): Promise<string> {
    const filename = `screenshot-${Date.now()}.jpg`;
    const filepath = path.join(this.screenshotsDir, filename);

    try {
      let imgBuffer = buffer;

      // Fallback: if no buffer available, try to capture now
      if (!imgBuffer) {
        console.log('[Recorder] No buffer available, capturing fresh screenshot...');
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 },
        });
        if (sources.length > 0 && !sources[0].thumbnail.isEmpty()) {
          imgBuffer = sources[0].thumbnail.toPNG();
        }
      }

      // If we still don't have an image, create a placeholder
      if (!imgBuffer) {
        console.warn('[Recorder] No screenshot data available, creating placeholder');
        await sharp({
          create: { width: 1920, height: 1080, channels: 3, background: { r: 240, g: 240, b: 240 } }
        }).jpeg({ quality: 85 }).toFile(filepath);
        return filepath;
      }

      // Get real dimensions
      const imgMeta = await sharp(imgBuffer).metadata();
      const imgWidth = imgMeta.width || 1920;
      const imgHeight = imgMeta.height || 1080;

      // If click action, composite a highlight circle onto the image
      if (clickMetadata && clickMetadata.x !== undefined && clickMetadata.y !== undefined) {
        const primaryDisplay = electronScreen.getPrimaryDisplay();
        const scaleFactor = primaryDisplay.scaleFactor || 1;
        const screenWidth = primaryDisplay.size.width;
        const screenHeight = primaryDisplay.size.height;

        // Scale click coordinates from screen space to image space
        const scaledX = Math.round((clickMetadata.x / screenWidth) * imgWidth);
        const scaledY = Math.round((clickMetadata.y / screenHeight) * imgHeight);

        // Clamp to image bounds
        const cx = Math.max(0, Math.min(scaledX, imgWidth));
        const cy = Math.max(0, Math.min(scaledY, imgHeight));

        const r = 30; // circle radius
        const svgOverlay = Buffer.from(`
          <svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
            <!-- Outer glow -->
            <circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="none" stroke="rgba(255,50,50,0.3)" stroke-width="6"/>
            <!-- Main ring -->
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,50,50,0.18)" stroke="#FF3232" stroke-width="4"/>
            <!-- Center dot -->
            <circle cx="${cx}" cy="${cy}" r="5" fill="#FF3232"/>
            <!-- Crosshair -->
            <line x1="${cx - r - 10}" y1="${cy}" x2="${cx - r + 5}" y2="${cy}" stroke="#FF3232" stroke-width="3" stroke-linecap="round"/>
            <line x1="${cx + r - 5}" y1="${cy}" x2="${cx + r + 10}" y2="${cy}" stroke="#FF3232" stroke-width="3" stroke-linecap="round"/>
            <line x1="${cx}" y1="${cy - r - 10}" x2="${cx}" y2="${cy - r + 5}" stroke="#FF3232" stroke-width="3" stroke-linecap="round"/>
            <line x1="${cx}" y1="${cy + r - 5}" x2="${cx}" y2="${cy + r + 10}" stroke="#FF3232" stroke-width="3" stroke-linecap="round"/>
          </svg>
        `);

        await sharp(imgBuffer)
          .composite([{ input: svgOverlay, top: 0, left: 0 }])
          .jpeg({ quality: 85 })
          .toFile(filepath);
      } else {
        // No click — just save the screenshot as-is
        await sharp(imgBuffer)
          .jpeg({ quality: 85 })
          .toFile(filepath);
      }

      console.log('[Recorder] Screenshot saved:', filepath);
    } catch (err) {
      console.error('[Recorder] Screenshot processing failed:', err);
      // Create placeholder
      try {
        await sharp({
          create: { width: 1920, height: 1080, channels: 3, background: { r: 240, g: 240, b: 240 } }
        }).jpeg({ quality: 85 }).toFile(filepath);
      } catch {
        // If even placeholder fails, return empty path
        return '';
      }
    }

    return filepath;
  }
}
