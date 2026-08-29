import React, { useEffect, useState } from 'react';
import { FiDollarSign, FiShoppingBag, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { reportAPI } from '../api';
import { Card, CardHeader, CardBody } from './ui/Card';
import StatCard from './ui/StatCard';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { formatCurrency, formatDateTime } from '../utils/format';
import { useAuth } from './Auth';

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const res = await reportAPI.getDashboard();
        setData(res.data);
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  const trend = (data?.salesTrend || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    total: Number(d.total_sales),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user?.username}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening in your shop today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={FiDollarSign}
          tone="green"
          label="Today's Sales"
          value={formatCurrency(data?.today?.totalSales)}
        />
        <StatCard icon={FiShoppingBag} tone="brand" label="Today's Orders" value={data?.today?.orderCount ?? 0} />
        <StatCard
          icon={FiAlertTriangle}
          tone={data?.lowStockCount > 0 ? 'red' : 'green'}
          label="Low Stock Items"
          value={data?.lowStockCount ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Sales — last 7 days" subtitle="Total revenue including tax" />
          <CardBody>
            {trend.length === 0 ? (
              <EmptyState icon={FiTrendingUp} title="No sales yet" message="Recent sales will show up here." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Low stock alerts" />
          <CardBody className="p-0">
            {(data?.lowStockItems || []).length === 0 ? (
              <EmptyState icon={FiAlertTriangle} title="All good" message="Nothing is running low right now." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.lowStockItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.product_name}</p>
                      <p className="text-xs text-slate-400">
                        {[item.size, item.color].filter(Boolean).join(' / ') || item.sku}
                      </p>
                    </div>
                    <Badge tone="red">{item.quantity} left</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent orders" />
          <CardBody className="p-0">
            {(data?.recentOrders || []).length === 0 ? (
              <EmptyState icon={FiShoppingBag} title="No orders yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{o.invoice_number}</p>
                      <p className="truncate text-xs text-slate-400">
                        {o.customer_name} · {formatDateTime(o.order_date)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top products this month" />
          <CardBody className="p-0">
            {(data?.topProducts || []).length === 0 ? (
              <EmptyState icon={FiTrendingUp} title="No sales this month yet" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between px-5 py-3">
                    <p className="text-sm font-medium text-slate-800">{p.product_name}</p>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.revenue)}</p>
                      <p className="text-xs text-slate-400">{p.units_sold} sold</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Home;
