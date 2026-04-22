import { buildStepDescription, buildStepTitle, humanizeKey } from '../common/process-helpers';
import { RecordingStep } from '../common/types';

export class AIService {
  public static async generateDescription(step: RecordingStep): Promise<string> {
    return buildStepDescription(step);
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
      const keyLabel = humanizeKey(step.metadata.key);
      const isChar = keyLabel && keyLabel.length === 1;

      if (step.action_type === 'keypress' && isChar) {
        if (!currentKeySequence) {
          currentKeySequence = {
            ...step,
            title: `Enter "${keyLabel}" in ${step.metadata.app_name || 'the application'}`,
            description: `Capture the required information by typing "${keyLabel}" in ${step.metadata.window_title || step.metadata.app_name || 'the application'}.`,
            metadata: { ...step.metadata, fullText: keyLabel }
          };
          groupedSteps.push(currentKeySequence);
        } else {
          currentKeySequence.metadata.fullText += keyLabel;
          currentKeySequence.title = buildStepTitle(currentKeySequence);
          currentKeySequence.description = buildStepDescription(currentKeySequence);
        }
      } else {
        currentKeySequence = null;
        step.title = buildStepTitle(step);
        step.description = buildStepDescription(step);
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
