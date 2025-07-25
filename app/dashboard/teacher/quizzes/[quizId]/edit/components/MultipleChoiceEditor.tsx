"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Plus, Save, Trash2, GripVertical } from "lucide-react";
import { QuestionType } from "@prisma/client";
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from "react-beautiful-dnd";

interface OptionType {
  id: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

interface MultipleChoiceEditorProps {
  questionId?: string;
  initialData?: {
    content: string;
    points: number;
    order: number;
    explanation?: string | null;
    options?: OptionType[];
    metadata?: {
      allowMultiple?: boolean;
      shuffleOptions?: boolean;
    } | null;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function MultipleChoiceEditor({
  questionId,
  initialData,
  onSave,
  onCancel
}: MultipleChoiceEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  const [content, setContent] = useState(initialData?.content || "");
  const [points, setPoints] = useState(initialData?.points || 10);
  const [order, setOrder] = useState(initialData?.order || 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  
  // Options
  const [options, setOptions] = useState<OptionType[]>(
    initialData?.options || [
      { id: generateId(), content: "", isCorrect: false, order: 0 },
      { id: generateId(), content: "", isCorrect: false, order: 1 },
      { id: generateId(), content: "", isCorrect: false, order: 2 },
      { id: generateId(), content: "", isCorrect: false, order: 3 },
    ]
  );
  
  // Metadata
  const [allowMultiple, setAllowMultiple] = useState(
    initialData?.metadata?.allowMultiple || false
  );
  const [shuffleOptions, setShuffleOptions] = useState(
    initialData?.metadata?.shuffleOptions || false
  );
  
  // Generate a unique ID
  function generateId() {
    return `id_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Handle adding a new option
  const addOption = () => {
    setOptions([
      ...options,
      {
        id: generateId(),
        content: "",
        isCorrect: false,
        order: options.length,
      },
    ]);
  };
  
  // Handle removing an option
  const removeOption = (id: string) => {
    // Don't allow fewer than 2 options
    if (options.length <= 2) return;
    
    const newOptions = options.filter(option => option.id !== id);
    // Update order to be sequential
    const reorderedOptions = newOptions.map((option, index) => ({
      ...option,
      order: index,
    }));
    setOptions(reorderedOptions);
  };
  
  // Handle option content change
  const handleOptionContentChange = (id: string, content: string) => {
    setOptions(
      options.map(option =>
        option.id === id ? { ...option, content } : option
      )
    );
  };
  
  // Handle option correctness change
  const handleOptionCorrectChange = (id: string, isCorrect: boolean) => {
    if (!allowMultiple) {
      // For single choice, deselect all others
      setOptions(
        options.map(option =>
          option.id === id
            ? { ...option, isCorrect }
            : { ...option, isCorrect: false }
        )
      );
    } else {
      // For multiple choice, just toggle the selected one
      setOptions(
        options.map(option =>
          option.id === id ? { ...option, isCorrect } : option
        )
      );
    }
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(options);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order values
    const reorderedOptions = items.map((item, index) => ({
      ...item,
      order: index,
    }));
    
    setOptions(reorderedOptions);
  };
  
  // Handle saving the question
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validate that at least one option is marked as correct
      const hasCorrectOption = options.some(option => option.isCorrect);
      
      if (!hasCorrectOption) {
        alert("Please mark at least one option as correct.");
        setIsLoading(false);
        return;
      }
      
      // Ensure option content is filled
      const hasEmptyOption = options.some(option => !option.content.trim());
      
      if (hasEmptyOption) {
        alert("Please provide content for all options.");
        setIsLoading(false);
        return;
      }
      
      await onSave({
        type: QuestionType.MULTIPLE_CHOICE,
        content,
        points,
        order,
        explanation,
        options: options.map(option => ({
          id: option.id, // Keep ID for existing options (update case)
          content: option.content,
          isCorrect: option.isCorrect,
          order: option.order,
        })),
        metadata: {
          allowMultiple, // Use consistent naming
          shuffleOptions,
          allowPartialCredit: true // Default to allow partial credit
        },
      });
    } catch (error) {
      console.error("Error saving multiple choice question:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{questionId ? "Edit Multiple Choice Question" : "New Multiple Choice Question"}</span>
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
                  placeholder="Enter multiple choice question prompt..."
                  minHeight="150px"
                />
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">Answer Options</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowMultiple"
                      checked={allowMultiple}
                      onCheckedChange={setAllowMultiple}
                    />
                    <Label htmlFor="allowMultiple">Allow multiple correct answers</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="options" isDropDisabled={false} isCombineEnabled={false}>
                      {(provided: DroppableProvided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {options.map((option, index) => (
                            <Draggable key={option.id} draggableId={option.id} index={index}>
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-start space-x-2 bg-muted/50 p-2 rounded-md"
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-3 text-muted-foreground"
                                  >
                                    <GripVertical className="h-5 w-5" />
                                  </div>
                                  <Checkbox
                                    id={`option-${option.id}`}
                                    checked={option.isCorrect}
                                    onCheckedChange={(checked) =>
                                      handleOptionCorrectChange(option.id, checked === true)
                                    }
                                    className="mt-3"
                                  />
                                  <div className="flex-1">
                                    <Input
                                      value={option.content}
                                      onChange={(e) =>
                                        handleOptionContentChange(option.id, e.target.value)
                                      }
                                      placeholder={`Option ${index + 1}`}
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(option.id)}
                                    disabled={options.length <= 2}
                                    className="mt-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="shuffleOptions"
                  checked={shuffleOptions}
                  onCheckedChange={setShuffleOptions}
                />
                <Label htmlFor="shuffleOptions">Shuffle option order for each student</Label>
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