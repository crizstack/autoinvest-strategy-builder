import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlossaryTerm } from '@/data/educationalContent';

interface GlossaryCardProps {
  term: GlossaryTerm;
}

export default function GlossaryCard({ term }: GlossaryCardProps) {
  return (
    <Card className="p-4 bg-[#0B110B]/50 border-[#235317]/30 hover:border-[#235317]/45 transition-all">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-lg">{term.term}</h3>
            <Badge variant="outline" className="border-[#235317]/45 text-[#B8C2B8] mt-2">
              {term.category}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-[#6B756B] font-semibold uppercase">Definição</p>
            <p className="text-sm text-[#B8C2B8]">{term.definition}</p>
          </div>

          <div>
            <p className="text-xs text-[#6B756B] font-semibold uppercase">Exemplo</p>
            <p className="text-sm text-[#B8C2B8] italic">{term.example}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
