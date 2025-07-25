"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { RubricCriterion } from "@/components/ui/editor/rubric-builder";
import { HelpCircle, Save, ThumbsUp, MessageSquare, AlertCircle } from "lucide-react";

type ScoreByLevel = {
  [criterionId: string]: string; // Level ID selected for each criterion
};

interface RubricLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

interface EssayGradingProps {
  quizId: string;
  attemptId: string;
  answerId: string;
  questionContent: string;
  studentAnswer: string;
  questionPoints: number;
  existingScore?: number | null;
  existingFeedback?: string | null;
  rubric?: RubricCriterion[];
  gradingGuide?: string | null;
  exampleAnswer?: string | null;
  onSaveGrade: (score: number, feedback: string) => Promise<void>;
  isRichText?: boolean;
}

export function EssayGrading({
  quizId,
  attemptId,
  answerId,
  questionContent,
  studentAnswer,
  questionPoints,
  existingScore,
  existingFeedback = "",
  rubric = [],
  gradingGuide = null,
  exampleAnswer = null,
  onSaveGrade,
  isRichText = false
}: EssayGradingProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(existingFeedback || "");
  const [score, setScore] = useState<number>(existingScore || 0);
  const [selectedLevels, setSelectedLevels] = useState<ScoreByLevel>({});
  const [wordCount, setWordCount] = useState(0);
  const [activeTab, setActiveTab] = useState(rubric.length > 0 ? "rubric" : "manual");
  const [showGradingResources, setShowGradingResources] = useState(false);

  // Count words in student answer
  useEffect(() => {
    if (studentAnswer) {
      // Strip HTML tags if richText is true
      const textOnly = isRichText 
        ? studentAnswer.replace(/<[^>]*>/g, ' ') 
        : studentAnswer;
      
      const words = textOnly.trim().split(/\s+/);
      setWordCount(words.length);
    } else {
      setWordCount(0);
    }
  }, [studentAnswer, isRichText]);

  // Update score when a rubric level is selected
  useEffect(() => {
    if (rubric.length > 0 && Object.keys(selectedLevels).length > 0) {
      let calculatedScore = 0;
      
      rubric.forEach(criterion => {
        const selectedLevelId = selectedLevels[criterion.id];
        if (selectedLevelId) {
          const level = criterion.levels.find(l => l.id === selectedLevelId);
          if (level) {
            calculatedScore += level.points;
          }
        }
      });
      
      // Đảm bảo điểm không vượt quá giới hạn điểm tối đa của câu hỏi
      calculatedScore = Math.min(calculatedScore, questionPoints);
      
      setScore(calculatedScore);
    }
  }, [selectedLevels, rubric, questionPoints]);

  const handleLevelSelect = (criterionId: string, levelId: string) => {
    setSelectedLevels(prev => ({
      ...prev,
      [criterionId]: levelId
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Đảm bảo điểm nằm trong khoảng hợp lệ trước khi lưu
      const validScore = Math.min(Math.max(0, score), questionPoints);
      
      if (validScore !== score) {
        setScore(validScore);
        toast({
          title: "Score adjusted",
          description: `Score has been adjusted to ${validScore} to stay within allowed range (0-${questionPoints}).`,
          variant: "destructive",
        });
      }
      
      await onSaveGrade(validScore, feedback);
      toast({
        title: "Grade saved",
        description: "The essay has been graded successfully.",
      });
    } catch (error) {
      console.error("Error saving grade:", error);
      toast({
        title: "Error saving grade",
        description: "There was a problem saving the grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Essay Grading</h2>
          <p className="text-muted-foreground">
            Grade the student's essay response and provide feedback
          </p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Grade
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Question and Answer */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: questionContent }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <span className="text-lg">Student Answer</span>
                <Badge variant="outline">{wordCount} words</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRichText ? (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: studentAnswer }}
                />
              ) : (
                <div className="whitespace-pre-wrap">{studentAnswer}</div>
              )}
            </CardContent>
          </Card>

          {/* Grading Resources (Conditionally Show) */}
          {(gradingGuide || exampleAnswer) && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowGradingResources(!showGradingResources)}
                className="w-full"
              >
                {showGradingResources ? "Hide Grading Resources" : "Show Grading Resources"}
              </Button>
              
              {showGradingResources && (
                <div className="space-y-4 mt-4">
                  {gradingGuide && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Grading Guide
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: gradingGuide }}
                        />
                      </CardContent>
                    </Card>
                  )}
                  
                  {exampleAnswer && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Example Answer
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: exampleAnswer }}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Grading */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Grading</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  {rubric.length > 0 && (
                    <TabsTrigger value="rubric">Rubric Grading</TabsTrigger>
                  )}
                  <TabsTrigger value="manual">Manual Grading</TabsTrigger>
                </TabsList>

                {rubric.length > 0 && (
                  <TabsContent value="rubric" className="space-y-4 pt-4">
                    {rubric.map((criterion) => (
                      <div key={criterion.id} className="space-y-2 pt-2">
                        <div className="font-medium">{criterion.name} ({criterion.pointsAvailable} points)</div>
                        {criterion.description && (
                          <p className="text-sm text-muted-foreground mb-2">{criterion.description}</p>
                        )}
                        
                        <div className="grid gap-2">
                          {criterion.levels.map((level) => (
                            <div 
                              key={level.id}
                              className={`
                                p-3 rounded-md border cursor-pointer
                                ${selectedLevels[criterion.id] === level.id ? 
                                  'border-primary bg-primary/5' : 
                                  'hover:border-primary/50'
                                }
                              `}
                              onClick={() => handleLevelSelect(criterion.id, level.id)}
                            >
                              <div className="flex justify-between">
                                <div className="font-medium">{level.name}</div>
                                <div>{level.points} points</div>
                              </div>
                              {level.description && (
                                <p className="text-sm mt-1">{level.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    ))}
                  </TabsContent>
                )}

                <TabsContent value="manual" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="font-medium">Score</label>
                        <span>{score} / {questionPoints}</span>
                      </div>
                      <Slider
                        value={[score]}
                        max={questionPoints}
                        step={0.5}
                        onValueChange={(values) => setScore(values[0])}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 space-y-2">
                <label className="font-medium">Feedback</label>
                <RichTextEditor
                  content={feedback}
                  onChange={setFeedback}
                  placeholder="Enter feedback for the student..."
                  minHeight="150px"
                />
                <div className="flex items-start gap-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Provide specific feedback on strengths and areas for improvement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 