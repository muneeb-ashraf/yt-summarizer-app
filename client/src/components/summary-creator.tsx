import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCreateSummary } from "@/hooks/use-summary";
import { FormControl, FormField, FormItem, Form } from "@/components/ui/form";

interface FormData {
  videoUrl: string;
  format: string;
  language: string;
}

export function SummaryCreator() {
  const form = useForm<FormData>({
    defaultValues: {
      videoUrl: "",
      format: "paragraph",
      language: "en"
    }
  });

  const { mutate: createSummary, isLoading } = useCreateSummary();
  const [videoId, setVideoId] = useState<string | null>(null);

  const onSubmit = (data: FormData) => {
    // Extract video ID from URL
    const videoIdMatch = data.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\s]+)/);
    if (!videoIdMatch) {
      return;
    }

    setVideoId(videoIdMatch[1]);
    createSummary({
      videoId: videoIdMatch[1],
      format: data.format,
      language: data.language
    });
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Paste YouTube video URL"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Summary format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph</SelectItem>
                      <SelectItem value="bullets">Bullet Points</SelectItem>
                      <SelectItem value="timestamped">Timestamped</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Summary...
              </>
            ) : (
              "Generate Summary"
            )}
          </Button>
        </form>
      </Form>

      {videoId && (
        <div className="mt-4">
          <iframe
            width="100%"
            height="200"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </Card>
  );
}