import { duplicateSlideGroups } from './slide-demo-assignments.ts';
import { lecture2Explanations } from './slide-explanations/lecture-2.ts';
import { lecture3Explanations } from './slide-explanations/lecture-3.ts';
import { lecture4Explanations } from './slide-explanations/lecture-4.ts';
import { lecture5Explanations } from './slide-explanations/lecture-5.ts';
import { lecture6Explanations } from './slide-explanations/lecture-6.ts';
import { lecture7Explanations } from './slide-explanations/lecture-7.ts';
import { lecture8Explanations } from './slide-explanations/lecture-8.ts';

// Title, agenda, acknowledgement, and section-divider pages have no explanation.
export const nonMaterialSlides: Record<string, number[]> = {
  'lecture-2': [1, 2, 3, 36],
  'lecture-3': [1, 2, 3, 49],
  'lecture-4': [1, 2, 3, 33],
  'lecture-5': [1, 2, 3, 24, 41],
  'lecture-6': [1, 2, 3, 31, 32],
  'lecture-7': [1, 2, 3, 22],
  'lecture-8': [1, 2, 3, 19],
};

const explanations: Record<string, Record<number, string>> = {
  'lecture-2': { ...lecture2Explanations },
  'lecture-3': { ...lecture3Explanations },
  'lecture-4': { ...lecture4Explanations },
  'lecture-5': { ...lecture5Explanations },
  'lecture-6': { ...lecture6Explanations },
  'lecture-7': { ...lecture7Explanations },
  'lecture-8': { ...lecture8Explanations },
};

for (const group of duplicateSlideGroups) {
  const copies = group
    .map(([lectureId, page]) => explanations[lectureId]?.[page])
    .filter((explanation): explanation is string => Boolean(explanation));
  if (new Set(copies).size > 1)
    throw new Error(`Conflicting explanations for duplicate slides: ${JSON.stringify(group)}`);
  if (!copies.length) continue;
  for (const [lectureId, page] of group) {
    if (explanations[lectureId]) explanations[lectureId][page] = copies[0];
  }
}

export function explanationForSlide(lectureId: string, page: number): string | undefined {
  return explanations[lectureId]?.[page];
}
