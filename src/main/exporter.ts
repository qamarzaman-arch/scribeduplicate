import { RecordingProcess, RecordingStep } from '../common/types';
import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';
import sharp from 'sharp';
import { createFlowDiagramSvg } from '../common/flow-svg';
import { generateFlowDiagram, STEP_KIND_LABELS } from '../common/process-helpers';

export class Exporter {
  public static async exportToHTML(process: RecordingProcess, outputPath: string) {
    const flowDiagram = process.flow_diagram || generateFlowDiagram(process);
    const flowSvg = createFlowDiagramSvg(flowDiagram, { width: 980 });
    const flowDataUri = flowSvg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(flowSvg)}` : '';

    // Convert screenshots to Base64 to ensure they load correctly in exported HTML
    const attachBase64 = async (step: RecordingStep) => {
      if (!step.screenshot_path) {
        return { ...step, base64: '' };
      }
      if (step.screenshot_path.startsWith('data:')) {
        return { ...step, base64: step.screenshot_path };
      }
      const base64 = fs.readFileSync(step.screenshot_path).toString('base64');
      return { ...step, base64: `data:image/jpeg;base64,${base64}` };
    };

    const stepsWithBase64 = await Promise.all(process.steps.map(attachBase64));

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${process.title} - HachiAi Documentation</title>
        <style>
          /* Professional Offline-First Styles */
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px; color: #111827; }
          .max-w-4xl { max-width: 56rem; margin: 0 auto; }
          .text-center { text-align: center; }
          .mb-20 { margin-bottom: 5rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mt-8 { margin-top: 2rem; }
          .mt-32 { margin-top: 8rem; }
          .p-12 { padding: 3rem; }
          .p-10 { padding: 2.5rem; }
          .pt-12 { padding-top: 3rem; }
          .space-y-24 > * + * { margin-top: 3.5rem; }
          .bg-white { background-color: #ffffff; }
          .rounded-3xl { border-radius: 1.5rem; }
          .rounded-2xl { border-radius: 1rem; }
          .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
          .border { border: 1px solid #e5e7eb; }
          .border-t { border-top: 1px solid #f3f4f6; }
          .flex { display: flex; }
          .justify-center { justify-content: center; }
          .justify-between { justify-content: space-between; }
          .items-start { align-items: flex-start; }
          .gap-8 { gap: 2rem; }
          .relative { position: relative; }
          .absolute { position: absolute; }
          .w-full { width: 100%; }
          .w-12 { width: 3rem; }
          .h-12 { height: 3rem; }
          .border-4 { border-width: 4px; }
          .border-indigo-600 { border-color: #6D4C82; }
          .rounded-full { border-radius: 9999px; }
          .bg-indigo-600\/20 { background-color: rgba(109, 76, 130, 0.2); }
          .-translate-x-1\/2 { transform: translateX(-50%); }
          .-translate-y-1\/2 { transform: translateY(-50%); }
          .font-extrabold { font-weight: 800; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .uppercase { text-transform: uppercase; }
          .tracking-widest { letter-spacing: 0.1em; }
          .tracking-tight { letter-spacing: -0.025em; }
          .text-sm { font-size: 0.8rem; }
          .text-xs { font-size: 0.7rem; }
          .text-lg { font-size: 1rem; }
          .text-2xl { font-size: 1.3rem; }
          .text-5xl { font-size: 2.4rem; }
          .text-indigo-600 { color: #6D4C82; }
          .text-gray-900 { color: #404040; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-400 { color: #9ca3af; }
          .overflow-hidden { overflow: hidden; }
          .step-card { break-inside: avoid; page-break-inside: avoid; }
          img { max-width: 100%; height: auto; display: block; }
          @media print {
            body { background: white; }
            .no-print { display: none; }
            .step-card { break-inside: avoid; page-break-inside: avoid; }
          }
        </style>
      </head>
      <body class="p-12 text-gray-900">
        <div class="max-w-4xl mx-auto">
          <header class="mb-20 text-center">
            <span class="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4 block">Requirements Gathering Report</span>
            <h1 class="text-5xl font-extrabold mb-6 tracking-tight">${process.title}</h1>
            <p class="text-gray-500 text-lg max-w-2xl mx-auto">
              ${process.intake.objective || 'This document provides a professional, step-by-step guide to the recorded process.'}
            </p>
            <div class="mt-8 flex justify-center gap-8 text-sm font-semibold text-gray-400 uppercase tracking-wider">
              <span>${process.steps.length} Steps Captured</span>
              <span>Generated ${new Date().toLocaleDateString()}</span>
            </div>
          </header>

          <section class="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 mb-20">
            <span class="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-3 block">Process Summary</span>
            <div class="space-y-4 text-gray-900">
              <p><strong>Process Name:</strong> ${process.intake.processName || process.title}</p>
              <p><strong>Who Performs It:</strong> ${process.intake.owner || 'Not specified'}</p>
              <p><strong>Concerned Person's Email:</strong> ${process.intake.contactEmail || 'Not specified'}</p>
              <p><strong>How Often It Runs:</strong> ${process.intake.frequency || 'Not specified'}</p>
              <p><strong>Expected Completion Time:</strong> ${process.intake.expectedCompletionTime || 'Not specified'}</p>
              <p><strong>Outcome:</strong> ${process.intake.objective || 'Not specified'}</p>
            </div>
          </section>

          ${flowDataUri ? `
            <section class="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 mb-20">
              <span class="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-3 block">Flow Diagram</span>
              <h2 class="text-2xl font-bold mb-6">Process overview</h2>
              <img src="${flowDataUri}" class="w-full" />
            </section>
          ` : ''}

          <div class="space-y-24">
            ${stepsWithBase64.map(step => `
              <section class="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 relative step-card">
                <div class="flex justify-between items-start mb-8">
                  <div>
                    <span class="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-2 block">${STEP_KIND_LABELS[step.step_kind]} ${step.step_number}</span>
                    <h2 class="text-2xl font-bold">${step.title || step.description}</h2>
                    <p class="text-gray-500 text-sm mt-2">${step.description}</p>
                    <p class="text-gray-400 text-sm mt-2">${step.metadata.app_name || 'System Action'}</p>
                  </div>
                </div>
                ${step.base64 ? `
                  <div class="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                    <img src="${(step as any).base64}" class="w-full" style="max-height:420px; object-fit:contain; background:#f8fafc;" />
                  </div>
                ` : '<p class="text-gray-400">No screenshot available for this step.</p>'}
              </section>
            `).join('')}
          </div>

          <footer class="mt-32 pt-12 border-t border-gray-100 text-center text-gray-400 text-xs font-medium uppercase tracking-widest no-print">
            Powered by HachiAi Requirements Gathering Tool
          </footer>
        </div>
      </body>
      </html>
    `;
    fs.writeFileSync(outputPath, html);
  }

  public static async exportToDOCX(process: RecordingProcess, outputPath: string) {
    const flowDiagram = process.flow_diagram || generateFlowDiagram(process);
    const flowSvg = createFlowDiagramSvg(flowDiagram, { width: 980 });
    const flowImageBuffer = flowSvg ? await sharp(Buffer.from(flowSvg)).png().toBuffer() : null;
    const children: any[] = [
      new Paragraph({
        text: process.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `Created on ${new Date(process.created_at).toLocaleString()}`,
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Who performs it: ${process.intake.owner || 'Not specified'}`, bold: true })
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Concerned person's email: ${process.intake.contactEmail || 'Not specified'}`, bold: true })
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `How often it runs: ${process.intake.frequency || 'Not specified'}`, bold: true })
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Expected completion time: ${process.intake.expectedCompletionTime || 'Not specified'}`, bold: true })
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        text: `Outcome: ${process.intake.objective || 'Not specified'}`,
        spacing: { after: 500 },
      }),
    ];

    if (flowImageBuffer) {
      children.push(
        new Paragraph({
          text: 'Flow Diagram',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 200 },
        }),
        new Paragraph({
          children: [
            new ImageRun({
              data: flowImageBuffer,
              transformation: {
                width: 560,
                height: 680,
              },
              type: 'png',
            }),
          ],
          spacing: { after: 600 },
        })
      );
    }

    for (const step of process.steps) {
      children.push(
        new Paragraph({
          text: `${STEP_KIND_LABELS[step.step_kind]} ${step.step_number}: ${step.title || step.description}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      children.push(
        new Paragraph({
          text: step.description,
          spacing: { after: 200 },
        })
      );

      // Handle both file paths and data URLs
      let screenshotBuffer: Buffer;
      if (!step.screenshot_path) {
        continue;
      } else if (step.screenshot_path.startsWith('data:')) {
        const base64Data = step.screenshot_path.replace(/^data:image\/\w+;base64,/, '');
        screenshotBuffer = Buffer.from(base64Data, 'base64');
      } else {
        screenshotBuffer = fs.readFileSync(step.screenshot_path);
      }

      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: screenshotBuffer,
              transformation: {
                width: 520,
                height: 292,
              },
              type: 'png',
            }),
          ],
          spacing: { after: 600 },
        })
      );

    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
  }
}
