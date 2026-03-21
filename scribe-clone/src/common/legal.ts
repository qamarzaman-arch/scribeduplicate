export const LEGAL_CONSENT_VERSION = '2026-03-19';

export const privacySummarySections = [
  {
    title: 'What HachiAi Accesses',
    body: 'HachiAi records screenshots, mouse clicks, keyboard actions, active-window details, and exported guide content so it can build step-by-step documentation.'
  },
  {
    title: 'How Data Is Stored',
    body: 'Recordings, screenshots, and exports are stored locally on the user device by default. The app does not require a separate runtime or server installation to operate after installation.'
  },
  {
    title: 'Your Responsibilities',
    body: 'Before recording, users must make sure they have the right to capture the target system and any personal, confidential, or regulated information that may appear on screen.'
  },
  {
    title: 'OS Permissions',
    body: 'The app may require Windows accessibility, screen capture, keyboard, mouse, or similar permissions to function correctly. Recording will not work until those permissions are granted where required.'
  }
] as const;

export const privacyChecklist = [
  'I understand the app can capture screenshots and interaction metadata during recording.',
  'I will only record workflows where I am authorized to capture the content shown on screen.',
  'I understand captured data is stored locally unless I choose to export or share it.'
] as const;
