import { create } from 'zustand';
import { superAdminService } from '@/services/api.service';
import type { Website, WebsitePage, WebsiteSection, WebsiteTemplate, MediaItem, WebsiteBlock, SectionType } from '@/types';

const DEFAULT_BLOCKS: WebsiteBlock[] = [
  { id: 'hero', type: 'hero', label: 'Hero Section', description: 'Full-width hero with headline, subtitle and CTA', icon: 'Layout', category: 'layout', defaultContent: { heading: 'Welcome', subheading: 'Your tagline here', ctaText: 'Learn More', ctaLink: '#', backgroundImage: '' }, defaultSettings: { fullHeight: true, overlay: true, alignment: 'center' } },
  { id: 'about', type: 'about', label: 'About', description: 'About us section with image and text', icon: 'FileText', category: 'content', defaultContent: { heading: 'About Us', content: 'Your about text here', image: '' }, defaultSettings: { layout: 'side-by-side' } },
  { id: 'services', type: 'services', label: 'Services', description: 'Grid of services/cards', icon: 'Grid', category: 'content', defaultContent: { heading: 'Our Services', services: [{ title: 'Service 1', description: 'Description', icon: '' }] }, defaultSettings: { columns: 3 } },
  { id: 'stats', type: 'stats', label: 'Statistics', description: 'Animated counter stats', icon: 'BarChart', category: 'content', defaultContent: { heading: 'By the Numbers', stats: [{ label: 'Patients', value: '1000+' }] }, defaultSettings: { columns: 4, animation: true } },
  { id: 'gallery', type: 'gallery', label: 'Gallery', description: 'Image gallery grid', icon: 'Image', category: 'media', defaultContent: { heading: 'Gallery', images: [] }, defaultSettings: { columns: 3, lightbox: true } },
  { id: 'testimonials', type: 'testimonials', label: 'Testimonials', description: 'Customer/client testimonials', icon: 'MessageSquare', category: 'content', defaultContent: { heading: 'Testimonials', testimonials: [{ name: 'John Doe', text: 'Great service!', avatar: '' }] }, defaultSettings: { style: 'carousel' } },
  { id: 'team', type: 'team', label: 'Team', description: 'Team member cards', icon: 'Users', category: 'content', defaultContent: { heading: 'Our Team', members: [{ name: 'Jane Doe', role: 'CEO', photo: '' }] }, defaultSettings: { columns: 4 } },
  { id: 'faq', type: 'faq', label: 'FAQ', description: 'Accordion FAQ section', icon: 'HelpCircle', category: 'content', defaultContent: { heading: 'FAQ', items: [{ question: 'Question?', answer: 'Answer here' }] }, defaultSettings: { style: 'accordion' } },
  { id: 'contact', type: 'contact', label: 'Contact', description: 'Contact form and details', icon: 'Mail', category: 'interactive', defaultContent: { heading: 'Contact Us', address: '', phone: '', email: '', mapEmbed: '' }, defaultSettings: { showForm: true, showMap: false } },
  { id: 'cta', type: 'cta', label: 'Call to Action', description: 'Banner CTA section', icon: 'Bell', category: 'interactive', defaultContent: { heading: 'Get in Touch', subheading: 'We are here to help', buttonText: 'Contact', buttonLink: '#' }, defaultSettings: { background: 'primary' } },
  { id: 'partners', type: 'partners', label: 'Partners', description: 'Partner/Sponsor logos', icon: 'Handshake', category: 'content', defaultContent: { heading: 'Our Partners', logos: [] }, defaultSettings: { columns: 5, autoScroll: true } },
  { id: 'html', type: 'html', label: 'Custom HTML', description: 'Custom HTML/CSS/JS embed', icon: 'Code', category: 'layout', defaultContent: { html: '', css: '', js: '' }, defaultSettings: { sandboxed: true } },
];

interface WebsiteState {
  websites: Website[];
  currentWebsite: Website | null;
  templates: WebsiteTemplate[];
  media: MediaItem[];
  loading: boolean;
  blocks: WebsiteBlock[];
  draftPages: WebsitePage[];

  fetchWebsites: (params?: Record<string, string>) => Promise<void>;
  fetchWebsiteById: (id: string) => Promise<void>;
  setCurrentWebsite: (site: Website | null) => void;
  updateWebsiteStyle: (style: Partial<Website['style']>) => void;
  updateWebsiteSEO: (seo: Partial<Website['seo']>) => void;
  addPage: (page: Partial<WebsitePage>) => void;
  updatePage: (pageId: string, updates: Partial<WebsitePage>) => void;
  removePage: (pageId: string) => void;
  addSection: (pageId: string, section: Partial<WebsiteSection>) => void;
  updateSection: (pageId: string, sectionId: string, updates: Partial<WebsiteSection>) => void;
  removeSection: (pageId: string, sectionId: string) => void;
  reorderSections: (pageId: string, sections: WebsiteSection[]) => void;
  fetchTemplates: () => Promise<void>;
  fetchMedia: (params?: Record<string, string>) => Promise<void>;
  saveWebsite: () => Promise<void>;
  publishWebsite: (id: string) => Promise<void>;
}

