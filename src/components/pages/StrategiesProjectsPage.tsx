import { useState } from 'react';
import { projects, type Project } from '@/lib/store';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { name: '', company_name: '', contact_person: '', contact_email: '', contact_phone: '', billing_label: 'one_time', start_date: '', deadline: '', description: '' };

export function StrategiesProjectsPage() {
  const buId = useBusinessUnit('strategies');
  const [items, setItems] = useState<Project[]>(() => projects.list(buId));
  const [filter, setFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = () => setItems(projects.list(buId));

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ name: p.name, company_name: p.company_name, contact_person: p.contact_person, contact_email: p.contact_email, contact_phone: p.contact_phone ?? '', billing_label: p.billing_label ?? 'one_time', start_date: p.start_date ?? '', deadline: p.deadline ?? '', description: p.description ?? '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const payload = { ...form, business_unit_id: buId, status_label: null, start_date: form.start_date || null, deadline: form.deadline || null, contact_phone: form.contact_phone || null, description: form.description || null };
    if (editing) {
      projects.update(editing.id, payload);
      toast.success('Project updated');
    } else {
      projects.insert(payload);
      toast.success('Project added');
    }
    setDialogOpen(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this project?')) return;
    projects.delete(id);
    toast.success('Project deleted');
    refresh();
  };

  const filtered = filter === 'all' ? items : items.filter(p => p.billing_label === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Solvix Strategies — Projects</h1>
        <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Project</Button>
      </div>
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Projects</SelectItem>
          <SelectItem value="one_time">One-Time</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
        </SelectContent>
      </Select>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No projects yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Project</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead><TableHead>Company</TableHead><TableHead>Contact</TableHead>
                <TableHead>Billing</TableHead><TableHead>Deadline</TableHead><TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.company_name}</TableCell>
                  <TableCell>{p.contact_person}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{(p.billing_label ?? '').replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{p.deadline ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Project' : 'Add Project'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Project Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} /></div>
              <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} /></div>
              <div className="space-y-2">
                <Label>Billing Type</Label>
                <Select value={form.billing_label} onValueChange={v => setForm({...form, billing_label: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} /></div>
              <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
