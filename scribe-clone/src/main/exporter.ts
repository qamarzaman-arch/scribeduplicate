import { RecordingProcess } from '../common/types';
import fs from 'fs';

export class Exporter {
  public static async exportToHTML(process: RecordingProcess, outputPath: string) {
    // Convert screenshots to Base64 to ensure they load correctly in exported HTML
    const stepsWithBase64 = await Promise.all(process.steps.map(async (step) => {
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
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
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
                      style="left: ${(step.metadata.x / 1280) * 100}%; top: ${(step.metadata.y / (1280 * (9/16))) * 100}%;"
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
}
