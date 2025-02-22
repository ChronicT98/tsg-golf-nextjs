// app/regelwerk/page.tsx
export default function RegelwerkPage() {
    return (
      <div className="regelwerk">
        <div className="container">
          <h1>TSG Regelwerk</h1>
  
          <section className="regelwerk__section">
            <h2>Präambel</h2>
            <div className="regelwerk__card">
              <p>
                Die TSG ist eine Verbindung aus Golfenthusiasten, die sich zum
                Ziel gesetzt haben JEDEN Dienstag eine 18 Loch-Runde Golf nach
                sportlichen Aspekt zu spielen.
              </p>
            </div>
          </section>
  
          <section className="regelwerk__section">
            <h2>Regelwerk</h2>
            <div className="regelwerk__grid">
              <article className="regelwerk__rule">
                <h3>§1. Spieltag und Ort</h3>
                <p>
                  Gespielt wird jeden Dienstag um 14:00 Uhr (Zeiten werden
                  einvernehmlich der Jahreszeit angepasst und müssen rechtzeitig
                  allen Mitglieder übermittelt werden) auf GC Eugendorf (oder nach
                  einstimmiger Vereinbarung auf jedem anderen Kurs) nach
                  Stablefort.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§2. Golfregeln</h3>
                <p>
                  Es gelten die offiziellen Golfregeln 2019. (R&A and USGA 2019)
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§3. Grundsatz</h3>
                <p>
                  Grundvoraussetzung der TSG ist ein Gentlemen-Agreement aller
                  Mitglieder, daß die Regelauslegung einfach, den aktuellen Regeln
                  entsprechend und im Zweifelsfall nicht zum Vorteil des Einzelnen
                  ausgelegt werden sollen.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§4. 9-Loch Regelung</h3>
                <p>
                  9-Loch Turniere sind generell verboten! Bei zu wider Handeln
                  wird die &quot;Weiber Wies&apos;n&quot; Strafe verhängt.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§5. Gäste</h3>
                <p>
                  Gäste können nur auf Einladung eines TSG-Mitgliedes mitspielen
                  und spielen mit Ihrem Gast im letzten Flight.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§6. Flights</h3>
                <p>
                  Es werden die Flights nach der &quot;Präsi-Los-Methode&quot;
                  zusammengestellt.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§7. TSG-Turnier</h3>
                <p>
                  Jeden letzten Dienstag im Monat wird ein TSG-Turnier OHNE Gäste
                  auf GC Eugendorf (oder nach einstimmiger Vereinbarung auf jedem
                  anderen Kurs) gespielt. Wetterbedingt kann das Turnier um 1
                  Woche verschoben werden.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§8. TSG-Turniere und Auswärtsrunden</h3>
                <p>
                  TSG-Turniere und Auswärtsrunden werden nicht aus der Clubkassa
                  bezahlt.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§9. Absagen, Verlängerungen etc.</h3>
                <p>
                  Wetterbedingte Absagen, Rundenverlängerungen etc. müssen
                  einstimmig und rechtzeitig vereinbart werden.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§10. Mindestspielerzahl</h3>
                <p>
                  Mindestspielerzahl für eine Runde die in die Wertung kommt sind
                  4 Spieler.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§11. Putts</h3>
                <p>
                  Es werden keine Putts mehr geschenkt, jeder Ball wird fertig
                  geputted.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§12. Runde wird nicht beendet</h3>
                <p>
                  Sollte eine Runde nicht auf 18 Löchern fertig gespielt werden
                  können, müssen mindestens 9 Löcher von ALLEN gespielt werden,
                  damit die Runde in die Wertung kommt. Die fehlenden Löcher auf
                  18 Löcher werden jeweils mit einem Netto Par gerechnet.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§13. Punktewertung</h3>
                <p>
                  Einzelwertung per Dienstag: Die erspielten Punkte für Netto und
                  Brutto sowie für die Kombination Brutto/Netto werden über die
                  gessamte Saison aufsummiert
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§14. Geldwertung</h3>
                <p>
                  Folgende Vereinbarungen werden getroffen und sind vom jeweiligen
                  Zähler direkt auf der Scorekarte mitzuschreiben:
                </p>
                <table className="regelwerk__fees">
                  <thead>
                    <tr>
                      <th>Ereignis</th>
                      <th>Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Fehlen am Dienstag</td>
                      <td>Höchstbeitrag der Dienstagsrunde</td>
                    </tr>
                    <tr>
                      <td>Eagle</td>
                      <td>20,00 €</td>
                    </tr>
                    <tr>
                      <td>Birdie</td>
                      <td>1,50 €</td>
                    </tr>
                    <tr>
                      <td>Par</td>
                      <td>0,50 €</td>
                    </tr>
                    <tr>
                      <td>Bunker</td>
                      <td>0,50 €</td>
                    </tr>
                    <tr>
                      <td>Pers.Puffer nicht erreicht</td>
                      <td>2,00 €</td>
                    </tr>
                    <tr>
                      <td>3-Putt oder Höher</td>
                      <td>1,00 €</td>
                    </tr>
                    <tr>
                      <td>Last Putt</td>
                      <td>2,00 €</td>
                    </tr>
                  </tbody>
                </table>
                <p className="regelwerk__note">
                  Es wird vereinbart das am Jahresende kein ausgleichen der
                  Geldwertung vorgenommen wird.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§15. Streichresultate</h3>
                <p>
                  Es werden max. 5 Streichresultate für die Jahreswertung
                  herangezogen!
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§16. Jahreswertung</h3>
                <div className="sub-rules">
                  <p><strong>§16.1.</strong> Brutto: Der Erste Platz wird mit einem
                      Pokal geehrt</p> 
                  <p>
                    <strong>§16.2.</strong> Netto: Der Erste Platz wird mit einem
                    Pokal geehrt
                  </p>
                  <p>
                    <strong>§16.3.</strong> Brutto/Netto: Wanderpokal; verbleibt
                    im Eigentum eines Spielers wenn er 3x den Wanderpokal gewonnen
                    hat oder 2x hintereinander
                  </p>
                  <p><strong>§16.4.</strong> Sonderwertungen</p>
                </div>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§17. Jahresausflug</h3>
                <p>
                  Der Jahresausflug wird von Donnerstag bis Sonntag stattfinden.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§18. Dienstag vor Ausflug</h3>
                <p>
                  Am letzten Dienstag vor dem Ausflug wird keine offizielle
                  TSG-Runde mehr gespielt.
                </p>
              </article>
  
              <article className="regelwerk__rule">
                <h3>§19. Neumitglieder</h3>
                <p>
                  Neumitglieder werden nur durch die Gründungsmitglieder nach
                  Einstimmigkeit aufgenommen werden.
                </p>
              </article>
            </div>
          </section>
        </div>
      </div>
    );
  }