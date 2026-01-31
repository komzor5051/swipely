import React from 'react';

interface UsageBadgeProps {
  remaining: number;
  isPro: boolean;
  onUpgradeClick: () => void;
}

export const UsageBadge: React.FC<UsageBadgeProps> = ({ remaining, isPro, onUpgradeClick }) => {
  if (isPro) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
        <i className="ph ph-crown"></i>
        <span>PRO</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">
        {remaining > 0 ? (
          <span className="text-gray-600">
            <span className="font-semibold text-gray-900">{remaining}</span> из 5 генераций
          </span>
        ) : (
          <span className="text-red-600 font-medium">Лимит исчерпан</span>
        )}
      </div>
      <button
        onClick={onUpgradeClick}
        className="text-sm bg-gradient-to-r from-[#000080] to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5"
      >
        Upgrade
      </button>
    </div>
  );
};
