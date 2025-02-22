'use client';
import '@/app/styles/mitglieder.css';
import { gruendungsmitglieder, ordentlicheMitglieder, inMemoriam, type MemberDetails } from './data';
import { useState } from 'react';

export default function MitgliederPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filterCategories = [
    { id: 'all', label: 'Alle Mitglieder' },
    { id: 'gruendung', label: 'Gründungsmitglieder' },
    { id: 'ordentlich', label: 'Ordentliche Mitglieder' },
    { id: 'memoriam', label: 'In Memoriam' },
    { id: 'funktionaere', label: 'Funktionäre' },
  ];

  const shouldShowCategory = (category: string) => {
    if (activeCategory === 'all') return true;
    return category === activeCategory;
  };

  return (
    <div className="mitglieder">
      <div className="container">
        <h1>TSG Mitglieder</h1>

        <div className="mitglieder__filters">
          {filterCategories.map((category) => (
            <button
              key={category.id}
              className={`mitglieder__filter ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <section className="mitglieder__section">
          {shouldShowCategory('gruendung') && (
            <div className="mitglieder__category">
            <h3 className="mitglieder__category-title">Gründungsmitglieder</h3>
            <div className="mitglieder__grid">
              {gruendungsmitglieder.map((member) => (
                <div key={member.name} className="mitglieder__card">
                  <div className="mitglieder__image">
                    <img src={member.imageSrc} alt={member.name} />
                  </div>
                  <h3 className="mitglieder__name">
                    {member.name}
                    {member.spitzname && <span className="mitglieder__nickname">"{member.spitzname}"</span>}
                  </h3>
                  <div className="mitglieder__info">
                    <div className="mitglieder__detail">
                      <span>Handicap:</span>
                      <strong>{member.hcp}</strong>
                    </div>
                    {member.geboren && (
                      <div className="mitglieder__detail">
                        <span>Geboren:</span>
                        <strong>{member.geboren}</strong>
                      </div>
                    )}
                    {member.firma && (
                      <div className="mitglieder__detail">
                        <span>Beruf:</span>
                        <strong>{member.firma}</strong>
                      </div>
                    )}
                    {member.handy && (
                      <div className="mitglieder__detail">
                        <span>Handy:</span>
                        <strong>{member.handy}</strong>
                      </div>
                    )}
                  </div>
                  <div className="mitglieder__contact">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="mitglieder__badge">
                        Email
                      </a>
                    )}
                    {member.web && (
                      <a href={`https://${member.web}`} target="_blank" rel="noopener noreferrer" className="mitglieder__badge">
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {shouldShowCategory('ordentlich') && (
            <div className="mitglieder__category">
            <h3 className="mitglieder__category-title">Ordentliche Mitglieder</h3>
            <div className="mitglieder__grid">
              {ordentlicheMitglieder.map((member) => (
                <div key={member.name} className="mitglieder__card">
                  <div className="mitglieder__image">
                    <img src={member.imageSrc} alt={member.name} />
                  </div>
                  <h3 className="mitglieder__name">
                    {member.name}
                    {member.spitzname && <span className="mitglieder__nickname">"{member.spitzname}"</span>}
                  </h3>
                  <div className="mitglieder__info">
                    <div className="mitglieder__detail">
                      <span>Handicap:</span>
                      <strong>{member.hcp}</strong>
                    </div>
                    {member.geboren && (
                      <div className="mitglieder__detail">
                        <span>Geboren:</span>
                        <strong>{member.geboren}</strong>
                      </div>
                    )}
                    {member.firma && (
                      <div className="mitglieder__detail">
                        <span>Beruf:</span>
                        <strong>{member.firma}</strong>
                      </div>
                    )}
                    {member.beruf && (
                      <div className="mitglieder__detail">
                        <span>Beruf:</span>
                        <strong>{member.beruf}</strong>
                      </div>
                    )}
                    {member.handy && (
                      <div className="mitglieder__detail">
                        <span>Handy:</span>
                        <strong>{member.handy}</strong>
                      </div>
                    )}
                  </div>
                  <div className="mitglieder__contact">
                    {member.email && (
                      <a href={`mailto:${member.email}`} className="mitglieder__badge">
                        Email
                      </a>
                    )}
                    {member.web && (
                      <a href={`https://${member.web}`} target="_blank" rel="noopener noreferrer" className="mitglieder__badge">
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {shouldShowCategory('memoriam') && (
            <div className="mitglieder__category">
            <h3 className="mitglieder__category-title">In Memoriam</h3>
            <div className="mitglieder__grid">
              {inMemoriam.map((member) => (
                <div key={member.name} className="mitglieder__card">
                  <div className="mitglieder__image">
                    <img src={member.imageSrc} alt={member.name} />
                  </div>
                  <h3 className="mitglieder__name">
                    {member.name}
                    {member.spitzname && <span className="mitglieder__nickname">"{member.spitzname}"</span>}
                  </h3>
                  <div className="mitglieder__info">
                    <div className="mitglieder__detail">
                      <span>Handicap:</span>
                      <strong>{member.hcp}</strong>
                    </div>
                    {member.geboren && (
                      <div className="mitglieder__detail">
                        <span>Geboren:</span>
                        <strong>{member.geboren}</strong>
                      </div>
                    )}
                    {member.verstorben && (
                      <div className="mitglieder__detail">
                        <span className="kreuz">✞</span>
                        <strong>{member.verstorben}</strong>
                      </div>
                    )}
                  </div> 
                </div>
              ))}
            </div>
          </div>
          )}
        </section>

        {(activeCategory === 'all' || activeCategory === 'funktionaere') && (
          <section className="mitglieder__section">
            <h3 className="mitglieder__category-title">Funktionäre</h3>
            <div className="mitglieder__grid">
              <div className="mitglieder__card mitglieder__card--funktionaer">
                <h3 className="mitglieder__name">Christian Kafka</h3>
                <div className="mitglieder__badges">
                  <span className="mitglieder__badge" id="seperator">Präsident</span>
                  <span className="mitglieder__badge">Auswertung</span>
                </div>
              </div>

              <div className="mitglieder__card mitglieder__card--funktionaer">
                <h3 className="mitglieder__name">Ernst Aigner</h3>
                <div className="mitglieder__badges">
                  <span className="mitglieder__badge">Kassier</span>
                </div>
              </div>

              <div className="mitglieder__card mitglieder__card--funktionaer">
                <h3 className="mitglieder__name">Peter Konrad</h3>
                <div className="mitglieder__badges">
                  <span className="mitglieder__badge" id="seperator">Kassaprüfer</span>
                  <span className="mitglieder__badge">Turnierkarten</span>
                </div>
              </div>

              <div className="mitglieder__card mitglieder__card--funktionaer">
                <h3 className="mitglieder__name">Tobias Kafka</h3>
                <div className="mitglieder__badges">
                  <span className="mitglieder__badge">Homepage</span>
                </div>
              </div>

              <div className="mitglieder__card mitglieder__card--funktionaer">
                <h3 className="mitglieder__name">Bernhard Anderle</h3>
                <div className="mitglieder__badges">
                  <span className="mitglieder__badge" id="seperator">Medien</span>
                  <span className="mitglieder__badge">Marketing</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}