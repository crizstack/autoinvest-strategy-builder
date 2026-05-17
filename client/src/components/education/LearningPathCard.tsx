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
  beginner: 'bg-green-600/20 text-green-300 border-green-600/50',
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
    <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white text-lg">{path.title}</h3>
            </div>
            <p className="text-sm text-slate-400">{path.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${difficultyColors[path.difficulty]} border`}>
            {difficultyLabels[path.difficulty]}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            <Clock className="w-3 h-3 mr-1" />
            {path.estimatedTime}h
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            <BookOpen className="w-3 h-3 mr-1" />
            {pathLessons.length} aulas
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-semibold uppercase">Aulas incluídas</p>
          <div className="flex flex-wrap gap-2">
            {pathLessons.map((lesson) => (
              <Badge key={lesson.id} variant="secondary" className="text-xs">
                {lesson.title}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={() => onStart(path)} className="w-full bg-blue-600 hover:bg-blue-700">
          Iniciar Trilha
        </Button>
      </div>
    </Card>
  );
}
