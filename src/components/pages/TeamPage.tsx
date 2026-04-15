import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, User } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { name: '', designation: '', email: '', phone: '', employment_label: 'salaried', joined_at: new Date().toISOString().split('T')[0] };

export function TeamPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterLabel, setFilterLabel] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    const { data } = await supabase.from('team_members').select('*').eq('business_unit_id', buId).order('name');
    setMembers(data ?? []);
  };
  useEffect(() => { refresh(); }, [buId]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: any) => { setEditing(m); setForm({ name: m.name, designation: m.designation, email: m.email, phone: m.phone ?? '', employment_label: m.employment_label, joined_at: m.joined_at }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, business_unit_id: buId, phone: form.phone || null, photo_url: null };
    if (editing) { await supabase.from('team_members').update(payload).eq('id', editing.id); toast.success('Member updated'); }
    else { await supabase.from('team_members').insert(payload); toast.success('Member added'); }
    setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team member?')) return;
    await supabase.from('team_members').delete().eq('id', id);
    toast.success('Member deleted'); refresh();
  };

  const filtered = members.filter(m => {
    if (filterLabel !== 'all' && m.employment_label !== filterLabel) return false;
    if (search) { const s = search.toLowerCase(); return m.name.toLowerCase().includes(s) || m.designation.toLowerCase().includes(s); }
    return true;
  });

  const title = businessUnit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title} — Team Members</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Member</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={filterLabel} onValueChange={setFilterLabel}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="salaried">Salaried</SelectItem><SelectItem value="freelancing">Freelancing</SelectItem></SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No team members yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Member</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m:any) => (
            <Card key={m.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={()=>openEdit(m)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="h-6 w-6" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{m.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{m.designation}</div>
                  <Badge variant="outline" className="mt-1 capitalize text-xs">{m.employment_label}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Member' : 'Add Team Member'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="space-y-2"><Label>Designation</Label><Input value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Employment</Label>
                <Select value={form.employment_label} onValueChange={v=>setForm({...form,employment_label:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="salaried">Salaried</SelectItem><SelectItem value="freelancing">Freelancing</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Date Joined</Label><Input type="date" value={form.joined_at} onChange={e=>setForm({...form,joined_at:e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            {editing && <Button variant="destructive" className="mr-auto" onClick={()=>{handleDelete(editing.id);setDialogOpen(false);}}>Delete</Button>}
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing?'Update':'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
