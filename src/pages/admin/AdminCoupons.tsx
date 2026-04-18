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
import { Switch } from "@/components/ui/switch";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  grant_type: 'plan_upgrade' | 'extend_days';
  grant_plan: string | null;
  grant_days: number | null;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
  is_active: boolean;
}

const PLANS = ['free', 'starter', 'pro'] as const;
type Draft = Omit<Coupon, 'id' | 'redemption_count'> & { id?: string };

const emptyDraft: Draft = {
  code: '', description: '', grant_type: 'plan_upgrade', grant_plan: 'pro',
  grant_days: null, max_redemptions: null, expires_at: null, is_active: true,
};

const AdminCoupons = () => {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setLoading(false);
    if (error) return toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    setRows((data || []) as Coupon[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft?.code) return toast({ title: 'Code is required', variant: 'destructive' });
    const payload: any = {
      code: draft.code.trim().toUpperCase(),
      description: draft.description || null,
      grant_type: draft.grant_type,
      grant_plan: draft.grant_type === 'plan_upgrade' ? draft.grant_plan : null,
      grant_days: draft.grant_type === 'extend_days' ? draft.grant_days : null,
      max_redemptions: draft.max_redemptions,
      expires_at: draft.expires_at,
      is_active: draft.is_active,
    };
    const q = draft.id
      ? supabase.from('coupons').update(payload).eq('id', draft.id)
      : supabase.from('coupons').insert(payload);
    const { error } = await q;
    if (error) return toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    toast({ title: draft.id ? 'Coupon updated' : 'Coupon created' });
    setDraft(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Coupons</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
          <Button onClick={() => setDraft({ ...emptyDraft })}>New coupon</Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Grants</TableHead>
              <TableHead>Redemptions</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono">{c.code}</TableCell>
                <TableCell>
                  {c.grant_type === 'plan_upgrade'
                    ? `Plan → ${c.grant_plan}`
                    : `+${c.grant_days} days`}
                </TableCell>
                <TableCell>{c.redemption_count}{c.max_redemptions ? ` / ${c.max_redemptions}` : ''}</TableCell>
                <TableCell>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</TableCell>
                <TableCell>{c.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setDraft({ ...c })}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(c.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No coupons</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? 'Edit coupon' : 'New coupon'}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="WELCOME2026" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Grant type</Label>
                <Select value={draft.grant_type} onValueChange={(v: any) => setDraft({ ...draft, grant_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plan_upgrade">Plan upgrade</SelectItem>
                    <SelectItem value="extend_days">Extend days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.grant_type === 'plan_upgrade' ? (
                <div className="space-y-2">
                  <Label>Grant plan</Label>
                  <Select value={draft.grant_plan || 'pro'} onValueChange={(v) => setDraft({ ...draft, grant_plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PLANS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Grant days</Label>
                  <Input type="number" value={draft.grant_days ?? ''} onChange={(e) => setDraft({ ...draft, grant_days: e.target.value ? Number(e.target.value) : null })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Max redemptions (blank = unlimited)</Label>
                <Input type="number" value={draft.max_redemptions ?? ''} onChange={(e) => setDraft({ ...draft, max_redemptions: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="space-y-2">
                <Label>Expires at (blank = never)</Label>
                <Input type="date" value={draft.expires_at ? draft.expires_at.slice(0, 10) : ''} onChange={(e) => setDraft({ ...draft, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;

