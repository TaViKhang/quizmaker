"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RubricBuilder, RubricCriterion } from "@/components/ui/editor/rubric-builder";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Pencil, Save, HelpCircle, Calendar } from "lucide-react";
import { QuestionType } from "@prisma/client";
import { DateTimePicker } from "@/components/ui/date-time-picker";

interface EssayQuestionEditorProps {
  questionId?: string;
  initialData?: {
    content: string;
    points: number;
    order: number;
    explanation?: string | null;
    metadata?: {
      minWords?: number;
      maxWords?: number;
      placeholder?: string;
      richText?: boolean;
      rubric?: RubricCriterion[];
      gradingGuide?: string;
      exampleAnswer?: string;
      startDate?: string | null;
      endDate?: string | null;
      showResults?: boolean;
    } | null;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function EssayQuestionEditor({
  questionId,
  initialData,
  onSave,
  onCancel
}: EssayQuestionEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  const [content, setContent] = useState(initialData?.content || "");
  const [points, setPoints] = useState(initialData?.points || 10);
  const [order, setOrder] = useState(initialData?.order || 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  
  // Metadata
  const [minWords, setMinWords] = useState(initialData?.metadata?.minWords || 0);
  const [maxWords, setMaxWords] = useState(initialData?.metadata?.maxWords || 0);
  const [placeholder, setPlaceholder] = useState(initialData?.metadata?.placeholder || "Enter your answer here...");
  const [richText, setRichText] = useState(initialData?.metadata?.richText || false);
  const [rubric, setRubric] = useState<RubricCriterion[]>(initialData?.metadata?.rubric || []);
  const [gradingGuide, setGradingGuide] = useState(initialData?.metadata?.gradingGuide || "");
  const [exampleAnswer, setExampleAnswer] = useState(initialData?.metadata?.exampleAnswer || "");
  
  // Time and result settings
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.metadata?.startDate ? new Date(initialData.metadata.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.metadata?.endDate ? new Date(initialData.metadata.endDate) : undefined
  );
  const [showResults, setShowResults] = useState<boolean>(
    initialData?.metadata?.showResults !== undefined ? initialData.metadata.showResults : true
  );
  
  // Generate a unique ID
  const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;
  
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Create final data structure
      const finalData = {
        type: QuestionType.ESSAY,
        content,
        points,
        order,
        explanation,
        options: [], // Essay questions don't use options, but API might expect an array
        metadata: {
          minWords: minWords > 0 ? minWords : undefined,
          maxWords: maxWords > 0 ? maxWords : undefined,
          placeholder,
          richText,
          rubric: rubric.length > 0 ? rubric : undefined,
          gradingGuide: gradingGuide || undefined,
          exampleAnswer: exampleAnswer || undefined,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
          showResults
        }
      };
      
      console.log("EssayQuestionEditor submitting:", JSON.stringify(finalData, null, 2));
      await onSave(finalData);
    } catch (error) {
      console.error("Error saving essay question:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{questionId ? "Edit Essay Question" : "New Essay Question"}</span>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content">Question Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="rubric">Rubric</TabsTrigger>
              <TabsTrigger value="grading">Grading Guide</TabsTrigger>
              <TabsTrigger value="timing">Time & Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Question Content</Label>
                <RichTextEditor 
                  content={content}
                  onChange={setContent}
                  placeholder="Enter essay question prompt..."
                  minHeight="200px"
                  rawOutput={false}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minWords">Minimum Words</Label>
                  <Input
                    id="minWords"
                    type="number"
                    min="0"
                    value={minWords}
                    onChange={(e) => setMinWords(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Set to 0 for no minimum
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxWords">Maximum Words</Label>
                  <Input
                    id="maxWords"
                    type="number"
                    min="0"
                    value={maxWords}
                    onChange={(e) => setMaxWords(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Set to 0 for no maximum
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="placeholder">Answer Placeholder</Label>
                <Input
                  id="placeholder"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Text to show in the answer field before the student starts typing
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="richText"
                  checked={richText}
                  onCheckedChange={setRichText}
                />
                <Label htmlFor="richText">Enable Rich Text Editor for Students</Label>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label>Answer Explanation (Optional)</Label>
                <RichTextEditor 
                  content={explanation}
                  onChange={setExplanation}
                  placeholder="Enter explanation or sample answer..."
                  minHeight="150px"
                  rawOutput={false}
                />
                <p className="text-sm text-muted-foreground">
                  This will be shown to students after the quiz if "Show Results" is enabled
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="rubric" className="space-y-4 pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Create a rubric to help with grading this essay question. Define criteria and performance levels.
                </p>
              </div>
              
              <RubricBuilder
                criteria={rubric}
                onChange={setRubric}
                maxPoints={points}
              />
            </TabsContent>
            
            <TabsContent value="grading" className="space-y-4 pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Pencil className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Create grading guides and example answers to assist with consistent grading.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Grading Guide (For Teachers)</Label>
                <RichTextEditor 
                  content={gradingGuide}
                  onChange={setGradingGuide}
                  placeholder="Enter guidelines for grading this essay..."
                  minHeight="150px"
                  rawOutput={false}
                />
                <p className="text-sm text-muted-foreground">
                  This will only be visible to teachers when grading student responses.
                </p>
              </div>
              
              <div className="space-y-2 mt-6">
                <Label>Example Answer</Label>
                <RichTextEditor 
                  content={exampleAnswer}
                  onChange={setExampleAnswer}
                  placeholder="Enter an example of an ideal answer..."
                  minHeight="150px"
                  rawOutput={false}
                />
                <p className="text-sm text-muted-foreground">
                  This will only be visible to teachers when grading student responses.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="timing" className="space-y-4 pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Set optional start and end dates for question availability. Leave blank for always available.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Available From (Optional)</Label>
                  <DateTimePicker
                    date={startDate}
                    setDate={setStartDate}
                    granularity="minute"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Available Until (Optional)</Label>
                  <DateTimePicker
                    date={endDate}
                    setDate={setEndDate}
                    granularity="minute"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="showResults"
                  checked={showResults}
                  onCheckedChange={setShowResults}
                />
                <Label htmlFor="showResults">Show Results to Students After Quiz</Label>
              </div>
              <p className="text-sm text-muted-foreground pl-7">
                When enabled, students will be able to see their answers, scores, and explanations after quiz completion
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 