"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/ui/editor/rich-text-editor";
import { Plus, Save, Trash2, ArrowUpDown, ArrowRight } from "lucide-react";
import { QuestionType } from "@prisma/client";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";

interface Premise {
  id: string;
  content: string;
}

interface Response {
  id: string;
  content: string;
}

interface CorrectPair {
  premiseId: string;
  responseId: string;
}

interface MatchingEditorProps {
  questionId?: string;
  initialData?: {
    content: string;
    points: number;
    order: number;
    explanation?: string | null;
    options?: Array<{
      id?: string;
      content: string;
      group?: string;
      matchId?: string;
    }>;
    metadata?: {
      shuffleOptions?: boolean;
    } | null;
  };
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function MatchingEditor({
  questionId,
  initialData,
  onSave,
  onCancel
}: MatchingEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  
  const [content, setContent] = useState(initialData?.content || "");
  const [points, setPoints] = useState(initialData?.points || 10);
  const [order, setOrder] = useState(initialData?.order || 0);
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  
  // Generate a unique ID for client-side use only
  // Format: id_[random string] - this prefix helps us identify client-generated IDs 
  // vs. server-generated IDs when sending data to the API
  const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;
  
  // Process existing options if available
  const processInitialOptions = () => {
    if (!initialData?.options || initialData.options.length === 0) {
      return {
        premises: [
          { id: generateId(), content: "" },
          { id: generateId(), content: "" }
        ],
        responses: [
          { id: generateId(), content: "" },
          { id: generateId(), content: "" }
        ],
        correctPairs: []
      };
    }
    
    // Extract premises and responses from options
    const premises: Premise[] = [];
    const responses: Response[] = [];
    const correctPairs: CorrectPair[] = [];
    
    // Use consistent group identifiers: 'premise' and 'response'
    const premiseOptions = initialData.options.filter(o => o.group === 'premise');
    const responseOptions = initialData.options.filter(o => o.group === 'response');
    
    // Compatibility for legacy data (if any) that used 'left'/'right' instead of 'premise'/'response'
    if (premiseOptions.length === 0) {
      premiseOptions.push(...initialData.options.filter(o => o.group === 'left'));
    }
    if (responseOptions.length === 0) {
      responseOptions.push(...initialData.options.filter(o => o.group === 'right'));
    }
    
    // Create premises - preserve original IDs from initialData
    premiseOptions.forEach(option => {
      premises.push({
        id: option.id || generateId(), // Keep original ID if exists, generate only if needed
        content: option.content
      });
    });
    
    // Create responses - preserve original IDs from initialData
    responseOptions.forEach(option => {
      responses.push({
        id: option.id || generateId(), // Keep original ID if exists, generate only if needed
        content: option.content
      });
    });
    
    // Create correct pairs based on matchId from premise options
    premiseOptions.forEach(premiseOption => {
      if (premiseOption.matchId) {
        // Find the premise and response objects using exact ID matches
        const premise = premises.find(p => p.id === premiseOption.id);
        
        // Only create a pair if both premise and matchId exist
        if (premise) {
          correctPairs.push({
            premiseId: premise.id,
            responseId: premiseOption.matchId
          });
        }
      }
    });
    
    // If we don't have enough items, add empty ones
    if (premises.length < 2) {
      while (premises.length < 2) {
        premises.push({ id: generateId(), content: "" });
      }
    }
    
    if (responses.length < 2) {
      while (responses.length < 2) {
        responses.push({ id: generateId(), content: "" });
      }
    }
    
    return { premises, responses, correctPairs };
  };
  
  const initialState = processInitialOptions();
  
  // Separate state for premises, responses, and correct pairs
  const [premises, setPremises] = useState<Premise[]>(initialState.premises);
  const [responses, setResponses] = useState<Response[]>(initialState.responses);
  const [correctPairs, setCorrectPairs] = useState<CorrectPair[]>(
    initialState.correctPairs.length > 0 
      ? initialState.correctPairs 
      : [{ 
          premiseId: initialState.premises[0]?.id || '', 
          responseId: initialState.responses[0]?.id || '' 
        }]
  );
  
  // Metadata
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(
    initialData?.metadata?.shuffleOptions ?? true
  );
  
  // Premise management functions
  const addPremise = () => {
    setPremises([...premises, { id: generateId(), content: "" }]);
  };

  const updatePremise = (id: string, content: string) => {
    setPremises(premises.map(premise => 
      premise.id === id ? { ...premise, content } : premise
    ));
  };

  const removePremise = (id: string) => {
    if (premises.length <= 2) return; // Keep at least two premises
    
    // Remove the premise
    setPremises(premises.filter(premise => premise.id !== id));
    
    // Also remove any correct pairs that use this premise
    setCorrectPairs(correctPairs.filter(pair => pair.premiseId !== id));
  };
  
  // Response management functions
  const addResponse = () => {
    setResponses([...responses, { id: generateId(), content: "" }]);
  };

  const updateResponse = (id: string, content: string) => {
    setResponses(responses.map(response => 
      response.id === id ? { ...response, content } : response
    ));
  };

  const removeResponse = (id: string) => {
    if (responses.length <= 2) return; // Keep at least two responses
    
    // Remove the response
    setResponses(responses.filter(response => response.id !== id));
    
    // Also remove any correct pairs that use this response
    setCorrectPairs(correctPairs.filter(pair => pair.responseId !== id));
  };
  
  // Correct pairs management functions
  const addCorrectPair = () => {
    setCorrectPairs([...correctPairs, { 
      premiseId: premises.length > 0 ? premises[0].id : '',
      responseId: responses.length > 0 ? responses[0].id : ''
    }]);
  };

  const updateCorrectPair = (index: number, field: 'premiseId' | 'responseId', value: string) => {
    const newPairs = [...correctPairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    setCorrectPairs(newPairs);
  };

  const removeCorrectPair = (index: number) => {
    if (correctPairs.length <= 1) return; // Keep at least one pair
    
    const newPairs = [...correctPairs];
    newPairs.splice(index, 1);
    setCorrectPairs(newPairs);
  };

  // Utility function to get premise/response content by ID
  const getPremiseContent = (id: string) => {
    const premise = premises.find(p => p.id === id);
    return premise ? premise.content : 'Select an item';
  };

  const getResponseContent = (id: string) => {
    const response = responses.find(r => r.id === id);
    return response ? response.content : 'Select a response';
  };
  
  // Handle saving the question
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validate premises and responses
      const validPremises = premises.filter(p => p.content.trim() !== "");
      const validResponses = responses.filter(r => r.content.trim() !== "");
      
      if (validPremises.length < 2) {
        toast({
          title: "Validation Error",
          description: "Please add at least two items with content.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (validResponses.length < 2) {
        toast({
          title: "Validation Error",
          description: "Please add at least two responses with content.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Validate correct pairs
      const validPairs = correctPairs.filter(
        pair => 
          pair.premiseId && 
          pair.responseId && 
          validPremises.some(p => p.id === pair.premiseId) &&
          validResponses.some(r => r.id === pair.responseId)
      );
      
      if (validPairs.length < 1) {
        toast({
          title: "Validation Error",
          description: "Please create at least one valid matching pair.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Format data for API
      // Convert premises and responses to options format
      // IMPORTANT: We now preserve ALL IDs, including client-generated ones (id_*)
      // This allows the server to maintain correct matchId relationships
      const options = [
        // Premises (left column)
        ...validPremises.map((premise, index) => {
          return {
            id: premise.id, // Always include ID, even if client-generated
            content: premise.content,
            group: 'premise',  // Always use 'premise' as the group identifier
            order: index
          };
        }),
        
        // Responses (right column)
        ...validResponses.map((response, index) => {
          return {
            id: response.id, // Always include ID, even if client-generated
            content: response.content,
            group: 'response',  // Always use 'response' as the group identifier
            order: index
          };
        })
      ];
      
      // Add matchId to options based on correctPairs
      const optionsWithMatches = options.map(option => {
        // For premises, find if they are in a correctPair
        if (option.group === 'premise') {
          const premise = validPremises.find(p => p.id === option.id);
          
          if (premise) {
            const pair = validPairs.find(p => p.premiseId === premise.id);
            if (pair) {
              // Find the response option that matches this pair
              const responseOption = options.find(o => 
                o.group === 'response' && o.id === pair.responseId
              );
              
              // Use the response's ID as matchId
              return {
                ...option,
                matchId: pair.responseId // Use the responseId directly from the pair
              };
            }
          }
        }
        // For responses, the matchId is not needed (it's set on the premise)
        return option;
      });
      
      // Metadata
      const metadata = {
        shuffleOptions,
      };
      
      // Final data structure
      const finalData = {
        type: QuestionType.MATCHING,
        content,
        points,
        order,
        explanation,
        options: optionsWithMatches,
        metadata
      };
      
      await onSave(finalData);
    } catch (error) {
      console.error("Error saving matching question:", error);
      toast({
        title: "Error",
        description: "Failed to save the matching question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{questionId ? "Edit Matching Question" : "New Matching Question"}</span>
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
                  placeholder="Enter matching question instructions..."
                  minHeight="150px"
                />
                <p className="text-sm text-muted-foreground">
                  Provide instructions for the matching question (e.g., "Match the terms with their definitions").
                </p>
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-medium">Matching Items</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="shuffleOptions"
                      checked={shuffleOptions}
                      onCheckedChange={(checked: boolean) => setShuffleOptions(checked)}
                    />
                    <Label htmlFor="shuffleOptions">Shuffle responses</Label>
                  </div>
                </div>
                
                {/* Premises Section */}
                <div className="space-y-2 border p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Premises (Left Column)</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addPremise}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Premise
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create premises for the left column that students will match with responses.
                  </p>
                  
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-2">
                      {premises.map((premise) => (
                        <div key={premise.id} className="flex items-center gap-2">
                          <Input
                            value={premise.content}
                            onChange={(e) => updatePremise(premise.id, e.target.value)}
                            placeholder="Enter premise text"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePremise(premise.id)}
                            disabled={premises.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Responses section will go here */}
                <div className="space-y-2 border p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Responses (Right Column)</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addResponse}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Response
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Create responses for the right column that students will match with premises.
                  </p>
                  
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-2">
                      {responses.map((response) => (
                        <div key={response.id} className="flex items-center gap-2">
                          <Input
                            value={response.content}
                            onChange={(e) => updateResponse(response.id, e.target.value)}
                            placeholder="Enter response text"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeResponse(response.id)}
                            disabled={responses.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                {/* Correct Pairs section will go here */}
                <div className="space-y-2 border p-4 rounded-md mt-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Create Correct Matches</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addCorrectPair}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Match
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Define which premises match with which responses (correct answers).
                  </p>
                  
                  <div className="space-y-3">
                    {correctPairs.length === 0 ? (
                      <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                        No matches defined yet. Click "Add Match" to create one.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center font-medium">
                          <div>Premise</div>
                          <div></div>
                          <div>Response</div>
                          <div></div>
                        </div>
                        
                        {correctPairs.map((pair, index) => (
                          <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                            {/* Premise selector */}
                            <Select
                              value={pair.premiseId}
                              onValueChange={(value) => updateCorrectPair(index, 'premiseId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a premise" />
                              </SelectTrigger>
                              <SelectContent>
                                {premises.map((premise) => (
                                  <SelectItem key={premise.id} value={premise.id}>
                                    {premise.content || "<Empty premise>"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Arrow icon */}
                            <div className="flex justify-center">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                            
                            {/* Response selector */}
                            <Select
                              value={pair.responseId}
                              onValueChange={(value) => updateCorrectPair(index, 'responseId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a response" />
                              </SelectTrigger>
                              <SelectContent>
                                {responses.map((response) => (
                                  <SelectItem key={response.id} value={response.id}>
                                    {response.content || "<Empty response>"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {/* Delete button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCorrectPair(index)}
                              disabled={correctPairs.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                <Label>Answer Explanation (Optional)</Label>
                <RichTextEditor 
                  content={explanation}
                  onChange={setExplanation}
                  placeholder="Enter explanation of the correct pairs..."
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