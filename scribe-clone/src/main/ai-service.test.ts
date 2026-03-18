import { describe, it, expect } from 'vitest';
import { AIService } from './ai-service';
import { RecordingStep } from '../common/types';

describe('AIService', () => {
  it('generates correct description for click', async () => {
    const step: RecordingStep = {
      id: '1',
      process_id: 'p1',
      step_number: 1,
      action_type: 'click',
      description: '',
      screenshot_path: '',
      timestamp: Date.now(),
      metadata: { x: 100, y: 200, app_name: 'Chrome', window_title: 'Google' }
    };
    const desc = await AIService.generateDescription(step);
    expect(desc).toContain('Click on');
    expect(desc).toContain('in Chrome');
    expect(desc).toContain('(100, 200)');
  });

  it('generates correct description for keypress', async () => {
    const step: RecordingStep = {
      id: '2',
      process_id: 'p1',
      step_number: 2,
      action_type: 'keypress',
      description: '',
      screenshot_path: '',
      timestamp: Date.now(),
      metadata: { key: 'Enter', app_name: 'Slack' }
    };
    const desc = await AIService.generateDescription(step);
    expect(desc).toBe('Press Enter in Slack');
  });
});
