import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Row {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
  profile_email: string | null;
  profile_name: string | null;
}

const PLANS = ['free', 'starter', 'pro'] as const;
const STATUSES = ['active', 'canceled', 'past_due', 'trialing', 'incomplete'] as const;

const AdminSubscriptions = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_id, status, current_period_end, profiles:user_id(email, name)')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
      return;
    }
    setRows(
      (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        plan_id: r.plan_id,
        status: r.status,
        current_period_end: r.current_period_end,
        profile_email: r.profiles?.email ?? null,
        profile_name: r.profiles?.name ?? null,
      }))
    );
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: editing.plan_id,
        status: editing.status,
        current_period_end: editing.current_period_end,
      })
      .eq('id', editing.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Subscription updated' });
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">User subscriptions</h2>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period end</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="font-medium">{r.profile_name || '—'}</div>
                  <div className="text-xs text-muted-foreground">{r.profile_email}</div>
                </TableCell>
                <TableCell className="capitalize">{r.plan_id}</TableCell>
                <TableCell className="capitalize">{r.status}</TableCell>
                <TableCell>{r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No subscriptions</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit subscription</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><Label>User</Label><div className="text-sm mt-1">{editing.profile_email}</div></div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={editing.plan_id} onValueChange={(v) => setEditing({ ...editing, plan_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period end</Label>
                <Input type="date"
                  value={editing.current_period_end ? editing.current_period_end.slice(0, 10) : ''}
                  onChange={(e) => setEditing({ ...editing, current_period_end: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;

