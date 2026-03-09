import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Folder = { id: number; name: string; parentId: number | null };
type Template = { id: number; name: string; folderId: number | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template;
  folders: Folder[];
  onSuccess: () => void;
}

export default function MoveTemplateDialog({ open, onOpenChange, template, folders, onSuccess }: Props) {
  const [folderId, setFolderId] = useState<string>(
    template.folderId ? String(template.folderId) : "root"
  );

  const moveMutation = trpc.template.move.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      toast.success("Template moved");
    },
    onError: () => toast.error("Failed to move template"),
  });

  const handleMove = () => {
    moveMutation.mutate({
      id: template.id,
      folderId: folderId === "root" ? null : parseInt(folderId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Move Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Moving: <span className="text-foreground font-medium">{template.name}</span>
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs">Destination Folder</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (no folder)</SelectItem>
                {folders.map(f => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleMove} disabled={moveMutation.isPending}>
            {moveMutation.isPending ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
