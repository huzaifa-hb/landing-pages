import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutTemplate,
  LayoutGrid,
  Folder,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Tag,
  X,
  MoreHorizontal,
  Pencil,
  FolderInput,
  Copy,
  Check,
  Zap,
  ArrowUpDown,
  SlidersHorizontal,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import ManageTagsDialog from "@/components/ManageTagsDialog";
import MoveTemplateDialog from "@/components/MoveTemplateDialog";
import NewTemplateDialog from "@/components/NewTemplateDialog";

type FolderItem = { id: number; name: string; parentId: number | null; createdAt: Date; updatedAt: Date };
type TagItem = { id: number; name: string; color: string; createdAt: Date };
type TemplateItem = {
  id: number; name: string; description: string | null; code: string;
  folderId: number | null; thumbnailUrl: string | null;
  createdAt: Date; updatedAt: Date;
  tags: TagItem[];
};

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

// Viewport dimensions for thumbnail rendering
const THUMB_W = 1280;
const THUMB_H = 800;

function Thumbnail({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / THUMB_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isFullDoc = /<!doctype|<html/i.test(code);
  const srcDoc = isFullDoc
    ? code
    : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;}body{margin:0;padding:0;}::-webkit-scrollbar{display:none;}</style></head><body>${code}</body></html>`;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-muted overflow-hidden border-b border-border group-hover:opacity-90 transition-opacity"
      style={{ height: `${THUMB_H * scale}px` }}
    >
      <iframe
        title="thumbnail"
        srcDoc={srcDoc}
        className="absolute top-0 left-0 origin-top-left border-none pointer-events-none"
        style={{ width: `${THUMB_W}px`, height: `${THUMB_H}px`, transform: `scale(${scale})` }}
        tabIndex={-1}
        scrolling="no"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}

// Sidebar content extracted so it can be used in both desktop and mobile drawer
function SidebarContent({
  activeFolderId,
  setActiveFolderId,
  selectedTagIds,
  setSelectedTagIds,
  allTemplates,
  allFolders,
  allTags,
  onClose,
  navigate,
  theme,
  toggleTheme,
}: {
  activeFolderId: number | null | "all";
  setActiveFolderId: (v: number | null | "all") => void;
  selectedTagIds: number[];
  setSelectedTagIds: (v: number[]) => void;
  allTemplates: TemplateItem[];
  allFolders: FolderItem[];
  allTags: TagItem[];
  onClose?: () => void;
  navigate: (path: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}) {
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<number | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState("");
  const [deleteFolder, setDeleteFolder] = useState<FolderItem | null>(null);
  const [showManageTags, setShowManageTags] = useState(false);

  const utils = trpc.useUtils();

  const createFolder = trpc.folder.create.useMutation({
    onSuccess: () => {
      utils.folder.list.invalidate();
      setIsAddingFolder(false);
      setNewFolderName("");
      toast.success("Folder created");
    },
    onError: () => toast.error("Failed to create folder"),
  });

  const renameFolder = trpc.folder.rename.useMutation({
    onSuccess: () => {
      utils.folder.list.invalidate();
      setRenamingFolderId(null);
      toast.success("Folder renamed");
    },
    onError: () => toast.error("Failed to rename"),
  });

  const deleteFolderMutation = trpc.folder.delete.useMutation({
    onSuccess: () => {
      utils.folder.list.invalidate();
      utils.template.list.invalidate();
      if (activeFolderId === deleteFolder?.id) setActiveFolderId("all");
      setDeleteFolder(null);
      toast.success("Folder deleted");
    },
    onError: () => toast.error("Failed to delete folder"),
  });

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    createFolder.mutate({ name: newFolderName.trim() });
  };

  const handleRenameFolder = (folder: FolderItem) => {
    if (!renamingFolderName.trim() || renamingFolderName === folder.name) {
      setRenamingFolderId(null);
      return;
    }
    renameFolder.mutate({ id: folder.id, name: renamingFolderName.trim() });
  };

  const toggleTagFilter = (tagId: number) => {
    setSelectedTagIds(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter(id => id !== tagId)
        : [...selectedTagIds, tagId]
    );
  };

  const handleNavClick = (folderId: number | null | "all") => {
    setActiveFolderId(folderId);
    setSelectedTagIds([]);
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg text-foreground">
          <LayoutTemplate className="w-5 h-5 text-indigo-500" />
          <span>Landing Vault</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {/* Quick Preview */}
        <div className="px-3 mb-2">
          <button
            onClick={() => { navigate("/preview"); onClose?.(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-colors group"
          >
            <Zap className="w-4 h-4 text-amber-500 group-hover:text-amber-600" />
            Quick Preview
          </button>
        </div>

        {/* All Templates + Unfiled */}
        <div className="px-3 mb-4">
          <button
            onClick={() => handleNavClick("all")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFolderId === "all" && selectedTagIds.length === 0
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            All Templates
            <span className="ml-auto text-xs text-zinc-400">{allTemplates.length}</span>
          </button>
          <button
            onClick={() => handleNavClick(null)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFolderId === null && selectedTagIds.length === 0
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Folder className="w-4 h-4" />
            Unfiled
            <span className="ml-auto text-xs text-zinc-400">
              {allTemplates.filter((t: TemplateItem) => t.folderId === null).length}
            </span>
          </button>
        </div>

        {/* Folders */}
        <div className="px-3">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Folders</span>
            <button
              onClick={() => { setIsAddingFolder(true); setNewFolderName(""); }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            {isAddingFolder && (
              <div className="px-3 py-1.5">
                <input
                  autoFocus
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddFolder();
                    if (e.key === "Escape") { setIsAddingFolder(false); setNewFolderName(""); }
                  }}
                  onBlur={() => { if (!newFolderName.trim()) setIsAddingFolder(false); }}
                  placeholder="Folder name..."
                  className="w-full px-2 py-1.5 text-sm border border-border rounded-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>
            )}

            {allFolders.map((folder: FolderItem) => (
              <div
                key={folder.id}
                onClick={() => {
                  if (renamingFolderId !== folder.id) handleNavClick(folder.id);
                }}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  activeFolderId === folder.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {renamingFolderId === folder.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={renamingFolderName}
                    onChange={e => setRenamingFolderName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleRenameFolder(folder);
                      if (e.key === "Escape") setRenamingFolderId(null);
                    }}
                    onBlur={() => handleRenameFolder(folder)}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 px-1 py-0.5 text-sm border border-primary rounded outline-none bg-background text-foreground"
                  />
                ) : (
                  <div className="flex items-center gap-3 truncate flex-1 min-w-0">
                    <Folder className={`w-4 h-4 shrink-0 ${activeFolderId === folder.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="truncate">{folder.name}</span>
                    <span className="ml-auto text-xs text-zinc-400 shrink-0">
                      {allTemplates.filter((t: TemplateItem) => t.folderId === folder.id).length}
                    </span>
                  </div>
                )}

                {renamingFolderId !== folder.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={e => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-opacity ml-1 shrink-0"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={e => {
                        e.stopPropagation();
                        setRenamingFolderId(folder.id);
                        setRenamingFolderName(folder.name);
                      }}>
                        <Pencil className="w-3 h-3 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={e => { e.stopPropagation(); setDeleteFolder(folder); }}
                      >
                        <Trash2 className="w-3 h-3 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="px-3 mt-6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Tags</span>
              <button onClick={() => setShowManageTags(true)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <Tag className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 px-3">
              {allTags.map((tag: TagItem) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? "text-white border-transparent"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                  style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-3 border-t border-border shrink-0 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={() => setShowManageTags(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Tag className="w-4 h-4" />
          Manage Tags
        </button>
      </div>

      {/* Delete folder confirm */}
      <AlertDialog open={!!deleteFolder} onOpenChange={() => setDeleteFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting "{deleteFolder?.name}" will move all its templates to Unfiled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteFolder && deleteFolderMutation.mutate({ id: deleteFolder.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ManageTagsDialog
        open={showManageTags}
        onOpenChange={setShowManageTags}
        tags={allTags}
        onSuccess={() => utils.tag.list.invalidate()}
      />
    </div>
  );
}

export default function VaultPage() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [activeFolderId, setActiveFolderId] = useState<number | null | "all">("all");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [deleteTemplate, setDeleteTemplate] = useState<TemplateItem | null>(null);
  const [moveTemplate, setMoveTemplate] = useState<TemplateItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: allFolders = [] } = trpc.folder.list.useQuery();
  const { data: allTags = [] } = trpc.tag.list.useQuery();
  const { data: allTemplates = [], isLoading: templatesLoading } = trpc.template.list.useQuery({ all: true });

  const templates = useMemo(() => {
    let result = [...allTemplates] as TemplateItem[];
    if (activeFolderId !== "all") {
      result = activeFolderId === null
        ? result.filter(t => t.folderId === null)
        : result.filter(t => t.folderId === activeFolderId);
    }
    if (selectedTagIds.length > 0) {
      result = result.filter(t =>
        selectedTagIds.every(tagId => t.tags.some(tag => tag.id === tagId))
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest": result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "name-asc": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc": result.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    return result;
  }, [allTemplates, activeFolderId, selectedTagIds, search, sortBy]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      if (sidebar && !sidebar.contains(e.target as Node)) setSidebarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  const deleteTemplateMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      setDeleteTemplate(null);
      toast.success("Template deleted");
    },
    onError: () => toast.error("Failed to delete template"),
  });

  const duplicateMutation = trpc.template.create.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      toast.success("Template duplicated");
    },
    onError: () => toast.error("Failed to duplicate"),
  });

  const copyCode = (template: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(template.code);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Code copied");
  };

  const downloadCode = (template: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([template.code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const toggleTagFilter = (tagId: number) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const sortLabel: Record<SortOption, string> = {
    "newest": "Newest first",
    "oldest": "Oldest first",
    "name-asc": "Name A-Z",
    "name-desc": "Name Z-A",
  };

  const currentTitle = activeFolderId === "all"
    ? "All Templates"
    : activeFolderId === null
    ? "Unfiled"
    : allFolders.find((f: FolderItem) => f.id === activeFolderId)?.name ?? "Folder";

  const hasActiveFilters = selectedTagIds.length > 0 || search.trim() !== "";

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col shrink-0">
        <SidebarContent
          activeFolderId={activeFolderId}
          setActiveFolderId={setActiveFolderId}
          selectedTagIds={selectedTagIds}
          setSelectedTagIds={setSelectedTagIds}
          allTemplates={allTemplates as TemplateItem[]}
          allFolders={allFolders}
          allTags={allTags}
          navigate={navigate}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" aria-hidden="true" />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        id="mobile-sidebar"
        className={`md:hidden fixed top-0 left-0 h-full w-72 bg-card z-50 shadow-xl transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          activeFolderId={activeFolderId}
          setActiveFolderId={setActiveFolderId}
          selectedTagIds={selectedTagIds}
          setSelectedTagIds={setSelectedTagIds}
          allTemplates={allTemplates as TemplateItem[]}
          allFolders={allFolders}
          allTags={allTags}
          onClose={() => setSidebarOpen(false)}
          navigate={navigate}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Top bar */}
        <div className="border-b border-border bg-card shrink-0">
          {/* Primary row: hamburger + title + new template */}
          <div className="h-14 md:h-16 px-4 md:px-6 flex items-center gap-3">
            {/* Hamburger (mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-semibold text-foreground truncate">{currentTitle}</h1>
              {!templatesLoading && (
                <span className="text-xs md:text-sm text-muted-foreground shrink-0">
                  {templates.length} {templates.length !== 1 ? "templates" : "template"}
                </span>
              )}
            </div>

            {/* Theme toggle (mobile only) */}
            <button
              onClick={toggleTheme}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors shrink-0"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* New Template button */}
            <button
              onClick={() => setShowNewTemplate(true)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Template</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>

          {/* Secondary row: search + sort + filter (always visible) */}
          <div className="px-4 md:px-6 pb-3 flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-muted border border-transparent focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg text-sm outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm bg-background border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors shrink-0">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{sortLabel[sortBy]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-zinc-500">Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
                  <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name-asc">Name A to Z</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="name-desc">Name Z to A</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tag filter */}
            {allTags.length > 0 && (
              <DropdownMenu open={showTagFilter} onOpenChange={setShowTagFilter}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm border transition-colors shrink-0 ${
                      selectedTagIds.length > 0
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Filter</span>
                    {selectedTagIds.length > 0 && (
                      <span className="ml-0.5 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {selectedTagIds.length}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-zinc-500">Filter by Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allTags.map((tag: TagItem) => (
                    <DropdownMenuItem
                      key={tag.id}
                      onClick={() => toggleTagFilter(tag.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selectedTagIds.includes(tag.id) ? "border-transparent" : "border-zinc-300"
                        }`}
                        style={selectedTagIds.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                      >
                        {selectedTagIds.includes(tag.id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm">{tag.name}</span>
                    </DropdownMenuItem>
                  ))}
                  {selectedTagIds.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedTagIds([])} className="text-muted-foreground text-xs">
                        Clear all filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Active filter chips */}
          {selectedTagIds.length > 0 && (
            <div className="px-4 md:px-6 pb-2 flex items-center gap-1.5 flex-wrap">
              {selectedTagIds.map(tagId => {
                const tag = allTags.find((t: TagItem) => t.id === tagId);
                if (!tag) return null;
                return (
                  <button
                    key={tagId}
                    onClick={() => toggleTagFilter(tagId)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: (tag as TagItem).color }}
                  >
                    {(tag as TagItem).name}
                    <X className="w-3 h-3" />
                  </button>
                );
              })}
              <button
                onClick={() => setSelectedTagIds([])}
                className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded-md hover:bg-zinc-100"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          {templatesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4 py-16">
              <LayoutGrid className="w-12 h-12 opacity-20" />
              <p className="text-sm text-center px-4">
                {hasActiveFilters
                  ? "No templates match your current filters."
                  : "No templates here. Add your first one."}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={() => { setSearch(""); setSelectedTagIds([]); }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={() => setShowNewTemplate(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => navigate(`/template/${template.id}`)}
                  className="template-card group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col"
                >
                  <Thumbnail code={template.code} />

                  <div className="p-3 md:p-4 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-card-foreground truncate text-sm md:text-base">{template.name}</h3>
                      {/* Actions - always visible on mobile, hover on desktop */}
                      <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 -mt-0.5 -mr-1">
                        <button
                          onClick={e => copyCode(template, e)}
                          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                          title="Copy code"
                        >
                          {copiedId === template.id
                            ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                            : <Copy className="w-3.5 h-3.5" />
                          }
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`/template/${template.id}`); }}>
                              <Pencil className="w-3 h-3 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); downloadCode(template, e); }}>
                              <FolderInput className="w-3 h-3 mr-2" /> Download .html
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => {
                              e.stopPropagation();
                              duplicateMutation.mutate({
                                name: `${template.name} (copy)`,
                                code: template.code,
                                description: template.description ?? undefined,
                                folderId: template.folderId,
                                tagIds: template.tags.map(t => t.id),
                              });
                            }}>
                              <Copy className="w-3 h-3 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => { e.stopPropagation(); setMoveTemplate(template); }}>
                              <FolderOpen className="w-3 h-3 mr-2" /> Move to Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={e => { e.stopPropagation(); setDeleteTemplate(template); }}
                            >
                              <Trash2 className="w-3 h-3 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                    )}

                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {template.tags.map(tag => (
                          <span
                            key={tag.id}
                            className="text-xs px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {template.folderId && (
                        <span className="bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Folder className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">
                            {allFolders.find((f: FolderItem) => f.id === template.folderId)?.name ?? "Folder"}
                          </span>
                        </span>
                      )}
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Template */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTemplate?.name}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteTemplate && deleteTemplateMutation.mutate({ id: deleteTemplate.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewTemplateDialog
        open={showNewTemplate}
        onOpenChange={setShowNewTemplate}
        defaultFolderId={typeof activeFolderId === "number" ? activeFolderId : null}
        folders={allFolders}
        tags={allTags}
        onSuccess={() => utils.template.list.invalidate()}
      />

      {moveTemplate && (
        <MoveTemplateDialog
          open={!!moveTemplate}
          onOpenChange={() => setMoveTemplate(null)}
          template={moveTemplate}
          folders={allFolders}
          onSuccess={() => utils.template.list.invalidate()}
        />
      )}
    </div>
  );
}
