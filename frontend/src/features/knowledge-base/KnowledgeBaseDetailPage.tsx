import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { KnowledgeArticle } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  PlusCircle,
  Eye,
  Calendar,
} from 'lucide-react';

export const KnowledgeBaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<KnowledgeArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api.get(`/knowledge-base/${id}`);
        setArticle(res.data.data);
      } catch (err) {
        console.error('Failed to fetch KB article:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIndex)
        ? prev.filter((i) => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading standard operating procedure...</span>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Knowledge article not found.</p>
        <Link to="/knowledge-base" className="text-brand-400 hover:underline mt-2 inline-block text-sm">
          Return to Knowledge Base
        </Link>
      </div>
    );
  }

  // Parse steps if JSON string or array
  const steps: string[] = Array.isArray(article.troubleshooting_steps)
    ? article.troubleshooting_steps
    : typeof article.troubleshooting_steps === 'string'
    ? JSON.parse(article.troubleshooting_steps)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back navigation & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/knowledge-base')}
          className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-brand-400 uppercase tracking-wider">{article.category_name}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Eye className="w-3 h-3" /> {article.view_count} views
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">{article.title}</h1>
        </div>
      </div>

      {/* Problem Summary & Description */}
      <Card title="1. Problem Overview">
        <div className="text-sm text-slate-200 leading-relaxed">
          {article.problem_description}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
          {article.symptoms && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold uppercase tracking-wider text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Symptoms & Indicators
              </div>
              <p className="text-slate-300 leading-relaxed">{article.symptoms}</p>
            </div>
          )}

          {article.possible_causes && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold uppercase tracking-wider text-[10px]">
                <HelpCircle className="w-3.5 h-3.5" />
                Likely Root Causes
              </div>
              <p className="text-slate-300 leading-relaxed">{article.possible_causes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Step-by-step Interactive Troubleshooting Guide */}
      <Card
        title="2. Standard Troubleshooting Procedures (SOP)"
        subtitle="Follow these steps sequentially. Check off each step after verifying."
      >
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isChecked = completedSteps.includes(index);
            return (
              <div
                key={index}
                onClick={() => toggleStep(index)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-0.5">
                    Step {index + 1}
                  </span>
                  <p className={`text-xs ${isChecked ? 'text-emerald-200 line-through' : 'text-slate-200'} leading-relaxed`}>
                    {step}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Escalation Condition */}
      {article.escalation_condition && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-400 font-semibold uppercase tracking-wider text-[11px]">
            <ShieldAlert className="w-4 h-4" />
            Tier 2 Support Escalation Criteria
          </div>
          <p className="text-slate-300 leading-relaxed">{article.escalation_condition}</p>
        </div>
      )}

      {/* Bottom CTA: File Ticket if unresolved */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Issue still persists after following SOP?</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            An IT Support Engineer will inspect your workstation and diagnose the incident.
          </p>
        </div>
        <Link to="/tickets/create">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            File Incident Ticket
          </Button>
        </Link>
      </div>
    </div>
  );
};
