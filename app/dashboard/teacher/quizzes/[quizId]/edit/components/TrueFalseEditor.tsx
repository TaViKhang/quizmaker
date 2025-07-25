"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Save } from "lucide-react";
import { QuestionType } from "@prisma/client";

interface TrueFalseEditorProps {
  questionId?: string;
  initialData?: {
    content: string;
    points: number;
    order: number;
    explanation?: string | null;
    options?: {
      id?: string;
      content: string;
      isCorrect: boolean;
      order: number;
    }[];
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function TrueFalseEditor({
  questionId,
  initialData,
  onSave,
  onCancel
}: TrueFalseEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  const [content, setContent] = useState(initialData?.content || "");
  const [points, setPoints] = useState(initialData?.points || 10);
  const [order, setOrder] = useState(initialData?.order || 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  
  // Get the correct answer from options
  const getCorrectAnswer = (): boolean => {
    if (!initialData?.options || initialData.options.length === 0) {
      return false; // Default to false if no options
    }
    
    // Find the option with isCorrect = true
    const correctOption = initialData.options.find(option => option.isCorrect);
    
    // In true/false, typically "True" is the first option (content "True" or order 0)
    // So if the correct option is the "True" option, return true
    if (correctOption) {
      return correctOption.content === "True" || correctOption.order === 0;
    }
    
    return false;
  };
  
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean>(
    getCorrectAnswer()
  );
  
  // Handle saving the question
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Create options for True and False
      const options = [
        {
          content: "True",
          isCorrect: isCorrectAnswer === true,
          order: 0
        },
        {
          content: "False",
          isCorrect: isCorrectAnswer === false,
          order: 1
        }
      ];
      
      // Creating final data structure
      const finalData = {
        type: QuestionType.TRUE_FALSE,
        content,
        points,
        order,
        explanation,
        options,
        // Add required field for API schema
        correctAnswer: isCorrectAnswer,
      };
      
      console.log("TrueFalseEditor submitting:", JSON.stringify(finalData, null, 2));
      await onSave(finalData);
    } catch (error) {
      console.error("Error saving true/false question:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{questionId ? "Edit True/False Question" : "New True/False Question"}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Question
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Question Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Question Content</Label>
                <RichTextEditor 
                  content={content}
                  onChange={setContent}
                  placeholder="Enter a statement that is either true or false..."
                  minHeight="150px"
                />
                <p className="text-sm text-muted-foreground">
                  Write a statement that can be clearly identified as true or false.
                </p>
              </div>
              
              <div className="space-y-4 pt-4">
                <Label className="text-lg font-medium">Correct Answer</Label>
                <RadioGroup 
                  value={isCorrectAnswer ? "true" : "false"}
                  onValueChange={(value) => setIsCorrectAnswer(value === "true")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false">False</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Answer Explanation (Optional)</Label>
                <RichTextEditor 
                  content={explanation}
                  onChange={setExplanation}
                  placeholder="Enter explanation of why the answer is true or false..."
                  minHeight="150px"
                />
                <p className="text-sm text-muted-foreground">
                  This will be shown to students after the quiz if "Show Results" is enabled
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 