import React from 'react';
import { Card } from './Card';

const tones = {
  brand: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

const StatCard = ({ icon: Icon, label, value, hint, tone = 'brand' }) => (
  <Card className="p-5">
    <div className="flex items-center gap-4">
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl ${tones[tone]}`}>
          <Icon />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  </Card>
);

export default StatCard;
