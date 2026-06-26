import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { AVATARS } from '../../../data/avatars';
import { getCosmeticAvatarImage, getFrameClass } from '../../../utils/shop/catalog';
import { ShopItem } from '../../../utils/shop';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatarId: string, frameId: string) => void;
  currentAvatarId: string;
  currentFrameId: string;
  ownedAvatars: ShopItem[];
  ownedFrames: ShopItem[];
  allAvatars: ShopItem[];
  legacyAvatarIndex?: number;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAvatarId,
  currentFrameId,
  ownedAvatars,
  ownedFrames,
  allAvatars,
  legacyAvatarIndex = 0,
}) => {
  const { theme, t } = useTheme();
  const navigate = useNavigate();
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);
  const [selectedFrameId, setSelectedFrameId] = useState(currentFrameId);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      setSelectedAvatarId(currentAvatarId);
      setSelectedFrameId(currentFrameId);
    }
  }, [isOpen, currentAvatarId, currentFrameId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = () => {
    onSave(selectedAvatarId, selectedFrameId);
  };

  // Resolve preview image and frame
  const selectedAvatar = allAvatars.find(a => a.id === selectedAvatarId);
  const previewImage =
    (selectedAvatar?.image as string | undefined) || getCosmeticAvatarImage(selectedAvatarId);
  const selectedFrame = ownedFrames.find(f => f.id === selectedFrameId);
  const previewFrameClass = selectedFrame?.cssClass || getFrameClass(selectedFrameId) || '';

  const legacyFallback = AVATARS[Math.max(0, Math.min(legacyAvatarIndex, AVATARS.length - 1))];

  const isDark = theme === 'dark';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('editProfile') || 'Edit Profile'} size="md">
      {/* Scrollable content region */}
      <div className="overflow-y-auto max-h-[60vh] space-y-6 pr-1 -mr-1">
        {/* Live preview */}
        <div className="flex flex-col items-center gap-2 py-2">
          <div
            className={`w-20 h-20 rounded-full overflow-hidden flex items-center justify-center select-none ${previewFrameClass} ${previewImage ? '' : isDark ? 'bg-gradient-to-br from-sky-600 to-blue-800' : 'bg-gradient-to-br from-sky-400 to-blue-500'}`}
          >
            {previewImage ? (
              <img
                src={previewImage}
                alt={selectedAvatar?.name || 'Avatar'}
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <span style={{ fontSize: 38 }}>{legacyFallback}</span>
            )}
          </div>
          <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {selectedAvatar?.name || t('defaultAvatar') || 'Default'}
          </p>
        </div>

        {/* Avatar Selection */}
        <div>
          <p
            className={`text-[11px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
          >
            {t('chooseAvatar') || 'Choose Avatar'}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {ownedAvatars.map(avatar => {
              const isSelected = selectedAvatarId === avatar.id;
              const img =
                (allAvatars.find(a => a.id === avatar.id)?.image as string | undefined) ||
                getCosmeticAvatarImage(avatar.id);
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all active:scale-95 relative ${
                    isSelected
                      ? isDark
                        ? 'border-sky-500 bg-sky-500/10'
                        : 'border-sky-500 bg-sky-50'
                      : isDark
                        ? 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={avatar.name}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-400/10">
                    {img ? (
                      <img
                        src={img}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-2xl">{avatar.emoji}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${isSelected ? 'text-sky-500' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    {avatar.name}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onSave(selectedAvatarId, selectedFrameId);
              navigate('/shop');
            }}
            className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold text-sky-500 border border-sky-500/30 hover:bg-sky-500/10 transition-colors"
          >
            🛍️ {t('getMoreAvatarsInShop') || 'Get more avatars in the Shop →'}
          </button>
        </div>

        {/* Frame Selection — only shown when user owns at least one frame */}
        {ownedFrames.length > 0 && (
          <div>
            <p
              className={`text-[11px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              {t('chooseFrame') || 'Choose Frame'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedFrameId('')}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all active:scale-95 relative ${
                  selectedFrameId === ''
                    ? isDark
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-sky-500 bg-sky-50'
                    : isDark
                      ? 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
                aria-pressed={selectedFrameId === ''}
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-400/50 flex items-center justify-center">
                  <span
                    className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                  >
                    –
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold ${selectedFrameId === '' ? 'text-sky-500' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
                >
                  {t('noFrame') || 'None'}
                </span>
              </button>

              {ownedFrames.map(frame => {
                const isSelected = selectedFrameId === frame.id;
                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setSelectedFrameId(frame.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all active:scale-95 relative ${
                      isSelected
                        ? isDark
                          ? 'border-sky-500 bg-sky-500/10'
                          : 'border-sky-500 bg-sky-50'
                        : isDark
                          ? 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    aria-pressed={isSelected}
                    aria-label={frame.name}
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-slate-400/20 ${frame.cssClass || ''}`}
                    />
                    <span
                      className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${isSelected ? 'text-sky-500' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      {frame.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer buttons — always visible below the scroll area */}
      <div className="flex gap-3 mt-5 pt-4 border-t border-slate-200/20">
        <Button variant="ghost" onClick={onClose} className="flex-1">
          {t('cancel') || 'Cancel'}
        </Button>
        <Button variant="primary" onClick={handleSave} className="flex-1">
          {t('saveChanges') || 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
};

export default EditProfileModal;
