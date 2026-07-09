'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { superAdminService } from '@/services/api.service';
import {
  Bot, Cpu, Database, FileText, Save,
  Settings, ChevronRight, Edit3, Plus, Search,
} from 'lucide-react';

export default function AIManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'config' | 'prompts' | 'knowledge'>('config');
  const [config, setConfig] = useState({
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    superAdminService.getAiConfig().then(r => {
      if (r.data?.data) setConfig({ ...config, ...r.data.data });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await superAdminService.updateAiConfig(config);
      setToast('AI configuration saved');
    } catch { setToast('Failed to save'); }
    finally { setSaving(false); setTimeout(() => setToast(null), 3000); }
  };

  const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings, href: '' },
    { id: 'prompts', label: 'Prompts', icon: FileText, href: '/dashboard/admin/ai/prompts' },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database, href: '/dashboard/admin/ai/knowledge' },
  ] as const;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">AI Management</h1>
          <p className="text-sm text-slate-400 mt-1">Configure AI providers, prompts, and knowledge base</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon, href }) => (
          <button key={id} onClick={() => href ? router.push(href) : setActiveTab(id as 'config')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === id ? 'bg-[#1E3A8A] text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'config' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Cpu className="w-5 h-5" /> AI Provider Configuration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Provider</label>
                <select value={config.provider} onChange={e => setConfig({ ...config, provider: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="google">Google Gemini</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Model</label>
                <select value={config.model} onChange={e => setConfig({ ...config, model: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">API Key</label>
              <input type="password" value={config.apiKey} onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                placeholder="sk-..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Max Tokens</label>
                <input type="number" value={config.maxTokens} onChange={e => setConfig({ ...config, maxTokens: parseInt(e.target.value) || 4096 })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Temperature</label>
                <input type="number" step="0.1" min="0" max="2" value={config.temperature} onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) || 0.7 })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                className="rounded border-slate-300"
              />
              Enable AI features
            </label>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E3A8A]/90 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
