"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  pointsAvailable: number;
  levels: {
    id: string;
    name: string;
    description: string;
    points: number;
  }[];
}

interface RubricBuilderProps {
  criteria: RubricCriterion[];
  onChange: (criteria: RubricCriterion[]) => void;
  maxPoints?: number;
  className?: string;
}

export function RubricBuilder({
  criteria,
  onChange,
  maxPoints,
  className
}: RubricBuilderProps) {
  // Generate a unique ID
  const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;

  // Add a new criterion
  const addCriterion = () => {
    const newCriteria = [
      ...criteria,
      {
        id: generateId(),
        name: "",
        description: "",
        pointsAvailable: 10,
        levels: [
          {
            id: generateId(),
            name: "Excellent",
            description: "",
            points: 10
          },
          {
            id: generateId(),
            name: "Good",
            description: "",
            points: 7
          },
          {
            id: generateId(),
            name: "Needs Improvement",
            description: "",
            points: 3
          }
        ]
      }
    ];
    onChange(newCriteria);
  };

  // Remove a criterion
  const removeCriterion = (criterionId: string) => {
    const newCriteria = criteria.filter(c => c.id !== criterionId);
    onChange(newCriteria);
  };

  // Update criterion properties
  const updateCriterion = (
    criterionId: string,
    field: keyof Omit<RubricCriterion, "id" | "levels">,
    value: string | number
  ) => {
    const newCriteria = criteria.map(criterion => {
      if (criterion.id === criterionId) {
        const updatedCriterion = {
          ...criterion,
          [field]: value
        };
        
        // Automatically adjust level points based on the new pointsAvailable
        // Only if the field being updated is pointsAvailable
        if (field === 'pointsAvailable' && typeof value === 'number') {
          const maxPoints = value;
          // Only update if there are 3 levels (default Excellent/Good/Needs Improvement)
          if (updatedCriterion.levels.length >= 3) {
            // Apply 100%/70%/30% distribution to the first three levels
            const newLevels = [...updatedCriterion.levels];
            newLevels[0].points = maxPoints; // 100% for Excellent
            newLevels[1].points = Math.round(maxPoints * 0.7); // 70% for Good
            newLevels[2].points = Math.round(maxPoints * 0.3); // 30% for Needs Improvement
            updatedCriterion.levels = newLevels;
          }
        }
        
        return updatedCriterion;
      }
      return criterion;
    });
    onChange(newCriteria);
  };

  // Add a level to a criterion
  const addLevel = (criterionId: string) => {
    const newCriteria = criteria.map(criterion => {
      if (criterion.id === criterionId) {
        return {
          ...criterion,
          levels: [
            ...criterion.levels,
            {
              id: generateId(),
              name: "New Level",
              description: "",
              points: 0
            }
          ]
        };
      }
      return criterion;
    });
    onChange(newCriteria);
  };

  // Remove a level from a criterion
  const removeLevel = (criterionId: string, levelId: string) => {
    const newCriteria = criteria.map(criterion => {
      if (criterion.id === criterionId) {
        return {
          ...criterion,
          levels: criterion.levels.filter(level => level.id !== levelId)
        };
      }
      return criterion;
    });
    onChange(newCriteria);
  };

  // Update level properties
  const updateLevel = (
    criterionId: string,
    levelId: string,
    field: keyof Omit<RubricCriterion["levels"][0], "id">,
    value: string | number
  ) => {
    const newCriteria = criteria.map(criterion => {
      if (criterion.id === criterionId) {
        return {
          ...criterion,
          levels: criterion.levels.map(level => {
            if (level.id === levelId) {
              return {
                ...level,
                [field]: value
              };
            }
            return level;
          })
        };
      }
      return criterion;
    });
    onChange(newCriteria);
  };

  // Calculate total points
  const totalPoints = criteria.reduce((sum, criterion) => 
    sum + criterion.pointsAvailable, 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Rubric Criteria</h3>
        {maxPoints && (
          <div className="text-sm">
            <span className={totalPoints > maxPoints ? "text-destructive" : ""}>
              {totalPoints}
            </span>{" "}
            / {maxPoints} points
          </div>
        )}
      </div>

      {criteria.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md">
          <p className="text-muted-foreground mb-2">No grading criteria defined yet</p>
          <Button onClick={addCriterion} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {criteria.map((criterion) => (
            <Card key={criterion.id} className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2 h-7 w-7"
                onClick={() => removeCriterion(criterion.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <CardHeader>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Criterion name"
                      value={criterion.name}
                      onChange={(e) => updateCriterion(criterion.id, "name", e.target.value)}
                      className="font-medium"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm whitespace-nowrap">Points:</span>
                      <Input
                        type="number"
                        min="0"
                        value={criterion.pointsAvailable}
                        onChange={(e) => updateCriterion(criterion.id, "pointsAvailable", Number(e.target.value))}
                        className="w-16"
                      />
                    </div>
                  </div>
                  <Textarea
                    placeholder="Describe this criterion..."
                    value={criterion.description}
                    onChange={(e) => updateCriterion(criterion.id, "description", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium mb-2">Performance Levels</h4>

                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center text-sm font-medium px-2">
                    <div>Level</div>
                    <div>Description</div>
                    <div>Points</div>
                  </div>

                  {criterion.levels.map((level) => (
                    <div key={level.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-start">
                      <Input
                        placeholder="Level name"
                        value={level.name}
                        onChange={(e) => updateLevel(criterion.id, level.id, "name", e.target.value)}
                      />
                      <Textarea
                        placeholder="Describe this level..."
                        value={level.description}
                        onChange={(e) => updateLevel(criterion.id, level.id, "description", e.target.value)}
                        className="resize-none min-h-[60px]"
                      />
                      <Input
                        type="number"
                        min="0"
                        max={criterion.pointsAvailable.toString()}
                        value={level.points}
                        onChange={(e) => updateLevel(criterion.id, level.id, "points", Number(e.target.value))}
                        className="w-16"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => removeLevel(criterion.id, level.id)}
                        disabled={criterion.levels.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addLevel(criterion.id)}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Level
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button 
            variant="outline" 
            onClick={addCriterion}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Criterion
          </Button>
        </div>
      )}
    </div>
  );
} 