'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWebsiteStore } from '@/store/websiteStore';
import { superAdminService } from '@/services/api.service';
import type { Website, WebsitePage, WebsiteSection, WebsiteBlock, SectionType, WebsiteStyle } from '@/types';
import {
  Globe, Plus, Save, Eye, X, Settings, ChevronDown, ChevronUp,
  MoveVertical, Trash2, Copy, Layers, Palette, Search, Smartphone,
  Tablet, Monitor, Undo, Redo, Code, Image, Type, Layout, Grid,
  Columns, Heading, AlignLeft, Play, Download, FileText,
  Menu, ArrowLeft, Check, Edit3, MoreHorizontal, GripVertical,
} from 'lucide-react';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';
type EditorTab = 'pages' | 'blocks' | 'style' | 'seo' | 'settings';

const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

export default function WebsiteEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const websiteId = searchParams.get('id');
  const entityType = (searchParams.get('type') || 'hospital') as Website['entityType'];
  const entityId = searchParams.get('entityId') || '';

  const {
    currentWebsite, templates, blocks, loading,
    setCurrentWebsite, fetchWebsiteById, fetchTemplates,
    updateWebsiteStyle, updateWebsiteSEO,
    addPage, updatePage, removePage,
    addSection, updateSection, removeSection, reorderSections,
    saveWebsite, publishWebsite,
  } = useWebsiteStore();

  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [editorTab, setEditorTab] = useState<EditorTab>('blocks');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');
  const [showPageEditor, setShowPageEditor] = useState(false);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    if (websiteId) { fetchWebsiteById(websiteId); }
  }, [websiteId, fetchWebsiteById]);

  useEffect(() => {
    if (currentWebsite && currentWebsite.pages.length > 0 && !selectedPageId) {
      setSelectedPageId(currentWebsite.pages[0]._id);
    }
  }, [currentWebsite, selectedPageId]);

  const selectedPage = currentWebsite?.pages.find(p => p._id === selectedPageId);
  const selectedSection = selectedPage?.sections.find(s => s._id === selectedSectionId);

  const handleSave = async () => {
    setSaving(true);
    try { await saveWebsite(); showToast('Website saved', 'success'); }
    catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => {
    if (!currentWebsite) return;
    try {
      if (currentWebsite.status === 'published') {
        await superAdminService.unpublishWebsite(currentWebsite._id);
        setCurrentWebsite({ ...currentWebsite, status: 'unpublished' });
        showToast('Website unpublished', 'info');
      } else {
        await publishWebsite(currentWebsite._id);
        showToast('Website published!', 'success');
      }
    } catch { showToast('Failed to publish', 'error'); }
  };

  const handleCreatePage = () => {
    const newPage: Partial<WebsitePage> = {
      title: 'New Page',
      slug: `page-${Date.now()}`,
      isHome: currentWebsite?.pages.length === 0,
      status: 'draft',
      seo: { title: '', description: '' },
    };
    addPage(newPage);
    showToast('Page created', 'success');
  };

  const handleDeletePage = (pageId: string) => {
    removePage(pageId);
    if (selectedPageId === pageId) {
      setSelectedPageId(currentWebsite?.pages[0]?._id || '');
    }
    showToast('Page deleted', 'info');
  };

  const handleAddSection = (block: WebsiteBlock) => {
    if (!selectedPageId) return;
    addSection(selectedPageId, {
      type: block.type,
      label: block.label,
      settings: block.defaultSettings,
      content: block.defaultContent,
    });
    setShowBlockPicker(false);
    showToast(`Added ${block.label}`, 'success');
  };

  const handleUpdateSection = (sectionId: string, field: string, value: any) => {
    if (!selectedPageId) return;
    const section = selectedPage?.sections.find(s => s._id === sectionId);
    if (!section) return;
    if (field.startsWith('content.')) {
      const key = field.replace('content.', '');
      updateSection(selectedPageId, sectionId, { content: { ...section.content, [key]: value } });
    } else if (field.startsWith('settings.')) {
      const key = field.replace('settings.', '');
      updateSection(selectedPageId, sectionId, { settings: { ...section.settings, [key]: value } });
    } else {
      updateSection(selectedPageId, sectionId, { [field]: value });
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!selectedPageId) return;
    removeSection(selectedPageId, sectionId);
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
    showToast('Section removed', 'info');
  };

  const handleAiAssistant = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setAiSuggestions([
        `Suggested hero heading: "${aiPrompt}"`,
        `Add a services section highlighting your offerings`,
        `Include a contact form with map integration`,
        `Add team member profiles with photos and bios`,
      ]);
      showToast('AI suggestions ready', 'success');
    } catch { showToast('AI request failed', 'error'); }
    finally { setAiLoading(false); }
  };

  const applyAiSuggestion = (suggestion: string) => {
    if (suggestion.includes('hero')) {
      handleAddSection(blocks.find(b => b.type === 'hero')!);
    } else if (suggestion.includes('services')) {
      handleAddSection(blocks.find(b => b.type === 'services')!);
    } else if (suggestion.includes('contact')) {
      handleAddSection(blocks.find(b => b.type === 'contact')!);
    } else if (suggestion.includes('team')) {
      handleAddSection(blocks.find(b => b.type === 'team')!);
    }
  };

  const blockCategories = [
    { id: 'layout', label: 'Layout', items: blocks.filter(b => b.category === 'layout') },
    { id: 'content', label: 'Content', items: blocks.filter(b => b.category === 'content') },
    { id: 'media', label: 'Media', items: blocks.filter(b => b.category === 'media') },
    { id: 'interactive', label: 'Interactive', items: blocks.filter(b => b.category === 'interactive') },
  ];

  const filteredBlockCategories = blockCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(b => !blockSearch || b.label.toLowerCase().includes(blockSearch.toLowerCase())),
  })).filter(cat => cat.items.length > 0);

  if (!currentWebsite && loading) return <div className="flex items-center justify-center h-[80vh]"><div className="text-center"><Globe className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" /><p className="text-slate-400">Loading website editor...</p></div></div>;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/admin/websites')} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
          <Globe className="w-4 h-4 text-[#1E3A8A]" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">{currentWebsite?.title || 'New Website'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            currentWebsite?.status === 'published' ? 'bg-green-100 text-green-700' :
            currentWebsite?.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'
          }`}>{currentWebsite?.status || 'draft'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mr-2">
            {(Object.keys(DEVICE_ICONS) as DeviceMode[]).map(mode => {
              const Icon = DEVICE_ICONS[mode];
              return (
                <button key={mode} onClick={() => setDeviceMode(mode)}
                  className={`p-1.5 ${deviceMode === mode ? 'bg-[#1E3A8A] text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} transition-colors`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              showAIAssistant ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> AI
          </button>
          <button onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              showPreview ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3A8A]/90 disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handlePublish}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              currentWebsite?.status === 'published'
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> {currentWebsite?.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Page Management */}
        <div className="w-56 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pages</span>
            <button onClick={handleCreatePage} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#1E3A8A]">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {currentWebsite?.pages.map((page) => (
              <div key={page._id}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                  selectedPageId === page._id ? 'bg-[#1E3A8A]/10 text-[#1E3A8A] font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setSelectedPageId(page._id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {page.isHome && <span className="text-[10px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold">HOME</span>}
                  <span className="truncate">{page.title}</span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setEditingPage(page); setShowPageEditor(true); }} className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"><Edit3 className="w-3 h-3" /></button>
                  {!page.isHome && <button onClick={(e) => { e.stopPropagation(); handleDeletePage(page._id); }} className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Tabs (blocks/style/seo/settings) */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            {[
              { id: 'blocks' as EditorTab, label: 'Blocks', icon: Grid },
              { id: 'style' as EditorTab, label: 'Style', icon: Palette },
              { id: 'seo' as EditorTab, label: 'SEO', icon: Search },
              { id: 'settings' as EditorTab, label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setEditorTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                  editorTab === id ? 'text-[#1E3A8A] border-b-2 border-[#1E3A8A]' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {editorTab === 'blocks' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input type="text" placeholder="Search blocks..." value={blockSearch} onChange={e => setBlockSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
                {filteredBlockCategories.map(cat => (
                  <div key={cat.id}>
                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{cat.label}</h4>
                    <div className="space-y-1">
                      {cat.items.map(block => (
                        <button key={block.id} onClick={() => handleAddSection(block)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        >
                          <div className="w-6 h-6 rounded-md bg-[#1E3A8A]/10 flex items-center justify-center shrink-0">
                            <Layout className="w-3 h-3 text-[#1E3A8A]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{block.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{block.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editorTab === 'style' && (
              <div className="space-y-4">
                {[
                  { label: 'Primary Color', key: 'primaryColor' as keyof WebsiteStyle, type: 'color' },
                  { label: 'Secondary Color', key: 'secondaryColor' as keyof WebsiteStyle, type: 'color' },
                  { label: 'Accent Color', key: 'accentColor' as keyof WebsiteStyle, type: 'color' },
                  { label: 'Font Family', key: 'fontFamily' as keyof WebsiteStyle, type: 'select', options: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'] },
                  { label: 'Border Radius', key: 'borderRadius' as keyof WebsiteStyle, type: 'select', options: ['none', 'sm', 'md', 'lg', 'xl', 'full'] },
                  { label: 'Spacing', key: 'spacing' as keyof WebsiteStyle, type: 'select', options: ['compact', 'normal', 'relaxed', 'spacious'] },
                ].map(({ label, key, type, options }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
                    {type === 'color' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input type="color" value={(currentWebsite?.style[key] as string) || '#000000'}
                          onChange={e => updateWebsiteStyle({ [key]: e.target.value })}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                        />
                        <input type="text" value={(currentWebsite?.style[key] as string) || ''}
                          onChange={e => updateWebsiteStyle({ [key]: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none font-mono"
                        />
                      </div>
                    ) : (
                      <select value={(currentWebsite?.style[key] as string) || ''}
                        onChange={e => updateWebsiteStyle({ [key]: e.target.value })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                      >
                        {options?.map(o => <option key={o} value={o.toLowerCase()}>{o}</option>)}
                      </select>
                    )}
                  </div>
                ))}
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={currentWebsite?.style.animations || false}
                    onChange={e => updateWebsiteStyle({ animations: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Enable animations
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={currentWebsite?.style.darkMode || false}
                    onChange={e => updateWebsiteStyle({ darkMode: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  Enable dark mode
                </label>
              </div>
            )}

            {editorTab === 'seo' && (
              <div className="space-y-4">
                {[
                  { label: 'Meta Title', key: 'title', type: 'text' },
                  { label: 'Meta Description', key: 'description', type: 'textarea' },
                  { label: 'OG Image URL', key: 'ogImage', type: 'text' },
                  { label: 'OG Title', key: 'ogTitle', type: 'text' },
                  { label: 'OG Description', key: 'ogDescription', type: 'textarea' },
                  { label: 'Canonical URL', key: 'canonicalUrl', type: 'text' },
                  { label: 'Robots', key: 'robots', type: 'select', options: ['index, follow', 'noindex, follow', 'index, nofollow', 'noindex, nofollow'] },
                ].map(({ label, key, type, options }) => (
                  <div key={key as string}>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
                    {type === 'textarea' ? (
                      <textarea value={(currentWebsite?.seo as any)?.[key] || ''}
                        onChange={e => updateWebsiteSEO({ [key]: e.target.value })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none resize-none h-16"
                      />
                    ) : type === 'select' ? (
                      <select value={(currentWebsite?.seo as any)?.[key] || ''}
                        onChange={e => updateWebsiteSEO({ [key]: e.target.value })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                      >
                        {options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={(currentWebsite?.seo as any)?.[key] || ''}
                        onChange={e => updateWebsiteSEO({ [key]: e.target.value })}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {editorTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">Website Title</label>
                  <input type="text" value={currentWebsite?.title || ''}
                    onChange={e => setCurrentWebsite(currentWebsite ? { ...currentWebsite, title: e.target.value } : null)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Slug</label>
                  <input type="text" value={currentWebsite?.slug || ''}
                    onChange={e => setCurrentWebsite(currentWebsite ? { ...currentWebsite, slug: e.target.value } : null)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Custom Domain</label>
                  <input type="text" value={currentWebsite?.domain || ''} placeholder="www.example.com"
                    onChange={e => setCurrentWebsite(currentWebsite ? { ...currentWebsite, domain: e.target.value } : null)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Panel */}
        {showAIAssistant && (
          <div className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> AI Assistant
              </span>
              <button onClick={() => setShowAIAssistant(false)} className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <p className="text-xs text-slate-400">Ask AI to generate content, suggest layouts, or optimize your website.</p>
              {aiSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-slate-400 uppercase">Suggestions</h4>
                  {aiSuggestions.map((s, i) => (
                    <button key={i} onClick={() => applyAiSuggestion(s)}
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-2">
                <input type="text" placeholder="Describe what you want..."
                  value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAiAssistant()}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                />
                <button onClick={handleAiAssistant} disabled={aiLoading || !aiPrompt.trim()}
                  className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
          {showPreview ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className={`mx-auto ${deviceMode === 'desktop' ? 'max-w-5xl' : deviceMode === 'tablet' ? 'max-w-2xl' : 'max-w-sm'} bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[60vh]`}>
                {selectedPage?.sections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Layers className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400 mb-1">This page is empty</p>
                    <p className="text-xs text-slate-400 mb-4">Add sections from the Blocks panel</p>
                    <button onClick={() => setEditorTab('blocks')}
                      className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Section
                    </button>
                  </div>
                ) : (
                  selectedPage?.sections
                    .filter(s => s.visible)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(section => (
                      <div key={section._id}
                        onClick={() => setSelectedSectionId(section._id)}
                        className={`relative group border-b border-slate-100 dark:border-slate-800 p-8 cursor-pointer transition-colors ${
                          selectedSectionId === section._id ? 'ring-2 ring-[#1E3A8A] ring-inset bg-blue-50/30 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSection(section._id); }} className="p-1 rounded bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-red-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{section.label}</div>
                        <div className="text-slate-600 dark:text-slate-300">
                          {section.type === 'hero' && (
                            <div className="space-y-2">
                              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{section.content.heading || 'Welcome'}</h1>
                              <p className="text-sm">{section.content.subheading || ''}</p>
                              {section.content.ctaText && <span className="inline-block px-4 py-2 bg-[#1E3A8A] text-white rounded-lg text-sm font-semibold">{section.content.ctaText}</span>}
                            </div>
                          )}
                          {section.type === 'about' && (
                            <div className="space-y-2">
                              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{section.content.heading || 'About Us'}</h2>
                              <p className="text-sm">{section.content.content || ''}</p>
                              {section.content.image && <img src={section.content.image} alt="" className="w-full h-40 object-cover rounded-lg" />}
                            </div>
                          )}
                          {section.type === 'services' && (
                            <div className="space-y-3">
                              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{section.content.heading || 'Our Services'}</h2>
                              <div className="grid grid-cols-2 gap-3">
                                {(section.content.services || []).slice(0, 3).map((s: any, i: number) => (
                                  <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800"><p className="text-sm font-semibold">{s.title}</p><p className="text-xs text-slate-400 mt-1">{s.description}</p></div>
                                ))}
                              </div>
                            </div>
                          )}
                          {section.type === 'contact' && (
                            <div className="space-y-2">
                              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{section.content.heading || 'Contact Us'}</h2>
                              <p className="text-sm">{section.content.address}</p>
                              <p className="text-sm">{section.content.phone}</p>
                              <p className="text-sm">{section.content.email}</p>
                            </div>
                          )}
                          {(section.type === 'stats' || section.type === 'counters') && (
                            <div className="space-y-3">
                              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{section.content.heading || 'By the Numbers'}</h2>
                              <div className="grid grid-cols-2 gap-3">
                                {(section.content.stats || []).slice(0, 4).map((s: any, i: number) => (
                                  <div key={i} className="text-center"><p className="text-xl font-bold text-[#1E3A8A]">{s.value}</p><p className="text-xs text-slate-400">{s.label}</p></div>
                                ))}
                              </div>
                            </div>
                          )}
                          {section.type === 'html' && (
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-400 text-center">
                              <Code className="w-4 h-4 inline mr-1" /> Custom HTML/CSS Content
                            </div>
                          )}
                          {!['hero', 'about', 'services', 'contact', 'stats', 'counters', 'html'].includes(section.type) && (
                            <div className="text-sm text-slate-400 italic">{section.type} section content</div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <Eye className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Click <strong className="text-slate-600">Preview</strong> to see your website</p>
                <p className="text-xs text-slate-400 mt-1">Add sections from the Blocks panel, then preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg z-50 animate-slide-up ${
          toast.type === 'success' ? 'bg-green-600 text-white' :
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Page Editor Modal */}
      {showPageEditor && editingPage && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPageEditor(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Page</h3>
              <button onClick={() => setShowPageEditor(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Page Title</label>
                <input type="text" value={editingPage.title}
                  onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Slug</label>
                <input type="text" value={editingPage.slug}
                  onChange={e => setEditingPage({ ...editingPage, slug: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={editingPage.isHome}
                  onChange={e => setEditingPage({ ...editingPage, isHome: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Set as homepage
              </label>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowPageEditor(false)} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                <button onClick={() => { updatePage(editingPage._id, editingPage); setShowPageEditor(false); showToast('Page updated', 'success'); }}
                  className="px-4 py-2 text-sm font-semibold bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E3A8A]/90"
                >Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
