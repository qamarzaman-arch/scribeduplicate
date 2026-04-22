import {
  FlowDiagram,
  GuideIntakeDetails,
  RecordingProcess,
  RecordingStep,
  RecordingActionType,
  StepBranch,
  StepClassification,
  StepHighlight
} from './types';

export const STEP_KIND_LABELS: Record<StepClassification, string> = {
  process: 'Process Stage',
  step: 'Action Step',
  'business-rule': 'Decision Rule',
  exception: 'Exception Path'
};

export const ACTION_LABELS: Record<RecordingActionType, string> = {
  click: 'Click',
  keypress: 'Type',
  scroll: 'Scroll',
  'window-switch': 'Switch'
};

export const SCAN_CODE_MAP: Record<string, string> = {
  '1': 'Esc', '2': '1', '3': '2', '4': '3', '5': '4', '6': '5', '7': '6', '8': '7', '9': '8', '10': '9', '11': '0',
  '12': '-', '13': '=', '14': 'Backspace', '15': 'Tab', '16': 'Q', '17': 'W', '18': 'E', '19': 'R', '20': 'T',
  '21': 'Y', '22': 'U', '23': 'I', '24': 'O', '25': 'P', '26': '[', '27': ']', '28': 'Enter', '29': 'Ctrl',
  '30': 'A', '31': 'S', '32': 'D', '33': 'F', '34': 'G', '35': 'H', '36': 'J', '37': 'K', '38': 'L', '39': ';',
  '40': "'", '41': '`', '42': 'Shift', '43': '\\', '44': 'Z', '45': 'X', '46': 'C', '47': 'V', '48': 'B',
  '49': 'N', '50': 'M', '51': ',', '52': '.', '53': '/', '54': 'Shift', '55': '*', '56': 'Alt', '57': 'Space',
  '58': 'Caps Lock', '3613': 'Ctrl', '3640': 'Alt', '3675': 'Win', '3676': 'Win',
  '57419': 'Left Arrow', '57416': 'Up Arrow', '57421': 'Right Arrow', '57424': 'Down Arrow',
  '3655': 'Home', '3663': 'End', '3657': 'Page Up', '3665': 'Page Down',
  '3666': 'Insert', '3667': 'Delete',
  '59': 'F1', '60': 'F2', '61': 'F3', '62': 'F4', '63': 'F5', '64': 'F6',
  '65': 'F7', '66': 'F8', '67': 'F9', '68': 'F10', '87': 'F11', '88': 'F12'
};

export function humanizeKey(rawKey?: string) {
  if (!rawKey) return 'input';
  return SCAN_CODE_MAP[rawKey] || `Key ${rawKey}`;
}

function inferClickTarget(x: number, y: number, screenWidth: number, screenHeight: number, windowTitle: string, appName: string): string {
  const relX = x / screenWidth;
  const relY = y / screenHeight;

  if (relY > 0.95) {
    if (relX < 0.05) return 'Start menu';
    if (relX > 0.85) return 'system tray';
    return `${appName} on the taskbar`;
  }

  if (relY < 0.04) {
    if (relX > 0.95) return 'Close';
    if (relX > 0.9) return 'Maximize or Restore';
    if (relX > 0.85) return 'Minimize';
    return `${windowTitle || appName} title bar`;
  }

  if (relY < 0.08) return `${appName} menu or toolbar`;
  if (relX < 0.15) return `${appName} navigation panel`;
  if (relX > 0.85) return `${appName} side panel`;

  return windowTitle ? `${windowTitle}` : `${appName}`;
}

