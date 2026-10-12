export const profile = {
  name: 'Nazar Dzys',
  firstName: 'Nazar',
  lastName: 'Dzys',
  role: 'Senior Frontend Engineer & Team Lead',
  stack: 'React / TypeScript',
  bio: 'Frontend engineer and team lead with 10 years in web development. I focus on React architecture, design systems and performance. Co-founder of NVSOFTLAB, where I build mobile products end to end.',
  location: 'Wrocław, Poland · Remote EU / hybrid',
  email: 'nazardzys@gmail.com',
  phone: { label: '+48 514 063 561', href: 'tel:+48514063561' },
  github: 'https://github.com/ndzys',
  cvUrl: __CV_FILE__ ? `${import.meta.env.BASE_URL}${__CV_FILE__}` : null,
} as const;

/** Terminal lines printed while unlocking; `at` is the progress (0–100) that reveals each one. */
export const unlockLog = [
  { at: 4, text: 'resolving 10 years of web development' },
  { at: 20, text: 'linking React · TypeScript · GraphQL' },
  { at: 36, text: 'mounting <TeamLead size="4–5" />' },
  { at: 52, text: 'importing design systems & shared UI' },
  { at: 68, text: 'shipping NVSOFTLAB apps to the App Store' },
  { at: 84, text: 'tree-shaking buzzwords · 0 found' },
  { at: 99, text: 'ready · full potential unlocked' },
] as const;
