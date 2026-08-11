export type Section = 'VARC' | 'DILR' | 'Quant';

export interface TopicNode {
  id: string;
  label: string;
  section: Section;
  parent?: string;
  children?: TopicNode[];
}

export const SECTIONS: { id: Section; label: string; color: string }[] = [
  { id: 'VARC', label: 'VARC', color: '#8b5cf6' },
  { id: 'DILR', label: 'DILR', color: '#3b82f6' },
  { id: 'Quant', label: 'Quant', color: '#06b6d4' },
];

export const TOPIC_TAXONOMY: Record<Section, TopicNode[]> = {
  VARC: [
    { id: 'rc', label: 'Reading Comprehension', section: 'VARC', children: [
      { id: 'rc-philosophy', label: 'Philosophy', section: 'VARC', parent: 'rc' },
      { id: 'rc-history', label: 'History', section: 'VARC', parent: 'rc' },
      { id: 'rc-science', label: 'Science', section: 'VARC', parent: 'rc' },
      { id: 'rc-economics', label: 'Economics', section: 'VARC', parent: 'rc' },
      { id: 'rc-politics', label: 'Politics', section: 'VARC', parent: 'rc' },
    ]},
    { id: 'va', label: 'Verbal Ability', section: 'VARC', children: [
      { id: 'va-para-jumbles', label: 'Para Jumbles', section: 'VARC', parent: 'va' },
      { id: 'va-para-summary', label: 'Para Summary', section: 'VARC', parent: 'va' },
      { id: 'va-odd-one-out', label: 'Odd One Out', section: 'VARC', parent: 'va' },
    ]},
  ],
  DILR: [
    { id: 'arrangements', label: 'Arrangements', section: 'DILR' },
    { id: 'games-tournament', label: 'Games & Tournament', section: 'DILR' },
    { id: 'routes-networks', label: 'Routes & Networks', section: 'DILR' },
    { id: 'selection-sets', label: 'Selection Sets', section: 'DILR' },
    { id: 'venn-diagram', label: 'Venn Diagram', section: 'DILR' },
    { id: 'puzzles', label: 'Puzzles', section: 'DILR' },
  ],
  Quant: [
    { id: 'arithmetic', label: 'Arithmetic', section: 'Quant', children: [
      { id: 'arith-ratio', label: 'Ratio', section: 'Quant', parent: 'arithmetic' },
      { id: 'arith-percentages', label: 'Percentages', section: 'Quant', parent: 'arithmetic' },
      { id: 'arith-profit-loss', label: 'Profit & Loss', section: 'Quant', parent: 'arithmetic' },
      { id: 'arith-si-ci', label: 'SI-CI', section: 'Quant', parent: 'arithmetic' },
      { id: 'arith-tsd', label: 'TSD', section: 'Quant', parent: 'arithmetic' },
      { id: 'arith-mixtures', label: 'Mixtures', section: 'Quant', parent: 'arithmetic' },
      { id: 'arith-work-time', label: 'Work & Time', section: 'Quant', parent: 'arithmetic' },
    ]},
    { id: 'algebra', label: 'Algebra', section: 'Quant' },
    { id: 'geometry', label: 'Geometry', section: 'Quant' },
    { id: 'modern-math', label: 'Modern Math', section: 'Quant' },
    { id: 'number-system', label: 'Number System', section: 'Quant' },
  ],
};

export const MISTAKE_TYPES = ['Concept Error', 'Calculation Error', 'Silly Error', 'Time Pressure Error', 'Guessing Error'] as const;
export type MistakeType = (typeof MISTAKE_TYPES)[number];

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
