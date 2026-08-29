import React, { useState } from 'react';
import { FiDownload, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { reportAPI } from '../api';
import { Card, CardBody, CardHeader } from './ui/Card';
import Button from './ui/Button';
import { Input, Select } from './ui/Field';
import EmptyState from './ui/EmptyState';
import { formatCurrency } from '../utils/format';

const reportTabs = [
  { key: 'daily', label: 'Daily' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const Reports = () => {
  const [activeReport, setActiveReport] = useState('daily');
  const [reportData, setReportData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      let res;
      if (activeReport === 'daily') res = await reportAPI.getDaily(selectedDate);
      else if (activeReport === 'monthly') res = await reportAPI.getMonthly(selectedYear, selectedMonth);
      else res = await reportAPI.getYearly(selectedYear);
      setReportData(res.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map((row) => Object.values(row).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${activeReport}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalSales = reportData.reduce((sum, r) => sum + Number(r.total_sales || 0), 0);
  const totalTax = reportData.reduce((sum, r) => sum + Number(r.total_tax || 0), 0);
  const totalOrders = reportData.reduce((sum, r) => sum + Number(r.total_orders || 0), 0);

  const chartData = reportData.map((r) => ({
    label: r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : `Month ${r.month}`,
    sales: Number(r.total_sales || 0),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">Sales, discounts and GST collected.</p>
      </div>

      <Card>
        <CardBody>
          <div className="mb-4 flex flex-wrap gap-2">
            {reportTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setActiveReport(t.key);
                  setReportData([]);
                }}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium ${
                  activeReport === t.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {activeReport === 'daily' && (
              <Input label="Date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            )}
            {activeReport === 'monthly' && (
              <>
                <Select label="Month" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </Select>
                <Input label="Year" type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
              </>
            )}
            {activeReport === 'yearly' && (
              <Input label="Year" type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} />
            )}
            <Button onClick={generate} loading={loading}>
              Generate Report
            </Button>
            {reportData.length > 0 && (
              <Button variant="secondary" onClick={downloadCSV}>
                <FiDownload /> Download CSV
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {reportData.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-slate-500">Total Sales</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalSales)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-500">GST Collected</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalTax)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-slate-500">Orders</p>
              <p className="text-xl font-semibold text-slate-900">{totalOrders}</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Sales trend" />
            <CardBody>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Report data" />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  <tr>
                    {Object.keys(reportData[0]).map((key) => (
                      <th key={key} className="px-5 py-3">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-5 py-2.5 text-slate-600">
                          {typeof value === 'number' ? value.toFixed(2) : String(value ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {reportData.length === 0 && (
        <Card>
          <EmptyState icon={FiBarChart2} title="No report generated yet" message="Pick a range above and click Generate Report." />
        </Card>
      )}
    </div>
  );
};

export default Reports;
