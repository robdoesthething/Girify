import React from 'react';
import { Friend } from '../hooks/useFriends';
import FriendItem from './FriendItem';

interface FriendsListProps {
  friends: Friend[];
  onRemove: (username: string) => void;
  onBlock: (username: string) => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ friends, onRemove, onBlock }) => {
  if (friends.length === 0) {
    return (
      <div className="text-center py-12 flex flex-col items-center gap-3">
        <span className="text-5xl">👥</span>
        <p className="font-bold text-base font-inter">No friends yet.</p>
        <p className="text-sm opacity-60 font-inter">Share your score and challenge someone!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-sm text-slate-500 uppercase tracking-widest mb-2">
        My Friends ({friends.length})
      </h3>
      {friends.map(f => (
        <FriendItem key={f.username} friend={f} onRemove={onRemove} onBlock={onBlock} />
      ))}
    </div>
  );
};

export default FriendsList;
