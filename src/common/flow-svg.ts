import { FlowDiagram, FlowNode, StepClassification } from './types';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getNodePalette(type: FlowNode['type']) {
  if (type === 'start') {
    return { fill: '#6D4C82', stroke: '#5A3E6B', text: '#FFFFFF', detail: '#EBDFF2' };
  }

  if (type === 'end') {
    return { fill: '#404040', stroke: '#2F2F2F', text: '#FFFFFF', detail: '#D1D5DB' };
  }

  if (type === 'business-rule') {
    return { fill: '#F5EDF8', stroke: '#9B7CAD', text: '#5A3E6B', detail: '#7C6A87' };
  }

  if (type === 'exception') {
    return { fill: '#FCE7F3', stroke: '#DB2777', text: '#9D174D', detail: '#BE185D' };
  }

  if (type === 'process') {
    return { fill: '#F5F3F7', stroke: '#6D4C82', text: '#404040', detail: '#7C6A87' };
  }

  return { fill: '#FFFFFF', stroke: '#C9B6D3', text: '#404040', detail: '#6B7280' };
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const proposed = current ? `${current} ${word}` : word;
    if (proposed.length <= maxChars) {
      current = proposed;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 4);
}

export function createFlowDiagramSvg(diagram?: FlowDiagram, options?: { width?: number }) {
  if (!diagram || diagram.nodes.length === 0) return '';

  const width = options?.width || 980;
  const maxColumn = Math.max(...diagram.nodes.map((node) => node.column || 0), 0);
  const maxRow = Math.max(...diagram.nodes.map((node) => node.row || 0), 0);
  const laneWidth = maxColumn > 0 ? Math.max(240, Math.floor((width - 200) / (maxColumn + 1))) : width - 240;
  const nodeWidth = Math.max(250, laneWidth - 36);
  const baseNodeHeight = 118;
  const rowGap = 54;
  const startX = 80;
  const topPadding = 56;

  const preparedNodes = diagram.nodes.map((node) => {
    const palette = getNodePalette(node.type);
    const labelLines = wrapText(node.label, 28);
    const detailLines = wrapText(node.detail || '', 34);
    const nodeHeight = Math.max(baseNodeHeight, 96 + labelLines.length * 20 + detailLines.length * 16);
    return {
      node,
      palette,
      labelLines,
      detailLines,
      nodeHeight
    };
  });

  const rowHeights = new Map<number, number>();
  preparedNodes.forEach(({ node, nodeHeight }) => {
    const row = node.row || 0;
    rowHeights.set(row, Math.max(rowHeights.get(row) || baseNodeHeight, nodeHeight));
  });

  const rowOffsets = new Map<number, number>();
  let runningOffset = topPadding;
  for (let row = 0; row <= maxRow; row += 1) {
    rowOffsets.set(row, runningOffset);
    runningOffset += (rowHeights.get(row) || baseNodeHeight) + rowGap;
  }

  const nodes = preparedNodes.map(({ node, palette, labelLines, detailLines, nodeHeight }) => {
    const x = startX + (node.column || 0) * laneWidth;
    const y = rowOffsets.get(node.row || 0) || topPadding;

    const iconLabel = node.type === 'start'
      ? 'START'
      : node.type === 'end'
        ? 'END'
        : node.type === 'business-rule'
          ? 'DECISION RULE'
          : node.type === 'exception'
            ? 'EXCEPTION PATH'
            : node.type === 'process'
              ? 'PROCESS STAGE'
              : 'ACTION STEP';

    return {
      node,
      x,
      y,
      nodeHeight,
      palette,
      labelLines,
      detailLines,
      iconLabel
    };
  });

  const height = runningOffset - rowGap + topPadding;

  const nodeMap = new Map(nodes.map((node) => [node.node.id, node]));

  const edgeMarkup = diagram.edges.map((edge) => {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) return '';

    const startXPoint = from.x + nodeWidth / 2;
    const startYPoint = from.y + from.nodeHeight;
    const endXPoint = to.x + nodeWidth / 2;
    const endYPoint = to.y;
    const midY = startYPoint + (endYPoint - startYPoint) / 2;
    const labelX = startXPoint + (endXPoint - startXPoint) / 2;
    const labelY = midY - 12;

    return `
      <path d="M ${startXPoint} ${startYPoint} C ${startXPoint} ${midY}, ${endXPoint} ${midY}, ${endXPoint} ${endYPoint}" fill="none" stroke="#C9B6D3" stroke-width="5" stroke-linecap="round"/>
      <circle cx="${endXPoint}" cy="${endYPoint}" r="9" fill="#6D4C82"/>
      ${edge.label ? `
        <rect x="${labelX - 52}" y="${labelY - 16}" width="104" height="28" rx="14" ry="14" fill="#FFFFFF" stroke="#E7DDF0"/>
        <text x="${labelX}" y="${labelY + 3}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#6D4C82" text-anchor="middle">${escapeXml(edge.label)}</text>
      ` : ''}
    `;
  }).join('');

  const nodeMarkup = nodes.map(({ node, x, y, nodeHeight, palette, labelLines, detailLines, iconLabel }) => {
    const centerX = x + nodeWidth / 2;
    const chipWidth = Math.max(104, iconLabel.length * 10 + 36);
    const labelBaseY = y + 82;
    const detailBaseY = labelBaseY + labelLines.length * 20 + 18;
    const sequenceLabel = node.sequenceLabel;
    const sequenceWidth = sequenceLabel ? Math.max(84, sequenceLabel.length * 8 + 26) : 0;

    return `
      <g>
        <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="30" ry="30" fill="${palette.fill}" stroke="${palette.stroke}" stroke-width="3" filter="url(#node-shadow)"/>
        <rect x="${centerX - chipWidth / 2}" y="${y + 24}" width="${chipWidth}" height="36" rx="18" ry="18" fill="${palette.stroke}"/>
        <text x="${centerX}" y="${y + 47}" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle">${escapeXml(iconLabel)}</text>
        ${sequenceLabel ? `
          <rect x="${x + nodeWidth - sequenceWidth - 22}" y="${y + 22}" width="${sequenceWidth}" height="30" rx="15" ry="15" fill="#FFFFFF" fill-opacity="0.92" stroke="${palette.stroke}" stroke-width="1.5"/>
          <text x="${x + nodeWidth - sequenceWidth / 2 - 22}" y="${y + 41}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${palette.stroke}" text-anchor="middle">${escapeXml(sequenceLabel)}</text>
        ` : ''}
        ${labelLines.map((line, lineIndex) => `
          <text x="${centerX}" y="${labelBaseY + lineIndex * 20}" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="${palette.text}" text-anchor="middle">
            ${escapeXml(line)}
          </text>
        `).join('')}
        ${detailLines.slice(0, 3).map((line, lineIndex) => `
          <text x="${centerX}" y="${detailBaseY + lineIndex * 16}" font-family="Arial, sans-serif" font-size="12" fill="${palette.detail}" text-anchor="middle">
            ${escapeXml(line)}
          </text>
        `).join('')}
      </g>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="flow-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#F7F1FA"/>
        </linearGradient>
        <filter id="node-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#6D4C82" flood-opacity="0.08"/>
        </filter>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" rx="48" ry="48" fill="url(#flow-bg)"/>
      ${edgeMarkup}
      ${nodeMarkup}
    </svg>
  `;
}

export function getNodeTypeOptions(): Array<{ value: StepClassification | 'start' | 'end'; label: string }> {
  return [
    { value: 'process', label: 'Process Stage' },
    { value: 'step', label: 'Action Step' },
    { value: 'business-rule', label: 'Decision Rule' },
    { value: 'exception', label: 'Exception Path' },
    { value: 'start', label: 'Start' },
    { value: 'end', label: 'End' }
  ];
}
