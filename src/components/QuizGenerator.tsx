import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, BookOpen, Check, X } from "lucide-react";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  order_index: number;
}

interface QuizResult {
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
}

export const QuizGenerator = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [results, setResults] = useState<{ [key: number]: QuizResult }>({});
  const [showResults, setShowResults] = useState(false);

  const generateQuiz = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { content, title: title || 'Generated Quiz', numQuestions }
      });

      if (error) throw error;

      setQuiz(data);
      setAnswers({});
      setResults({});
      setShowResults(false);
      toast.success('Quiz generated successfully!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    
    try {
      const questionResults: { [key: number]: QuizResult } = {};
      let score = 0;

      // Check each answer using the secure function
      for (let index = 0; index < quiz.questions.length; index++) {
        const question = quiz.questions[index] as QuizQuestion;
        const userAnswer = answers[index] || '';
        
        const { data, error } = await supabase.rpc('check_quiz_answer', {
          _question_id: question.id,
          _user_answer: userAnswer
        });

        if (error) {
          console.error('Error checking answer:', error);
          continue;
        }

        const result = data as unknown as QuizResult;
        questionResults[index] = result;
        if (result.is_correct) score++;
      }

      setResults(questionResults);
      setShowResults(true);
      toast.success(`You scored ${score}/${quiz.questions.length}!`);
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Quiz Generator
          </CardTitle>
          <CardDescription>Generate quizzes from any content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title (optional)</Label>
            <Input
              id="title"
              placeholder="My Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Paste your notes, article, or any text here..."
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-background"
            />
          </div>

          <div>
            <Label htmlFor="numQuestions">Number of Questions</Label>
            <Input
              id="numQuestions"
              type="number"
              min={3}
              max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="bg-background"
            />
          </div>

          <Button
            onClick={generateQuiz}
            disabled={isGenerating || !content.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              'Generate Quiz'
            )}
          </Button>
        </CardContent>
      </Card>

      {quiz && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>{quiz.quiz.title}</CardTitle>
            <CardDescription>
              {quiz.questions.length} questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.questions.map((question: QuizQuestion, index: number) => (
              <div key={index} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">{index + 1}.</span>
                  <p className="font-medium flex-1">{question.question}</p>
                  {showResults && results[index] && (
                    results[index].is_correct ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )
                  )}
                </div>
                
                <RadioGroup
                  value={answers[index]}
                  onValueChange={(value) => setAnswers({ ...answers, [index]: value })}
                  disabled={showResults}
                >
                  {question.options.map((option: string, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`q${index}-${optIndex}`} />
                      <Label
                        htmlFor={`q${index}-${optIndex}`}
                        className={`flex-1 cursor-pointer ${
                          showResults && results[index]?.correct_answer === option
                            ? 'text-green-600 font-medium'
                            : showResults && answers[index] === option && !results[index]?.is_correct
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {showResults && results[index]?.explanation && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium text-primary mb-1">Explanation:</p>
                    <p className="text-muted-foreground">{results[index].explanation}</p>
                  </div>
                )}
              </div>
            ))}

            {!showResults && (
              <Button 
                onClick={submitQuiz} 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking Answers...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </Button>
            )}

            {showResults && (
              <Button
                onClick={() => {
                  setQuiz(null);
                  setAnswers({});
                  setResults({});
                  setShowResults(false);
                }}
                variant="outline"
                className="w-full"
              >
                Generate New Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};