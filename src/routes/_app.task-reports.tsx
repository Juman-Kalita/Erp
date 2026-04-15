import { createFileRoute } from '@tanstack/react-router';
import { TaskReportsPage } from '@/components/pages/TaskReportsPage';

export const Route = createFileRoute('/_app/task-reports')({
  component: TaskReportsPage,
});
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/task-reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/task-reports"!</div>
}
