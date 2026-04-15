import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = { high: 'text-destructive', medium: 'text-yellow-600', low: 'text-green-600' };

export function EmployeePanelPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('team_members').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setMember(data);
    });
  }, [user]);

  useEffect(() => {
    if (!member) return;
    supabase.from('tasks').select('*, projects(name)').eq('team_member_id', member.id).order('created_at', { ascending: false }).then(({ data }) => setTasks(data ?? []));
  }, [member]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : null } : t));
  };

  const todo = tasks.filter(t => t.status === 'to_do');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const done = tasks.filter(t => t.status === 'done');

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="font-medium">{task.title}</div>
            {task.description && <div className="text-sm text-muted-foreground mt-1">{task.description}</div>}
            {task.projects?.name && <div className="text-xs text-muted-foreground mt-1">Project: {task.projects.name}</div>}
            {task.deadline && <div className="text-xs text-muted-foreground mt-1">Due: {formatDate(task.deadline)}</div>}
            <Badge variant="outline" className={cn('mt-2 capitalize text-xs', priorityColors[task.priority])}>{task.priority}</Badge>
          </div>
          <Select value={task.status} onValueChange={v => updateStatus(task.id, v)}>
            <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="to_do">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">No employee profile linked</p>
        <p className="text-sm text-muted-foreground mt-2">Ask your admin to link your account to a team member profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">{member.name} — {member.designation}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">To Do</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{todo.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{inProgress.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{done.length}</div></CardContent></Card>
      </div>
      <Tabs defaultValue="todo">
        <TabsList>
          <TabsTrigger value="todo">To Do ({todo.length})</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="todo" className="mt-4">
          {todo.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No pending tasks</p> : todo.map(t => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="inprogress" className="mt-4">
          {inProgress.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">Nothing in progress</p> : inProgress.map(t => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {done.length === 0 ? <p className="text-muted-foreground text-sm py-8 text-center">No completed tasks</p> : done.map(t => <TaskCard key={t.id} task={t} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
