import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { storage } from '../utils/storage';

const DebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [info, setInfo] = useState<any>({});

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
    };

    const interval = setInterval(updateInfo, 1000);
    updateInfo();

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-red-600 text-white p-2 rounded-full shadow-lg text-xs font-mono opacity-50 hover:opacity-100"
      >
        BUG
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 text-green-400 font-mono text-[10px] p-4 overflow-auto pointer-events-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-sm">Auth Debugger</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="bg-red-900 text-white px-3 py-1 rounded"
        >
          CLOSE
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-white">UID:</span> {info.uid}
        </div>
        <div>
          <span className="text-white">Email:</span> {info.email}
        </div>
        <div>
          <span className="text-white">Display:</span> {info.displayName}
        </div>
        <div>
          <span className="text-white">Storage User:</span> {info.storageUser}
        </div>
        <hr className="border-gray-700" />
        <div>
          <span className="text-white">Redirect Pending:</span> {info.redirectPending}
        </div>
        <div>
          <span className="text-white">Processing:</span> {info.processing}
        </div>
        <div className="mt-4 break-all text-gray-500">{info.ua}</div>
      </div>
    </div>
  );
};

export default DebugOverlay;
