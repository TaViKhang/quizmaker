"use client";

import { useState } from "react";
import { QuestionType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface QuestionGraderProps {
  answerId: string;
  quizId: string;
  attemptId: string;
  questionType: QuestionType;
  maxPoints: number;
}

export default function QuestionGrader({
  answerId,
  quizId,
  attemptId,
  questionType,
  maxPoints,
}: QuestionGraderProps) {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For essay and code questions, we need manual grading
  const needsManualGrading = 
    questionType === QuestionType.ESSAY || 
    questionType === QuestionType.CODE;

  const handleSubmitGrade = async () => {
    if (isSubmitting) return;
    
    // Validation
    if (isCorrect === null && !needsManualGrading) {
      toast({
        title: "Error",
        description: "Please select whether the answer is correct or incorrect.",
        variant: "destructive",
      });
      return;
    }
    
    if (points < 0 || points > maxPoints) {
      toast({
        title: "Error",
        description: `Points must be between 0 and ${maxPoints}.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/teacher/quizzes/${quizId}/attempts/${attemptId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerId,
          isCorrect: needsManualGrading ? null : isCorrect,
          score: points,
          feedback,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit grade");
      }
      
      toast({
        title: "Grade submitted",
        description: "The grade has been successfully submitted.",
      });
      
      // Reload the page to refresh the data
      window.location.reload();
    } catch (error) {
      console.error("Error submitting grade:", error);
      toast({
        title: "Error",
        description: "Failed to submit grade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Answer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!needsManualGrading && (
          <div className="space-y-2">
            <Label>Is the answer correct?</Label>
            <RadioGroup 
              value={isCorrect === null ? undefined : isCorrect ? "correct" : "incorrect"} 
              onValueChange={(value) => setIsCorrect(value === "correct")}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="correct" id="correct" />
                <Label htmlFor="correct">Correct</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="incorrect" id="incorrect" />
                <Label htmlFor="incorrect">Incorrect</Label>
              </div>
            </RadioGroup>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="points">
            Points (Max: {maxPoints})
          </Label>
          <Input
            id="points"
            type="number"
            min={0}
            max={maxPoints}
            step={0.5}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="feedback">Feedback (Optional)</Label>
          <Textarea
            id="feedback"
            placeholder="Provide feedback to the student..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmitGrade} 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Grade"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 