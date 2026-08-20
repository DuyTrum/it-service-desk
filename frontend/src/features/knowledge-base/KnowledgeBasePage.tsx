import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { KnowledgeArticle, KnowledgeCategory } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Search,
  BookOpen,
  Wifi,
  Cpu,
  Printer,
  AppWindow,
  Key,
  Eye,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const KnowledgeBasePage: React.FC = () => {
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/knowledge-base/categories');
        setCategories(res.data.data);
      } catch (err) {
        console.error('Failed to fetch KB categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('categoryId', selectedCategory);
        if (search) params.append('search', search);

        const res = await api.get(`/knowledge-base?${params.toString()}`);
        setArticles(res.data.data);
      } catch (err) {
        console.error('Failed to fetch KB articles:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, [selectedCategory, search]);

  const getCategoryIcon = (name?: string) => {
    switch (name?.toLowerCase()) {
      case 'network':
        return <Wifi className="w-5 h-5 text-brand-400" />;
      case 'hardware':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'printer':
        return <Printer className="w-5 h-5 text-emerald-400" />;
      case 'software':
        return <AppWindow className="w-5 h-5 text-purple-400" />;
      case 'account & access':
        return <Key className="w-5 h-5 text-rose-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner & Search Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl text-center max-w-4xl mx-auto space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">IT Knowledge Base & Self-Service SOPs</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Search standard operating procedures, network setup guides, and troubleshooting workflows before submitting a ticket.
          </p>
        </div>

        <div className="relative max-w-xl mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search solutions (e.g. Wi-Fi connection, Printer offline, Blue screen, Password reset)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xl"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === ''
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
              : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Topics ({articles.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>{cat.name}</span>
            {cat.article_count !== undefined && (
              <span className="text-[10px] opacity-75">({cat.article_count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-medium">Searching knowledge base...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">No knowledge articles found matching your query.</p>
          <Link to="/tickets/create" className="text-xs text-brand-400 hover:underline mt-2 inline-block">
            Submit a direct Support Ticket instead →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((art) => (
            <Link
              key={art.id}
              to={`/knowledge-base/${art.id}`}
              className="p-5 rounded-2xl bg-slate-850/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    {getCategoryIcon(art.category_name)}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {art.category_name}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {art.problem_description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  {art.view_count} views
                </span>
                <span className="text-brand-400 group-hover:translate-x-1 transition-transform font-semibold flex items-center gap-1 text-[11px]">
                  Read SOP <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
