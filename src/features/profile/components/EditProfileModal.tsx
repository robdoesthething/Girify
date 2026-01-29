import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { ShopItem } from '../../../utils/shop';
import { themeClasses } from '../../../utils/themeUtils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, avatarId: string, frameId: string) => void;
  currentName: string;
  currentAvatarId: string;
  currentFrameId: string;
  ownedAvatars: ShopItem[];
  ownedFrames: ShopItem[];
  allAvatars: ShopItem[]; // Needed to show images for owned items
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentAvatarId,
  currentFrameId,
  ownedAvatars,
  ownedFrames,
  allAvatars,
}) => {
  const { theme, t } = useTheme();
  const [name, setName] = useState(currentName);
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);
  const [selectedFrameId, setSelectedFrameId] = useState(currentFrameId);

  const handleSave = () => {
    onSave(name, selectedAvatarId, selectedFrameId);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  // Helper to find avatar image
  const getAvatarImage = (id: string) => {
    return allAvatars.find(a => a.id === id)?.image;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${themeClasses(theme, 'bg-slate-900 text-white', 'bg-white text-slate-900')}`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-black">{t('editProfile') || 'Edit Profile'}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-bold mb-2 opacity-70">
                {t('displayName') || 'Display Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl outline-none border-2 focus:border-sky-500 transition-colors ${themeClasses(theme, 'bg-slate-800 border-slate-700', 'bg-slate-50 border-slate-200')}`}
                placeholder="Enter your name"
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-bold mb-2 opacity-70">
                {t('avatar') || 'Avatar'}
              </label>
              <div className="grid grid-cols-4 gap-4">
                {ownedAvatars.map(avatar => {
                  const isSelected = selectedAvatarId === avatar.id;
                  const img = getAvatarImage(avatar.id);
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatarId(avatar.id)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-500/30 ring-offset-2 dark:ring-offset-slate-900'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {img ? (
                        <img
                          src={img as string}
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <span className="text-2xl">{avatar.emoji}</span> // Fallback
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-sky-500 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame Selection */}
            <div>
              <label className="block text-sm font-bold mb-2 opacity-70">
                {t('frame') || 'Frame'}
              </label>
              <div className="grid grid-cols-4 gap-4">
                {ownedFrames.map(frame => {
                  const isSelected = selectedFrameId === frame.id;
                  return (
                    <button
                      key={frame.id}
                      onClick={() => setSelectedFrameId(frame.id)}
                      className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all relative ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-500/30 ring-offset-2 dark:ring-offset-slate-900'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full ${frame.cssClass || ''} bg-slate-400/20`}
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-3 h-3 bg-sky-500 rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('saveChanges') || 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
