import React, { useState, useRef, useEffect } from "react";
import api from "../../config/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateIssueProps {
  repoId: string;
  onCreated: () => void;
  onCancel: () => void;
}

interface FormErrors {
  title?: string;
  description?: string;
}

interface SimilarIssue {
  issueId: string;
  title: string;
  description: string;
  status: string;
  similarity: number;
}

interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number;
  similarIssues: SimilarIssue[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateIssue: React.FC<CreateIssueProps> = ({
  repoId,
  onCreated,
  onCancel,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ── AI duplicate detection state ──
  const [duplicateCheck, setDuplicateCheck] =
    useState<DuplicateCheckResult | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Duplicate check ──
  const checkForDuplicates = async (t: string, d: string): Promise<void> => {
    // Don't check until both fields have meaningful content
    if (!t.trim() || !d.trim() || t.length < 5 || d.length < 10) {
      setDuplicateCheck(null);
      return;
    }

    setChecking(true);
    try {
      const res = await api.post(
        `/issue/check-duplicate/${repoId}`,
        { title: t, description: d }
      );
      setDuplicateCheck(res.data);
    } catch (err) {
      // AI check failed — don't block user, just clear the warning
      console.error("Duplicate check failed:", err);
      setDuplicateCheck(null);
    } finally {
      setChecking(false);
    }
  };

  // ── Debounced onChange handlers ──
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setTitle(val);
    if (errors.title) setErrors((p) => ({ ...p, title: undefined }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkForDuplicates(val, description);
    }, 600);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    const val = e.target.value;
    setDescription(val);
    if (errors.description) setErrors((p) => ({ ...p, description: undefined }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkForDuplicates(title, val);
    }, 600);
  };

  // ── Validation ──
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    const userId = localStorage.getItem("userId");
    setLoading(true);
    try {
      await api.post(`/issue/create/${repoId}`, {
        title: title.trim(),
        description: description.trim(),
        userId,
      });
      onCreated();
    } catch (err) {
      console.error("Failed to create issue:", err);
      setErrors({ title: "Failed to create issue. Try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ──
  const hasSimilarIssues =
    (duplicateCheck?.similarIssues?.length ?? 0) > 0;

  const showClearBadge =
    duplicateCheck !== null &&
    !hasSimilarIssues &&
    !checking &&
    title.length >= 5 &&
    description.length >= 10;

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
        .issue-input.error {
          border-color: rgba(255,107,74,0.45);
        }
        .issue-input.error:focus {
          border-color: rgba(255,107,74,0.55);
          box-shadow: 0 0 0 3px rgba(255,107,74,0.07);
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.2s ease both; }
      `}</style>

      <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        {/* Top shimmer */}
        <div
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl
                        bg-gradient-to-r from-transparent via-[#FF6B4A]/20 to-transparent"
        />

        {/* Header */}
        <div className="mb-6">
          <h3 className="font-syne text-lg font-bold text-white tracking-tight">
            New Issue
          </h3>
          <p className="font-plex text-[11px] text-gray-600 mt-1">
            describe the problem clearly
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* ── Title ── */}
          <div className="flex flex-col gap-1.5">
            <label className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
              Title <span className="text-[#FF6B4A]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Short, descriptive title…"
              className={`issue-input w-full px-3.5 py-2.5 rounded-lg font-dm text-sm
                         bg-white/[0.03] border border-white/[0.07]
                         text-gray-200 placeholder-gray-700 transition-all duration-200
                         ${errors.title ? "error" : ""}`}
            />
            {errors.title && (
              <p className="font-plex text-[10px] text-[#FF6B4A]">
                {errors.title}
              </p>
            )}
          </div>

          {/* ── Description ── */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
                Description <span className="text-[#FF6B4A]">*</span>
              </label>
              <span
                className={`font-plex text-[10px] transition-colors
                                ${
                                  description.length > 500
                                    ? "text-[#FF6B4A]"
                                    : "text-gray-700"
                                }`}
              >
                {description.length} / 500
              </span>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Steps to reproduce, expected vs actual behavior…"
              className={`issue-input w-full px-3.5 py-2.5 rounded-lg font-dm text-sm
                         bg-white/[0.03] border border-white/[0.07] resize-none
                         text-gray-200 placeholder-gray-700 transition-all duration-200
                         leading-relaxed
                         ${errors.description ? "error" : ""}`}
            />
            {errors.description && (
              <p className="font-plex text-[10px] text-[#FF6B4A]">
                {errors.description}
              </p>
            )}
          </div>

          {/* ── AI Duplicate Detection Panel ── */}

          {/* Checking spinner */}
          {checking && (
            <div
              className="fade-in flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg
                            border border-white/[0.05] bg-white/[0.02]"
            >
              <svg
                className="w-3 h-3 animate-spin text-[#A78BFA] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="font-plex text-[10px] text-gray-600">
                scanning for similar issues…
              </span>
            </div>
          )}

          {/* Similar issues / duplicate warning */}
          {hasSimilarIssues && !checking && (
            <div
              className="fade-in rounded-xl border border-[#FF6B4A]/25
                            bg-[#FF6B4A]/[0.05] p-4"
            >
              {/* Header row */}
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#FF6B4A] animate-pulse shrink-0" />
                <span className="font-plex text-[11px] text-[#FF6B4A] uppercase tracking-widest">
                  {duplicateCheck?.isDuplicate
                    ? `${duplicateCheck.confidence}% match — similar issue exists`
                    : "similar issues found"}
                </span>
              </div>

              {/* Similar issues list */}
              <ul className="space-y-2">
                {duplicateCheck?.similarIssues.map((issue) => (
                  <li
                    key={issue.issueId}
                    className="flex items-start justify-between gap-3
                               px-3 py-2.5 rounded-lg
                               bg-white/[0.02] border border-white/[0.05]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-dm text-xs text-gray-300 truncate">
                        {issue.title}
                      </p>
                      <p className="font-plex text-[10px] text-gray-700 mt-0.5 truncate">
                        {issue.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      {/* Status badge */}
                      <span
                        className={`font-plex text-[9px] px-1.5 py-0.5
                                        rounded border uppercase tracking-wider
                                        ${
                                          issue.status === "open"
                                            ? "text-[#FF6B4A] border-[#FF6B4A]/20 bg-[#FF6B4A]/[0.08]"
                                            : "text-[#00FFA3] border-[#00FFA3]/20 bg-[#00FFA3]/[0.08]"
                                        }`}
                      >
                        {issue.status}
                      </span>
                      {/* Similarity score */}
                      <span className="font-plex text-[10px] text-gray-600">
                        {issue.similarity}%
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Footer note — don't block submission */}
              <p className="font-plex text-[10px] text-gray-700 mt-3 leading-relaxed">
                you can still submit if this is a different problem
              </p>
            </div>
          )}

          {/* All clear badge */}
          {showClearBadge && (
            <div
              className="fade-in flex items-center gap-2 px-3.5 py-2.5 rounded-lg
                            border border-[#00FFA3]/15 bg-[#00FFA3]/[0.03]"
            >
              <svg
                className="w-3 h-3 text-[#00FFA3]/60 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-plex text-[10px] text-[#00FFA3]/60">
                no similar issues found
              </span>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <button
              onClick={onCancel}
              className="font-plex text-[11px] text-gray-600 hover:text-gray-300
                         transition-colors duration-200"
            >
              ← Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="relative flex items-center gap-2 px-5 py-2 rounded-lg
                         font-plex text-[11px] tracking-widest uppercase overflow-hidden
                         border border-[#FF6B4A]/25 bg-[#FF6B4A]/[0.08] text-[#FF6B4A]
                         hover:bg-[#FF6B4A]/[0.15] hover:border-[#FF6B4A]/40
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Submit Issue"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateIssue;
