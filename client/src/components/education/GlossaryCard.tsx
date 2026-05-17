import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlossaryTerm } from '@/data/educationalContent';

interface GlossaryCardProps {
  term: GlossaryTerm;
}

export default function GlossaryCard({ term }: GlossaryCardProps) {
  return (
    <Card className="p-4 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-lg">{term.term}</h3>
            <Badge variant="outline" className="border-slate-700 text-slate-300 mt-2">
              {term.category}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Definição</p>
            <p className="text-sm text-slate-300">{term.definition}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Exemplo</p>
            <p className="text-sm text-slate-300 italic">{term.example}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
