"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { 
  Save, 
  Plus, 
  PlusCircle, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import { QuestionType } from "@prisma/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

interface Blank {
  id: string;
  correctAnswers: string[];
  caseSensitive: boolean;
  points?: number;
}

interface FillBlankEditorProps {
  questionId?: string;
  initialData?: {
    content: string;
    points: number;
    order: number;
    explanation?: string | null;
    blanks?: Blank[];
    metadata?: {
      template?: string;
    } | null;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

// Generate a unique ID for blanks
const generateId = () => `blank_${Math.random().toString(36).substr(2, 9)}`;

export function FillBlankEditor({
  questionId,
  initialData,
  onSave,
  onCancel
}: FillBlankEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  const [content, setContent] = useState(initialData?.content || "");
  const [points, setPoints] = useState(initialData?.points || 10);
  const [order, setOrder] = useState(initialData?.order || 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  
  // Template with blank markers like [blank_123]
  const [template, setTemplate] = useState(initialData?.metadata?.template || "");
  
  // Blanks with correct answers
  const [blanks, setBlanks] = useState<Blank[]>(
    initialData?.blanks || []
  );
  
  // Current blank being edited
  const [currentBlankId, setCurrentBlankId] = useState<string | null>(null);
  
  // Add a new blank
  const addBlank = useCallback(() => {
    const newBlankId = generateId();
    setBlanks([...blanks, {
      id: newBlankId,
      correctAnswers: [""],
      caseSensitive: false
    }]);
    
    // Update template to include the new blank
    setTemplate(prev => {
      if (prev.trim() === "") {
        return `[${newBlankId}]`;
      }
      return `${prev} [${newBlankId}]`;
    });
    
    // Set this as the current blank being edited
    setCurrentBlankId(newBlankId);
  }, [blanks]);
  
  // Remove a blank
  const removeBlank = (id: string) => {
    setBlanks(blanks.filter(blank => blank.id !== id));
    
    // Remove the blank marker from the template
    setTemplate(prev => prev.replace(`[${id}]`, ""));
    
    if (currentBlankId === id) {
      setCurrentBlankId(null);
    }
  };
  
  // Add a new correct answer for a blank
  const addCorrectAnswer = (blankId: string) => {
    setBlanks(blanks.map(blank => {
      if (blank.id === blankId) {
        return {
          ...blank,
          correctAnswers: [...blank.correctAnswers, ""]
        };
      }
      return blank;
    }));
  };
  
  // Remove a correct answer for a blank
  const removeCorrectAnswer = (blankId: string, index: number) => {
    setBlanks(blanks.map(blank => {
      if (blank.id === blankId && blank.correctAnswers.length > 1) {
        const newAnswers = [...blank.correctAnswers];
        newAnswers.splice(index, 1);
        return {
          ...blank,
          correctAnswers: newAnswers
        };
      }
      return blank;
    }));
  };
  
  // Update a correct answer for a blank
  const updateCorrectAnswer = (blankId: string, index: number, value: string) => {
    setBlanks(blanks.map(blank => {
      if (blank.id === blankId) {
        const newAnswers = [...blank.correctAnswers];
        newAnswers[index] = value;
        return {
          ...blank,
          correctAnswers: newAnswers
        };
      }
      return blank;
    }));
  };
  
  // Toggle case sensitivity for a blank
  const toggleCaseSensitive = (blankId: string) => {
    setBlanks(blanks.map(blank => {
      if (blank.id === blankId) {
        return {
          ...blank,
          caseSensitive: !blank.caseSensitive
        };
      }
      return blank;
    }));
  };
  
  // Find a blank by ID
  const getBlankById = (id: string) => {
    return blanks.find(blank => blank.id === id);
  };
  
  // Handle saving the question
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validate template and blanks
      if (!template.trim() || blanks.length === 0) {
        alert("Please add at least one blank to your question.");
        setIsLoading(false);
        return;
      }
      
      // Check if all blanks in the template have corresponding data
      const templateBlankIds = (template.match(/\[(blank_[a-z0-9]+)\]/g) || [])
        .map(match => match.substring(1, match.length - 1));
      
      const blankIds = blanks.map(blank => blank.id);
      
      const missingTemplateIds = templateBlankIds.filter(id => !blankIds.includes(id));
      const unusedBlankIds = blankIds.filter(id => !templateBlankIds.includes(id));
      
      if (missingTemplateIds.length > 0) {
        alert(`Template contains blanks that have no definition: ${missingTemplateIds.join(", ")}`);
        setIsLoading(false);
        return;
      }
      
      // Create options for blanks (needed for compatibility with other question types)
      const options = blanks.map((blank, index) => ({
        content: blank.correctAnswers.join(", "),
        isCorrect: true,
        order: index,
      }));
      
      // Create API compatible blanks array 
      const apiCompatibleBlanks = blanks.map(blank => ({
        id: blank.id,
        acceptableAnswers: blank.correctAnswers.filter(answer => answer.trim() !== ""),
        caseSensitive: blank.caseSensitive,
        points: blank.points || 1,
      }));
      
      // Final data structure
      const finalData = {
        type: QuestionType.FILL_BLANK,
        content,
        points,
        order,
        explanation,
        options,
        // Add required fields for API schema
        text: template,
        blanks: apiCompatibleBlanks
      };
      
      console.log("FillBlankEditor submitting:", JSON.stringify(finalData, null, 2));
      await onSave(finalData);
    } catch (error) {
      console.error("Error saving fill-in-the-blank question:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{questionId ? "Edit Fill in the Blank Question" : "New Fill in the Blank Question"}</span>
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
                <Label>Question Instructions</Label>
                <RichTextEditor 
                  content={content}
                  onChange={setContent}
                  placeholder="Enter instructions for the fill-in-the-blank question..."
                  minHeight="100px"
                />
                <p className="text-sm text-muted-foreground">
                  Provide general instructions for filling in the blanks.
                </p>
              </div>
              
              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">Question Template</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addBlank}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Blank
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Create your text with blanks designated by [blank_id] markers. Add, edit, or remove blanks.
                </p>
                
                <div className="border rounded-md p-4 bg-muted/30 min-h-[100px] whitespace-pre-wrap">
                  {template ? (
                    template.split(/(\[blank_[a-z0-9]+\])/).map((part, index) => {
                      if (part.match(/\[blank_[a-z0-9]+\]/)) {
                        const blankId = part.substring(1, part.length - 1);
                        return (
                          <Button
                            key={index}
                            variant="secondary"
                            size="sm"
                            className="mx-1 px-2 py-0 h-7 bg-primary/20 hover:bg-primary/30"
                            onClick={() => setCurrentBlankId(blankId)}
                          >
                            {`[Blank ${blanks.findIndex(b => b.id === blankId) + 1}]`}
                          </Button>
                        );
                      }
                      return <span key={index}>{part}</span>;
                    })
                  ) : (
                    <div className="text-muted-foreground italic flex items-center justify-center h-full">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Add blanks to create your template
                    </div>
                  )}
                </div>
                
                <Input
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Type or edit your template with [blank_id] markers"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Advanced: You can directly edit the template format above. Use [blank_id] format for blanks.
                </p>
              </div>
              
              {currentBlankId && (
                <div className="border rounded-md p-4 space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Editing Blank {blanks.findIndex(b => b.id === currentBlankId) + 1}
                    </h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBlank(currentBlankId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Blank
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="caseSensitive"
                        checked={getBlankById(currentBlankId)?.caseSensitive || false}
                        onCheckedChange={() => toggleCaseSensitive(currentBlankId)}
                      />
                      <Label htmlFor="caseSensitive">Case sensitive</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Correct Answers</Label>
                      <p className="text-sm text-muted-foreground">
                        Add all acceptable answers for this blank.
                      </p>
                      
                      {getBlankById(currentBlankId)?.correctAnswers.map((answer, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={answer}
                            onChange={(e) => updateCorrectAnswer(currentBlankId, index, e.target.value)}
                            placeholder={`Correct answer ${index + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCorrectAnswer(currentBlankId, index)}
                            disabled={getBlankById(currentBlankId)?.correctAnswers.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addCorrectAnswer(currentBlankId)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Correct Answer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
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
                  placeholder="Enter explanation of the correct answers..."
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