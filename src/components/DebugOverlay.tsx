import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { storage } from '../utils/storage';

const DebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const updateInfo = () => {
      setInfo({
        uid: auth.currentUser?.uid || 'null',
        email: auth.currentUser?.email || 'null',
        displayName: auth.currentUser?.displayName || 'null',
        storageUser: storage.get('girify_username', 'null'),
        redirectPending: sessionStorage.getItem('girify_redirect_pending') || 'null',
        processing: sessionStorage.getItem('girify_processing_redirect') || 'null',
        ua: navigator.userAgent,
      });

      try {
        const storedLogs = JSON.parse(localStorage.getItem('girify_debug_logs') || '[]');
        setLogs(storedLogs.slice(-20).reverse());
      } catch {
        // ignore
      }
    };

    const interval = setInterval(updateInfo, 500);
    updateInfo();

    return () => clearInterval(interval);
  }, []);

  const clearLogs = () => {
    localStorage.setItem('girify_debug_logs', '[]');
    setLogs([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg text-xs font-mono opacity-50 hover:opacity-100"
      >
        BUG
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 text-green-400 font-mono text-[10px] p-4 overflow-auto pointer-events-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-sm">Auth/Leaderboard Debugger</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="bg-red-900 text-white px-3 py-1 rounded"
        >
          CLOSE
        </button>
      </div>

      <div className="space-y-2 mb-4 border-b border-gray-700 pb-4">
        <div>
          <span className="text-white">UID:</span> {info.uid}
        </div>
        <div>
          <span className="text-white">User:</span> {info.storageUser}
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <span className="text-white font-bold">Logs (LS)</span>
          <button
            onClick={clearLogs}
            className="text-xs text-red-400 border border-red-900 px-2 rounded"
          >
            Clear
          </button>
        </div>
        <div className="text-[9px] font-mono opacity-90 h-64 overflow-y-auto flex flex-col-reverse bg-black p-2 rounded border border-gray-800">
          {logs.map((l, i) => (
            <div key={i} className="border-b border-gray-800 pb-1 mb-1 break-all">
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugOverlay;
