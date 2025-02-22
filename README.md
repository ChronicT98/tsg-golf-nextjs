# TSG Golf Website

Eine Next.js-basierte Website für den TSG Golf Club mit geschütztem Admin-Bereich.

## Lokale Entwicklung

Zuerst die Abhängigkeiten installieren:

```bash
npm install
```

Dann den Entwicklungsserver starten:

```bash
npm run dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

## Deployment auf Vercel

### 1. Vorbereitung

Stellen Sie sicher, dass Sie ein [Vercel-Konto](https://vercel.com/signup) haben.

### 2. Repository verbinden

1. Pushen Sie Ihren Code zu einem Git-Repository (GitHub, GitLab, oder Bitbucket)
2. Gehen Sie zu [Vercel New Project](https://vercel.com/new)
3. Importieren Sie Ihr Repository
4. Wählen Sie das Framework-Preset "Next.js"

### 3. Blob Storage einrichten

Für die Datei-Uploads (Scorecards, Bilder, etc.):

1. Gehen Sie zu Ihrem Projekt-Dashboard in Vercel
2. Navigieren Sie zu "Storage"
3. Wählen Sie "Blob"
4. Klicken Sie auf "Create Blob Store"
5. Kopieren Sie den generierten `BLOB_READ_WRITE_TOKEN`

### 4. Umgebungsvariablen konfigurieren

In Ihrem Vercel Projekt unter "Settings" > "Environment Variables" folgende Variablen setzen:

```
NEXTAUTH_SECRET=<generiert mit: openssl rand -base64 32>
ADMIN_USERNAME=<gewünschter Admin-Benutzername>
ADMIN_PASSWORD=<sicheres Admin-Passwort>
BLOB_READ_WRITE_TOKEN=<von Blob Storage kopiert>
```

NEXTAUTH_URL wird von Vercel automatisch gesetzt.

### 5. Deployment

1. Committen und pushen Sie Ihre Änderungen
2. Vercel wird automatisch ein neues Deployment starten
3. Nach erfolgreichem Deployment ist Ihre Seite unter `https://ihre-domain.vercel.app` erreichbar

### 6. Admin-Bereich

Der Admin-Bereich ist unter `/admin` erreichbar. Verwenden Sie die konfigurierten Zugangsdaten (ADMIN_USERNAME/ADMIN_PASSWORD) für den Login.

## Funktionen

- Geschützter Admin-Bereich mit Login
- Sichere Datei-Uploads mit Vercel Blob Storage
- JWT-basierte Authentifizierung
- Responsive Design
- Optimierte Bildverarbeitung

## Technologie-Stack

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [NextAuth.js](https://next-auth.js.org/) für Authentifizierung
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob) für Datei-Uploads
- [Tailwind CSS](https://tailwindcss.com/) für Styling

## Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue im Repository oder kontaktieren Sie den Administrator.