export function buildStepTitle(step: Pick<RecordingStep, 'action_type' | 'metadata'>) {
  const appName = step.metadata.app_name || 'the application';
  const windowTitle = step.metadata.window_title || '';

  if (step.action_type === 'keypress') {
    const fullText = step.metadata.fullText;
    const key = humanizeKey(step.metadata.key);
    if (fullText) return `Enter the required information in ${appName}`;
    if (['Enter', 'Tab', 'Esc', 'Backspace', 'Delete', 'Space'].includes(key)) {
      return `Confirm the action in ${appName}`;
    }
    if (['Left Arrow', 'Right Arrow', 'Up Arrow', 'Down Arrow'].includes(key)) {
      return `Navigate within ${appName}`;
    }
    return `Use the keyboard in ${appName}`;
  }

  if (step.action_type === 'click') {
    const target = inferClickTarget(step.metadata.x || 0, step.metadata.y || 0, 1920, 1080, windowTitle, appName);
    return `Select the relevant option in ${target}`;
  }

  if (step.action_type === 'scroll') return `Review the next section in ${appName}`;
  if (step.action_type === 'window-switch') return `Move to ${windowTitle || appName}`;

  return `Continue the process in ${appName}`;
}

export function buildStepDescription(step: Pick<RecordingStep, 'action_type' | 'metadata'>) {
  const appName = step.metadata.app_name || 'the application';
  const windowTitle = step.metadata.window_title || appName;

  if (step.action_type === 'keypress') {
    if (step.metadata.fullText) return `Enter the required information in ${windowTitle} and verify that the details are correct before continuing.`;
    return `Use the keyboard in ${windowTitle} to complete the required entry for this step.`;
  }

  if (step.action_type === 'click') {
    return `Select the highlighted area in ${windowTitle} to continue the process. Confirm that the correct option has been chosen before moving to the next step.`;
  }

  if (step.action_type === 'scroll') {
    return `Scroll within ${windowTitle} until the next required section or information is visible on screen.`;
  }

  if (step.action_type === 'window-switch') {
    return `Bring ${windowTitle} to the front so the process can continue in the correct application context.`;
  }

  return `Continue the documented process in ${appName}.`;
}

export function buildStepHighlight(step: Pick<RecordingStep, 'action_type' | 'metadata'>): StepHighlight {
  if (step.action_type === 'click') {
    return {
      kind: 'click',
      x: step.metadata.x,
      y: step.metadata.y,
      label: 'Selected area'
    };
  }

  if (step.action_type === 'keypress') {
    return {
      kind: 'keypress',
      x: 48,
      y: 48,
      width: 380,
      height: 120,
      label: step.metadata.fullText ? 'Required information entered' : `Keyboard action: ${humanizeKey(step.metadata.key)}`
    };
  }

  if (step.action_type === 'scroll') {
    return {
      kind: 'scroll',
      x: 48,
      y: 48,
      width: 320,
      height: 120,
      label: 'Scroll to review the next section'
    };
  }

  return {
    kind: 'window-switch',
    x: 48,
    y: 48,
    width: 420,
    height: 120,
    label: `Active window: ${step.metadata.window_title || step.metadata.app_name || 'Current window'}`
  };
}

export function createEmptyStep(processId: string, stepNumber: number): RecordingStep {
  return {
    id: globalThis.crypto?.randomUUID?.() || `step-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    process_id: processId,
    step_number: stepNumber,
    action_type: 'click',
    step_kind: 'step',
    title: 'Describe the branch step',
    description: 'Explain what should happen when this branch is followed.',
    screenshot_path: '',
    timestamp: Date.now(),
    branches: [],
    metadata: {
      app_name: 'Manual step',
      window_title: 'Branch flow',
      screenshotWidth: 1920,
      screenshotHeight: 1080,
      highlight: {
        kind: 'click',
        x: 120,
        y: 120,
        label: 'Manual branch step'
      }
    }
  };
}

export function createEmptyBranch(processId: string): StepBranch {
  return {
    id: globalThis.crypto?.randomUUID?.() || `branch-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    outcome_label: 'If yes',
    condition: 'Describe the decision or condition that triggers this path.',
    return_to_main: true,
    steps: [createEmptyStep(processId, 1)]
  };
}

function flattenAllSteps(steps: RecordingStep[]): RecordingStep[] {
  return steps;
}

export function getAllSteps(process: RecordingProcess) {
  return flattenAllSteps(process.steps || []);
}

