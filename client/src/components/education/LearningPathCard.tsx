import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, BookOpen } from 'lucide-react';
import { LearningPath, lessons } from '@/data/educationalContent';

interface LearningPathCardProps {
  path: LearningPath;
  onStart: (path: LearningPath) => void;
}

const difficultyColors = {
  beginner: 'bg-[#38A636]/20 text-[#76E821] border-[#38A636]/50',
  intermediate: 'bg-yellow-600/20 text-yellow-300 border-yellow-600/50',
  advanced: 'bg-red-600/20 text-red-300 border-red-600/50',
};

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function LearningPathCard({ path, onStart }: LearningPathCardProps) {
  const pathLessons = lessons.filter((l) => path.lessons.includes(l.id));

  return (
    <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30 hover:border-[#235317]/45 transition-all">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white text-lg">{path.title}</h3>
            </div>
            <p className="text-sm text-[#B8C2B8]">{path.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${difficultyColors[path.difficulty]} border`}>
            {difficultyLabels[path.difficulty]}
          </Badge>
          <Badge variant="outline" className="border-[#235317]/45 text-[#B8C2B8]">
            <Clock className="w-3 h-3 mr-1" />
            {path.estimatedTime}h
          </Badge>
          <Badge variant="outline" className="border-[#235317]/45 text-[#B8C2B8]">
            <BookOpen className="w-3 h-3 mr-1" />
            {pathLessons.length} aulas
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[#6B756B] font-semibold uppercase">Aulas incluídas</p>
          <div className="flex flex-wrap gap-2">
            {pathLessons.map((lesson) => (
              <Badge key={lesson.id} variant="secondary" className="text-xs">
                {lesson.title}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={() => onStart(path)} className="w-full bg-[#38A636] hover:bg-[#4CB22F]">
          Iniciar Trilha
        </Button>
      </div>
    </Card>
  );
}
