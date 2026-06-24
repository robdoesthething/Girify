import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface UpdateModalProps {
  giurosAwarded: number;
  onDismiss: () => void;
}

const UPDATES = [
  {
    emoji: '🏷️',
    title: 'Street names on map snapshots',
    desc: 'Map previews now show street labels and landmarks to help orient you.',
  },
  {
    emoji: '📍',
    title: 'Practice by district',
    desc: "Pick any of Barcelona's 10 districts and drill the streets you want to master.",
  },
  {
    emoji: '🎮',
    title: 'Cleaner play buttons',
    desc: 'Refreshed play and practice controls for a more consistent feel.',
  },
];

const UpdateModal: React.FC<UpdateModalProps> = ({ giurosAwarded, onDismiss }) => {
  const navigate = useNavigate();

  const handleVisitStore = () => {
    onDismiss();
    navigate('/shop');
  };

  const handleGiveFeedback = () => {
    onDismiss();
    navigate('/feedback');
  };

  const footer = (
    <div className="flex flex-col gap-2 w-full">
      <Button variant="primary" size="lg" fullWidth onClick={handleVisitStore} type="button">
        Visit the Shop 🛍️
      </Button>
      <Button variant="ghost" size="md" fullWidth onClick={handleGiveFeedback} type="button">
        Give feedback
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onDismiss}
      title="What's new in Girify"
      size="md"
      showCloseButton={true}
      closeOnBackdrop={true}
      footer={footer}
    >
      <div className="text-center mb-5">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-xs opacity-50 font-inter uppercase tracking-widest">Version 0.2</p>
      </div>

      <ul className="flex flex-col gap-3 mb-5">
        {UPDATES.map(update => (
          <li key={update.title} className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{update.emoji}</span>
            <div>
              <p className="font-bold text-sm font-inter">{update.title}</p>
              <p className="text-xs opacity-70 font-inter leading-relaxed">{update.desc}</p>
            </div>
          </li>
        ))}
      </ul>

      {giurosAwarded > 0 && (
        <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 px-4 py-3 text-center">
          <p className="text-sm font-bold font-inter text-sky-500">
            🪙 +{giurosAwarded} Giuros — thank you for being an early supporter!
          </p>
          <p className="text-xs opacity-60 font-inter mt-0.5">
            Spend them on avatars, frames &amp; titles in the shop.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default UpdateModal;
