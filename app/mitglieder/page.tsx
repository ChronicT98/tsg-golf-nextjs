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
                    {member.firma && (
                      <div className="mitglieder__detail">
                        <span>Firma:</span>
                        <strong>{member.firma}</strong>
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
                  <div className="mitglieder__badges">
                    <span className="mitglieder__badge">Gründungsmitglied</span>
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
                    {member.beruf && (
                      <div className="mitglieder__detail">
                        <span>Beruf:</span>
                        <strong>{member.beruf}</strong>
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
                    {member.verstorben && (
                      <div className="mitglieder__detail">
                        <span>Verstorben:</span>
                        <strong>{member.verstorben}</strong>
                      </div>
                    )}
                  </div>
                  <div className="mitglieder__badges">
                    <span className="mitglieder__badge">In Memoriam</span>
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
            <div className="mitglieder__card">
              <div className="mitglieder__image">
                <img src="/images/Christian.jpg" alt="Christian Kafka" />
              </div>
              <h3 className="mitglieder__name">
                Christian Kafka
                <span className="mitglieder__nickname">"Präsi"</span>
              </h3>
              <div className="mitglieder__info">
                <div className="mitglieder__detail">
                  <span>Firma:</span>
                  <strong>GF 4k Projektmanagement GmbH</strong>
                </div>
              </div>
              <div className="mitglieder__badges">
                <span className="mitglieder__badge">Präsident</span>
                <span className="mitglieder__badge">Auswertung</span>
              </div>
            </div>

            <div className="mitglieder__card">
              <div className="mitglieder__image">
                <img src="/images/ernstl.jpg" alt="Ernst Aigner" />
              </div>
              <h3 className="mitglieder__name">
                Ernst Aigner
                <span className="mitglieder__nickname">"Ernsti"</span>
              </h3>
              <div className="mitglieder__info">
                <div className="mitglieder__detail">
                  <span>Firma:</span>
                  <strong>GF Faimolz Manufaktur GmbH</strong>
                </div>
              </div>
              <div className="mitglieder__badges">
                <span className="mitglieder__badge">Kassier</span>
              </div>
            </div>

            <div className="mitglieder__card">
              <div className="mitglieder__image">
                <img src="/images/Wadi_2020.jpg" alt="Peter Konrad" />
              </div>
              <h3 className="mitglieder__name">
                Peter Konrad
                <span className="mitglieder__nickname">"Wadolino"</span>
              </h3>
              <div className="mitglieder__info">
                <div className="mitglieder__detail">
                  <span>Firma:</span>
                  <strong>GP Planungs- und VertriebsGmbH</strong>
                </div>
              </div>
              <div className="mitglieder__badges">
                <span className="mitglieder__badge">Kassaprüfer</span>
                <span className="mitglieder__badge">Turnierkarten</span>
              </div>
            </div>

            <div className="mitglieder__card">
              <h3 className="mitglieder__name">Tobias Kafka</h3>
              <div className="mitglieder__info">
                <div className="mitglieder__detail">
                  <span>Rolle:</span>
                  <strong>Webentwicklung</strong>
                </div>
              </div>
              <div className="mitglieder__badges">
                <span className="mitglieder__badge">Homepage</span>
              </div>
            </div>

            <div className="mitglieder__card">
              <div className="mitglieder__image">
                <img src="/images/Berni.jpg" alt="Bernhard Anderle" />
              </div>
              <h3 className="mitglieder__name">
                Bernhard Anderle
                <span className="mitglieder__nickname">"Berni"</span>
              </h3>
              <div className="mitglieder__info">
                <div className="mitglieder__detail">
                  <span>Beruf:</span>
                  <strong>Privatier</strong>
                </div>
              </div>
              <div className="mitglieder__badges">
                <span className="mitglieder__badge">Medien</span>
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