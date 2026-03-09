import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Folder = { id: number; name: string; parentId: number | null };
type Tag = { id: number; name: string; color: string; createdAt: Date };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId: number | null;
  folders: Folder[];
  tags: Tag[];
  onSuccess: () => void;
}

export default function NewTemplateDialog({ open, onOpenChange, defaultFolderId, folders, tags, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [folderId, setFolderId] = useState<string>(defaultFolderId ? String(defaultFolderId) : "root");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      setName(""); setDescription(""); setCode(""); setFolderId("root"); setSelectedTagIds([]);
      toast.success("Template saved");
    },
    onError: () => toast.error("Failed to save template"),
  });

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      code: code.trim(),
      folderId: folderId === "root" ? null : parseInt(folderId),
      tagIds: selectedTagIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Template</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Template Name <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. SaaS Hero Section"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-zinc-50 border-zinc-200 focus:border-indigo-500 focus:ring-indigo-200"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes / Description <span className="text-zinc-400 font-normal">(optional)</span></Label>
            <Input
              placeholder="What is this page for? Any notes..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-zinc-50 border-zinc-200 focus:border-indigo-500 focus:ring-indigo-200"
            />
          </div>

          {/* Folder + Tags row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="bg-zinc-50 border-zinc-200">
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No Folder</SelectItem>
                  {folders.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1.5 min-h-[38px] px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md">
                {tags.length === 0 ? (
                  <span className="text-xs text-zinc-400">No tags yet</span>
                ) : (
                  tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? "text-white border-transparent"
                          : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                      }`}
                      style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                    >
                      {tag.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">HTML/CSS Code <span className="text-red-500">*</span></Label>
            <div className="rounded-lg overflow-hidden border border-zinc-200">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                <span className="text-xs font-mono text-zinc-400">index.html</span>
                <span className="text-xs text-zinc-500">{code.length} chars</span>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Paste your combined HTML/CSS code here..."
                spellCheck={false}
                rows={14}
                className="w-full bg-zinc-950 text-zinc-100 p-4 font-mono text-sm leading-relaxed resize-none outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || !name.trim() || !code.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {createMutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
