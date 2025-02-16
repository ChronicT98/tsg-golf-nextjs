// app/components/members/member-card.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MemberDetails } from '@/app/mitglieder/data';

interface Props {
  member: MemberDetails;
  isMemorial?: boolean;
}

export default function MemberCard({ member, isMemorial = false }: Props) {
    const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`members__item-expanded ${isMemorial ? 'members__item--memorial' : ''}`}>
      <div className="members__basic-info"
      onClick={() => setIsOpen(!isOpen)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsOpen(!isOpen);
        }
      }}>
        <span className="members__name">{member.name}</span>
        <span className="members__hcp">{member.hcp}</span>
      </div>
      <div className="members__detail-panel" style={{ display: isOpen ? 'grid' : 'none'}} >
        <div className="members__photo">
          <Image
            src={member.imageSrc}
            alt={member.name}
            width={200}
            height={200}
            className="members__photo-img"
          />
        </div>
        <div className="members__details">
          {member.spitzname && <p><strong>Spitzname:</strong> {member.spitzname}</p>}
          {member.geboren && <p><strong>Geboren:</strong> {member.geboren}</p>}
          {member.verstorben && <p><strong>Verstorben:</strong> {member.verstorben}</p>}
          {member.firma && <p><strong>Firma:</strong> {member.firma}</p>}
          {member.beruf && <p><strong>Beruf:</strong> {member.beruf}</p>}
          <p><strong>Handy:</strong> {member.handy}</p>
          <p><strong>Email:</strong> {member.email}</p>
          {member.web && <p><strong>Web:</strong> {member.web}</p>}
        </div>
      </div>
    </div>
  );
}