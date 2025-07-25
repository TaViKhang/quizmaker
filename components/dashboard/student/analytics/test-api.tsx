"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export function TestClassParticipationAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<string>("last30days");

  const testAPI = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/me/class-participation-analytics?timeFrame=${timeFrame}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      setResponseData(result);
    } catch (err) {
      console.error("API test error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Test Class Participation API</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="last90days">Last 90 Days</SelectItem>
              <SelectItem value="allTime">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={testAPI} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test API"
            )}
          </Button>
        </div>
        
        {error && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive mb-4">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {responseData && (
          <div>
            <h3 className="font-medium mb-2">API Response:</h3>
            <Separator className="my-2" />
            <div className="overflow-auto max-h-96 bg-muted/50 p-2 rounded-md">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 