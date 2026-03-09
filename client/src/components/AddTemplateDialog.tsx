import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code2 } from "lucide-react";

type Folder = { id: number; name: string; parentId: number | null };
type Tag = { id: number; name: string; color: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId: number | null;
  folders: Folder[];
  tags: Tag[];
  onSuccess: () => void;
}

export default function AddTemplateDialog({ open, onOpenChange, defaultFolderId, folders, tags, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [folderId, setFolderId] = useState<string>(defaultFolderId ? String(defaultFolderId) : "root");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tab, setTab] = useState<"code" | "preview">("code");

  const createMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      resetForm();
      toast.success("Template saved");
    },
    onError: () => toast.error("Failed to save template"),
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCode("");
    setFolderId(defaultFolderId ? String(defaultFolderId) : "root");
    setSelectedTagIds([]);
    setTab("code");
  };

  const toggleTag = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !code.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      code: code.trim(),
      folderId: folderId === "root" ? null : parseInt(folderId),
      tagIds: selectedTagIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle>Add New Template</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
          {/* Name and description */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="space-y-1.5">
              <Label className="text-xs">Template Name *</Label>
              <Input
                placeholder="e.g. SaaS Hero Section"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-8 text-sm bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description (optional)</Label>
              <Input
                placeholder="Brief description..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="h-8 text-sm bg-secondary"
              />
            </div>
          </div>

          {/* Folder and tags */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="space-y-1.5">
              <Label className="text-xs">Folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="h-8 text-sm bg-secondary">
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
            <div className="space-y-1.5">
              <Label className="text-xs">Tags</Label>
              <div className="flex flex-wrap gap-1 min-h-8 p-1 bg-secondary rounded-md border border-input">
                {tags.length === 0 ? (
                  <span className="text-xs text-muted-foreground self-center px-1">No tags created yet</span>
                ) : (
                  tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        selectedTagIds.includes(tag.id)
                          ? "text-white border-transparent"
                          : "border-border text-muted-foreground hover:border-primary"
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

          {/* Code editor with preview tab */}
          <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
            <div className="flex items-center justify-between shrink-0">
              <Label className="text-xs">HTML / CSS Code *</Label>
              <div className="flex items-center bg-secondary rounded-md p-0.5 gap-0.5">
                <button
                  onClick={() => setTab("code")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                    tab === "code" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code2 size={11} /> Code
                </button>
                <button
                  onClick={() => setTab("preview")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                    tab === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye size={11} /> Preview
                </button>
              </div>
            </div>

            {tab === "code" ? (
              <Textarea
                placeholder="Paste your full HTML/CSS code here..."
                value={code}
                onChange={e => setCode(e.target.value)}
                className="flex-1 font-mono text-xs bg-secondary resize-none min-h-0"
                style={{ height: "100%" }}
              />
            ) : (
              <div className="flex-1 bg-white rounded-md border border-border overflow-hidden">
                {code ? (
                  <iframe
                    srcDoc={code}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    Add code to see preview
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
          <Button variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !code.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
