'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from '@/components/ui/header';
import { useHydration } from '@/hooks/useHydration';

// Types for our data
type Lesson = {
  id: string;
  title: string;
  order: number;
  isAccessible?: boolean;
  isCompleted?: boolean;
};

type Module = {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: Lesson[];
  isAccessible?: boolean;
};

type LessonDetail = {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  transcript: string | null;
  moduleId: string;
  order: number;
  module: {
    id: string;
    title: string;
  };
};

export default function Home() {
  const { data: session } = useSession();
  const isHydrated = useHydration();
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [showQuiz, setShowQuiz] = useState(false);

  // Function to get the next lesson for the user
  const getNextLesson = useCallback((moduleData: Module[]): {
    moduleTitle: string;
    moduleId: string;
    lesson: Lesson;
  } | null => {
    // First, look for the first incomplete but accessible lesson
    for (const mod of moduleData) {
      if (mod.isAccessible) {
        for (const lesson of mod.lessons) {
          if (lesson.isAccessible && !lesson.isCompleted) {
            return {
              moduleTitle: mod.title,
              moduleId: mod.id,
              lesson: lesson
            };
          }
        }
      }
    }
    
    // If no incomplete lessons found, fallback to the first lesson that is accessible
    for (const mod of moduleData) {
      if (mod.isAccessible && mod.lessons && mod.lessons.length > 0) {
        const accessibleLesson = mod.lessons.find(lesson => lesson.isAccessible);
        if (accessibleLesson) {
          return {
            moduleTitle: mod.title,
            moduleId: mod.id,
            lesson: accessibleLesson
          };
        }
      }
    }
    
    // Fallback to the first lesson of the first module if no accessible lessons found
    const firstModuleWithLessons = moduleData.find(mod => mod.lessons && mod.lessons.length > 0);
    if (firstModuleWithLessons && firstModuleWithLessons.lessons) {
      return {
        moduleTitle: firstModuleWithLessons.title,
        moduleId: firstModuleWithLessons.id,
        lesson: firstModuleWithLessons.lessons[0]
      };
    }
    
    return null;
  }, []);

  // Effect to load modules
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/modules');
        if (!response.ok) {
          throw new Error('Failed to fetch modules');
    }
        const data = await response.json();
        
        setModules(data);
        setIsLoading(false);
        
        if (data && data.length > 0) {
          const nextLesson = getNextLesson(data);
          
          if (nextLesson) {
            const moduleId = nextLesson.moduleId;
            setExpandedModules([moduleId]);
            fetchLesson(nextLesson.lesson.id, moduleId);
          } else {
            setExpandedModules([data[0].id]);
          }
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getNextLesson]);

  // Function to fetch a specific lesson  
  const fetchLesson = useCallback(async (lessonId: string, moduleId?: string) => {
    if (!lessonId) return;
    
    if (selectedLesson?.id === lessonId) {
      return;
    }
    
    setIsLessonLoading(true);
    try {
      const response = await fetch(`/api/lessons/${lessonId}?id=${lessonId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch lesson data');
      }
      
      const data = await response.json();
      const lessonData = {...data};
      
      setSelectedLesson(lessonData);
      setShowQuiz(false);
      setActiveTab("content");
      
      if (moduleId) {
        setExpandedModules([moduleId]);
      }
      else if (lessonData.moduleId && !expandedModules.includes(lessonData.moduleId)) {
        setExpandedModules([lessonData.moduleId]);
      }
      
      setIsLessonLoading(false);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setIsLessonLoading(false);
    }
  }, [expandedModules, selectedLesson?.id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      if (prev.includes(moduleId)) {
        return [];
      } 
      return [moduleId];
    });
  };

  // Define the structured data for courses
  const courseSchema = {
    "@context": "https://schema.org",
      "@type": "Course",
    "name": "EightFaces: Soft Skills Engine - Уроки",
    "description": "Курс для развития социальных навыков",
    "provider": {
      "@type": "Organization",
      "name": "EightFaces: Soft Skills Engine",
      "sameAs": "https://eightfaces.ru"
    },
    "hasCourseInstance": modules.map(module => ({
      "@type": "CourseInstance",
      "name": module.title,
      "description": module.description,
      "courseMode": "online"
    }))
  };

  // Не рендерим контент до завершения гидratации
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <script type="application/ld+json">
        {JSON.stringify(courseSchema)}
      </script>
      <main className="flex-grow">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">Учебная панель</h1>
            <p className="text-muted-foreground">Платформа для развития социальных навыков</p>
          </div>
          <div className="ai-card overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar - Module and lesson list */}
              <div className="lg:w-1/4 lg:max-w-xs border-r border-border/20">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse">
                      <div className="h-8 bg-muted rounded-md mb-4"></div>
                      <div className="h-6 bg-muted rounded-md"></div>
                    </div>
                    <p className="mt-4 text-muted-foreground">Загрузка модулей...</p>
                  </div>
                ) : (
                  <div className="h-full">
                    {modules.map((module) => (
                      <div key={module.id} className="border-b border-border/10">
                        <div 
                          className={`cursor-pointer p-4 flex justify-between items-center 
                            ${module.isAccessible ? 'text-foreground font-semibold' : 'text-muted-foreground font-normal'}
                            ${expandedModules.includes(module.id) ? 'glass-effect border-l-4 border-blue-500 ai-glow' : 'hover:glass-effect'}
                            ${selectedLesson?.moduleId === module.id ? 'font-semibold' : ''}
                            transition-all duration-300
                          `}
                          onClick={() => toggleModule(module.id)}
                        >
                          <h3 className={`${module.isAccessible ? 'font-semibold' : 'font-normal'} font-heading`}>
                          Модуль {Number(module.id) - 1}:&nbsp;{module.title}
                          </h3>
                          {expandedModules.includes(module.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Expandable lessons list */}
                        {expandedModules.includes(module.id) && module.lessons && (
                          <div className="bg-muted/20">
                            <ul className="divide-y divide-border/10">
                              {module.lessons.map(lesson => (
                                <li key={lesson.id}>
                                  {lesson.isAccessible ? (
                                    <div 
                                      onClick={() => fetchLesson(lesson.id, module.id)}
                                      className={`p-3 pl-6 text-sm flex items-center gap-2 cursor-pointer transition-all duration-200
                                        ${selectedLesson?.id === lesson.id ? 
                                          'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium ai-glow' : 
                                          lesson.isCompleted ? 
                                            'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30' : 
                                            'hover:glass-effect'
                                        }`}
                                    >
                                      <BookOpen className={`h-3 w-3 ${selectedLesson?.id === lesson.id ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                      <span>{lesson.title}</span>
                                      {lesson.isCompleted && (
                                        <CheckCircle className="ml-auto h-4 w-4 text-green-600" />
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-3 pl-6 text-sm text-muted-foreground flex items-center gap-2 cursor-not-allowed opacity-50">
                                      <BookOpen className="h-3 w-3" />
                                      <span>{lesson.title}</span>
                                      <span className="ml-auto text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                        🔒
                                      </span>
                </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                  </div>
                        )}
                </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Content Area - Selected Lesson */}
              <div className="flex-1 p-6">
                {isLessonLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse space-y-4">
                      <div className="h-8 bg-muted rounded-md w-3/4 mx-auto"></div>
                      <div className="h-4 bg-muted rounded-md w-1/2 mx-auto"></div>
                      <div className="h-64 bg-muted rounded-lg"></div>
                    </div>
                    <p className="mt-4 text-muted-foreground">Загрузка урока...</p>
                  </div>
                ) : selectedLesson ? (
                  <div>
                    {/* Lesson title */}
                    <h2 className="text-3xl font-bold mb-2 font-heading text-black dark:text-white">{selectedLesson.title}</h2>
                    <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
                      <span className="px-2 py-1 bg-muted rounded-full text-xs">
                        Модуль {Number(selectedLesson.module.id) - 1}: {selectedLesson.module.title}
                      </span>
                    </p>
                    
                    {/* Video section */}
                    <div className="mb-8">
                      {selectedLesson.video_url ? (
                        <div className="ai-card rounded-xl overflow-hidden ai-glow" style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <iframe
                            src={selectedLesson.video_url}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    ></iframe>
                  </div>
                      ) : (
                        <div className="ai-card rounded-xl p-8 text-center">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground">Видео для этого урока отсутствует</p>
                </div>
                      )}
              </div>

                    {/* Tabs for different content types */}
                    <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid grid-cols-3 mb-8 glass-effect">
                        <TabsTrigger value="content" className="data-[state=active]:ai-glow">Краткий конспект</TabsTrigger>
                        <TabsTrigger value="transcript" className="data-[state=active]:ai-glow">Транскрипт видео</TabsTrigger>
                        <TabsTrigger value="quiz" onClick={() => setShowQuiz(true)} className="data-[state=active]:ai-glow">Тест</TabsTrigger>
                      </TabsList>
                      
                      {/* Content tab */}
                      <TabsContent value="content" className="ai-card p-6">
                        {selectedLesson.content ? (
                          <>
                            <div 
                              className="prose max-w-none"
                              dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                            />
                            <div className="mt-8 p-4 glass-effect border border-amber-500/20 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20">
                              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                                    <path d="M12 9v4"></path>
                                    <path d="M12 17h.01"></path>
                                  </svg>
                                </div>
                                <p className="font-semibold">Пройдите тест, чтобы перейти к следующему уроку</p>
                  </div>
                </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Содержание для этого урока не доступно</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Transcript tab */}
                      <TabsContent value="transcript" className="ai-card p-6">
                        {selectedLesson.transcript ? (
                          <div className="whitespace-pre-line text-foreground leading-relaxed">
                            {selectedLesson.transcript}
                </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">Транскрипт для этого видео не доступен</p>
                          </div>
                        )}
                      </TabsContent>
                      
                      {/* Quiz tab */}
                      <TabsContent value="quiz" className="ai-card p-6">
                        {showQuiz ? (
                          <QuizWrapper lessonId={selectedLesson.id} />
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 ai-glow">
                              <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold mb-4 ai-gradient-text">Готовы пройти тест?</h3>
                            <p className="text-muted-foreground mb-6">Проверьте свои знания по этому уроку</p>
                            <Button 
                              size="lg" 
                              className="ai-button rounded-full px-8 py-3 font-semibold"
                              onClick={() => setShowQuiz(true)}
                            >
                              Начать тест
                            </Button>
                </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 ai-gradient-text">Начните обучение</h3>
                    <p className="text-muted-foreground">Выберите урок из списка слева для начала обучения</p>
                  </div>
                )}
              </div>
            </div>
          </div>
                  </div>
      </main>
                </div>
  );
}

// Quiz wrapper component to lazy load the quiz component
function QuizWrapper({ lessonId }: { lessonId: string }) {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  
  // Dynamically import the quiz component
  const QuizComponent = require('@/components/quiz/quiz').default;
  
  if (quizCompleted) {
    return (
      <div className="mt-8">
        <div className={`rounded-lg p-4 mb-6 ${quizPassed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">
              {quizPassed 
                ? 'Поздравляем! Вы успешно завершили тест.' 
                : 'Тест завершен. Рекомендуем изучить материал еще раз.'}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-full"
            onClick={async () => {
              try {
                // Mark the lesson as completed in the database
                const response = await fetch('/api/user/progress', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ lessonId }),
                });
                
                if (!response.ok) {
                  throw new Error('Failed to mark lesson as completed');
                }
                
                // Reload the page to refresh the modules/lessons status
                window.location.reload();
              } catch (error) {
                console.error('Error completing lesson:', error);
                alert('Не удалось отметить урок как завершенный. Пожалуйста, попробуйте снова.');
              }
            }}
          >
            Завершить урок
          </Button>
            </div>
    </div>
  );
}

  return (
    <QuizComponent 
      lessonId={lessonId} 
      onComplete={(passed: boolean) => {
        setQuizCompleted(true);
        setQuizPassed(passed);
      }} 
    />
  );
} 