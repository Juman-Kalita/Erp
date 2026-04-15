import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessUnit } from '@/hooks/use-business-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const emptyLead = { brand_name: '', email: '', phone: '', location: '', category: 'corporate', status: 'not_contacted', notes: '' };

export function LeadsPage({ businessUnit }: { businessUnit: 'tek' | 'strategies' }) {
  const buId = useBusinessUnit(businessUnit);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyLead);

  const refresh = async () => {
    const { data } = await supabase.from('leads').select('*').eq('business_unit_id', buId).order('created_at', { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [buId]);

  const openAdd = () => { setEditing(null); setForm(emptyLead); setDialogOpen(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ brand_name: l.brand_name, email: l.email, phone: l.phone, location: l.location, category: l.category, status: l.status, notes: l.notes ?? '' }); setDialogOpen(true); };

  const handleSave = async () => {
    const payload = { ...form, business_unit_id: buId, notes: form.notes || null };
    if (editing) { await supabase.from('leads').update(payload).eq('id', editing.id); toast.success('Lead updated'); }
    else { await supabase.from('leads').insert(payload); toast.success('Lead added'); }
    setDialogOpen(false); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await supabase.from('leads').delete().eq('id', id);
    toast.success('Lead deleted'); refresh();
  };

  const toggleStatus = async (l: any) => {
    const next = l.status === 'contacted' ? 'not_contacted' : 'contacted';
    await supabase.from('leads').update({ status: next }).eq('id', l.id);
    refresh();
  };

  const exportCSV = () => {
    const rows = [['Brand','Email','Phone','Location','Category','Status'], ...filtered.map((l:any) => [l.brand_name,l.email,l.phone,l.location,l.category,l.status])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'})); a.download='leads.csv'; a.click();
  };

  const filtered = items.filter(l => {
    if (filterCategory !== 'all' && l.category !== filterCategory) return false;
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (search) { const s = search.toLowerCase(); return l.brand_name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s); }
    return true;
  });

  const title = businessUnit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{title} — Leads</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportCSV}><Download className="mr-1 h-4 w-4" />Export</Button>
          <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Lead</Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="creator">Creator</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="not_contacted">Not Contacted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">No leads yet</p>
          <Button className="mt-4" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Lead</Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Brand Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
              <TableHead>Location</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>
              <TableHead>Added</TableHead><TableHead className="w-[80px]">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((l:any) => (
                <TableRow key={l.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{l.brand_name}</TableCell>
                  <TableCell>{l.email}</TableCell><TableCell>{l.phone}</TableCell><TableCell>{l.location}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{l.category}</Badge></TableCell>
                  <TableCell><Badge variant={l.status==='contacted'?'default':'outline'} className="cursor-pointer capitalize" onClick={()=>toggleStatus(l)}>{l.status.replace('_',' ')}</Badge></TableCell>
                  <TableCell>{formatDate(l.created_at)}</TableCell>
                  <TableCell><div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={()=>openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={()=>handleDelete(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'Add New Lead'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Brand Name</Label><Input value={form.brand_name} onChange={e=>setForm({...form,brand_name:e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="corporate">Corporate</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="creator">Creator</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="not_contacted">Not Contacted</SelectItem><SelectItem value="contacted">Contacted</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing?'Update':'Add'} Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
