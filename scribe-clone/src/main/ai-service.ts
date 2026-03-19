import { RecordingStep } from '../common/types';

// uiohook-napi uses raw scan codes. This is a partial mapping for common keys.
const SCAN_CODE_MAP: Record<string, string> = {
  '1': 'Esc', '2': '1', '3': '2', '4': '3', '5': '4', '6': '5', '7': '6', '8': '7', '9': '8', '10': '9', '11': '0',
  '12': '-', '13': '=', '14': 'Backspace', '15': 'Tab', '16': 'q', '17': 'w', '18': 'e', '19': 'r', '20': 't',
  '21': 'y', '22': 'u', '23': 'i', '24': 'o', '25': 'p', '26': '[', '27': ']', '28': 'Enter', '29': 'Ctrl',
  '30': 'a', '31': 's', '32': 'd', '33': 'f', '34': 'g', '35': 'h', '36': 'j', '37': 'k', '38': 'l', '39': ';',
  '40': "'", '41': '`', '42': 'Shift', '43': '\\', '44': 'z', '45': 'x', '46': 'c', '47': 'v', '48': 'b',
  '49': 'n', '50': 'm', '51': ',', '52': '.', '53': '/', '54': 'Shift', '55': '*', '56': 'Alt', '57': ' ',
  '58': 'Caps Lock'
};

export class AIService {
  public static async generateDescription(step: RecordingStep): Promise<string> {
    const { action_type, metadata } = step;
    const target = this.inferTarget(step);

    if (action_type === 'keypress') {
      const key = SCAN_CODE_MAP[metadata.key!] || metadata.key;
      return `Press ${key} in ${metadata.app_name || 'the application'}`;
    }

    switch (action_type) {
      case 'click':
        return `Click on ${target} in ${metadata.app_name || 'the application'}`;
      case 'scroll':
        return `Scroll down to view content in ${metadata.app_name}`;
      case 'window-switch':
        return `Switch active window to ${metadata.app_name}`;
      default:
        return `Interaction detected in ${metadata.app_name}`;
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
            description: `Enter "${keyLabel}"`,
            metadata: { ...step.metadata, fullText: keyLabel }
          };
          groupedSteps.push(currentKeySequence);
        } else {
          currentKeySequence.metadata.fullText += keyLabel;
          currentKeySequence.description = `Enter "${currentKeySequence.metadata.fullText}"`;
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
