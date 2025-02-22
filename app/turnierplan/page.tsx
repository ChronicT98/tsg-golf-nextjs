'use client';
import Head from 'next/head';
import '@/app/styles/turnierplan.css';

export default function EmbeddedPage() {
  const url = 'https://www.golf-eugendorf.at/club/turniere/';
  
  return (
    <div className="turnierplan-container">
      <Head>
        <title>Turnierplan</title>
        <meta name="description" content="Eine Webseite in meiner Next.js App anzeigen" />
      </Head>

      <main className="turnierplan-main">
        <h1>Turnierplan</h1>
        

        <div className="turnierplan-iframeContainer">
          <iframe 
            src={url} 
            width="100%" 
            height="600px" 
            title="Eingebettete Webseite"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            className="embeddedFrame"
          />
        </div>
      </main></div>)}
