'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, CheckSquare } from 'lucide-react';

type QuizOption = {
  id: string;
  text: string;
  isCorrect?: boolean; // This will be added by our checkCurrentAnswer function
  correctComment?: string;
  incorrectComment?: string;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOption[];
};

type Quiz = {
  id: string;
  lessonId: string;
  questions: QuizQuestion[];
};

type SelectedOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type CorrectOption = {
  id: string;
  text: string;
};

type QuizResultItem = {
  questionId: string;
  question: string;
  selectedOptionIds: string[];
  selectedOptions: SelectedOption[];
  isCorrect: boolean;
  feedback: string;
  correctOptions: CorrectOption[] | null;
};

type QuizProps = {
  lessonId: string;
  onComplete: (passed: boolean) => void;
};

export default function QuizComponent({ lessonId, onComplete }: QuizProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResultItem[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [checkedQuestions, setCheckedQuestions] = useState<string[]>([]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quizzes/${lessonId}?lessonId=${lessonId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch quiz');
        }

        if (!data.exists) {
          setError('Тест не найден для этого урока');
          setLoading(false);
          return;
        }

        // Process the quiz data to ensure isCorrect property exists on all options
        const processedQuiz = {
          ...data.quiz,
          questions: data.quiz.questions.map((question: any) => ({
            ...question,
            options: question.options.map((option: any) => ({
              ...option,
              // Ensure isCorrect is a boolean
              isCorrect: option.isCorrect === true
            }))
          }))
        };

        setQuiz(processedQuiz);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Не удалось загрузить тест. Пожалуйста, попробуйте позже.');
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [lessonId]);

  // Submit answers
  const submitAnswers = async () => {
    if (!quiz) return;
    
    // If current question hasn't been checked yet, check it first
    if (!checkedQuestions.includes(quiz.questions[currentQuestionIndex].id)) {
      checkCurrentAnswer();
    }

    // Prepare answers in the required format
    const answers = Object.entries(selectedOptions).map(([questionId, selectedOptionIds]) => ({
      questionId,
      selectedOptionIds
    }));

    try {
      const response = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          answers
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit answers');
      }

      setResults(data.results);
      setSubmitted(true);
      onComplete(data.allCorrect);
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError('Не удалось отправить ответы. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Handle selecting an option
  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedOptions(prev => {
      const currentSelections = prev[questionId] || [];
      
      // If already selected, remove it; otherwise add it
      const newSelections = currentSelections.includes(optionId)
        ? currentSelections.filter(id => id !== optionId)
        : [...currentSelections, optionId];
      
      return {
        ...prev,
        [questionId]: newSelections
      };
    });
  };

  // Check current question
  const checkCurrentAnswer = () => {
    if (!quiz) return;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const selectedOptionIds = selectedOptions[currentQuestion.id] || [];
    
    // First, analyze the question's options and user's selections
    const allOptions = [...currentQuestion.options]; // Make a copy to avoid mutations
    
    // Identify which options are correct and which are selected
    // Be defensive about option.isCorrect possibly being undefined
    const correctOptions = allOptions.filter(option => option.isCorrect === true);
    const selectedOptionsArray = allOptions.filter(option => selectedOptionIds.includes(option.id));
    const selectedCorrectOptions = selectedOptionsArray.filter(option => option.isCorrect === true);
    const selectedIncorrectOptions = selectedOptionsArray.filter(option => option.isCorrect !== true);
    const missedCorrectOptions = correctOptions.filter(option => !selectedOptionIds.includes(option.id));
    
    // Determine if the answer is fully correct:
    // - All correct options must be selected
    // - No incorrect options can be selected
    const isFullyCorrect = 
      selectedCorrectOptions.length === correctOptions.length && 
      selectedIncorrectOptions.length === 0 &&
      correctOptions.length > 0;
    
    // Determine appropriate feedback message
    let feedbackMessage = '';
    
    if (isFullyCorrect) {
      // For correct answers, use the first selected correct option's correctComment
      feedbackMessage = selectedCorrectOptions[0]?.correctComment || 'Правильно!';
    } else if (selectedIncorrectOptions.length > 0) {
      // For incorrect selections, use the first selected incorrect option's incorrectComment
      feedbackMessage = selectedIncorrectOptions[0]?.incorrectComment || 'Неправильно!';
    } else if (missedCorrectOptions.length > 0) {
      // For missed correct options, indicate they need to select more
      feedbackMessage = 'Вы выбрали не все правильные ответы!';
    }
    
    // Save feedback for display
    setCurrentFeedback({
      isCorrect: isFullyCorrect,
      message: feedbackMessage
    });
    
    // Mark question as checked
    setCheckedQuestions(prev => [...prev, currentQuestion.id]);
    
    // Update the quiz with our processed option data including the is_correct values
    // this makes them accessible for the UI
    const updatedQuiz = { ...quiz };
    updatedQuiz.questions[currentQuestionIndex].options = allOptions;
    setQuiz(updatedQuiz);
  };

  // Navigate to the next question
  const goToNextQuestion = () => {
    if (!quiz) return;
    
    // Clear feedback for the next question
    setCurrentFeedback(null);
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitAnswers();
    }
  };

  // Navigate to the previous question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentFeedback(null);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Check if the current question has at least one selected option
  const isCurrentQuestionAnswered = () => {
    if (!quiz) return false;
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const selections = selectedOptions[currentQuestion.id];
    return selections && selections.length > 0;
  };

  // Render loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p>Загрузка теста...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error || !quiz) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-500">{error || 'Тест не найден'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there are no questions, show a message
  if (quiz.questions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p>В этом тесте пока нет вопросов.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If the quiz has been submitted, show the results
  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Результаты теста</CardTitle>
        </CardHeader>
        <CardContent>
          {results.map((result, index) => (
            <div key={result.questionId} className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:mb-0 last:pb-0">
              <div className="flex items-start gap-2 mb-2">
                {result.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium">Вопрос {index + 1}: {result.question}</p>
                  
                  {/* Selected options */}
                  <div className="mt-2">
                    <p className="font-medium mb-1">Ваш выбор:</p>
                    <ul className="ml-2 space-y-1">
                      {result.selectedOptions.map(option => (
                        <li key={option.id} className="flex items-center gap-2">
                          {option.isCorrect ? (
                            <CheckSquare className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={option.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {option.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Correct options (if answer was wrong) */}
                  {!result.isCorrect && result.correctOptions && result.correctOptions.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium mb-1 text-green-600 dark:text-green-400">Правильные варианты:</p>
                      <ul className="ml-2 space-y-1">
                        {result.correctOptions.map(option => (
                          <li key={option.id} className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">{option.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {result.feedback}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Get the current question
  const currentQuestion = quiz.questions[currentQuestionIndex];

  // Render the quiz question
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
          <div className="flex flex-col space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptions[currentQuestion.id]?.includes(option.id) || false;
              const isChecked = checkedQuestions.includes(currentQuestion.id);
              const isCorrect = option.isCorrect;
              
              // Determine the styling based on selection and check status
              let itemStyle = "";
              
              // Safely check if option is correct - treat undefined as false
              const optionIsCorrect = option.isCorrect === true;
              
              if (isChecked) {
                if (isSelected && optionIsCorrect) {
                  // Selected correct answer
                  itemStyle = "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400";
                } else if (isSelected && !optionIsCorrect) {
                  // Selected incorrect answer
                  itemStyle = "border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400";
                } else if (!isSelected && optionIsCorrect) {
                  // Missed correct answer
                  itemStyle = "border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-400";
                } else {
                  // Correctly not selected
                  itemStyle = "border-gray-200 dark:border-gray-700";
                }
              } else {
                // Not checked yet
                itemStyle = isSelected ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400" : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800";
              }
              
              return (
                <div key={option.id}>
                  <div 
                    className={`flex items-center space-x-3 p-3 rounded-md border ${itemStyle} ${!isChecked ? 'cursor-pointer' : ''}`}
                    onClick={() => !isChecked && handleOptionSelect(currentQuestion.id, option.id)}
                  >
                    <Checkbox 
                      id={option.id}
                      checked={isSelected}
                      disabled={isChecked}
                      onCheckedChange={() => !isChecked && handleOptionSelect(currentQuestion.id, option.id)}
                      className="h-5 w-5"
                    />
                    <Label htmlFor={option.id} className={`flex-grow ${!isChecked ? 'cursor-pointer' : ''}`}>
                      {option.text}
                      {isChecked && optionIsCorrect && (
                        <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400">(правильный ответ)</span>
                      )}
                    </Label>
                  </div>
                  
                  {/* Individual feedback for this option */}
                  {isChecked && isSelected && (
                    <div className={`ml-8 mt-1 text-sm p-2 rounded ${optionIsCorrect ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20'}`}>
                      {optionIsCorrect 
                        ? (option.correctComment || 'Правильно!')
                        : (option.incorrectComment || 'Неправильно!')
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Назад
          </Button>
          
          {!checkedQuestions.includes(quiz.questions[currentQuestionIndex].id) ? (
            <Button
              onClick={checkCurrentAnswer}
              disabled={!isCurrentQuestionAnswered()}
              className="bg-green-500 hover:bg-green-600 cursor-pointer text-white rounded-full"
            >
              Проверить ответ
            </Button>
          ) : (
            <Button
              onClick={goToNextQuestion}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full"
            >
              {currentQuestionIndex < quiz.questions.length - 1 ? 'Следующий вопрос' : 'Завершить тест'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}