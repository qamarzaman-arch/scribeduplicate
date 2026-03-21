export interface RecordingStep {
  id: string;
  process_id: string;
  step_number: number;
  action_type: 'click' | 'keypress' | 'scroll' | 'window-switch';
  description: string;
  screenshot_path: string;
  timestamp: number;
  metadata: {
    x?: number;
    y?: number;
    key?: string;
    fullText?: string;
    window_title?: string;
    app_name?: string;
    url?: string;
  };
}

export interface RecordingProcess {
  id: string;
  title: string;
  created_at: number;
  steps: RecordingStep[];
}
