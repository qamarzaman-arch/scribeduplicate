import { RecordingStep } from '../common/types';

export class AIService {
  public static async generateDescription(step: RecordingStep): Promise<string> {
    const { action_type, metadata } = step;
    const target = this.inferTarget(step);

    switch (action_type) {
      case 'click':
        return `Click on ${target} in ${metadata.app_name || 'the application'}`;
      case 'keypress':
        // Map common keys to labels
        const keyMap: Record<string, string> = { '13': 'Enter', '32': 'Space', '9': 'Tab', '27': 'Esc' };
        const key = keyMap[metadata.key!] || metadata.key;
        return `Press ${key} in ${metadata.app_name || 'the field'}`;
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
      // Future: use Vision AI to identify button names or UI labels
      return `control at (${metadata.x}, ${metadata.y})`;
    }
    return 'element';
  }

  public static smartGroupActions(steps: RecordingStep[]): RecordingStep[] {
    const groupedSteps: RecordingStep[] = [];
    let currentKeySequence: RecordingStep | null = null;

    for (const step of steps) {
      if (step.action_type === 'keypress' && step.metadata.key!.length === 1) {
        // Character key, start or continue a sequence
        if (!currentKeySequence) {
          currentKeySequence = {
            ...step,
            description: `Enter "${step.metadata.key}"`,
            metadata: { ...step.metadata, fullText: step.metadata.key }
          };
          groupedSteps.push(currentKeySequence);
        } else {
          currentKeySequence.metadata.fullText += step.metadata.key;
          currentKeySequence.description = `Enter "${currentKeySequence.metadata.fullText}"`;
        }
      } else {
        // Other action or non-character key, break sequence
        currentKeySequence = null;
        groupedSteps.push(step);
      }
    }

    // Re-index steps
    return groupedSteps.map((s, i) => ({ ...s, step_number: i + 1 }));
  }

  public static async suggestTitle(steps: RecordingStep[]): Promise<string> {
    if (steps.length === 0) return 'New Guide';
    const primaryApp = steps[0].metadata.app_name || 'App';
    return `Process for ${primaryApp} (${steps.length} steps)`;
  }
}
