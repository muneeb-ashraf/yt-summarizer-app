import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Clock, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Summary } from "@/lib/supabase";

interface SummaryModalProps {
  summary: Summary | null;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function SummaryModal({
  summary,
  videoTitle,
  isOpen,
  onClose,
  onDelete,
}: SummaryModalProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  if (!summary) return null;

  const handleDelete = async () => {
    try {
      await onDelete(summary.id);
      setIsDeleteDialogOpen(false);
      onClose();
      toast({
        title: "Success",
        description: "Summary deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (format: "txt" | "pdf") => {
    const content = summary.summary;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary-${summary.video_id}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between mr-5">
              <div className="space-y-1">
                <DialogTitle>{videoTitle}</DialogTitle>
                <DialogDescription>
                  Generated on{" "}
                  {summary.created_at
                    ? new Date(summary.created_at).toLocaleString()
                    : "Unknown Date"}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 my-4">
            <Badge variant="secondary" className="capitalize">
              {summary.format}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {summary.language}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {new Date(summary.created_at).toLocaleString()}
            </div>
          </div>

          <div className="whitespace-pre-wrap">{summary.summary}</div>

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => handleDownload("txt")}>
              <Download className="h-4 w-4 mr-2" />
              Download TXT
            </Button>
            <Button variant="outline" onClick={() => handleDownload("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              summary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
