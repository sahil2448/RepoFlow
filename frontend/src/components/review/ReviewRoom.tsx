

// import React, { useEffect, useRef, useState } from "react";
// import { useParams, useSearchParams, useNavigate } from "react-router-dom";
// import socket from "../../config/socket";
// import api    from "../../config/api";
// import { ICE_SERVERS } from "../../config/webrtc";

// type CallStatus = "idle" | "waiting" | "connecting" | "connected" | "ended";

// interface CodeFile {
//   name:    string;
//   content: string;
// }

// // ── Icons (unchanged from before) ──
// const MicIcon: React.FC<{ on: boolean }> = ({ on }) => (
//   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     {on ? (
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//         d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
//     ) : (
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//         d="M3 3l18 18M9 9v3a3 3 0 005.12 2.12M15 7.5V4.5a3 3 0 10-5.83-1.07M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5" />
//     )}
//   </svg>
// );
// const CamIcon: React.FC<{ on: boolean }> = ({ on }) => (
//   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     {on ? (
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//         d="M15.75 10.5l4.72-2.36A1 1 0 0121.75 9v6a1 1 0 01-1.53.85L15.75 13.5M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z" />
//     ) : (
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//         d="M3 3l18 18M15.75 10.5l4.72-2.36A1 1 0 0121.75 9v6a1 1 0 01-.34.75M4.5 6.75h6.69M3 8.25v7.5a1.5 1.5 0 001.5 1.5h7.5" />
//     )}
//   </svg>
// );
// const LeaveIcon: React.FC = () => (
//   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//       d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//   </svg>
// );
// const FileIcon: React.FC = () => (
//   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//       d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//   </svg>
// );

// const ReviewRoom: React.FC = () => {
//   const { roomId } = useParams<{ roomId: string }>();
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();

//   const repoId    = searchParams.get("repoId")    || "";
//   const commitId  = searchParams.get("commitId")  || "";
//   const commitMsg = searchParams.get("commitMsg") || "";

//   const localVideoRef  = useRef<HTMLVideoElement>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement>(null);
//   const pcRef           = useRef<RTCPeerConnection | null>(null);
//   const localStreamRef  = useRef<MediaStream | null>(null);
//   const remotePeerIdRef = useRef<string | null>(null);

//   const [status, setStatus]   = useState<CallStatus>("idle");
//   const [micOn, setMicOn]     = useState<boolean>(true);
//   const [camOn, setCamOn]     = useState<boolean>(true);
//   const [copied, setCopied]   = useState<boolean>(false);

//   const [guestName, setGuestName]     = useState<string>("");
//   const [nameEntered, setNameEntered] = useState<boolean>(false);

//   // ── Code panel state ──
//   const [files, setFiles]             = useState<CodeFile[]>([]);
//   const [activeFile, setActiveFile]   = useState<number>(0);
//   const [filesLoading, setFilesLoading] = useState<boolean>(true);
//   const [filesError, setFilesError]   = useState<string>("");

//   const storedUserId   = localStorage.getItem("userId");
//   const storedUsername = localStorage.getItem("username");
//   const effectiveUserId = storedUserId || `guest-${roomId?.slice(0, 6)}`;
//   const effectiveName    = storedUsername || guestName;

//   const roomLink = `${window.location.origin}/review/${roomId}?repoId=${repoId}&commitId=${commitId}&commitMsg=${encodeURIComponent(commitMsg)}`;

//   useEffect(() => {
//     if (storedUserId) setNameEntered(true);
//   }, [storedUserId]);

//   // ── Fetch commit's code for the review panel ──
// useEffect(() => {
//   if (!repoId || !commitId) {
//     setFilesLoading(false);
//     setFilesError(`missing reference — repoId: ${repoId || "none"}, commitId: ${commitId || "none"}`);
//     return;
//   }
//   const fetchCode = async (): Promise<void> => {
//     try {
//       const res = await api.post(`/repo/${repoId}/revert/${commitId}`);
//         const fileUrls: { file: string; url: string; source: string }[] = res.data.fileUrls || [];

