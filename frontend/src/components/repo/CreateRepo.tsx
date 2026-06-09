import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";

type ApiErrorResponse = {
  response?: {
    status?: number;
  };
};



interface CreateRepoForm {
  name: string;
  description: string;
  visibility: boolean; 
}

interface FormErrors {
  name?: string;
  description?: string;
}



const LockIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FolderPlusIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);



const CreateRepo: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateRepoForm>({
    name:        "",
    description: "",
    visibility:  true, 
  });

  const [errors, setErrors]   = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Repository name is required.";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(form.name)) {
      newErrors.name = "Only letters, numbers, hyphens, dots, and underscores.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      await api.post("/repo/create", {
        name:        form.name.trim(),
        description: form.description.trim(),
        visibility:  form.visibility,
        owner:       userId,
      });

      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (err: unknown) {
      const apiError = err as ApiErrorResponse;
      if (apiError.response?.status === 409) {
        setErrors({ name: "A repository with this name already exists." });
      } else {
        setErrors({ name: "Something went wrong. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    
    const value = e.target.value.replace(/\s+/g, "-");
    setForm((prev) => ({ ...prev, name: value }));
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  

  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }

        .glow-teal {
          background: radial-gradient(ellipse, rgba(0,255,163,0.055) 0%, transparent 70%);
        }

        .auth-input:focus {
          outline: none;
          border-color: rgba(0,255,163,0.35);
          box-shadow: 0 0 0 3px rgba(0,255,163,0.06);
        }
        .auth-input.error {
          border-color: rgba(255,107,74,0.45);
        }
        .auth-input.error:focus {
          border-color: rgba(255,107,74,0.55);
          box-shadow: 0 0 0 3px rgba(255,107,74,0.07);
        }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.35s ease both; }

        @keyframes shimmer-sweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        .btn-shimmer:hover .shimmer-inner {
          animation: shimmer-sweep 0.7s ease;
        }
      `}</style>

      
      <div className="glow-teal pointer-events-none fixed -top-24 left-1/2
                      -translate-x-1/2 w-[700px] h-[400px] z-0" />

      <div className="font-dm relative z-10 min-h-[calc(100vh-56px)] text-white
                      flex flex-col items-center justify-center px-4 py-14">

        
        <div className="fade-up w-full max-w-[560px] mb-7" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03]
                            flex items-center justify-center">
              <FolderPlusIcon />
            </div>
            <h1 className="font-syne text-2xl font-bold text-white tracking-tight">
              Create a repository
            </h1>
          </div>
          <p className="font-plex text-[11px] text-gray-600 pl-11">
            a repository contains all your project files and history
          </p>
        </div>

        
        <div
          className="fade-up relative w-full max-w-[560px] rounded-2xl
                     border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm p-7"
          style={{ animationDelay: "60ms" }}
        >
          
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl
                          bg-gradient-to-r from-transparent via-[#00FFA3]/20 to-transparent" />

          <div className="flex flex-col gap-6">

            
            <div className="flex flex-col gap-1.5">
              <label className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
                Repository name <span className="text-[#FF6B4A]">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={handleNameChange}
                placeholder="my-awesome-project"
                className={`auth-input w-full px-3.5 py-2.5 rounded-lg
                           bg-white/[0.03] border border-white/[0.07]
                           text-sm text-gray-200 placeholder-gray-700
                           transition-all duration-200 font-plex
                           ${errors.name ? "error" : ""}`}
              />
              
              {errors.name && (
                <p className="font-plex text-[10px] text-[#FF6B4A] mt-0.5">
                  {errors.name}
                </p>
              )}
              
              {form.name && !errors.name && (
                <p className="font-plex text-[10px] text-gray-700 mt-0.5">
                  will be created as{" "}
                  <span className="text-[#00FFA3]/60">{form.name}</span>
                </p>
              )}
            </div>

            
            <div className="border-t border-white/[0.04]" />

            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
                  Description
                </label>
                <span className="font-plex text-[10px] text-gray-700">optional</span>
              </div>
              <textarea
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="A short description of your project…"
                rows={3}
                className="auth-input w-full px-3.5 py-2.5 rounded-lg resize-none
                           bg-white/[0.03] border border-white/[0.07]
                           text-sm text-gray-200 placeholder-gray-700
                           transition-all duration-200 font-dm leading-relaxed"
              />
              
              <p className={`font-plex text-[10px] text-right transition-colors ${
                form.description.length > 200 ? "text-[#FF6B4A]" : "text-gray-700"
              }`}>
                {form.description.length} / 200
              </p>
            </div>

            
            <div className="border-t border-white/[0.04]" />

            
            <div className="flex flex-col gap-3">
              <label className="font-plex text-[11px] text-gray-500 uppercase tracking-widest">
                Visibility
              </label>

              <div className="flex flex-col gap-2">
                
                <button
                  onClick={() => setForm((prev) => ({ ...prev, visibility: true }))}
                  className={`flex items-center gap-4 p-4 rounded-xl border
                              transition-all duration-200 text-left
                              ${form.visibility
                                ? "border-[#00FFA3]/25 bg-[#00FFA3]/[0.05]"
                                : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                              }`}
                >
                  
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                                    transition-all duration-200
                                    ${form.visibility
                                      ? "border-[#00FFA3] bg-[#00FFA3]/10"
                                      : "border-white/[0.15]"
                                    }`}>
                    {form.visibility && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3]" />
                    )}
                  </span>

                  <div className={`flex items-center gap-2.5 transition-colors ${
                    form.visibility ? "text-white" : "text-gray-500"
                  }`}>
                    <GlobeIcon />
                    <div>
                      <p className="font-plex text-[12px] font-medium leading-none mb-1">
                        Public
                      </p>
                      <p className="font-dm text-[11px] text-gray-600 leading-snug">
                        Anyone can see this repository
                      </p>
                    </div>
                  </div>
                </button>

                
                <button
                  onClick={() => setForm((prev) => ({ ...prev, visibility: false }))}
                  className={`flex items-center gap-4 p-4 rounded-xl border
                              transition-all duration-200 text-left
                              ${!form.visibility
                                ? "border-[#A78BFA]/25 bg-[#A78BFA]/[0.05]"
                                : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                              }`}
                >
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0
                                    transition-all duration-200
                                    ${!form.visibility
                                      ? "border-[#A78BFA] bg-[#A78BFA]/10"
                                      : "border-white/[0.15]"
                                    }`}>
                    {!form.visibility && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                    )}
                  </span>

                  <div className={`flex items-center gap-2.5 transition-colors ${
                    !form.visibility ? "text-white" : "text-gray-500"
                  }`}>
                    <LockIcon />
                    <div>
                      <p className="font-plex text-[12px] font-medium leading-none mb-1">
                        Private
                      </p>
                      <p className="font-dm text-[11px] text-gray-600 leading-snug">
                        Only you can see this repository
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            
            <div className="border-t border-white/[0.04]" />

            
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => navigate("/")}
                className="font-plex text-[11px] text-gray-600 hover:text-gray-300
                           transition-colors duration-200"
              >
                ← Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || success}
                className="btn-shimmer relative flex items-center gap-2 px-6 py-2.5
                           rounded-lg font-plex text-[12px] tracking-widest uppercase overflow-hidden
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                           border
                           ${success
                             ? 'bg-[#00FFA3]/10 border-[#00FFA3]/30 text-[#00FFA3]'
                             : 'bg-[#00FFA3]/10 border-[#00FFA3]/25 text-[#00FFA3] hover:bg-[#00FFA3]/[0.16] hover:border-[#00FFA3]/40'
                           }"
              >
                
                <span className="shimmer-inner absolute inset-0
                                 bg-gradient-to-r from-transparent via-[#00FFA3]/10 to-transparent
                                 -translate-x-full" />

                <span className="relative flex items-center gap-2">
                  {success ? (
                    <>
                      <CheckIcon />
                      Created!
                    </>
                  ) : loading ? (
                    <>
                      
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating…
                    </>
                  ) : (
                    <>
                      <FolderPlusIcon />
                      Create Repository
                    </>
                  )}
                </span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default CreateRepo;
