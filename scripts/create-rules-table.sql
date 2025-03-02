-- Create a table for storing TSG rules
CREATE TABLE IF NOT EXISTS "rules" (
  "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "section" VARCHAR(255) NOT NULL, -- 'Präambel' or 'Regelwerk'
  "number" VARCHAR(10), -- Rule number like '§1', '§2', etc. (NULL for preamble)
  "title" VARCHAR(255) NOT NULL, -- Rule title/heading
  "content" TEXT NOT NULL, -- Rule content
  "order_index" INTEGER NOT NULL DEFAULT 0, -- For ordering rules
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for the rules table
-- Allow anonymous read access
ALTER TABLE "rules" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" 
ON "rules" 
FOR SELECT USING (true);

-- Allow authenticated users to create, update, delete
CREATE POLICY "Allow authenticated create" 
ON "rules" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated update" 
ON "rules" 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated delete" 
ON "rules" 
FOR DELETE 
TO authenticated 
USING (true);

-- Add sample data (initial rules from the static page)
INSERT INTO "rules" (section, number, title, content, order_index) 
VALUES
-- Präambel
('Präambel', NULL, 'Präambel', 'Die TSG ist eine Verbindung aus Golfenthusiasten, die sich zum Ziel gesetzt haben JEDEN Dienstag eine 18 Loch-Runde Golf nach sportlichen Aspekt zu spielen.', 0),

-- Regelwerk
('Regelwerk', '§1', 'Spieltag und Ort', 'Gespielt wird jeden Dienstag um 14:00 Uhr (Zeiten werden einvernehmlich der Jahreszeit angepasst und müssen rechtzeitig allen Mitglieder übermittelt werden) auf GC Eugendorf (oder nach einstimmiger Vereinbarung auf jedem anderen Kurs) nach Stablefort.', 1),

('Regelwerk', '§2', 'Golfregeln', 'Es gelten die offiziellen Golfregeln 2019. (R&A and USGA 2019)', 2),

('Regelwerk', '§3', 'Grundsatz', 'Grundvoraussetzung der TSG ist ein Gentlemen-Agreement aller Mitglieder, daß die Regelauslegung einfach, den aktuellen Regeln entsprechend und im Zweifelsfall nicht zum Vorteil des Einzelnen ausgelegt werden sollen.', 3),

('Regelwerk', '§4', '9-Loch Regelung', '9-Loch Turniere sind generell verboten! Bei zu wider Handeln wird die "Weiber Wies''n" Strafe verhängt.', 4),

('Regelwerk', '§5', 'Gäste', 'Gäste können nur auf Einladung eines TSG-Mitgliedes mitspielen und spielen mit Ihrem Gast im letzten Flight.', 5),

('Regelwerk', '§6', 'Flights', 'Es werden die Flights nach der "Präsi-Los-Methode" zusammengestellt.', 6),

('Regelwerk', '§7', 'TSG-Turnier', 'Jeden letzten Dienstag im Monat wird ein TSG-Turnier OHNE Gäste auf GC Eugendorf (oder nach einstimmiger Vereinbarung auf jedem anderen Kurs) gespielt. Wetterbedingt kann das Turnier um 1 Woche verschoben werden.', 7),

('Regelwerk', '§8', 'TSG-Turniere und Auswärtsrunden', 'TSG-Turniere und Auswärtsrunden werden nicht aus der Clubkassa bezahlt.', 8),

('Regelwerk', '§9', 'Absagen, Verlängerungen etc.', 'Wetterbedingte Absagen, Rundenverlängerungen etc. müssen einstimmig und rechtzeitig vereinbart werden.', 9),

('Regelwerk', '§10', 'Mindestspielerzahl', 'Mindestspielerzahl für eine Runde die in die Wertung kommt sind 4 Spieler.', 10),

('Regelwerk', '§11', 'Putts', 'Es werden keine Putts mehr geschenkt, jeder Ball wird fertig geputted.', 11),

('Regelwerk', '§12', 'Runde wird nicht beendet', 'Sollte eine Runde nicht auf 18 Löchern fertig gespielt werden können, müssen mindestens 9 Löcher von ALLEN gespielt werden, damit die Runde in die Wertung kommt. Die fehlenden Löcher auf 18 Löcher werden jeweils mit einem Netto Par gerechnet.', 12),

('Regelwerk', '§13', 'Punktewertung', 'Einzelwertung per Dienstag: Die erspielten Punkte für Netto und Brutto sowie für die Kombination Brutto/Netto werden über die gessamte Saison aufsummiert', 13),

('Regelwerk', '§14', 'Geldwertung', 'Folgende Vereinbarungen werden getroffen und sind vom jeweiligen Zähler direkt auf der Scorekarte mitzuschreiben:\n\nFehlen am Dienstag: Höchstbeitrag der Dienstagsrunde\nEagle: 20,00 €\nBirdie: 1,50 €\nPar: 0,50 €\nBunker: 0,50 €\nPers.Puffer nicht erreicht: 2,00 €\n3-Putt oder Höher: 1,00 €\nLast Putt: 2,00 €\n\nEs wird vereinbart das am Jahresende kein ausgleichen der Geldwertung vorgenommen wird.', 14),

('Regelwerk', '§15', 'Streichresultate', 'Es werden max. 5 Streichresultate für die Jahreswertung herangezogen!', 15),

('Regelwerk', '§16', 'Jahreswertung', '§16.1. Brutto: Der Erste Platz wird mit einem Pokal geehrt\n§16.2. Netto: Der Erste Platz wird mit einem Pokal geehrt\n§16.3. Brutto/Netto: Wanderpokal; verbleibt im Eigentum eines Spielers wenn er 3x den Wanderpokal gewonnen hat oder 2x hintereinander\n§16.4. Sonderwertungen', 16),

('Regelwerk', '§17', 'Jahresausflug', 'Der Jahresausflug wird von Donnerstag bis Sonntag stattfinden.', 17),

('Regelwerk', '§18', 'Dienstag vor Ausflug', 'Am letzten Dienstag vor dem Ausflug wird keine offizielle TSG-Runde mehr gespielt.', 18),

('Regelwerk', '§19', 'Neumitglieder', 'Neumitglieder werden nur durch die Gründungsmitglieder nach Einstimmigkeit aufgenommen werden.', 19);