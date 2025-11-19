'use client';

import { BadgeWidget } from '@/components/BadgeWidget';
import { useParams } from 'next/navigation';

export default function BadgePage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-8">Embed this badge on your website</h1>
        <div className="mb-8">
          <BadgeWidget projectId={projectId} style="light" />
        </div>
        <div className="bg-gray-100 p-4 rounded-lg text-left">
          <p className="text-sm font-mono mb-2">HTML iframe:</p>
          <code className="text-xs">
            {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/badge/${projectId}" width="200" height="80" frameborder="0"></iframe>`}
          </code>
        </div>
      </div>
    </div>
  );
}

