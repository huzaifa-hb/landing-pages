import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  Code2,
  Columns2,
  Copy,
  Check,
  Download,
  Save,
  Zap,
  X,
  MoreHorizontal,
  Pencil,
  Lock,
} from "lucide-react";
import Editor from "@monaco-editor/react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ViewMode = "split" | "preview" | "code";

const PLACEHOLDER = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    }
    h1 { font-size: 2rem; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; }
    p { color: #666; line-height: 1.6; margin-bottom: 24px; }
    .btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Quick Preview</h1>
    <p>Paste your HTML/CSS code in the editor to see a live preview. Nothing gets saved until you click "Save to Vault".</p>
    <button class="btn">Get Started</button>
  </div>
</body>
</html>`;

export default function QuickPreviewPage() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState(PLACEHOLDER);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [copied, setCopied] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveFolderId, setSaveFolderId] = useState<string>("root");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileEditing, setMobileEditing] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Default to code view on mobile (split is unusable)
      if (mobile) setViewMode(v => v === "split" ? "code" : v);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { data: allFolders = [] } = trpc.folder.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.template.create.useMutation({
    onSuccess: (data) => {
      utils.template.list.invalidate();
      setShowSaveDialog(false);
      toast.success("Saved to vault");
      navigate(`/template/${data.id}`);
    },
    onError: () => toast.error("Failed to save"),
  });

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied");
  }, [code]);

  const downloadCode = useCallback(() => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }, [code]);

  const handleSave = () => {
    if (!saveName.trim()) {
      toast.error("Template name is required");
      return;
    }
    createMutation.mutate({
      name: saveName.trim(),
      code,
      folderId: saveFolderId === "root" ? null : parseInt(saveFolderId),
    });
  };

  const isFullDoc = /<!doctype|<html/i.test(code);
  const previewSrcDoc = isFullDoc
    ? code
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;}</style></head><body>${code}</body></html>`;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-sans overflow-hidden">

      {/* Header */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="h-14 md:h-16 px-3 md:px-6 flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 shrink-0">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold text-foreground leading-tight">Quick Preview</h1>
              <p className="text-xs text-muted-foreground leading-tight hidden sm:block">Paste code, see it live. Nothing saved until you click Save.</p>
            </div>
          </div>

          {/* Save to Vault - always visible */}
          <button
            onClick={() => { setSaveName(""); setShowSaveDialog(true); }}
            disabled={!code.trim()}
            className="flex items-center gap-1.5 px-3 md:px-4 h-9 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save to Vault</span>
            <span className="sm:hidden">Save</span>
          </button>

          {/* Desktop actions */}
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
              className="p-2 h-9 w-9 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent transition-colors"
              title="Download .html"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCode(""); toast.success("Editor cleared"); }}
              className="p-2 h-9 w-9 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-400/40 transition-colors"
              title="Clear editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile overflow menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden p-2 h-9 w-9 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground hover:bg-accent transition-colors">
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
                onClick={() => { setCode(""); toast.success("Editor cleared"); }}
              >
                <X className="w-3.5 h-3.5 mr-2" /> Clear editor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border px-3 md:px-6 flex items-center bg-card shrink-0">
        <button
          onClick={() => setViewMode("preview")}
          className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === "preview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          onClick={() => setViewMode("code")}
          className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium border-b-2 transition-colors ${
            viewMode === "code" ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Code
        </button>
        {/* Split only on desktop */}
        {!isMobile && (
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === "split" ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns2 className="w-4 h-4" />
            Split
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground py-3 pr-1 hidden md:inline">
          Preview updates as you type
        </span>
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Code panel */}
        {(viewMode === "code" || viewMode === "split") && (
          <div className={`flex flex-col ${viewMode === "split" ? "w-1/2 border-r border-border" : "w-full"} overflow-hidden`}>
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> Paste your HTML/CSS here
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
                        : "text-zinc-400 hover:text-white border border-zinc-700"
                    }`}
                  >
                    {mobileEditing ? <Lock className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                    {mobileEditing ? "Lock" : "Edit"}
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="html"
                value={code}
                onChange={v => setCode(v ?? "")}
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
                  renderLineHighlight: isMobile && !mobileEditing ? "none" : "line",
                  cursorStyle: isMobile && !mobileEditing ? "block" : "line",
                  cursorBlinking: isMobile && !mobileEditing ? "solid" : "blink",
                }}
              />
            </div>
          </div>
        )}

        {/* Preview panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className={`flex flex-col ${viewMode === "split" ? "w-1/2" : "w-full"} overflow-hidden`}>
            {viewMode === "split" && (
              <div className="flex items-center px-4 py-2 bg-muted/50 border-b border-border shrink-0">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Live Preview
                </span>
                <span className="ml-auto text-xs text-muted-foreground/60">Updates as you type</span>
              </div>
            )}
            {code.trim() ? (
              <iframe
                title="quick-preview"
                srcDoc={previewSrcDoc}
                className="w-full h-full border-none flex-1"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 p-8">
                <Eye className="w-12 h-12 opacity-20" />
                <p className="text-sm text-center">Paste some HTML/CSS code to see the preview</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save to Vault dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Save to Vault</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Template Name <span className="text-red-500">*</span></Label>
              <Input
                autoFocus
                placeholder="e.g. SaaS Hero Section"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSave(); }}
                className="bg-background border-border focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Folder (optional)</Label>
              <Select value={saveFolderId} onValueChange={setSaveFolderId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">No Folder</SelectItem>
                  {allFolders.map((f: { id: number; name: string }) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={createMutation.isPending || !saveName.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {createMutation.isPending ? "Saving..." : "Save to Vault"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
