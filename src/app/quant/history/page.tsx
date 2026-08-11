import { HistoryView } from '@/components/history/history-view';

export default function QuantHistoryPage() {
  const quantTopics = ['Arithmetic', 'Algebra', 'Geometry', 'Number System', 'Modern Math'];
  return (
    <HistoryView
      section="Quant"
      sectionLabel="Quant"
      sectionColor="text-cyan-400"
      topics={quantTopics}
    />
  );
}
