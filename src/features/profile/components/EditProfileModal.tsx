import React, { useState } from 'react';
import { Button, Heading, Input, Modal } from '../../../components/ui';
import { useTheme } from '../../../context/ThemeContext';
import { ShopItem } from '../../../utils/shop';

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
  const { t } = useTheme();
  const [name, setName] = useState(currentName);
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);
  const [selectedFrameId, setSelectedFrameId] = useState(currentFrameId);

  const handleSave = () => {
    onSave(name, selectedAvatarId, selectedFrameId);
    onClose();
  };

  // Helper to find avatar image
  const getAvatarImage = (id: string) => {
    return allAvatars.find(a => a.id === id)?.image;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editProfile') || 'Edit Profile'}
      size="md"
      footer={
        <div className="flex gap-4 w-full">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            {t('cancel') || 'Cancel'}
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex-1">
            {t('saveChanges') || 'Save Changes'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Name Input */}
        <Input
          label={t('displayName') || 'Display Name'}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
        />

        {/* Avatar Selection */}
        <div>
          <Heading variant="h6" className="mb-2 opacity-70">
            {t('avatar') || 'Avatar'}
          </Heading>
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
          <Heading variant="h6" className="mb-2 opacity-70">
            {t('frame') || 'Frame'}
          </Heading>
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
    </Modal>
  );
};

export default EditProfileModal;
