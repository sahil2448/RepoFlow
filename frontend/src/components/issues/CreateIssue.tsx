import React, { useState } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateIssueProps {
  repoId: string;
  onCreated: () => void;
  onCancel:  () => void;
}

interface FormErrors {
  title?:       string;
  description?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreateIssue: React.FC<CreateIssueProps> = ({ repoId, onCreated, onCancel }) => {
  const [title, setTitle]           = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading]       = useState<boolean>(false);
  const [errors, setErrors]         = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!title.trim())       e.title       = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    const userId = localStorage.getItem("userId");
    setLoading(true);
    try {
      await axios.post(`http://localhost:3000/issue/create/${repoId}`, {
        title:       title.trim(),
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
      `}</style>

      <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
        {/* Top shimmer */}
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl
                        bg-gradient-to-r from-transparent via-[#FF6B4A]/20 to-transparent" />

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

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
              Title <span className="text-[#FF6B4A]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="Short, descriptive title…"
              className={`issue-input w-full px-3.5 py-2.5 rounded-lg font-dm text-sm
                         bg-white/[0.03] border border-white/[0.07]
                         text-gray-200 placeholder-gray-700 transition-all duration-200
                         ${errors.title ? "error" : ""}`}
            />
            {errors.title && (
              <p className="font-plex text-[10px] text-[#FF6B4A]">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
                Description <span className="text-[#FF6B4A]">*</span>
              </label>
              <span className={`font-plex text-[10px] transition-colors
                                ${description.length > 500 ? "text-[#FF6B4A]" : "text-gray-700"}`}>
                {description.length} / 500
              </span>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((p) => ({ ...p, description: undefined }));
              }}
              placeholder="Steps to reproduce, expected vs actual behavior…"
              className={`issue-input w-full px-3.5 py-2.5 rounded-lg font-dm text-sm
                         bg-white/[0.03] border border-white/[0.07] resize-none
                         text-gray-200 placeholder-gray-700 transition-all duration-200
                         leading-relaxed
                         ${errors.description ? "error" : ""}`}
            />
            {errors.description && (
              <p className="font-plex text-[10px] text-[#FF6B4A]">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
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
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </>
              ) : "Submit Issue"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateIssue;