import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Search, BookOpen, Lightbulb, Zap, MessageCircle } from 'lucide-react';
import LessonCard from '@/components/education/LessonCard';
import GlossaryCard from '@/components/education/GlossaryCard';
import LearningPathCard from '@/components/education/LearningPathCard';
import { lessons, glossaryTerms, learningPaths, categories, Lesson, LearningPath } from '@/data/educationalContent';

export default function Education() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchGlossary, setSearchGlossary] = useState('');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  const filteredLessons = selectedCategory
    ? lessons.filter((l) => l.category === selectedCategory)
    : lessons;

  const filteredGlossary = searchGlossary
    ? glossaryTerms.filter(
        (t) =>
          t.term.toLowerCase().includes(searchGlossary.toLowerCase()) ||
          t.definition.toLowerCase().includes(searchGlossary.toLowerCase())
      )
    : glossaryTerms;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-slate-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold">Centro de Educação</h1>
          </div>
          <p className="text-slate-400">Aprenda sobre mercado de ações e análise técnica</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Aulas</span>
            </TabsTrigger>
            <TabsTrigger value="glossary" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="hidden sm:inline">Glossário</span>
            </TabsTrigger>
            <TabsTrigger value="paths" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Trilhas</span>
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Dúvidas</span>
            </TabsTrigger>
          </TabsList>

          {/* Aulas Tab */}
          <TabsContent value="lessons" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Mini Aulas</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === '' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('')}
                  className="whitespace-nowrap"
                >
                  Todas
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className="whitespace-nowrap"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {selectedLesson ? (
              <Card className="p-6 bg-slate-900/50 border-slate-800">
                <div className="space-y-4">
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedLesson(null)}
                      className="mb-4"
                    >
                      ← Voltar
                    </Button>
                    <h2 className="text-3xl font-bold mb-2">{selectedLesson.title}</h2>
                    <p className="text-slate-400">{selectedLesson.description}</p>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-slate-300 font-mono text-sm">
                      {selectedLesson.content}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} onSelect={setSelectedLesson} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Glossário Tab */}
          <TabsContent value="glossary" className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Glossário Financeiro</h2>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <Input
                  placeholder="Buscar termo..."
                  value={searchGlossary}
                  onChange={(e) => setSearchGlossary(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((term) => (
                <GlossaryCard key={term.id} term={term} />
              ))}
            </div>
          </TabsContent>

          {/* Trilhas Tab */}
          <TabsContent value="paths" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Trilhas de Aprendizado</h2>
              <p className="text-slate-400 mb-6">
                Siga um caminho estruturado para aprender sobre investimentos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningPaths.map((path) => (
                <LearningPathCard key={path.id} path={path} onStart={setSelectedPath} />
              ))}
            </div>

            {selectedPath && (
              <Card className="p-6 bg-slate-900/50 border-slate-800 mt-6">
                <div className="space-y-4">
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPath(null)}
                      className="mb-4"
                    >
                      ← Voltar
                    </Button>
                    <h2 className="text-2xl font-bold">{selectedPath.title}</h2>
                    <p className="text-slate-400 mt-2">{selectedPath.description}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-semibold">Aulas desta trilha:</p>
                    {lessons
                      .filter((l) => selectedPath.lessons.includes(l.id))
                      .map((lesson) => (
                        <div
                          key={lesson.id}
                          className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 cursor-pointer transition-all"
                          onClick={() => setSelectedLesson(lesson)}
                        >
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-sm text-slate-400">{lesson.duration} minutos</p>
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Dúvidas Tab */}
          <TabsContent value="help" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tire Suas Dúvidas</h2>
              <p className="text-slate-400 mb-6">
                Use o assistente IA para responder suas perguntas sobre investimentos
              </p>
            </div>

            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <div className="space-y-4">
                <p className="text-slate-300">
                  O assistente IA está disponível no ícone de chat 💬 no canto inferior direito.
                </p>
                <p className="text-slate-300">
                  Faça perguntas sobre:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-300">
                  <li>Conceitos de mercado de ações</li>
                  <li>Indicadores técnicos</li>
                  <li>Estratégias de investimento</li>
                  <li>Gestão de risco</li>
                  <li>Análise de ativos</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
