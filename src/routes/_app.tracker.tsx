import { createFileRoute } from '@tanstack/react-router';
import { SharedTrackerPage } from '@/components/pages/SharedTrackerPage';

export const Route = createFileRoute('/_app/tracker')({
  component: SharedTrackerPage,
});
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/tracker')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/tracker"!</div>
}
