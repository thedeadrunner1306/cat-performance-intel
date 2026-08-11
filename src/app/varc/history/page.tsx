import { HistoryView } from '@/components/history/history-view';

export default function VarcHistoryPage() {
  const varcTopics = ['Reading Comprehension', 'Verbal Ability'];
  return (
    <HistoryView
      section="VARC"
      sectionLabel="VARC"
      sectionColor="text-violet-400"
      topics={varcTopics}
    />
  );
}
