// src/components/ShareButton.jsx
import React, { useState } from 'react';
import { Share2, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { shareAchievement } from '../lib/sharedUtils';

export function ShareButton({ score, speed, type = 'score' }) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    setError(false);

    try {
      const success = await shareAchievement({ score, speed, type });
      setShared(success);
      setError(!success);

      // Reset status after a delay
      setTimeout(() => {
        setShared(false);
        setError(false);
      }, 3000);
    } catch (err) {
      setError(true);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      className={`kawaii-button relative ${
        shared ? 'bg-green-500 hover:bg-green-600' :
        error ? 'bg-red-500 hover:bg-red-600' : ''
      }`}
      disabled={sharing}
    >
      {sharing ? (
        <span className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2" />
          Sharing...
        </span>
      ) : shared ? (
        <span className="flex items-center">
          <Check className="w-4 h-4 mr-2" />
          Shared!
        </span>
      ) : error ? (
        <span className="flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Try Again
        </span>
      ) : (
        <span className="flex items-center">
          <Share2 className="w-4 h-4 mr-2" />
          Share Achievement
        </span>
      )}
    </Button>
  );
}