//         const decoded: CodeFile[] = await Promise.all(
//           fileUrls.map(async ({ file, url, source }) => {
//             if (source === "mongodb") {
//               // data URL — decode base64 directly, no network call needed
//               const base64 = url.split(",")[1];
//               const content = atob(base64);
//               return { name: file, content };
//             } else {
//               // s3 — fetch the signed URL and read as text
//               const r = await fetch(url);
//               const content = await r.text();
//               return { name: file, content };
//             }
//           })
//         );

//         setFiles(decoded);
//     }catch (err: any) {
//   // ✅ TEMPORARY — log everything raw
//   console.error("FULL ERROR OBJECT:", err);
//   console.error("STATUS:", err?.response?.status);
//   console.error("DATA:", err?.response?.data);
//   console.error("MESSAGE:", err?.message);

//   setFilesError(
//     `[${err?.response?.status || "no status"}] ${err?.response?.data?.error || err?.message || "unknown"}`
//   );
// } finally {
//       setFilesLoading(false);
//     }
//   };
//   fetchCode();
// }, [repoId, commitId]);

//   // ── WebRTC setup (unchanged logic from before) ──
//   const createPeerConnection = (): RTCPeerConnection => {
//     const pc = new RTCPeerConnection(ICE_SERVERS);
//     pcRef.current = pc;

//     localStreamRef.current?.getTracks().forEach((track) => {
//       pc.addTrack(track, localStreamRef.current!);
//     });

//     pc.onicecandidate = (e) => {
//       if (e.candidate && remotePeerIdRef.current) {
//         socket.emit("review:signal", { to: remotePeerIdRef.current, signal: e.candidate });
//       }
//     };

//     pc.ontrack = (e) => {
//       if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
//       setStatus("connected");
//     };

//     pc.onconnectionstatechange = () => {
//       if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
//         setStatus("ended");
//       }
//     };

//     return pc;
//   };

//   const createOfferAndSend = async () => {
//     const pc = createPeerConnection();
//     const offer = await pc.createOffer();
//     await pc.setLocalDescription(offer);
//     socket.emit("review:signal", { to: remotePeerIdRef.current, signal: pc.localDescription });
//   };

//   useEffect(() => {
//     if (!roomId || !nameEntered) return;
//     let mounted = true;

//     const init = async (): Promise<void> => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//         if (!mounted) return;
//         localStreamRef.current = stream;
//         if (localVideoRef.current) localVideoRef.current.srcObject = stream;

//         setStatus("waiting");
//         socket.connect();
//         socket.emit("review:join", { roomId, userId: effectiveUserId, username: effectiveName || "Guest" });
//       } catch (err) {
//         console.error("Camera/mic access denied:", err);
//       }
//     };
//     init();

//     const onJoined = ({ peers }: { peers: string[] }) => {
//       if (peers.length > 0) {
//         remotePeerIdRef.current = peers[0];
//         setStatus("connecting");
//         createPeerConnection();
//       }
//     };

//     const onPeerJoined = ({ socketId }: { socketId: string }) => {
//       remotePeerIdRef.current = socketId;
//       setStatus("connecting");
//       createOfferAndSend();
//     };

//     const onSignal = async ({ from, signal }: { from: string; signal: any }) => {
//       remotePeerIdRef.current = from;
//       const pc = pcRef.current || createPeerConnection();

//       if (signal.type === "offer") {
//         await pc.setRemoteDescription(new RTCSessionDescription(signal));
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         socket.emit("review:signal", { to: from, signal: pc.localDescription });
//       } else if (signal.type === "answer") {
//         await pc.setRemoteDescription(new RTCSessionDescription(signal));
//       } else if (signal.candidate) {
//         try { await pc.addIceCandidate(new RTCIceCandidate(signal)); } catch {}
//       }
//     };

//     const onPeerLeft = () => {
//       setStatus("ended");
//       pcRef.current?.close();
//       pcRef.current = null;
//       if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
//     };

//     const onRoomFull = () => {
//       alert("This review room already has 2 participants.");
//       navigate(-1);
//     };