export const useWebsiteStore = create<WebsiteState>((set, get) => ({
  websites: [],
  currentWebsite: null,
  templates: [],
  media: [],
  loading: false,
  blocks: DEFAULT_BLOCKS,
  draftPages: [],

  fetchWebsites: async (params) => {
    set({ loading: true });
    try {
      const res = await superAdminService.getWebsites(params);
      set({ websites: res.data?.data || [], loading: false });
    } catch { set({ loading: false }); }
  },

  fetchWebsiteById: async (id) => {
    set({ loading: true });
    try {
      const res = await superAdminService.getWebsiteById(id);
      set({ currentWebsite: res.data?.data || null, loading: false });
    } catch { set({ loading: false }); }
  },

  setCurrentWebsite: (site) => set({ currentWebsite: site }),

  updateWebsiteStyle: (style) => set((s) => ({
    currentWebsite: s.currentWebsite ? { ...s.currentWebsite, style: { ...s.currentWebsite.style, ...style } } : null,
  })),

  updateWebsiteSEO: (seo) => set((s) => ({
    currentWebsite: s.currentWebsite ? { ...s.currentWebsite, seo: { ...s.currentWebsite.seo, ...seo } } : null,
  })),

  addPage: (page) => set((s) => {
    const newPage: WebsitePage = {
      _id: `page_${Date.now()}`,
      title: page.title || 'New Page',
      slug: page.slug || 'new-page',
      isHome: page.isHome || false,
      status: 'draft',
      sections: [],
      sortOrder: (s.currentWebsite?.pages.length || 0) + 1,
      seo: page.seo,
    };
    return {
      currentWebsite: s.currentWebsite
        ? { ...s.currentWebsite, pages: [...s.currentWebsite.pages, newPage] }
        : null,
    };
  }),

  updatePage: (pageId, updates) => set((s) => ({
    currentWebsite: s.currentWebsite
      ? { ...s.currentWebsite, pages: s.currentWebsite.pages.map((p) => p._id === pageId ? { ...p, ...updates } : p) }
      : null,
  })),

  removePage: (pageId) => set((s) => ({
    currentWebsite: s.currentWebsite
      ? { ...s.currentWebsite, pages: s.currentWebsite.pages.filter((p) => p._id !== pageId) }
      : null,
  })),

  addSection: (pageId, section) => set((s) => ({
    currentWebsite: s.currentWebsite
      ? {
          ...s.currentWebsite,
          pages: s.currentWebsite.pages.map((p) => {
            if (p._id !== pageId) return p;
            const newSection: WebsiteSection = {
              _id: `sec_${Date.now()}`,
              type: section.type || 'custom',
              label: section.label || 'New Section',
              visible: true,
              settings: section.settings || {},
              content: section.content || {},
              sortOrder: p.sections.length + 1,
            };
            return { ...p, sections: [...p.sections, newSection] };
          }),
        }
      : null,
  })),

  updateSection: (pageId, sectionId, updates) => set((s) => ({
    currentWebsite: s.currentWebsite
      ? {
          ...s.currentWebsite,
          pages: s.currentWebsite.pages.map((p) => {
            if (p._id !== pageId) return p;
            return { ...p, sections: p.sections.map((sec) => sec._id === sectionId ? { ...sec, ...updates } : sec) };
          }),
        }
      : null,
  })),

  removeSection: (pageId, sectionId) => set((s) => ({
    currentWebsite: s.currentWebsite
      ? {
          ...s.currentWebsite,
          pages: s.currentWebsite.pages.map((p) => {
            if (p._id !== pageId) return p;
            return { ...p, sections: p.sections.filter((sec) => sec._id !== sectionId) };
          }),
        }
      : null,
  })),

  reorderSections: (pageId, sections) => set((s) => ({
    currentWebsite: s.currentWebsite
      ? {
          ...s.currentWebsite,
          pages: s.currentWebsite.pages.map((p) => p._id === pageId ? { ...p, sections } : p),
        }
      : null,
  })),

  fetchTemplates: async () => {
    try {
      const res = await superAdminService.getWebsiteTemplates();
      set({ templates: res.data?.data || [] });
    } catch { /* ignore */ }
  },

  fetchMedia: async (params) => {
    try {
      const res = await superAdminService.getMedia(params);
      set({ media: res.data?.data || [] });
    } catch { /* ignore */ }
  },

  saveWebsite: async () => {
    const site = get().currentWebsite;
    if (!site) return;
    try {
      await superAdminService.updateWebsite(site._id, site);
    } catch { throw new Error('Failed to save website'); }
  },

  publishWebsite: async (id) => {
    try {
      await superAdminService.publishWebsite(id);
      set((s) => ({
        currentWebsite: s.currentWebsite?._id === id ? { ...s.currentWebsite, status: 'published', publishedAt: new Date().toISOString() } : s.currentWebsite,
      }));
    } catch { throw new Error('Failed to publish'); }
  },
}));
