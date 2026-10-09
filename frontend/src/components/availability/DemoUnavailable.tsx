import React from "react";
import type { DemoUnavailableProps } from "./demoContent";

const VIDEO_URL = "https://drive.google.com/file/d/1kclURA520SmDoM05o3Skc294tdsIHdTn/view";

const DemoUnavailable: React.FC<DemoUnavailableProps> = ({ onRetry, retrying }) => {
  return (
    <div className="dot-grid min-h-screen" style={{ color: "var(--text-primary)" }}>
      <a href="#demo-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
        Skip to content
      </a>
      <main id="demo-main" className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-5 py-12">
        <section aria-labelledby="demo-heading" className="w-full rounded-2xl p-6 text-center sm:p-10" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
          <p className="mb-4 inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ border: "1px solid var(--border-card)", color: "var(--text-secondary)" }}>
            RepoFlow
          </p>
          <h1 id="demo-heading" className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl" style={{ fontFamily: "'Syne', sans-serif" }}>
            If you are a recruiter or hiring team, please read
          </h1>
          <ul className="mx-auto mt-6 max-w-xl space-y-3 text-left text-sm leading-relaxed sm:text-base" style={{ color: "var(--text-secondary)" }}>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-mint)" }} />
              <span>I have deployed both the backend and frontend on the cloud (AWS). My AWS free credits have been exhausted, and I am receiving invoices from AWS for payment. So I have paused the backend services for now.</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-mint)" }} />
              <span>If you need to know what the application is about, please see the demo video I have attached in my resume (hyperlink &ndash; video).</span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-mint)" }} />
              <span>Still, if you want to check the live application end to end yourself, please contact me via my email or phone number. I will start the backend services for you.</span>
            </li>
          </ul>
          <div className="mt-7">
            <a href={VIDEO_URL} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-auto" style={{ background: "var(--accent-mint)", color: "#04140C", outlineColor: "var(--accent-mint)", minHeight: 48 }}>
              Demo Video
            </a>
          </div>
          <address className="mx-auto mt-7 max-w-xl rounded-xl p-4 text-left text-sm leading-relaxed not-italic sm:text-base" style={{ border: "1px solid var(--border-card)", color: "var(--text-secondary)" }}>
            <p>Phone No: <a href="tel:+919309282448" className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: "var(--accent-mint)" }}>+91 9309282448</a></p>
            <p className="mt-1.5">Email: <a href="mailto:sahil.kamble.work@gmail.com" className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: "var(--accent-mint)" }}>sahil.kamble.work@gmail.com</a></p>
            <p className="mt-1.5">Alternate Email: <a href="mailto:syk2448@gmail.com" className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: "var(--accent-mint)" }}>syk2448@gmail.com</a></p>
          </address>
          <div className="mt-6">
            <button type="button" onClick={onRetry} disabled={retrying} aria-live="polite" aria-busy={retrying} className="text-sm underline underline-offset-4 transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-70" style={{ color: "var(--text-muted)", outlineColor: "var(--accent-mint)" }}>
              {retrying ? "Checking backend…" : "Try Live Demo Again"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DemoUnavailable;
