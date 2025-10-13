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

export const QuizGenerator = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
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
      toast.success('Quiz generated successfully!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const submitQuiz = () => {
    let score = 0;
    quiz.questions.forEach((q: any, index: number) => {
      if (answers[index] === q.correct_answer) {
        score++;
      }
    });

    setShowResults(true);
    toast.success(`You scored ${score}/${quiz.questions.length}!`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
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
            {quiz.questions.map((question: any, index: number) => (
              <div key={index} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">{index + 1}.</span>
                  <p className="font-medium flex-1">{question.question}</p>
                  {showResults && (
                    answers[index] === question.correct_answer ? (
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
                          showResults && option === question.correct_answer
                            ? 'text-green-600 font-medium'
                            : showResults && answers[index] === option
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {showResults && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium text-primary mb-1">Explanation:</p>
                    <p className="text-muted-foreground">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}

            {!showResults && (
              <Button onClick={submitQuiz} className="w-full">
                Submit Quiz
              </Button>
            )}

            {showResults && (
              <Button
                onClick={() => {
                  setQuiz(null);
                  setAnswers({});
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