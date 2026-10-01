export const AGE_GROUP_OPTIONS = [
  { value: 'infant', label: 'Infant', range: '0–18 mo' },
  { value: 'toddler', label: 'Toddler', range: '18–30 mo' },
  { value: 'preschool', label: 'Preschool', range: '2.5–5 yrs' },
  { value: 'kindergarten', label: 'Kindergarten', range: '4–6 yrs' },
  { value: 'school-age', label: 'School-age', range: '6–12 yrs' },
];

export const AGE_GROUP_LABELS = Object.fromEntries(
  AGE_GROUP_OPTIONS.map(({ value, label }) => [value, label])
);

export const AGE_GROUP_DISPLAY_LABELS = Object.fromEntries(
  AGE_GROUP_OPTIONS.map(({ value, label, range }) => [value, `${label} (${range})`])
);

export const AVAILABILITY_AGE_GROUPS = ['infant', 'toddler', 'preschool'];

const DAY_OPTIONS = [
  { value: 'mon', label: 'Mon' }, { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' }, { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' }, { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

export function formatDaysOpen(daysOpen = []) {
  const days = DAY_OPTIONS.filter(day => daysOpen.includes(day.value)).map(day => day.label);
  if (days.join(',') === 'Mon,Tue,Wed,Thu,Fri') return 'Mon–Fri';
  if (days.length === DAY_OPTIONS.length) return 'Mon–Sun';
  return days.join(', ');
}
