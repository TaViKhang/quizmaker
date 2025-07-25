"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Plus, Save, Trash2 } from "lucide-react";
import { QuestionType } from "@prisma/client";

interface ShortAnswerEditorProps {
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
    }[];
    metadata?: {
      caseSensitive?: boolean;
      placeholder?: string;
    } | null;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function ShortAnswerEditor({
  questionId,
  initialData,
  onSave,
  onCancel
}: ShortAnswerEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  const [content, setContent] = useState(initialData?.content || "");
  const [points, setPoints] = useState(initialData?.points || 10);
  const [order, setOrder] = useState(initialData?.order || 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  
  // Correct answers
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(
    initialData?.options?.filter(o => o.isCorrect).map(o => o.content) || [""]
  );
  
  // Metadata
  const [caseSensitive, setCaseSensitive] = useState(
    initialData?.metadata?.caseSensitive || false
  );
  const [placeholder, setPlaceholder] = useState(
    initialData?.metadata?.placeholder || "Enter your answer..."
  );
  
  // Add a new correct answer
  const addCorrectAnswer = () => {
    setCorrectAnswers([...correctAnswers, ""]);
  };
  
  // Remove a correct answer
  const removeCorrectAnswer = (index: number) => {
    if (correctAnswers.length <= 1) return; // Keep at least one correct answer
    const newAnswers = [...correctAnswers];
    newAnswers.splice(index, 1);
    setCorrectAnswers(newAnswers);
  };
  
  // Update a correct answer
  const updateCorrectAnswer = (index: number, value: string) => {
    const newAnswers = [...correctAnswers];
    newAnswers[index] = value;
    setCorrectAnswers(newAnswers);
  };
  
  // Handle saving the question
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Filter out empty answers
      const filteredAnswers = correctAnswers.filter(answer => answer.trim() !== "");
      
      if (filteredAnswers.length === 0) {
        alert("Please add at least one correct answer.");
        setIsLoading(false);
        return;
      }
      
      // Create options for correct answers
      const options = filteredAnswers.map((answer, index) => ({
        content: answer,
        isCorrect: true,
        order: index,
      }));
      
      // Creating final data structure
      const finalData = {
        type: QuestionType.SHORT_ANSWER,
        content,
        points,
        order,
        explanation,
        options,
        metadata: {
          caseSensitive,
          placeholder
        }
      };
      
      console.log("ShortAnswerEditor submitting:", JSON.stringify(finalData, null, 2));
      await onSave(finalData);
    } catch (error) {
      console.error("Error saving short answer question:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{questionId ? "Edit Short Answer Question" : "New Short Answer Question"}</span>
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
                  placeholder="Enter short answer question prompt..."
                  minHeight="150px"
                />
                <p className="text-sm text-muted-foreground">
                  Write a question that requires a brief, specific answer.
                </p>
              </div>
              
              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">Correct Answers</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="caseSensitive"
                      checked={caseSensitive}
                      onCheckedChange={setCaseSensitive}
                    />
                    <Label htmlFor="caseSensitive">Case sensitive</Label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Add all acceptable answers. Students need to match one of these exactly.
                </p>
                
                <div className="space-y-2">
                  {correctAnswers.map((answer, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={answer}
                        onChange={(e) => updateCorrectAnswer(index, e.target.value)}
                        placeholder={`Correct answer ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCorrectAnswer(index)}
                        disabled={correctAnswers.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCorrectAnswer}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Correct Answer
                  </Button>
                </div>
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
                <Label htmlFor="placeholder">Answer Placeholder</Label>
                <Input
                  id="placeholder"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="Enter your answer..."
                />
                <p className="text-sm text-muted-foreground">
                  Text to show in the answer field before the student starts typing
                </p>
              </div>
              
              <div className="space-y-2 pt-6">
                <Label>Answer Explanation (Optional)</Label>
                <RichTextEditor 
                  content={explanation}
                  onChange={setExplanation}
                  placeholder="Enter explanation of the correct answer..."
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