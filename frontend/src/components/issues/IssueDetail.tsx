import React, { useEffect, useState } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  _id: string;
  title: string;
  description: string;
  status: "open" | "closed";
  createdAt?: string;
}

interface IssueDetailProps {
  issueId:   string;
  isOwner:   boolean;
  onBack:    () => void;
  onDeleted: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const IssueDetail: React.FC<IssueDetailProps> = ({
  issueId, isOwner, onBack, onDeleted,
}) => {
  const [issue, setIssue]       = useState<Issue | null>(null);
  const [loading, setLoading]   = useState<boolean>(true);
  const [editing, setEditing]   = useState<boolean>(false);
  const [saving, setSaving]     = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Editable fields
  const [editTitle, setEditTitle]         = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editStatus, setEditStatus]       = useState<"open" | "closed">("open");

  useEffect(() => {
    const fetch = async (): Promise<void> => {
      try {
        const res = await axios.get(`http://localhost:3000/issue/${issueId}`);
        const data: Issue = res.data.issue;
        setIssue(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditStatus(data.status);
      } catch (err) {
        console.error("Failed to fetch issue:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [issueId]);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      const res = await axios.put(`http://localhost:3000/issue/update/${issueId}`, {
        title:       editTitle,
        description: editDescription,
        status:      editStatus,
      });
      setIssue(res.data.issue);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update issue:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm("Delete this issue? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:3000/issue/delete/${issueId}`);
      onDeleted();
    } catch (err) {
      console.error("Failed to delete issue:", err);
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (): Promise<void> => {
    if (!issue) return;
    const newStatus = issue.status === "open" ? "closed" : "open";
    try {
      const res = await axios.put(`http://localhost:3000/issue/update/${issueId}`, {
        title:       issue.title,
        description: issue.description,
        status:      newStatus,
      });
      setIssue(res.data.issue);
      setEditStatus(newStatus);
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-8 w-64 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-32 rounded-xl bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="py-16 text-center">
        <p className="font-plex text-[11px] text-gray-700">issue not found</p>
        <button onClick={onBack}
          className="font-plex text-[11px] text-[#00FFA3]/70 hover:text-[#00FFA3]
                     transition-colors mt-2">
          ← back
        </button>
      </div>
    );
  }

  const isOpen = issue.status === "open";

  return (
    <>
      <style>{`
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
        .issue-input:focus {
          outline: none;
          border-color: rgba(0,255,163,0.35);
          box-shadow: 0 0 0 3px rgba(0,255,163,0.06);
        }
      `}</style>

      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-1.5 font-plex text-[11px] text-gray-700
                   hover:text-gray-300 transition-colors mb-5 group">
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        all issues
      </button>

      <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

        {/* Top shimmer — coral for open, mint for closed */}
        <div className={`absolute inset-x-0 top-0 h-px
                         bg-gradient-to-r from-transparent to-transparent
                         ${isOpen ? "via-[#FF6B4A]/25" : "via-[#00FFA3]/20"}`} />

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/[0.05]">
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="issue-input w-full font-syne text-xl font-bold
                           bg-white/[0.03] border border-white/[0.07]
                           rounded-lg px-3 py-2 text-white transition-all duration-200"
              />
            ) : (
              <h2 className="font-syne text-xl font-bold text-white tracking-tight">
                {issue.title}
              </h2>
            )}

            {issue.createdAt && (
              <p className="font-plex text-[10px] text-gray-700 mt-1.5">
                opened{" "}
                {new Date(issue.createdAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Status badge */}
          <span className={`shrink-0 font-plex text-[9px] px-2.5 py-1 rounded border
                            uppercase tracking-widest
                            ${isOpen
                              ? "text-[#FF6B4A] bg-[#FF6B4A]/[0.08] border-[#FF6B4A]/20"
                              : "text-[#00FFA3] bg-[#00FFA3]/[0.08] border-[#00FFA3]/20"
                            }`}>
            {issue.status}
          </span>
        </div>

        {/* ── Description ── */}
        <div className="p-6 border-b border-white/[0.05]">
          <p className="font-plex text-[10px] uppercase tracking-widest text-gray-600 mb-3">
            Description
          </p>
          {editing ? (
            <textarea
              rows={6}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="issue-input w-full px-3.5 py-2.5 rounded-lg font-dm text-sm
                         bg-white/[0.03] border border-white/[0.07] resize-none
                         text-gray-200 placeholder-gray-700 transition-all duration-200
                         leading-relaxed"
            />
          ) : (
            <p className="font-dm text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </p>
          )}
        </div>

        {/* ── Status toggle (editing) ── */}
        {editing && (
          <div className="px-6 py-4 border-b border-white/[0.05]">
            <p className="font-plex text-[10px] uppercase tracking-widest text-gray-600 mb-3">
              Status
            </p>
            <div className="flex gap-2">
              {(["open", "closed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEditStatus(s)}
                  className={`font-plex text-[11px] px-3.5 py-1.5 rounded-lg border
                              transition-all duration-200
                              ${editStatus === s
                                ? s === "open"
                                  ? "text-[#FF6B4A] bg-[#FF6B4A]/[0.08] border-[#FF6B4A]/25"
                                  : "text-[#00FFA3] bg-[#00FFA3]/[0.08] border-[#00FFA3]/25"
                                : "text-gray-600 border-white/[0.06] hover:text-gray-300"
                              }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {isOwner && (
          <div className="flex items-center justify-between px-6 py-4">

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 font-plex text-[11px] px-4 py-1.5
                               rounded-lg border border-[#00FFA3]/25 bg-[#00FFA3]/[0.07]
                               text-[#00FFA3] hover:bg-[#00FFA3]/[0.14]
                               disabled:opacity-40 transition-all duration-200"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditTitle(issue.title);
                      setEditDescription(issue.description);
                      setEditStatus(issue.status);
                    }}
                    className="font-plex text-[11px] text-gray-600 hover:text-gray-300
                               transition-colors px-3 py-1.5"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="font-plex text-[11px] px-4 py-1.5 rounded-lg border
                               border-white/[0.07] text-gray-400 bg-white/[0.02]
                               hover:text-white hover:border-white/[0.12]
                               transition-all duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    className={`font-plex text-[11px] px-4 py-1.5 rounded-lg border
                                transition-all duration-200
                                ${isOpen
                                  ? "border-[#00FFA3]/20 bg-[#00FFA3]/[0.05] text-[#00FFA3]/70 hover:bg-[#00FFA3]/[0.12] hover:text-[#00FFA3]"
                                  : "border-[#FF6B4A]/20 bg-[#FF6B4A]/[0.05] text-[#FF6B4A]/70 hover:bg-[#FF6B4A]/[0.12] hover:text-[#FF6B4A]"
                                }`}
                  >
                    {isOpen ? "Close issue" : "Reopen issue"}
                  </button>
                </>
              )}
            </div>

            {/* Delete */}
            {!editing && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="font-plex text-[11px] text-gray-700 hover:text-[#FF6B4A]
                           transition-colors duration-200 disabled:opacity-40"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default IssueDetail;