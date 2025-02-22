'use client';

import MeisterschaftViewer from '@/app/components/scorecard-viewer/scorecard-viewer';
import '@/app/styles/spielergebnisse.css';
import '@/app/styles/GolfScorecard.css';
import '@/app/styles/image-modal.css';

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