export type RecordingActionType = 'click' | 'keypress' | 'scroll' | 'window-switch';

export type StepClassification = 'process' | 'step' | 'business-rule' | 'exception';

export interface GuideIntakeDetails {
  processName: string;
  objective: string;
  owner: string;
  frequency: string;
  expectedCompletionTime: string;
  contactEmail: string;
}

export interface StepHighlight {
  kind: 'click' | 'keypress' | 'scroll' | 'window-switch';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label: string;
}

export interface FlowNode {
  id: string;
  stepId?: string;
  type: StepClassification | 'start' | 'end';
  label: string;
  detail?: string;
  sequenceLabel?: string;
  column?: number;
  row?: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface FlowDiagram {
  generated_at: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface StepBranch {
  id: string;
  outcome_label: string;
  condition: string;
  return_to_main: boolean;
  steps: RecordingStep[];
}

export interface RecordingStep {
  id: string;
  process_id: string;
  step_number: number;
  action_type: RecordingActionType;
  step_kind: StepClassification;
  title: string;
  description: string;
  screenshot_path: string;
  timestamp: number;
  branches?: StepBranch[];
  metadata: {
    x?: number;
    y?: number;
    screenshotWidth?: number;
    screenshotHeight?: number;
    key?: string;
    fullText?: string;
    window_title?: string;
    app_name?: string;
    url?: string;
    highlight?: StepHighlight;
  };
}

export interface RecordingProcess {
  id: string;
  title: string;
  created_at: number;
  intake: GuideIntakeDetails;
  flow_diagram?: FlowDiagram;
  steps: RecordingStep[];
}