//     socket.off("review:joined").on("review:joined", onJoined);
//     socket.off("review:peer-joined").on("review:peer-joined", onPeerJoined);
//     socket.off("review:signal-received").on("review:signal-received", onSignal);
//     socket.off("review:peer-left").on("review:peer-left", onPeerLeft);
//     socket.off("review:room-full").on("review:room-full", onRoomFull);

//     return () => {
//       mounted = false;
//       socket.emit("review:leave");
//       socket.off("review:joined", onJoined);
//       socket.off("review:peer-joined", onPeerJoined);
//       socket.off("review:signal-received", onSignal);
//       socket.off("review:peer-left", onPeerLeft);
//       socket.off("review:room-full", onRoomFull);
//       localStreamRef.current?.getTracks().forEach((t) => t.stop());
//       pcRef.current?.close();
//     };
//   }, [roomId, nameEntered]);

//   const toggleMic = (): void => {
//     const track = localStreamRef.current?.getAudioTracks()[0];
//     if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
//   };
//   const toggleCam = (): void => {
//     const track = localStreamRef.current?.getVideoTracks()[0];
//     if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
//   };

//   const handleCopyLink = (): void => {
//     navigator.clipboard.writeText(roomLink);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleEndCall = (): void => {
//     socket.emit("review:leave");
//     pcRef.current?.close();
//     localStreamRef.current?.getTracks().forEach((t) => t.stop());
//     navigate(-1);
//   };

//   // ── Guest name gate ──
//   if (!nameEntered) {
//     return (
//       <div className="dot-grid font-dm min-h-screen text-white flex flex-col items-center justify-center px-4">
//         <style>{`
//           .font-syne { font-family: 'Syne', sans-serif; }
//           .font-plex { font-family: 'IBM Plex Mono', monospace; }
//           .dot-grid { background-color: #060611; background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 28px 28px; }
//         `}</style>
//         <div className="w-full max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
//           <h2 className="font-syne text-lg font-bold text-white mb-1">Join Review Call</h2>
//           <p className="font-plex text-[11px] text-gray-600 mb-5">enter your name to join — no account needed</p>
//           <input
//             autoFocus
//             value={guestName}
//             onChange={(e) => setGuestName(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && guestName.trim() && setNameEntered(true)}
//             placeholder="Your name"
//             className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07] font-dm text-sm text-gray-200 placeholder-gray-700 outline-none focus:border-[#00FFA3]/35 mb-4"
//           />
//           <button
//             onClick={() => guestName.trim() && setNameEntered(true)}
//             disabled={!guestName.trim()}
//             className="w-full py-2.5 rounded-lg font-plex text-[11px] tracking-widest uppercase bg-[#00FFA3]/10 border border-[#00FFA3]/25 text-[#00FFA3] hover:bg-[#00FFA3]/[0.16] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
//           >
//             Join Call
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style>{`
//         .font-syne { font-family: 'Syne', sans-serif; }
//         .font-plex { font-family: 'IBM Plex Mono', monospace; }
//         .font-dm   { font-family: 'DM Sans', sans-serif; }
//         .dot-grid { background-color: #060611; background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 28px 28px; }
//         @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
//         .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
//       `}</style>

//       <div className="dot-grid font-dm min-h-screen text-white flex flex-col">

//         {/* ── Header ── */}
//         <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] shrink-0">
//           <div>
//             <h1 className="font-syne text-base font-bold text-white">Code Review Call</h1>
//             <p className="font-plex text-[10px] text-gray-600 mt-0.5">{commitMsg}</p>
//           </div>

