"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuestionType } from "@prisma/client";
import { Edit, Trash, GripVertical } from "lucide-react";

// Helper function to get question type label
const getQuestionTypeLabel = (type: QuestionType) => {
  const labels: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: "Multiple Choice",
    ESSAY: "Essay",
    TRUE_FALSE: "True/False",
    SHORT_ANSWER: "Short Answer",
    MATCHING: "Matching",
    FILL_BLANK: "Fill in the Blank",
    CODE: "Code",
    FILE_UPLOAD: "File Upload",
  };
  return labels[type] || type;
};

// Helper function to get badge variant based on question type
const getQuestionTypeBadgeVariant = (type: QuestionType): "default" | "outline" | "secondary" | "destructive" => {
  const variants: Record<QuestionType, "default" | "outline" | "secondary" | "destructive"> = {
    MULTIPLE_CHOICE: "default",
    ESSAY: "outline",
    TRUE_FALSE: "secondary",
    SHORT_ANSWER: "outline",
    MATCHING: "default",
    FILL_BLANK: "secondary",
    CODE: "outline",
    FILE_UPLOAD: "destructive",
  };
  return variants[type] || "default";
};

interface Question {
  id: string;
  type: QuestionType;
  content: string;
  order: number;
  points: number;
}

interface QuestionsListProps {
  questions: Question[];
  onEditQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestions: (newOrder: { id: string; order: number }[]) => void;
}

export function QuestionsList({
  questions,
  onEditQuestion,
  onDeleteQuestion,
  onReorderQuestions,
}: QuestionsListProps) {
  // State for reordering (we'll sort questions by order prop)
  const [orderedQuestions, setOrderedQuestions] = useState(() => {
    return [...questions].sort((a, b) => a.order - b.order);
  });

  // Update local state when questions prop changes
  useState(() => {
    const sorted = [...questions].sort((a, b) => a.order - b.order);
    setOrderedQuestions(sorted);
  });

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    if (!result.destination) {
      return; // Dropped outside the list
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return; // No change
    }

    // Reorder array
    const updatedQuestions = [...orderedQuestions];
    const [removed] = updatedQuestions.splice(sourceIndex, 1);
    updatedQuestions.splice(destinationIndex, 0, removed);

    // Update orders
    const withNewOrders = updatedQuestions.map((question, index) => ({
      ...question,
      order: index + 1,
    }));

    setOrderedQuestions(withNewOrders);

    // Send reorder to parent
    onReorderQuestions(
      withNewOrders.map(question => ({
        id: question.id,
        order: question.order,
      }))
    );
  };

  // If no questions, show empty state
  if (orderedQuestions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">No questions added yet.</p>
          <p className="text-sm text-muted-foreground">
            Click the "Add Question" button above to create your first question.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Questions</CardTitle>
        <CardDescription>
          Drag to reorder questions. Click edit to modify a question.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions" isDropDisabled={false} isCombineEnabled={false}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {orderedQuestions.map((question, index) => (
                  <Draggable
                    key={question.id}
                    draggableId={question.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="border rounded-md p-3 bg-background flex items-start gap-4"
                      >
                        <div
                          className="flex items-center self-stretch p-1 cursor-grab text-muted-foreground"
                          {...provided.dragHandleProps}
                        >
                          <GripVertical size={20} />
                        </div>

                        <div className="flex-grow overflow-hidden">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Q{index + 1}</span>
                              <Badge variant={getQuestionTypeBadgeVariant(question.type)}>
                                {getQuestionTypeLabel(question.type)}
                              </Badge>
                              <Badge variant="outline">{question.points} {question.points === 1 ? 'point' : 'points'}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {/* Strip HTML tags for display */}
                              {question.content.replace(/<[^>]*>/g, '')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onEditQuestion(question.id)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Trash className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this question? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteQuestion(question.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
} 