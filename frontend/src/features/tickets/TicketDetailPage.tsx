import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  User as UserIcon,
  Laptop,
  Clock,
  Shield,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
  Star,
  HardDrive,
  Cpu,
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Modals
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [rootCause, setRootCause] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const isTechOrAdmin = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN';
  const isCreator = user?.id === ticket?.created_by_user_id;

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.data);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleStatusChange = async (newStatus: string, extraData = {}) => {
    try {
      await api.patch(`/tickets/${id}`, {
        status: newStatus,
        ...extraData,
      });
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const handleAssignToMe = async () => {
    if (!user) return;
    try {
      await api.patch(`/tickets/${id}`, {
        assignedTechId: user.id,
        status: ticket?.status === 'Open' ? 'Assigned' : ticket?.status,
        comment: `Assigned to ${user.fullName}`,
      });
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign ticket');
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/tickets/${id}/comments`, {
        comment: commentText.trim(),
        isInternalNote,
      });
      setCommentText('');
      setIsInternalNote(false);
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/tickets/${id}`, {
        status: 'Resolved',
        rootCause,
        resolutionNotes,
      });
      setIsResolveModalOpen(false);
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve ticket');
    }
  };

  const handleCloseAndRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/tickets/${id}/close`, {
        satisfactionRating: rating,
        feedbackComment: feedback,
      });
      setIsCloseModalOpen(false);
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to close ticket');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/tickets/${id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchTicket();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload attachment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Ticket not found or access denied.</p>
        <Link to="/tickets" className="text-brand-400 hover:underline mt-2 inline-block text-sm">
          Return to Ticket Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tickets')}
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-brand-400 text-sm">{ticket.ticket_code}</span>
              <Badge variant={ticket.priority as any}>{ticket.priority}</Badge>
              <Badge variant={ticket.status as any}>{ticket.status}</Badge>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">{ticket.title}</h2>
          </div>
        </div>

        {/* Action Controls for Tech / Admin */}
        <div className="flex flex-wrap items-center gap-2">
          {isTechOrAdmin && (
            <>
              {(!ticket.assigned_tech_id || ticket.assigned_tech_id !== user?.id) && (
                <Button variant="secondary" size="sm" onClick={handleAssignToMe}>
                  Assign to Me
                </Button>
              )}

              {ticket.status === 'Assigned' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange('In Progress')}
                >
                  Start Progress
                </Button>
              )}

              {ticket.status === 'In Progress' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange('Waiting for User')}
                  >
                    Waiting for User
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setIsResolveModalOpen(true)}
                  >
                    Mark as Resolved
                  </Button>
                </>
              )}

              {ticket.status === 'Waiting for User' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange('In Progress')}
                >
                  Resume Progress
                </Button>
              )}
            </>
          )}

          {/* Action for Ticket Creator: Close & Rate */}
          {isCreator && ticket.status === 'Resolved' && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<Star className="w-4 h-4 text-amber-300" />}
              onClick={() => setIsCloseModalOpen(true)}
            >
              Verify & Close Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Description, Resolution notes, Comments, Attachments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description Card */}
          <Card title="Incident Description" subtitle={`Reported under category: ${ticket.category}`}>
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </div>

            {/* Resolution Note if resolved/closed */}
            {ticket.resolution_notes && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolution & Root Cause Details
                </div>
                {ticket.root_cause && (
                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-emerald-200">Root Cause:</span> {ticket.root_cause}
                  </p>
                )}
                <p className="text-xs text-slate-200">
                  <span className="font-semibold text-emerald-200">Technician Solution:</span> {ticket.resolution_notes}
                </p>
              </div>
            )}

            {/* User Satisfaction Rating if closed */}
            {ticket.satisfaction_rating && (
              <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">User Rating:</span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < (ticket.satisfaction_rating || 0) ? 'fill-current' : 'text-slate-600'}`}
                      />
                    ))}
                  </div>
                </div>
                {ticket.feedback_comment && (
                  <span className="text-xs text-slate-300 italic">"{ticket.feedback_comment}"</span>
                )}
              </div>
            )}
          </Card>

          {/* Attachments Section */}
          <Card
            title={`Attachments (${ticket.attachments?.length || 0})`}
            subtitle="Screenshots, crash dumps, and log files"
            action={
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.txt,.zip"
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                  Add File
                </span>
              </label>
            }
          >
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 flex items-center gap-3 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-brand-400">
                      <Paperclip className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">{att.file_name}</p>
                      <p className="text-[10px] text-slate-400">
                        Uploaded by {att.uploaded_by_name} • {(att.file_size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No attachments uploaded yet.</p>
            )}
          </Card>

          {/* Threaded Discussion / Activity Comments */}
          <Card title="Activity & Support Communication" subtitle="Direct collaboration thread between requester and support">
            <div className="space-y-4">
              {/* Comment Thread */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all ${
                        c.is_internal_note
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : c.user_id === user?.id
                          ? 'bg-brand-600/10 border-brand-500/30 ml-4'
                          : 'bg-slate-900 border-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{c.user_name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {c.role_name}
                          </span>
                          {c.is_internal_note && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                              🔒 Internal Tech Note
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {c.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No messages in this discussion yet.</p>
                )}
              </div>

              {/* Comment Input Form */}
              {ticket.status !== 'Closed' && (
                <form onSubmit={handlePostComment} className="pt-4 border-t border-slate-800 space-y-3">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type your response or technical note here..."
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <div className="flex items-center justify-between">
                    {isTechOrAdmin ? (
                      <label className="flex items-center gap-2 text-xs text-amber-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isInternalNote}
                          onChange={(e) => setIsInternalNote(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                        />
                        <span>Post as Internal Technician Note (Hidden from employee)</span>
                      </label>
                    ) : (
                      <div />
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSubmittingComment}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Send Reply
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: Requester info, Asset Specs & Health Telemetry, Audit Trail */}
        <div className="space-y-6">
          {/* Requester Profile Card */}
          <Card title="Requester Information">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white">
                  {ticket.creator_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{ticket.creator_name}</h4>
                  <p className="text-slate-400">{ticket.creator_email}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-slate-200 font-medium">{ticket.department_name}</span>
                </div>
                {ticket.creator_phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone Hotline:</span>
                    <span className="text-slate-200 font-medium">{ticket.creator_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Assigned Tech:</span>
                  <span className="text-brand-400 font-semibold">
                    {ticket.tech_name || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Linked IT Asset & PC Telemetry */}
          {ticket.asset_id && (
            <Card title="Linked Hardware Asset" subtitle="Workstation specs and live health diagnostics">
              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-brand-400 font-bold text-[11px] bg-brand-500/10 px-2 py-0.5 rounded">
                      {ticket.asset_code}
                    </span>
                    <h4 className="font-semibold text-white mt-1">{ticket.asset_name}</h4>
                    <p className="text-slate-400">{ticket.asset_category} • {ticket.asset_model}</p>
                  </div>
                  <Badge variant={ticket.asset_status as any}>{ticket.asset_status}</Badge>
                </div>

                {/* Live Telemetry if Agent reports */}
                {ticket.assetTelemetry && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 mt-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-brand-400" />
                        Live PC Health (Agent)
                      </span>
                      <Badge variant="online">Online</Badge>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <div className="flex justify-between text-slate-400">
                          <span>CPU Load</span>
                          <span className="text-slate-200 font-medium">{ticket.assetTelemetry.cpu_usage}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500" style={{ width: `${ticket.assetTelemetry.cpu_usage}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400">
                          <span>Memory (RAM)</span>
                          <span className="text-slate-200 font-medium">{ticket.assetTelemetry.ram_usage}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500" style={{ width: `${ticket.assetTelemetry.ram_usage}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-400">
                          <span>Disk (Drive C:)</span>
                          <span className={ticket.assetTelemetry.disk_usage > 85 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                            {ticket.assetTelemetry.disk_usage}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${ticket.assetTelemetry.disk_usage > 85 ? 'bg-rose-500' : 'bg-brand-500'}`}
                            style={{ width: `${ticket.assetTelemetry.disk_usage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  to={`/assets/${ticket.asset_id}`}
                  className="block text-center text-xs text-brand-400 hover:underline pt-2 font-medium"
                >
                  View full asset history →
                </Link>
              </div>
            </Card>
          )}

          {/* Audit History Timeline */}
          <Card title="Incident Audit Trail" subtitle="Complete history of status and assignment transitions">
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {ticket.history && ticket.history.length > 0 ? (
                ticket.history.map((h, i) => (
                  <div key={h.id} className="relative pl-5 border-l-2 border-slate-800 text-xs space-y-0.5">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-brand-400" />
                    <p className="font-semibold text-slate-200">
                      {h.comment || `Changed ${h.field_changed} from ${h.old_value || 'None'} to ${h.new_value}`}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{h.changed_by_name || 'System'}</span>
                      <span>•</span>
                      <span>{new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No history recorded yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Resolve Incident */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Resolve Support Incident"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Root Cause of Problem
            </label>
            <input
              type="text"
              required
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. Faulty 8GB RAM Module in Slot 1"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Technical Resolution & Fix Notes
            </label>
            <textarea
              rows={4}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe the exact fix applied (e.g. Replaced RAM stick with Kingston 8GB DDR4, tested MemTest86 100% pass)..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResolveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="success" size="sm">
              Confirm Resolution
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Close & Rate */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Verify Resolution & Close Ticket"
      >
        <form onSubmit={handleCloseAndRate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Rate Support Quality (1 to 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${star <= rating ? 'fill-current' : 'text-slate-600'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Feedback / Comment for IT Support (Optional)
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="How was your experience with IT Support?"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCloseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Rating & Close Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
