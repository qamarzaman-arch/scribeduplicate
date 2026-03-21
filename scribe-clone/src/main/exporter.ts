import { RecordingProcess } from '../common/types';
import fs from 'fs';
import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel } from 'docx';

export class Exporter {
  public static async exportToHTML(process: RecordingProcess, outputPath: string) {
    // Convert screenshots to Base64 to ensure they load correctly in exported HTML
    const stepsWithBase64 = await Promise.all(process.steps.map(async (step) => {
      if (step.screenshot_path.startsWith('data:')) {
        return { ...step, base64: step.screenshot_path };
      }
      const base64 = fs.readFileSync(step.screenshot_path).toString('base64');
      return { ...step, base64: `data:image/jpeg;base64,${base64}` };
    }));

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
          body { font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 48px; color: #111827; }
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
          .space-y-24 > * + * { margin-top: 6rem; }
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
          .text-sm { font-size: 0.875rem; }
          .text-xs { font-size: 0.75rem; }
          .text-lg { font-size: 1.125rem; }
          .text-2xl { font-size: 1.5rem; }
          .text-5xl { font-size: 3rem; }
          .text-indigo-600 { color: #6D4C82; }
          .text-gray-900 { color: #404040; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-400 { color: #9ca3af; }
          .overflow-hidden { overflow: hidden; }
          .print-break { page-break-after: always; }
          @media print {
            body { background: white; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body class="p-12 text-gray-900">
        <div class="max-w-4xl mx-auto">
          <header class="mb-20 text-center">
            <span class="text-indigo-600 font-bold tracking-widest uppercase text-sm mb-4 block">Requirements Gathering Report</span>
            <h1 class="text-5xl font-extrabold mb-6 tracking-tight">${process.title}</h1>
            <p class="text-gray-500 text-lg max-w-2xl mx-auto">
              This document provides a comprehensive, step-by-step breakdown of the recorded process.
            </p>
            <div class="mt-8 flex justify-center gap-8 text-sm font-semibold text-gray-400 uppercase tracking-wider">
              <span>${process.steps.length} Steps Captured</span>
              <span>Generated ${new Date().toLocaleDateString()}</span>
            </div>
          </header>

          <div class="space-y-24">
            ${stepsWithBase64.map(step => `
              <section class="bg-white rounded-3xl p-10 shadow-sm border border-gray-100 print-break relative">
                <div class="flex justify-between items-start mb-8">
                  <div>
                    <span class="text-indigo-600 font-bold uppercase text-xs tracking-widest mb-2 block">Step ${step.step_number}</span>
                    <h2 class="text-2xl font-bold">${step.description}</h2>
                    <p class="text-gray-400 text-sm mt-1">${step.metadata.app_name || 'System Action'}</p>
                  </div>
                </div>
                <div class="relative rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                  <img src="${(step as any).base64}" class="w-full" />
                  ${step.action_type === 'click' && step.metadata.x && step.metadata.y ? `
                    <div
                      class="absolute w-12 h-12 border-4 border-indigo-600 rounded-full bg-indigo-600/20 -translate-x-1/2 -translate-y-1/2"
                      style="left: ${(step.metadata.x / 1920) * 100}%; top: ${(step.metadata.y / 1080) * 100}%;"
                    ></div>
                  ` : ''}
                </div>
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
    const children: any[] = [
      new Paragraph({
        text: process.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `Created on ${new Date(process.created_at).toLocaleString()}`,
        spacing: { after: 1000 },
      }),
    ];

    for (const step of process.steps) {
      children.push(
        new Paragraph({
          text: `Step ${step.step_number}: ${step.description}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      // Handle both file paths and data URLs
      let screenshotBuffer: Buffer;
      if (step.screenshot_path.startsWith('data:')) {
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
                width: 600,
                height: 337,
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
