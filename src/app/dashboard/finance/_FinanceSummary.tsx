'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import {
  Users, DollarSign, CheckCircle, Clock, Target, TrendingUp,
  Activity, Trophy, Eye, EyeOff, Download, RefreshCw
} from 'lucide-react';
import { ledgerService } from '@/services/api.service';
import toast from 'react-hot-toast';

interface FinanceStats {
  totalMembers: number;
  expectedThisMonth: number;
  collectedThisMonth: number;
  outstandingBalance: number;
  totalArrears: number;
  activeTargets: number;
  targetFundsRaised: number;
  pendingPayments: number;
  treasuryBalance: number;
  recentPayments: any[];
}

interface FinanceSummaryProps {
  blurAmounts: boolean;
  onToggleBlur: () => void;
  onRefresh: () => void;
}

export function FinanceSummary({ blurAmounts, onToggleBlur, onRefresh }: FinanceSummaryProps) {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportRange, setExportRange] = useState({
    type: 'all', // 'all', 'year', 'month'
    year: new Date().getFullYear().toString(),
    month: new Date().toISOString().slice(0, 7)
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await ledgerService.getDashboardStats();
      setStats(res.data.data);
    } catch (e) {
      console.error('Failed to load finance stats');
      toast.error('Failed to load finance stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = async () => {
    await loadStats();
    onRefresh();
    toast.success('Data refreshed');
  };

  const formatMonthName = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const res = await ledgerService.exportData(type);
      const { data, filename } = res.data.data;
      
      // Convert to CSV
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        const csv = [
          headers.join(','),
          ...data.map((row: any) => 
            headers.map(h => {
              const value = row[h];
              // Format month columns
              if (h === 'Month' && value && typeof value === 'string' && value.match(/^\d{4}-\d{2}$/)) {
                return `"${formatMonthName(value)}"`;
              }
              return `"${value || ''}"`;
            }).join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Exported ${type} successfully`);
      }
    } catch (e) {
      console.error('Failed to export', e);
      toast.error('Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  const renderValue = (value: number | string, isCurrency: boolean = true) => {
    if (blurAmounts) {
      return (
        <span className="blur-sm select-none">••••••</span>
      );
    }
    return isCurrency ? formatCurrency(Number(value)) : value;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-20 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
      isCurrency: false
    },
    {
      label: 'Expected This Month',
      value: stats.expectedThisMonth,
      icon: DollarSign,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
    },
    {
      label: 'Collected This Month',
      value: stats.collectedThisMonth,
      icon: CheckCircle,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600'
    },
    {
      label: 'Outstanding Balance',
      value: stats.outstandingBalance,
      icon: Clock,
      color: 'bg-red-100 dark:bg-red-900/30 text-red-600'
    },
    {
      label: 'Total Arrears',
      value: stats.totalArrears,
      icon: TrendingUp,
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
    },
    {
      label: 'Active Targets',
      value: stats.activeTargets,
      icon: Target,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
      isCurrency: false
    },
    {
      label: 'Target Funds Raised',
      value: stats.targetFundsRaised,
      icon: Activity,
      color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
    },
    {
      label: 'Pending Payments',
      value: stats.pendingPayments,
      icon: Trophy,
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
      isCurrency: false
    },
    {
      label: 'Treasury Balance',
      value: stats.treasuryBalance,
      icon: DollarSign,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Finance Overview</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onToggleBlur}
            className="flex items-center gap-2"
          >
            {blurAmounts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {blurAmounts ? 'Show Amounts' : 'Hide Amounts'}
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('ledgers')}
              disabled={!!exporting}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              {exporting === 'ledgers' ? 'Exporting...' : 'Ledgers'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('payments')}
              disabled={!!exporting}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              {exporting === 'payments' ? 'Exporting...' : 'Payments'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('targets')}
              disabled={!!exporting}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              {exporting === 'targets' ? 'Exporting...' : 'Targets'}
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.color)}>
                <card.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {card.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">
              {renderValue(card.value, card.isCurrency !== false)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