//           <div className="flex items-center gap-4">
//             {status === "waiting" && (
//               <div className="flex items-center gap-2">
//                 <input readOnly value={roomLink}
//                   className="w-64 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.07]
//                              font-plex text-[10px] text-gray-500" />
//                 <button onClick={handleCopyLink}
//                   className="px-2.5 py-1.5 rounded-md border border-[#00FFA3]/25 bg-[#00FFA3]/[0.08]
//                              text-[#00FFA3] font-plex text-[10px] hover:bg-[#00FFA3]/[0.14]">
//                   {copied ? "copied!" : "copy"}
//                 </button>
//               </div>
//             )}
//             <div className="flex items-center gap-2">
//               <span className={`w-2 h-2 rounded-full ${
//                 status === "connected" ? "bg-[#00FFA3]" :
//                 status === "ended"     ? "bg-[#FF6B4A]" : "bg-[#A78BFA] pulse-dot"
//               }`} />
//               <span className="font-plex text-[10px] text-gray-500 uppercase tracking-widest">
//                 {status === "waiting" && "waiting"}
//                 {status === "connecting" && "connecting"}
//                 {status === "connected" && "connected"}
//                 {status === "ended" && "ended"}
//                 {status === "idle" && "starting"}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* ── Main split: code | video ── */}
//         <div className="flex-1 flex overflow-hidden">

//           {/* ── Code panel ── */}
//           <div className="flex-1 flex flex-col border-r border-white/[0.06] min-w-0">

//             {/* File tabs */}
//             {files.length > 1 && (
//               <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.05] overflow-x-auto shrink-0">
//                 {files.map((f, i) => (
//                   <button
//                     key={f.name}
//                     onClick={() => setActiveFile(i)}
//                     className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-plex text-[10px]
//                                 transition-colors whitespace-nowrap
//                                 ${i === activeFile
//                                   ? "bg-white/[0.06] text-white"
//                                   : "text-gray-600 hover:text-gray-300"
//                                 }`}
//                   >
//                     <FileIcon /> {f.name}
//                   </button>
//                 ))}
//               </div>
//             )}

//             {/* Code content */}
//             <div className="flex-1 overflow-auto">
//               {filesLoading ? (
//                 <div className="p-4 space-y-2">
//                   {[1,2,3].map((i) => <div key={i} className="h-4 rounded bg-white/[0.03] animate-pulse" />)}
//                 </div>
//               ) : filesError ? (
//                 <div className="p-6 text-center">
//                   <p className="font-plex text-[11px] text-[#FF6B4A]/70">{filesError}</p>
//                 </div>
//               ) : files.length === 0 ? (
//                 <div className="p-6 text-center">
//                   <p className="font-plex text-[11px] text-gray-700">no files in this commit</p>
//                 </div>
//               ) : (
//                 <div className="divide-y divide-white/[0.03]">
//                   {files[activeFile]?.content.split("\n").map((line, i) => (
//                     <div key={i} className="flex hover:bg-[#00FFA3]/[0.03]">
//                       <span className="shrink-0 w-10 py-1 text-center font-plex text-[10px]
//                                        text-gray-800 select-none border-r border-white/[0.04]">
//                         {i + 1}
//                       </span>
//                       <span className="flex-1 px-3 py-1 font-plex text-[11px] text-gray-300
//                                        leading-relaxed break-all whitespace-pre">
//                         {line || " "}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* ── Video sidebar ── */}
//           <div className="w-72 flex flex-col shrink-0">
//             <div className="flex-1 p-3 space-y-3 overflow-y-auto">

//               {/* Remote (peer) */}
//               <div className="relative aspect-video rounded-xl border border-white/[0.07]
//                               bg-white/[0.02] overflow-hidden">
//                 <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
//                 {status !== "connected" && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <p className="font-plex text-[10px] text-gray-700 text-center px-2">
//                       {status === "ended" ? "peer left" : "waiting for peer…"}
//                     </p>
//                   </div>
//                 )}
//                 <span className="absolute bottom-1.5 left-1.5 font-plex text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-gray-400">
//                   peer
//                 </span>
//               </div>

//               {/* Local (you) */}
//               <div className="relative aspect-video rounded-xl border border-white/[0.07]
//                               bg-white/[0.02] overflow-hidden">
//                 <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
//                 <span className="absolute bottom-1.5 left-1.5 font-plex text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-gray-400">
//                   you
//                 </span>
//               </div>
//             </div>

