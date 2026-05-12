import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { api, type Message, type Stats } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Database, FileText, Hash, Loader2, LogOut, Plus, Search, Sparkles, Trash2, Eye, RefreshCw,
} from "lucide-react";

interface Props { user: { first_name?: string; username?: string } | null; onLogout: () => void }

const PAGE_SIZE = 30;

export default function Dashboard({ user, onLogout }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<Message | null>(null);
  const [del, setDel] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/api/stats");
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const nextOffset = reset ? 0 : offset;
      const { data } = await api.get("/api/messages", {
        params: { limit: PAGE_SIZE, offset: nextOffset, q: debouncedQ || undefined },
      });
      setTotal(data.total);
      setMessages(reset ? data.items : [...messages, ...data.items]);
      setOffset(nextOffset + data.items.length);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to load");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, offset, messages]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    setOffset(0);
    setMessages([]);
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const create = async () => {
    if (!draft.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post<Message>("/api/messages", { text: draft });
      setMessages((m) => [data, ...m]);
      setTotal((t) => t + 1);
      setDraft("");
      toast.success("Saved to Telegram");
      loadStats();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to save");
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!del) return;
    setDeleting(true);
    try {
      await api.delete(`/api/messages/${del.id}`);
      setMessages((m) => m.filter((x) => x.id !== del.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Deleted");
      setDel(null);
      loadStats();
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const greeting = useMemo(() => user?.first_name || user?.username || "there", [user]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur-xl bg-background/40 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-tight truncate">Saved Vault</div>
            <div className="text-xs text-muted-foreground truncate">Hi {greeting} 👋</div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { loadStats(); load(true); }} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Database className="h-4 w-4" />} label="Total messages" value={stats?.total_messages ?? "—"} />
          <StatCard icon={<Hash className="h-4 w-4" />} label="Unique tags" value={stats?.unique_tags ?? "—"} />
          <StatCard icon={<FileText className="h-4 w-4" />} label="With tags" value={stats?.with_tags ?? "—"} />
          <StatCard
            icon={<Sparkles className="h-4 w-4" />}
            label="Last saved"
            value={stats?.last_message_date ? formatDistanceToNow(new Date(stats.last_message_date), { addSuffix: true }) : "—"}
          />
        </div>

        {/* New note */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> New note</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Write anything… use #tags to organize. Cmd/Ctrl+Enter to save."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") create(); }}
              rows={4}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{draft.length}/4096</span>
              <Button onClick={create} disabled={creating || !draft.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Save to Telegram
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search + list */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Saved messages</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && messages.length === 0 && (
              <div className="py-12 grid place-items-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No messages yet — write your first note above ✨
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className="group flex gap-3 p-3 rounded-lg border border-border/40 bg-background/30 hover:bg-background/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm whitespace-pre-wrap break-words line-clamp-3">{m.text.slice(0, 300)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>#{m.id}</span>
                    <span>·</span>
                    <span>{m.date ? formatDistanceToNow(new Date(m.date), { addSuffix: true }) : ""}</span>
                    {m.tags.slice(0, 4).map((t) => <Badge key={t}>#{t}</Badge>)}
                  </div>
                </div>
                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" onClick={() => setView(m)} title="View raw"><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setDel(m)} title="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {messages.length < total && (
              <div className="pt-2 flex justify-center">
                <Button variant="outline" onClick={() => load(false)} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Load more ({messages.length}/{total})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* View */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message #{view?.id}</DialogTitle>
            <DialogDescription>{view?.date ? new Date(view.date).toLocaleString() : ""}</DialogDescription>
          </DialogHeader>
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words text-sm bg-background/40 border border-border rounded-md p-3">
            {view?.text}
          </pre>
          {view && view.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {view.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this message?</DialogTitle>
            <DialogDescription>It will be permanently removed from your Telegram Saved Messages.</DialogDescription>
          </DialogHeader>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs bg-background/40 border border-border rounded-md p-3">
            {del?.text.slice(0, 400)}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
