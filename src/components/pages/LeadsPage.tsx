import { useState } from 'react';
import { leads, type Lead } from '@/lib/store';
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
  const [items, setItems] = useState<Lead[]>(() => leads.list(buId));
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyLead);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const refresh = () => setItems(leads.list(buId));

  const openAdd = () => { setEditing(null); setForm(emptyLead); setDialogOpen(true); };
  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({ brand_name: lead.brand_name, email: lead.email, phone: lead.phone, location: lead.location, category: lead.category, status: lead.status, notes: lead.notes ?? '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      leads.update(editing.id, form);
      toast.success('Lead updated');
    } else {
      leads.insert({ ...form, business_unit_id: buId, notes: form.notes || null });
      toast.success('Lead added');
    }
    setDialogOpen(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this lead?')) return;
    leads.delete(id);
    toast.success('Lead deleted');
    refresh();
  };

  const toggleStatus = (lead: Lead) => {
    const next = lead.status === 'contacted' ? 'not_contacted' : 'contacted';
    leads.update(lead.id, { status: next });
    refresh();
  };

  const exportCSV = () => {
    const rows = [['Brand', 'Email', 'Phone', 'Location', 'Category', 'Status'], ...filtered.map(l => [l.brand_name, l.email, l.phone, l.location, l.category, l.status])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'leads.csv'; a.click();
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
            <TableHeader>
              <TableRow>
                <TableHead>Brand Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                <TableHead>Location</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>
                <TableHead>Added</TableHead><TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(lead => (
                <TableRow key={lead.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{lead.brand_name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.location}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{lead.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={lead.status === 'contacted' ? 'default' : 'outline'} className="cursor-pointer capitalize" onClick={() => toggleStatus(lead)}>
                      {lead.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(lead.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
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
            <div className="space-y-2"><Label>Brand Name</Label><Input value={form.brand_name} onChange={e => setForm({...form, brand_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_contacted">Not Contacted</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'} Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