//             {/* Controls */}
//             <div className="flex items-center justify-center gap-2.5 py-4 border-t border-white/[0.06] shrink-0">
//               <button onClick={toggleMic}
//                 className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all
//                            ${micOn ? "border-white/[0.08] bg-white/[0.03] text-gray-300" : "border-[#FF6B4A]/30 bg-[#FF6B4A]/[0.12] text-[#FF6B4A]"}`}>
//                 <MicIcon on={micOn} />
//               </button>
//               <button onClick={toggleCam}
//                 className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all
//                            ${camOn ? "border-white/[0.08] bg-white/[0.03] text-gray-300" : "border-[#FF6B4A]/30 bg-[#FF6B4A]/[0.12] text-[#FF6B4A]"}`}>
//                 <CamIcon on={camOn} />
//               </button>
//               <button onClick={handleEndCall}
//                 className="w-9 h-9 rounded-full border border-[#FF6B4A]/30 bg-[#FF6B4A]/[0.12] text-[#FF6B4A]
//                            flex items-center justify-center hover:bg-[#FF6B4A]/[0.2] transition-all ml-1">
//                 <LeaveIcon />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ReviewRoom;

import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import socket from "../../config/socket";
import api    from "../../config/api";
import { ICE_SERVERS } from "../../config/webrtc";

type CallStatus = "idle" | "waiting" | "connecting" | "connected" | "ended";
type MobileTab   = "code" | "call";

interface CodeFile {
  name:    string;
  content: string;
}

// ── Icons ──
const MicIcon: React.FC<{ on: boolean }> = ({ on }) => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {on ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 3l18 18M9 9v3a3 3 0 005.12 2.12M15 7.5V4.5a3 3 0 10-5.83-1.07M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5" />
    )}
  </svg>
);
const CamIcon: React.FC<{ on: boolean }> = ({ on }) => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {on ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15.75 10.5l4.72-2.36A1 1 0 0121.75 9v6a1 1 0 01-1.53.85L15.75 13.5M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 3l18 18M15.75 10.5l4.72-2.36A1 1 0 0121.75 9v6a1 1 0 01-.34.75M4.5 6.75h6.69M3 8.25v7.5a1.5 1.5 0 001.5 1.5h7.5" />
    )}
  </svg>
);
const LeaveIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const FileIcon: React.FC = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const CodeTabIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
);
const CallTabIcon: React.FC = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M15.75 10.5l4.72-2.36A1 1 0 0121.75 9v6a1 1 0 01-1.53.85L15.75 13.5M4.5 6.75h9a1.5 1.5 0 011.5 1.5v7.5a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-7.5a1.5 1.5 0 011.5-1.5z" />
  </svg>
);

const ReviewRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const repoId    = searchParams.get("repoId")    || "";
  const commitId  = searchParams.get("commitId")  || "";
  const commitMsg = searchParams.get("commitMsg") || "";

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef           = useRef<RTCPeerConnection | null>(null);
  const localStreamRef  = useRef<MediaStream | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);

  const [status, setStatus]   = useState<CallStatus>("idle");
  const [micOn, setMicOn]     = useState<boolean>(true);
  const [camOn, setCamOn]     = useState<boolean>(true);
  const [copied, setCopied]   = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("code"); // ✅ new

  const [guestName, setGuestName]     = useState<string>("");
  const [nameEntered, setNameEntered] = useState<boolean>(false);

  const [files, setFiles]               = useState<CodeFile[]>([]);
  const [activeFile, setActiveFile]     = useState<number>(0);
  const [filesLoading, setFilesLoading] = useState<boolean>(true);
  const [filesError, setFilesError]     = useState<string>("");

  const storedUserId    = localStorage.getItem("userId");
  const storedUsername  = localStorage.getItem("username");
  const effectiveUserId = storedUserId || `guest-${roomId?.slice(0, 6)}`;
  const effectiveName   = storedUsername || guestName;

  const roomLink = `${window.location.origin}/review/${roomId}?repoId=${repoId}&commitId=${commitId}&commitMsg=${encodeURIComponent(commitMsg)}`;

  useEffect(() => {
    if (storedUserId) setNameEntered(true);
  }, [storedUserId]);

  useEffect(() => {
    if (!repoId || !commitId) {
      setFilesLoading(false);
      setFilesError(`missing reference — repoId: ${repoId || "none"}, commitId: ${commitId || "none"}`);
      return;
    }
    const fetchCode = async (): Promise<void> => {
      try {
        const res = await api.post(`/repo/${repoId}/revert/${commitId}`);
        const fileUrls: { file: string; url: string; source: string }[] = res.data.fileUrls || [];
        const decoded: CodeFile[] = await Promise.all(
          fileUrls.map(async ({ file, url, source }) => {
            if (source === "mongodb") {
              const base64 = url.split(",")[1];
              return { name: file, content: atob(base64) };
            } else {
              const r = await fetch(url);
              return { name: file, content: await r.text() };
            }
          })
        );
        setFiles(decoded);
      } catch (err: any) {
        console.error("Code fetch failed:", err?.response?.status, err?.response?.data, err);
        setFilesError(err?.response?.data?.error || "could not load code for this commit");
      } finally {
        setFilesLoading(false);
      }
    };
    fetchCode();
  }, [repoId, commitId]);

  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });
    pc.onicecandidate = (e) => {
      if (e.candidate && remotePeerIdRef.current) {
        socket.emit("review:signal", { to: remotePeerIdRef.current, signal: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
      setStatus("connected");
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setStatus("ended");
      }
    };
    return pc;
  };

  const createOfferAndSend = async () => {
    const pc = createPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("review:signal", { to: remotePeerIdRef.current, signal: pc.localDescription });
  };

  useEffect(() => {
    if (!roomId || !nameEntered) return;
    let mounted = true;

    const init = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setStatus("waiting");
        socket.connect();
        socket.emit("review:join", { roomId, userId: effectiveUserId, username: effectiveName || "Guest" });
      } catch (err) {
        console.error("Camera/mic access denied:", err);
      }
    };
    init();

    const onJoined = ({ peers }: { peers: string[] }) => {
      if (peers.length > 0) {
        remotePeerIdRef.current = peers[0];
        setStatus("connecting");
        createPeerConnection();
      }
    };
    const onPeerJoined = ({ socketId }: { socketId: string }) => {
      remotePeerIdRef.current = socketId;
      setStatus("connecting");
      createOfferAndSend();
    };
    const onSignal = async ({ from, signal }: { from: string; signal: any }) => {
      remotePeerIdRef.current = from;
      const pc = pcRef.current || createPeerConnection();
      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("review:signal", { to: from, signal: pc.localDescription });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(signal)); } catch {}
      }
    };
    const onPeerLeft = () => {
      setStatus("ended");
      pcRef.current?.close();
      pcRef.current = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };
    const onRoomFull = () => {
      alert("This review room already has 2 participants.");
      navigate(-1);
    };

    socket.off("review:joined").on("review:joined", onJoined);
    socket.off("review:peer-joined").on("review:peer-joined", onPeerJoined);
    socket.off("review:signal-received").on("review:signal-received", onSignal);
    socket.off("review:peer-left").on("review:peer-left", onPeerLeft);
    socket.off("review:room-full").on("review:room-full", onRoomFull);

    return () => {
      mounted = false;
      socket.emit("review:leave");
      socket.off("review:joined", onJoined);
      socket.off("review:peer-joined", onPeerJoined);
      socket.off("review:signal-received", onSignal);
      socket.off("review:peer-left", onPeerLeft);
      socket.off("review:room-full", onRoomFull);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, [roomId, nameEntered]);

  const toggleMic = (): void => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };
  const toggleCam = (): void => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };
  const handleCopyLink = (): void => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleEndCall = (): void => {
    socket.emit("review:leave");
    pcRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate(-1);
  };

  if (!nameEntered) {
    return (
      <div className="dot-grid font-dm min-h-screen text-white flex flex-col items-center justify-center px-4">
        <style>{`
          .font-syne { font-family: 'Syne', sans-serif; }
          .font-plex { font-family: 'IBM Plex Mono', monospace; }
          .dot-grid { background-color: #060611; background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 28px 28px; }
        `}</style>
        <div className="w-full max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
          <h2 className="font-syne text-lg font-bold text-white mb-1">Join Review Call</h2>
          <p className="font-plex text-[11px] text-gray-600 mb-5">enter your name to join — no account needed</p>
          <input
            autoFocus
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && guestName.trim() && setNameEntered(true)}
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07] font-dm text-sm text-gray-200 placeholder-gray-700 outline-none focus:border-[#00FFA3]/35 mb-4"
          />
          <button
            onClick={() => guestName.trim() && setNameEntered(true)}
            disabled={!guestName.trim()}
            className="w-full py-2.5 rounded-lg font-plex text-[11px] tracking-widest uppercase bg-[#00FFA3]/10 border border-[#00FFA3]/25 text-[#00FFA3] hover:bg-[#00FFA3]/[0.16] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
          >
            Join Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
        .dot-grid { background-color: #060611; background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 28px 28px; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .pulse-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        /* Thin custom scrollbar so it doesn't eat horizontal space on mobile */
        .thin-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .thin-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
      `}</style>

      {/* ✅ h-screen + overflow-hidden LOCKS the layout to viewport.
          This is the actual fix — min-h-screen was letting the whole
          page grow and scroll, dragging header/video off-screen with it. */}
      <div className="dot-grid font-dm h-screen overflow-hidden text-white flex flex-col">

        {/* ── Header — always pinned, never scrolls ── */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-white/[0.06] shrink-0">
          <div className="min-w-0">
            <h1 className="font-syne text-sm sm:text-base font-bold text-white truncate">Code Review Call</h1>
            <p className="font-plex text-[10px] text-gray-600 mt-0.5 truncate">{commitMsg}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {status === "waiting" && (
              <button
                onClick={handleCopyLink}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
                           border border-[#00FFA3]/25 bg-[#00FFA3]/[0.08] text-[#00FFA3]
                           font-plex text-[10px] hover:bg-[#00FFA3]/[0.14] transition-colors"
              >
                {copied ? "copied!" : "copy invite link"}
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                status === "connected" ? "bg-[#00FFA3]" :
                status === "ended"     ? "bg-[#FF6B4A]" : "bg-[#A78BFA] pulse-dot"
              }`} />
              <span className="font-plex text-[10px] text-gray-500 uppercase tracking-widest whitespace-nowrap">
                {status === "waiting" && "waiting"}
                {status === "connecting" && "connecting"}
                {status === "connected" && "connected"}
                {status === "ended" && "ended"}
                {status === "idle" && "starting"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Mobile-only invite link (visible while waiting, on small screens) ── */}
        {status === "waiting" && (
          <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-white/[0.05] shrink-0">
            <input readOnly value={roomLink}
              className="flex-1 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.07]
                         font-plex text-[10px] text-gray-500 truncate" />
            <button onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-md border border-[#00FFA3]/25 bg-[#00FFA3]/[0.08]
                         text-[#00FFA3] font-plex text-[10px] shrink-0">
              {copied ? "✓" : "copy"}
            </button>
          </div>
        )}

        {/* ── Mobile tab switcher — only below lg breakpoint ── */}
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-b border-white/[0.05] shrink-0">
          <button
            onClick={() => setMobileTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-plex text-[11px]
                        transition-colors ${mobileTab === "code"
                          ? "bg-white/[0.06] text-white"
                          : "text-gray-600"}`}
          >
            <CodeTabIcon /> Code
          </button>
          <button
            onClick={() => setMobileTab("call")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-plex text-[11px]
                        transition-colors ${mobileTab === "call"
                          ? "bg-white/[0.06] text-white"
                          : "text-gray-600"}`}
          >
            <CallTabIcon /> Call
            {status === "connected" && <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3]" />}
          </button>
        </div>

        {/* ── Main split — locked height, only inner panels scroll ── */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* ── Code panel ── */}
          <div className={`${mobileTab === "code" ? "flex" : "hidden"} lg:flex
                           flex-1 flex-col border-r border-white/[0.06] min-w-0 overflow-hidden`}>

            {files.length > 1 && (
              <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.05]
                              overflow-x-auto thin-scroll shrink-0">
                {files.map((f, i) => (
                  <button
                    key={f.name}
                    onClick={() => setActiveFile(i)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-plex text-[10px]
                                transition-colors whitespace-nowrap shrink-0
                                ${i === activeFile
                                  ? "bg-white/[0.06] text-white"
                                  : "text-gray-600 hover:text-gray-300"
                                }`}
                  >
                    <FileIcon /> {f.name}
                  </button>
                ))}
              </div>
            )}

            {/* ✅ Only THIS scrolls — header/tabs/sidebar/controls stay fixed */}
            <div className="flex-1 overflow-y-auto overflow-x-auto thin-scroll">
              {filesLoading ? (
                <div className="p-4 space-y-2">
                  {[1,2,3].map((i) => <div key={i} className="h-4 rounded bg-white/[0.03] animate-pulse" />)}
                </div>
              ) : filesError ? (
                <div className="p-6 text-center">
                  <p className="font-plex text-[11px] text-[#FF6B4A]/70 break-words">{filesError}</p>
                </div>
              ) : files.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-plex text-[11px] text-gray-700">no files in this commit</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.03] min-w-fit">
                  {files[activeFile]?.content.split("\n").map((line, i) => (
                    <div key={i} className="flex hover:bg-[#00FFA3]/[0.03]">
                      <span className="shrink-0 w-10 py-1 text-center font-plex text-[10px]
                                       text-gray-800 select-none border-r border-white/[0.04] sticky left-0 bg-[#060611]">
                        {i + 1}
                      </span>
                      <span className="flex-1 px-3 py-1 font-plex text-[11px] text-gray-300
                                       leading-relaxed whitespace-pre">
                        {line || " "}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Video sidebar ── */}
          <div className={`${mobileTab === "call" ? "flex" : "hidden"} lg:flex
                           w-full lg:w-64 flex-col overflow-hidden`}>
            <div className="flex-1 overflow-y-auto thin-scroll p-3 flex flex-row lg:flex-col gap-3">

              <div className="relative flex-1 lg:flex-none lg:aspect-video rounded-xl border border-white/[0.07]
                              bg-white/[0.02] overflow-hidden min-h-[140px] lg:min-h-0">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {status !== "connected" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="font-plex text-[10px] text-gray-700 text-center px-2">
                      {status === "ended" ? "peer left" : "waiting for peer…"}
                    </p>
                  </div>
                )}
                <span className="absolute bottom-1.5 left-1.5 font-plex text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-gray-400">
                  peer
                </span>
              </div>

              <div className="relative flex-1 lg:flex-none lg:aspect-video rounded-xl border border-white/[0.07]
                              bg-white/[0.02] overflow-hidden min-h-[140px] lg:min-h-0">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 font-plex text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-gray-400">
                  you
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Controls — permanent bottom bar, ALWAYS visible regardless of scroll/tab ── */}
        <div className="flex items-center justify-center gap-3 py-3 border-t border-white/[0.06] shrink-0 bg-[#060611]">
          <button onClick={toggleMic}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all
                       ${micOn ? "border-white/[0.08] bg-white/[0.03] text-gray-300" : "border-[#FF6B4A]/30 bg-[#FF6B4A]/[0.12] text-[#FF6B4A]"}`}>
            <MicIcon on={micOn} />
          </button>
          <button onClick={toggleCam}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all
                       ${camOn ? "border-white/[0.08] bg-white/[0.03] text-gray-300" : "border-[#FF6B4A]/30 bg-[#FF6B4A]/[0.12] text-[#FF6B4A]"}`}>
            <CamIcon on={camOn} />
          </button>
          <button onClick={handleEndCall}
            className="w-10 h-10 rounded-full border border-[#FF6B4A]/30 bg-[#FF6B4A]/[0.12] text-[#FF6B4A]
                       flex items-center justify-center hover:bg-[#FF6B4A]/[0.2] transition-all ml-2">
            <LeaveIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default ReviewRoom;