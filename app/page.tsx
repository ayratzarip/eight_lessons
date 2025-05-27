'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from '@/components/ui/header';

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
  }, [getNextLesson]);

  // Function to fetch a specific lesson
  const fetchLesson = async (lessonId: string, moduleId?: string) => {
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
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <script type="application/ld+json">
        {JSON.stringify(courseSchema)}
      </script>
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 prose">
            <h1 className="text-3xl font-bold mb-4">Учебная панель</h1>
          </div>
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar - Module and lesson list */}
              <div className="lg:w-1/4 lg:max-w-xs border-r border-gray-200">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p>Загрузка модулей...</p>
                  </div>
                ) : (
                  <div className="h-full">
                    {modules.map((module) => (
                      <div key={module.id} className="border-b">
                        <div 
                          className={`cursor-pointer p-4 flex justify-between items-center 
                            ${module.isAccessible ? ' text-indigo-950 font-semibold' : 'text-gray-500 font-normal'}
                            ${expandedModules.includes(module.id) ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-gray-50'}
                            ${selectedLesson?.moduleId === module.id ? 'font-semibold' : ''}
                            transition-all duration-150
                          `}
                          onClick={() => toggleModule(module.id)}
                        >
                          <h3 className={`${module.isAccessible ? 'font-semibold' : 'font-normal'} font-inter`}>
                          Модуль {Number(module.id) - 1}:&nbsp;{module.title}
                          </h3>
                          {expandedModules.includes(module.id) ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        
                        {/* Expandable lessons list */}
                        {expandedModules.includes(module.id) && module.lessons && (
                          <div className="bg-gray-50">
                            <ul className="divide-y divide-gray-100">
                              {module.lessons.map(lesson => (
                                <li key={lesson.id}>
                                  {lesson.isAccessible ? (
                                    <div 
                                      onClick={() => fetchLesson(lesson.id, module.id)}
                                      className={`p-3 pl-6 text-sm flex items-center gap-2 cursor-pointer
                                        ${selectedLesson?.id === lesson.id ? 
                                          'bg-green-100 text-green-700 font-medium' : 
                                          lesson.isCompleted ? 
                                            'bg-green-50 text-green-700 hover:bg-green-100' : 
                                            'hover:bg-gray-100'
                                        }`}
                                    >
                                      <BookOpen className={`h-3 w-3 ${selectedLesson?.id === lesson.id ? 'text-green-700' : ''}`} />
                                      <span>{lesson.title}</span>
                                      {lesson.isCompleted && (
                                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-3 pl-6 text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed bg-gray-50">
                                      <BookOpen className="h-3 w-3" />
                                      <span>{lesson.title}</span>
                                      <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
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
                    <p>Загрузка урока...</p>
                  </div>
                ) : selectedLesson ? (
                  <div>
                    {/* Lesson title */}
                    <h2 className="text-3xl text-indigo-950 font-bold mb-2 font-inter">{selectedLesson.title}</h2>
                    <p className="text-sm text-gray-500 mb-4">
                      Модуль {Number(selectedLesson.module.id) - 1}: {selectedLesson.module.title}
                    </p>
                    
                    {/* Video section */}
                    <div className="mb-6">
                      {selectedLesson.video_url ? (
                        <div className="rounded-lg overflow-hidden" style={{ position: 'relative', paddingTop: '56.25%' }}>
                          <iframe
                            src={selectedLesson.video_url}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                          ></iframe>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-lg p-6 text-center">
                          <p className="text-gray-500">Видео для этого урока отсутствует</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Tabs for different content types */}
                    <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid text-gray-600 grid-cols-3 mb-6">
                        <TabsTrigger value="content">Краткий конспект</TabsTrigger>
                        <TabsTrigger value="transcript">Транскрипт видео</TabsTrigger>
                        <TabsTrigger value="quiz" onClick={() => setShowQuiz(true)}>Тест</TabsTrigger>
                      </TabsList>
                      
                      {/* Content tab */}
                      <TabsContent value="content" className="border rounded-md p-4 text-gray-600">
                        {selectedLesson.content ? (
                          <>
                            <div 
                              className="max-w-full w-full"
                              dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                            />
                            <div className="mt-8 p-4 bg-amber-50 border border-amber-300 rounded-md">
                              <div className="flex items-center gap-2 text-amber-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                                  <path d="M12 9v4"></path>
                                  <path d="M12 17h.01"></path>
                                </svg>
                                <p className="font-medium">Пройдите тест, чтобы перейти к следующему уроку</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-gray-500">Содержание для этого урока не доступно</p>
                        )}
                      </TabsContent>
                      
                      {/* Transcript tab */}
                      <TabsContent value="transcript" className="border rounded-md p-4 text-gray-600">
                        {selectedLesson.transcript ? (
                          <div className="whitespace-pre-line">
                            {selectedLesson.transcript}
                          </div>
                        ) : (
                          <p className="text-gray-500">Транскрипт для этого видео не доступен</p>
                        )}
                      </TabsContent>
                      
                      {/* Quiz tab */}
                      <TabsContent value="quiz" className="border rounded-md p-4 text-gray-600">
                        {showQuiz ? (
                          <QuizWrapper lessonId={selectedLesson.id} />
                        ) : (
                          <div className="text-center py-8">
                            <Button 
                              size="lg" 
                              className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-full"
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
                  <div className="text-center py-12">
                    <p className="text-gray-500">Выберите урок из списка слева для начала обучения</p>
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