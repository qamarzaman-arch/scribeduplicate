import { RecordingStep } from '../common/types';

// uiohook-napi uses raw scan codes. This is a partial mapping for common keys.
const SCAN_CODE_MAP: Record<string, string> = {
  '1': 'Esc', '2': '1', '3': '2', '4': '3', '5': '4', '6': '5', '7': '6', '8': '7', '9': '8', '10': '9', '11': '0',
  '12': '-', '13': '=', '14': 'Backspace', '15': 'Tab', '16': 'q', '17': 'w', '18': 'e', '19': 'r', '20': 't',
  '21': 'y', '22': 'u', '23': 'i', '24': 'o', '25': 'p', '26': '[', '27': ']', '28': 'Enter', '29': 'Ctrl',
  '30': 'a', '31': 's', '32': 'd', '33': 'f', '34': 'g', '35': 'h', '36': 'j', '37': 'k', '38': 'l', '39': ';',
  '40': "'", '41': '`', '42': 'Shift', '43': '\\', '44': 'z', '45': 'x', '46': 'c', '47': 'v', '48': 'b',
  '49': 'n', '50': 'm', '51': ',', '52': '.', '53': '/', '54': 'Shift', '55': '*', '56': 'Alt', '57': 'Space',
  '58': 'Caps Lock',
  // Extended keys
  '3613': 'Ctrl', '3640': 'Alt', '3675': 'Win', '3676': 'Win',
  '57419': 'Left Arrow', '57416': 'Up Arrow', '57421': 'Right Arrow', '57424': 'Down Arrow',
  '3655': 'Home', '3663': 'End', '3657': 'Page Up', '3665': 'Page Down',
  '3666': 'Insert', '3667': 'Delete',
  '59': 'F1', '60': 'F2', '61': 'F3', '62': 'F4', '63': 'F5', '64': 'F6',
  '65': 'F7', '66': 'F8', '67': 'F9', '68': 'F10', '87': 'F11', '88': 'F12'
};

// Common UI element patterns based on screen position
function inferClickTarget(x: number, y: number, screenWidth: number, screenHeight: number, windowTitle: string, appName: string): string {
  const relX = x / screenWidth;
  const relY = y / screenHeight;

  // Taskbar area (bottom of screen, typically last 40-50 px)
  if (relY > 0.95) {
    if (relX < 0.05) return 'the Start menu button on the taskbar';
    if (relX > 0.85) return 'the system tray area on the taskbar';
    return `the "${appName}" icon on the taskbar`;
  }

  // Title bar area (top 30-40 px of a window)
  if (relY < 0.04) {
    if (relX > 0.95) return 'the Close button (X)';
    if (relX > 0.90) return 'the Maximize/Restore button';
    if (relX > 0.85) return 'the Minimize button';
    return `the title bar of "${windowTitle}"`;
  }

  // Menu bar / ribbon area
  if (relY < 0.08) {
    return `a menu or toolbar option in "${appName}"`;
  }

  // Navigation / sidebar area (left edge)
  if (relX < 0.15) {
    return `a navigation item in the sidebar of "${appName}"`;
  }

  // Right panel area
  if (relX > 0.85) {
    return `a panel or control on the right side of "${appName}"`;
  }

  // Generic content area
  return `a UI element in "${windowTitle || appName}"`;
}

export class AIService {
  public static async generateDescription(step: RecordingStep): Promise<string> {
    const { action_type, metadata } = step;
    const appName = metadata.app_name || 'the application';
    const windowTitle = metadata.window_title || '';

    if (action_type === 'keypress') {
      const key = SCAN_CODE_MAP[metadata.key!] || `Key ${metadata.key}`;
      // Special keys get more descriptive text
      if (['Enter', 'Tab', 'Esc', 'Backspace', 'Delete', 'Space'].includes(key)) {
        return `Press the ${key} key in ${appName}`;
      }
      if (key.startsWith('F') && key.length <= 3) {
        return `Press the ${key} function key in ${appName}`;
      }
      if (['Ctrl', 'Alt', 'Shift', 'Win'].includes(key)) {
        return `Press the ${key} modifier key in ${appName}`;
      }
      if (['Left Arrow', 'Right Arrow', 'Up Arrow', 'Down Arrow'].includes(key)) {
        return `Press the ${key} key to navigate in ${appName}`;
      }
      return `Type "${key}" in ${appName}`;
    }

    if (action_type === 'click') {
      const x = metadata.x || 0;
      const y = metadata.y || 0;

      // Infer what was clicked based on position and window context
      const target = inferClickTarget(x, y, 1920, 1080, windowTitle, appName);
      return `Click on ${target}`;
    }

    switch (action_type) {
      case 'scroll':
        return `Scroll to view more content in ${appName}`;
      case 'window-switch':
        return `Switch to "${windowTitle}" in ${appName}`;
      default:
        return `Interact with ${appName}`;
    }
  }

  private static inferTarget(step: RecordingStep): string {
    const { metadata } = step;
    if (metadata.x && metadata.y) {
      return `control at (${metadata.x}, ${metadata.y})`;
    }
    return 'element';
  }

  public static smartGroupActions(steps: RecordingStep[]): RecordingStep[] {
    const groupedSteps: RecordingStep[] = [];
    let currentKeySequence: RecordingStep | null = null;

    for (const step of steps) {
      const keyLabel = SCAN_CODE_MAP[step.metadata.key!] || step.metadata.key;
      const isChar = keyLabel && keyLabel.length === 1;

      if (step.action_type === 'keypress' && isChar) {
        if (!currentKeySequence) {
          currentKeySequence = {
            ...step,
            description: `Type "${keyLabel}" in ${step.metadata.app_name || 'the application'}`,
            metadata: { ...step.metadata, fullText: keyLabel }
          };
          groupedSteps.push(currentKeySequence);
        } else {
          currentKeySequence.metadata.fullText += keyLabel;
          currentKeySequence.description = `Type "${currentKeySequence.metadata.fullText}" in ${step.metadata.app_name || 'the application'}`;
        }
      } else {
        currentKeySequence = null;
        groupedSteps.push(step);
      }
    }

    return groupedSteps.map((s, i) => ({ ...s, step_number: i + 1 }));
  }

  public static async suggestTitle(steps: RecordingStep[]): Promise<string> {
    if (steps.length === 0) return 'New Guide';
    const primaryApp = steps[0].metadata.app_name || 'App';
    return `Process for ${primaryApp} (${steps.length} steps)`;
  }
}
