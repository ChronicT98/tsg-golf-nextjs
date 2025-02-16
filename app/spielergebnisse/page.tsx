'use client';

import MeisterschaftViewer from '@/app/components/scorecard-viewer/scorecard-viewer';

export default function SpielErgebnissePage() {
  return (
    <div className="spielergebnisse">
      <div className="container">
        <h1>Spielergebnisse</h1>
        <MeisterschaftViewer />
      </div>
    </div>
  );
}