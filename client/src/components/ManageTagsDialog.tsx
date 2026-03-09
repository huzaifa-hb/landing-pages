import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Tag = { id: number; name: string; color: string; createdAt: Date };

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4", "#64748b", "#78716c",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  onSuccess: () => void;
}

export default function ManageTagsDialog({ open, onOpenChange, tags, onSuccess }: Props) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [deleteTag, setDeleteTag] = useState<Tag | null>(null);

  const createMutation = trpc.tag.create.useMutation({
    onSuccess: () => {
      onSuccess();
      setNewTagName("");
      setNewTagColor("#6366f1");
      toast.success("Tag created");
    },
    onError: (err) => {
      if (err.message.includes("Duplicate")) {
        toast.error("Tag name already exists");
      } else {
        toast.error("Failed to create tag");
      }
    },
  });

  const deleteMutation = trpc.tag.delete.useMutation({
    onSuccess: () => {
      onSuccess();
      setDeleteTag(null);
      toast.success("Tag deleted");
    },
    onError: () => toast.error("Failed to delete tag"),
  });

  const handleCreate = () => {
    if (!newTagName.trim()) return;
    createMutation.mutate({ name: newTagName.trim(), color: newTagColor });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
          </DialogHeader>

          {/* Create new tag */}
          <div className="space-y-3 py-2 border-b border-border pb-4">
            <Label className="text-xs font-medium">Create New Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                className="flex-1 h-8 text-sm bg-secondary"
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newTagName.trim() || createMutation.isPending}
                className="h-8 gap-1"
              >
                <Plus size={12} /> Add
              </Button>
            </div>
            {/* Color picker */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newTagColor === color ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-background" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={newTagColor}
                  onChange={e => setNewTagColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>
            {/* Preview */}
            {newTagName && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Preview:</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: newTagColor }}
                >
                  {newTagName}
                </span>
              </div>
            )}
          </div>

          {/* Existing tags */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <Label className="text-xs font-medium">Existing Tags ({tags.length})</Label>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No tags created yet.</p>
            ) : (
              <div className="space-y-1">
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent group">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-foreground">{tag.name}</span>
                    </div>
                    <button
                      onClick={() => setDeleteTag(tag)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting "{deleteTag?.name}" will remove it from all templates. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteTag && deleteMutation.mutate({ id: deleteTag.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
