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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  videoUrl: z.string().min(1, "Video URL is required")
    .regex(/(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\s]+)/, "Invalid YouTube URL"),
  format: z.enum(["paragraph", "bullets", "timestamped"]),
  language: z.enum(["en", "es", "fr"])
});

type FormData = z.infer<typeof formSchema>;

export function SummaryCreator() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      videoUrl: "",
      format: "paragraph",
      language: "en"
    }
  });

  const { createSummary, isLoading } = useCreateSummary();
  const [videoId, setVideoId] = useState<string | null>(null);

  const onSubmit = (data: FormData) => {
    const videoIdMatch = data.videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\s]+)/);
    if (!videoIdMatch) return;

    const extractedVideoId = videoIdMatch[1];
    setVideoId(extractedVideoId);

    createSummary({
      videoId: extractedVideoId,
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
                    value={field.value}
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
                    value={field.value}
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