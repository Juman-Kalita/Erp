import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@tanstack/react-router';
import { DollarSign, CreditCard, Package, ArrowRight } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { invoices, expenseTools, assets, BU_IDS } from '@/lib/store';

function KpiCard({ title, amount, icon: Icon }: { title: string; amount: number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatINR(amount)}</div>
      </CardContent>
    </Card>
  );
}

function BusinessUnitCard({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link to={to as any}>
      <Card className="group cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const { role } = useAuth();
  const allInvoices = invoices.listAll().filter(i => i.status === 'paid');
  const tekRevenue = allInvoices.filter(i => i.business_unit_id === BU_IDS.tek).reduce((s, i) => s + Number(i.total), 0);
  const strategiesRevenue = allInvoices.filter(i => i.business_unit_id === BU_IDS.strategies).reduce((s, i) => s + Number(i.total), 0);
  const totalRevenue = tekRevenue + strategiesRevenue;
  const totalExpenses = expenseTools.listAll().reduce((s, e) => s + Number(e.amount), 0);
  const totalAssets = assets.listAll().reduce((s, a) => s + Number(a.price), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {role === 'admin' && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard title="Total Revenue" amount={totalRevenue} icon={DollarSign} />
            <KpiCard title="Total Expenses" amount={totalExpenses} icon={CreditCard} />
            <KpiCard title="Total Assets" amount={totalAssets} icon={Package} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Solvix Tek Revenue</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatINR(tekRevenue)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Solvix Strategies Revenue</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatINR(strategiesRevenue)}</div></CardContent>
            </Card>
          </div>
        </>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <BusinessUnitCard title="Solvix Tek" description="Tech and production — Leads, Clients, Team, Projects, Expense Tools, Invoices" to="/tek/leads" />
        <BusinessUnitCard title="Solvix Strategies" description="Consulting and strategy — Leads, Clients, Team, Projects, Assets, Invoices" to="/strategies/leads" />
      </div>
    </div>
  );
}