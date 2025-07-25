"use client";

import * as React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  granularity?: "day" | "minute" | "second";
  className?: string;
}

export function DateTimePicker({
  date,
  setDate,
  granularity = "minute",
  className,
}: DateTimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<{
    hours: string;
    minutes: string;
    seconds: string;
  }>({
    hours: date ? format(date, "HH") : "12",
    minutes: date ? format(date, "mm") : "00",
    seconds: date ? format(date, "ss") : "00",
  });

  // Update time state when date prop changes
  React.useEffect(() => {
    if (date) {
      setSelectedTime({
        hours: format(date, "HH"),
        minutes: format(date, "mm"),
        seconds: format(date, "ss"),
      });
    }
  }, [date]);

  // Update the date with the selected time
  const updateDateWithTime = React.useCallback(() => {
    if (!date) return;

    const hours = parseInt(selectedTime.hours);
    const minutes = parseInt(selectedTime.minutes);
    const seconds = parseInt(selectedTime.seconds);

    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(seconds);

    setDate(newDate);
  }, [date, selectedTime, setDate]);

  // Update time when hours, minutes, or seconds change
  React.useEffect(() => {
    if (date) {
      updateDateWithTime();
    }
  }, [selectedTime, updateDateWithTime, date]);

  // Generate arrays for hours, minutes, and seconds
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const seconds = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  // Handle time selection
  const handleSelectTime = (value: string, type: "hours" | "minutes" | "seconds") => {
    setSelectedTime((prev) => ({ ...prev, [type]: value }));
  };

  // Handle date selection
  const handleSelectDate = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      return;
    }

    if (date) {
      // Keep the existing time when selecting a new date
      const newDate = new Date(selectedDate);
      const hours = parseInt(selectedTime.hours);
      const minutes = parseInt(selectedTime.minutes);
      const seconds = parseInt(selectedTime.seconds);

      newDate.setHours(hours, minutes, seconds);
      setDate(newDate);
    } else {
      // If there was no date before, set with default time (current time)
      setDate(selectedDate);
    }
  };

  // Handle clearing the date
  const handleClear = () => {
    setDate(undefined);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelectDate}
            initialFocus
          />
          
          {granularity !== "day" && date && (
            <div className="border-t border-border p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                <Select
                  value={selectedTime.hours}
                  onValueChange={(value) => handleSelectTime(value, "hours")}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="h-48">
                    {hours.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground self-center">:</span>
                <Select
                  value={selectedTime.minutes}
                  onValueChange={(value) => handleSelectTime(value, "minutes")}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="h-48">
                    {minutes.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {granularity === "second" && (
                  <>
                    <span className="text-muted-foreground self-center">:</span>
                    <Select
                      value={selectedTime.seconds}
                      onValueChange={(value) => handleSelectTime(value, "seconds")}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue placeholder="SS" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="h-48">
                        {seconds.map((second) => (
                          <SelectItem key={second} value={second}>
                            {second}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
              
              {date && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-8"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
} 