export function generateFlowDiagram(process: RecordingProcess): FlowDiagram {
  const nodes: FlowDiagram['nodes'] = [];
  const edges: FlowDiagram['edges'] = [];
  let rowCursor = 0;

  const startNode = {
    id: 'start',
    type: 'start' as const,
    label: process.intake.processName || process.title || 'Start',
    detail: process.intake.objective || 'Guide begins',
    column: 0,
    row: rowCursor++
  };
  nodes.push(startNode);

  const ensureStepNode = (step: RecordingStep, column: number, row: number, sequenceLabel?: string) => {
    const node = {
      id: `node-${step.id}`,
      stepId: step.id,
      type: step.step_kind,
      label: step.title || step.description || `Step ${step.step_number}`,
      detail: step.metadata.app_name || step.metadata.window_title || undefined,
      sequenceLabel,
      column,
      row
    };
    nodes.push(node);
    return node;
  };

  const mainNodes = process.steps.map((step) => ensureStepNode(step, 0, rowCursor++, `Step ${step.step_number}`));

  const endNode = {
    id: 'end',
    type: 'end' as const,
    label: 'Completed guide',
    detail: `${getAllSteps(process).length} documented ${getAllSteps(process).length === 1 ? 'step' : 'steps'}`,
    column: 0,
    row: rowCursor
  };

  const orderedMainNodes = [startNode, ...mainNodes, endNode];
  orderedMainNodes.slice(0, -1).forEach((node, index) => {
    edges.push({
      id: `edge-${node.id}-${orderedMainNodes[index + 1].id}`,
      from: node.id,
      to: orderedMainNodes[index + 1].id,
      label: index === 0 ? 'Begin' : undefined
    });
  });

  nodes.push(endNode);

  return {
    generated_at: Date.now(),
    nodes,
    edges
  };
}

export function normalizeProcess(process: Partial<RecordingProcess>): RecordingProcess {
  const intake: GuideIntakeDetails = {
    processName: process.intake?.processName || process.title || 'Untitled Guide',
    objective: process.intake?.objective || '',
    owner: process.intake?.owner || '',
    frequency: process.intake?.frequency || '',
    expectedCompletionTime: process.intake?.expectedCompletionTime || '',
    contactEmail: process.intake?.contactEmail || ''
  };

  const normalizeSteps = (steps: RecordingStep[], processId: string) => steps.map((step, index) => {
    const normalizedStep = {
      ...step,
      process_id: step.process_id || processId,
      step_number: step.step_number || index + 1,
      action_type: step.action_type || 'click',
      step_kind: step.step_kind || 'step',
      title: step.title || buildStepTitle(step as RecordingStep),
      description: step.description || buildStepDescription(step as RecordingStep),
      screenshot_path: step.screenshot_path || '',
      timestamp: step.timestamp || Date.now(),
      branches: (step.branches || []).map((branch, branchIndex) => ({
        id: branch.id || globalThis.crypto?.randomUUID?.() || `branch-${Date.now()}-${branchIndex}`,
        outcome_label: branch.outcome_label || `Path ${branchIndex + 1}`,
        condition: branch.condition || 'Describe when this branch should be followed.',
        return_to_main: branch.return_to_main !== false,
        steps: normalizeSteps(branch.steps || [], step.process_id || processId)
      })),
      metadata: {
        ...(step.metadata || {}),
        app_name: step.metadata?.app_name || 'Application',
        window_title: step.metadata?.window_title || 'Active Window',
        screenshotWidth: step.metadata?.screenshotWidth || 1920,
        screenshotHeight: step.metadata?.screenshotHeight || 1080,
        highlight: step.metadata?.highlight || buildStepHighlight(step as RecordingStep)
      }
    };

    return normalizedStep as RecordingStep;
  });

  const normalizedSteps = normalizeSteps((process.steps || []) as RecordingStep[], process.id || `process-${Date.now()}`);

  const normalizedProcess: RecordingProcess = {
    id: process.id || `process-${Date.now()}`,
    title: process.title || intake.processName,
    created_at: process.created_at || Date.now(),
    intake,
    steps: normalizedSteps,
    flow_diagram: process.flow_diagram
  };

  if (!normalizedProcess.flow_diagram) {
    normalizedProcess.flow_diagram = generateFlowDiagram(normalizedProcess);
  }

  return normalizedProcess;
}
