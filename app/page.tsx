'use client';
import { useState } from 'react';
import ImageModal from '@/app/components/scorecard-viewer/image-modal';
import Image from 'next/image';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <main>
      <section className="hero">
        <div className="hero__content">
          <h1 className="hero__title">
            Tuesday Selection Golf
          </h1>
          <p className="hero__subtitle">
            Innovating Golf Since 2007
          </p>
          <div className="container" style={{ marginTop: '3rem' }}>
            <div className="hero__image-container">
              <Image
                src="/images/TSG-Members.jpg"
                alt="Tuesday Selection Golf Members"
                width={1200}
                height={600}
                className="hero__image"
                priority
                onClick={() => setIsModalOpen(true)}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: '6rem 0', background: 'linear-gradient(to bottom, var(--background-color), rgba(79, 70, 229, 0.05))' }}>
        <div className="container">
          <h2 className="text-gradient" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', textAlign: 'center', marginBottom: '2rem' }}>
            Über uns
          </h2>
          <p style={{ 
            fontSize: '1.25rem', 
            lineHeight: '1.7', 
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto',
            color: 'var(--text-color)',
            opacity: '0.9'
          }}>
            Eine Community von leidenschaftlichen Golfspielern
          </p>
          <div className="card" style={{ 
            marginTop: '3rem',
            padding: '2rem',
            maxWidth: '800px',
            margin: '3rem auto 0',
            background: 'var(--card-background)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow)',
            border: '1px solid var(--card-border)'
          }}>
            <p style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
              Wir sind eine dynamische Gruppe von Golfbegeisterten, die sich jeden Dienstag zu einer
              18-Loch Runde auf unserem Heimatclub{' '}
              <a 
                href="https://www.golf-eugendorf.at/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-gradient"
                style={{ fontWeight: '500' }}
              >
                Golfclub Salzburg Eugendorf
              </a>{' '}
              treffen.
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            margin: '0 auto',
            maxWidth: '1200px'
          }}>
            <div className="features__card animate-fadeIn">
              <h3 className="features__card-title">Wöchentliche Turniere</h3>
              <p className="features__card-text">
                Jeden Dienstag treffen wir uns zu spannenden 18-Loch Runden. 
                Unsere regelmäßigen Turniere bieten die perfekte Mischung aus 
                sportlicher Herausforderung und geselligem Beisammensein.
              </p>
            </div>

            <div className="features__card animate-fadeIn" style={{animationDelay: '0.2s'}}>
              <h3 className="features__card-title">Detaillierte Statistiken</h3>
              <p className="features__card-text">
                Wir führen genaue Aufzeichnungen über alle Spiele und Ergebnisse. 
                Unsere Mitglieder können ihre Entwicklung verfolgen und ihre 
                Leistungen analysieren.
              </p>
            </div>

            <div className="features__card animate-fadeIn" style={{animationDelay: '0.4s'}}>
              <h3 className="features__card-title">Starke Gemeinschaft</h3>
              <p className="features__card-text">
                Mehr als nur ein Golfclub - wir sind eine eingeschworene 
                Gemeinschaft von Gleichgesinnten, die ihre Leidenschaft für 
                Golf teilen und gemeinsam wachsen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
  <ImageModal
    imageUrl="/images/TSG-Members.jpg"
    alt="Tuesday Selection Golf Members"
    onClose={() => setIsModalOpen(false)}
  />
)}
    </main>
  );
}