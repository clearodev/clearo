'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Award } from 'lucide-react';
import { API_URL } from '@/src/config/api';

interface BadgeWidgetProps {
  projectId: string;
  style?: 'light' | 'dark';
}

export function BadgeWidget({ projectId, style = 'dark' }: BadgeWidgetProps) {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, [projectId]);

  const fetchScore = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}`
      );
      setScore(response.data.transparency_score);
    } catch (error) {
      console.error('Error fetching score:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (score: number) => {
    if (score >= 90) return '#a855f7'; // purple
    if (score >= 75) return '#e5e7eb'; // gray
    if (score >= 60) return '#fbbf24'; // yellow
    if (score >= 45) return '#9ca3af'; // gray
    if (score >= 30) return '#fb923c'; // orange
    return '#6b7280'; // gray
  };

  const getBadgeName = (score: number) => {
    if (score >= 90) return 'Diamond';
    if (score >= 75) return 'Platinum';
    if (score >= 60) return 'Gold';
    if (score >= 45) return 'Silver';
    if (score >= 30) return 'Bronze';
    return 'Unverified';
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
        style === 'light' ? 'bg-gray-100' : 'bg-gray-800'
      }`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      </div>
    );
  }

  if (score === null) {
    return null;
  }

  const bgColor = style === 'light' ? '#f3f4f6' : '#1f2937';
  const textColor = style === 'light' ? '#111827' : '#ffffff';
  const badgeColor = getBadgeColor(score);

  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2"
      style={{
        backgroundColor: bgColor,
        borderColor: badgeColor,
        color: textColor,
      }}
    >
      <Award style={{ color: badgeColor }} className="w-5 h-5" />
      <div>
        <div className="font-semibold text-sm" style={{ color: badgeColor }}>
          {getBadgeName(score)}
        </div>
        <div className="text-xs opacity-75">
          Transparency Score: {score}/100
        </div>
      </div>
    </div>
  );
}

