import * as React from "react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "./ui/card";
import { useToast } from "../hooks/use-toast";
import { Loader2, Paintbrush } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";

const PRESET_MOODS = [
  { value: "energetic", label: "Energetic" },
  { value: "calm", label: "Calm" },
  { value: "professional", label: "Professional" },
  { value: "playful", label: "Playful" },
  { value: "elegant", label: "Elegant" },
  { value: "modern", label: "Modern" },
];

export function ThemeCustomizer() {
  const { toast } = useToast();
  const [customMood, setCustomMood] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("");
  const queryClient = useQueryClient();

  const { mutate: updateTheme, isPending } = useMutation({
    mutationFn: async (mood: string) => {
      const response = await fetch("/api/theme/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate theme");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme"] });
      toast({
        title: "Theme updated!",
        description: "Your new mood-based theme has been applied.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating theme",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateTheme = () => {
    const mood = customMood || selectedMood;
    if (!mood) {
      toast({
        title: "Please select a mood",
        description: "Choose a preset mood or enter your own description.",
        variant: "destructive",
      });
      return;
    }
    updateTheme(mood);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
        <CardDescription>
          Customize your theme based on your mood or desired atmosphere
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Choose a preset mood</label>
          <Select
            value={selectedMood}
            onValueChange={(value) => {
              setSelectedMood(value);
              setCustomMood("");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a mood" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_MOODS.map((mood) => (
                <SelectItem key={mood.value} value={mood.value}>
                  {mood.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Or describe your own mood</label>
          <Input
            placeholder="E.g., Sunset by the beach, Modern tech startup..."
            value={customMood}
            onChange={(e) => {
              setCustomMood(e.target.value);
              setSelectedMood("");
            }}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleUpdateTheme}
          disabled={isPending || (!selectedMood && !customMood)}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Theme...
            </>
          ) : (
            <>
              <Paintbrush className="mr-2 h-4 w-4" />
              Generate Theme
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}