import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  Code2,
  Save,
  Copy,
  Check,
  Download,
  Trash2,
  Tag,
  Folder,
  Columns2,
  MoreHorizontal,
  Pencil,
  Lock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Editor from "@monaco-editor/react";

type ViewMode = "preview" | "code" | "split";

export default function TemplatePage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const templateId = parseInt(params.id ?? "0");

  const utils = trpc.useUtils();

  const { data: template, isLoading } = trpc.template.getById.useQuery(
    { id: templateId },
    { enabled: !!templateId }
  );
  const { data: allFolders = [] } = trpc.folder.list.useQuery();
  const { data: allTags = [] } = trpc.tag.list.useQuery();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [folderId, setFolderId] = useState<string>("root");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copied, setCopied] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTagPanel, setShowTagPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileEditing, setMobileEditing] = useState(false);

  // Detect mobile to disable split view
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // If on mobile and split was selected, fall back to preview
  useEffect(() => {
    if (isMobile && viewMode === "split") setViewMode("preview");
  }, [isMobile, viewMode]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? "");
      setCode(template.code);
      setFolderId(template.folderId ? String(template.folderId) : "root");
      setSelectedTagIds(template.tags.map((t: { id: number }) => t.id));
      setIsDirty(false);
    }
  }, [template]);

  const updateMutation = trpc.template.update.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      utils.template.getById.invalidate({ id: templateId });
      setIsDirty(false);
      toast.success("Saved");
    },
    onError: () => toast.error("Failed to save"),
  });

  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      navigate("/");
      toast.success("Template deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleSave = useCallback(() => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    updateMutation.mutate({
      id: templateId,
      name: name.trim(),
      description: description.trim() || undefined,
      code,
      folderId: folderId === "root" ? null : parseInt(folderId),
      tagIds: selectedTagIds,
    });
  }, [name, description, code, folderId, selectedTagIds, templateId, updateMutation]);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, handleSave]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied");
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const toggleTag = (id: number) => {
    setSelectedTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    setIsDirty(true);
  };

  const isFullDoc = /<!doctype|<html/i.test(code);
  const previewSrcDoc = isFullDoc
    ? code
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;}</style></head><body>${code}</body></html>`;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Template not found.</p>
          <button onClick={() => navigate("/")} className="text-indigo-600 text-sm hover:underline">
            Back to vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">

      {/* Header - two rows on mobile, one row on desktop */}
      <div className="border-b border-border bg-card shrink-0">

        {/* Row 1: back + title + save */}
        <div className="h-14 md:h-16 px-3 md:px-6 flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setIsDirty(true); }}
            placeholder="Template name..."
            className="text-base md:text-xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 flex-1 min-w-0 truncate text-foreground"
          />

          {isDirty && (
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">Unsaved</span>
          )}

          {/* Save button - always visible */}
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || !isDirty}
            className={`flex items-center gap-1.5 px-3 md:px-4 h-9 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              isDirty
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-muted text-muted-foreground cursor-default"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{updateMutation.isPending ? "Saving..." : "Save"}</span>
          </button>

          {/* Desktop actions: copy, download, delete */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm bg-background border border-border text-muted-foreground hover:bg-accent transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadCode}
              className="p-2 h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-background border border-border text-muted-foreground hover:bg-accent transition-colors"
              title="Download .html"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-background border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-400/40 transition-colors"
              title="Delete template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile overflow menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden p-2 h-9 w-9 flex items-center justify-center rounded-lg text-sm bg-background border border-border text-muted-foreground hover:bg-accent transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={copyCode}>
                {copied ? <Check className="w-3.5 h-3.5 mr-2 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                {copied ? "Copied!" : "Copy code"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadCode}>
                <Download className="w-3.5 h-3.5 mr-2" /> Download .html
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: folder + tags (always visible, wraps on mobile) */}
        <div className="px-3 md:px-6 pb-2 flex items-center gap-2 flex-wrap">
          {/* Folder selector */}
          <Select value={folderId} onValueChange={v => { setFolderId(v); setIsDirty(true); }}>
            <SelectTrigger className="w-36 h-8 text-sm bg-background border-border gap-1.5">
              <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="No folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">No Folder</SelectItem>
              {allFolders.map((f: { id: number; name: string }) => (
                <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tag toggle */}
          <button
            onClick={() => setShowTagPanel(!showTagPanel)}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm border transition-colors ${
              showTagPanel || selectedTagIds.length > 0
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-background border-border text-muted-foreground hover:bg-accent"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Tags {selectedTagIds.length > 0 && `(${selectedTagIds.length})`}
          </button>

          {/* Ctrl+S hint - desktop only */}
          <span className="ml-auto text-xs text-muted-foreground hidden md:inline">Ctrl+S to save</span>
        </div>
      </div>

      {/* Tag + Notes panel */}
      {showTagPanel && (
        <div className="border-b border-border px-3 md:px-6 py-3 bg-muted/50 flex flex-col md:flex-row md:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Tags:</span>
            {allTags.length === 0 ? (
              <span className="text-xs text-muted-foreground/60">No tags yet. Create from the sidebar.</span>
            ) : (
              allTags.map((tag: { id: number; name: string; color: string }) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? "text-white border-transparent"
                      : "border-border text-muted-foreground bg-background hover:border-muted-foreground"
                  }`}
                  style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Notes:</span>
            <input
              type="text"
              value={description}
              onChange={e => { setDescription(e.target.value); setIsDirty(true); }}
              placeholder="Add notes about this template..."
              className="text-xs px-3 py-1.5 bg-background border border-border rounded-lg outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50 flex-1 md:w-72"
            />
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="border-b border-border px-3 md:px-6 flex items-center bg-card shrink-0">
        <button
          onClick={() => setViewMode("preview")}
          className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === "preview"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          onClick={() => setViewMode("code")}
          className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === "code"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Code
        </button>
        {/* Split view only on desktop */}
        {!isMobile && (
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === "split"
                ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Columns2 className="w-4 h-4" />
            Split
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground py-3 pr-1 hidden md:inline">
          Ctrl+S to save
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Code panel (code or split mode) */}
        {(viewMode === "code" || viewMode === "split") && (
          <div className={`flex flex-col ${viewMode === "split" ? "w-1/2 border-r border-border" : "w-full"} overflow-hidden`}>
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> index.html
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">{code.length} chars</span>
                {/* Mobile edit toggle */}
                {isMobile && (
                  <button
                    onClick={() => setMobileEditing(e => !e)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                      mobileEditing
                        ? "bg-indigo-600 text-white"
                        : "text-zinc-400 hover:text-white border border-zinc-600"
                    }`}
                  >
                    {mobileEditing ? <Lock className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                    {mobileEditing ? "Lock" : "Edit"}
                  </button>
                )}
                <button
                  onClick={copyCode}
                  className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="html"
                value={code}
                onChange={v => { setCode(v ?? ""); setIsDirty(true); }}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                  minimap: { enabled: false },
                  wordWrap: "on",
                  lineNumbers: isMobile ? "off" : "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true,
                  formatOnPaste: true,
                  tabSize: 2,
                  automaticLayout: true,
                  readOnly: isMobile && !mobileEditing,
                  // Prevent cursor from showing when read-only on mobile
                  renderLineHighlight: isMobile && !mobileEditing ? "none" : "line",
                  cursorStyle: isMobile && !mobileEditing ? "block" : "line",
                  cursorBlinking: isMobile && !mobileEditing ? "solid" : "blink",
                }}
              />
            </div>
          </div>
        )}

        {/* Preview panel (preview or split mode) */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={`flex flex-col ${viewMode === "split" ? "w-1/2" : "w-full"} overflow-hidden`}>
            {viewMode === "split" && (
              <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border shrink-0">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Live Preview
                </span>
              </div>
            )}
            <iframe
              title="preview"
              srcDoc={previewSrcDoc}
              className="w-full h-full border-none flex-1"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              "{template.name}" will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteMutation.mutate({ id: templateId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
