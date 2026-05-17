import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen } from 'lucide-react';
import { Lesson } from '@/data/educationalContent';

interface LessonCardProps {
  lesson: Lesson;
  onSelect: (lesson: Lesson) => void;
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

export default function LessonCard({ lesson, onSelect }: LessonCardProps) {
  return (
    <Card className="p-4 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer hover:shadow-lg">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">{lesson.title}</h3>
            <p className="text-sm text-slate-400">{lesson.description}</p>
          </div>
          <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${difficultyColors[lesson.difficulty]} border`}>
            {difficultyLabels[lesson.difficulty]}
          </Badge>
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            {lesson.category}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {lesson.duration} min
          </div>
        </div>

        <Button
          onClick={() => onSelect(lesson)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Abrir Aula
        </Button>
      </div>
    </Card>
  );
}
