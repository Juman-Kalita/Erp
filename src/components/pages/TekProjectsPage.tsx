import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const statuses = ['upcoming', 'in_progress', 'completed'] as const;
const statusLabels: Record<string, string> = { upcoming: 'Upcoming', in_progress: 'In Progress', completed: 'Completed' };
const emptyForm = { name: '', company_name: '', contact_person: '', contact_email: '', contact_phone: '', status_label: 'upcoming', start_date: '', deadline: '', description: '' };

export function TekProjectsPage() {
  const buId = useBusinessUnit('tek');
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('projects').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [buId]);

  const openAdd = (status?: string) => { setEditing(null); setForm({ ...emptyForm, status_label: status ?? 'upcoming' }); setDialogOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, company_name: p.company_name, contact_person: p.contact_person, contact_email: p.contact_email, contact_phone: p.contact_phone ?? '', status_label: p.status_label ?? 'upcoming', start_date: p.start_date ?? '', deadline: p.deadline ?? '', description: p.description ?? '' }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, business_unit_id: buId, billing_label: null, start_date: form.start_date || null, deadline: form.deadline || null, contact_phone: form.contact_phone || null, description: form.description || null };
    if (editing) { await supabase.from('projects').update(payload).eq('id', editing.id); toast.success('Project updated'); }
    else { await supabase.from('projects').insert(payload); toast.success('Project added'); }
    setDialogOpen(false); refresh();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('projects').update({ status_label: status }).eq('id', id);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solvix Tek — Projects</h1>
        <Button size="sm" onClick={()=>openAdd()}><Plus className="mr-1 h-4 w-4" />Add Project</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {statuses.map(status => {
          const cols = items.filter((p:any) => p.status_label === status);
          return (
            <div key={status} className="rounded-xl border bg-muted/30 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-sm">{statusLabels[status]} ({cols.length})</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=>openAdd(status)}><Plus className="h-3 w-3" /></Button>
              </div>
              <div className="space-y-2">
                {cols.map((p:any) => (
                  <Card key={p.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={()=>openEdit(p)}>
                    <CardContent className="p-3">
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{p.company_name}</div>
                      {p.deadline && <div className="text-xs text-muted-foreground mt-1">Due: {p.deadline}</div>}
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {statuses.filter(s=>s!==status).map(s=>(
                          <Button key={s} variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={e=>{e.stopPropagation();updateStatus(p.id,s);}}>→ {statusLabels[s]}</Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {cols.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No projects</p>}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'Add Project'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Project Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="space-y-2"><Label>Company Name</Label><Input value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contact_person} onChange={e=>setForm({...form,contact_person:e.target.value})} /></div>
              <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status_label} onValueChange={v=>setForm({...form,status_label:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{statuses.map(s=><SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} /></div>
              <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing?'Update':'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
