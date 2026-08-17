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
  beginner: 'bg-[#38A636]/20 text-[#76E821] border-[#38A636]/50',
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
    <Card className="p-4 bg-[#0B110B]/50 border-[#235317]/30 hover:border-[#235317]/45 transition-all cursor-pointer hover:shadow-lg">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-white text-lg mb-1">{lesson.title}</h3>
            <p className="text-sm text-[#B8C2B8]">{lesson.description}</p>
          </div>
          <BookOpen className="w-5 h-5 text-[#76E821] flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${difficultyColors[lesson.difficulty]} border`}>
            {difficultyLabels[lesson.difficulty]}
          </Badge>
          <Badge variant="outline" className="border-[#235317]/45 text-[#B8C2B8]">
            {lesson.category}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-[#B8C2B8]">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {lesson.duration} min
          </div>
        </div>

        <Button
          onClick={() => onSelect(lesson)}
          className="w-full bg-[#38A636] hover:bg-[#4CB22F]"
        >
          Abrir Aula
        </Button>
      </div>
    </Card>
  );
}
