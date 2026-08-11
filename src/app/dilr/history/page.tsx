import { HistoryView } from '@/components/history/history-view';

export default function DilrHistoryPage() {
  const dilrTopics = [
    'Arrangements',
    'Games & Tournaments',
    'Venn Diagrams',
    'Routes & Networks',
    'Selection',
    'Distribution',
    'Puzzles',
    'Caselets',
    'Tables'
  ];
  return (
    <HistoryView
      section="DILR"
      sectionLabel="DILR"
      sectionColor="text-blue-400"
      topics={dilrTopics}
    />
  );
}
