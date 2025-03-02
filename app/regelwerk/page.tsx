'use client';

import { useState, useEffect } from 'react';

interface Rule {
  id: string;
  section: string; // 'Präambel' or 'Regelwerk'
  number: string | null; // Rule number like '§1', '§2', etc. (NULL for preamble)
  title: string; // Rule title/heading
  content: string; // Rule content
  order_index: number; // For ordering rules
  created_at: string;
  updated_at: string;
}

export default function RegelwerkPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rules on component mount
  useEffect(() => {
    async function fetchRules() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/rules');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Regeln');
        }
        const data = await response.json();
        setRules(data.rules || []);
      } catch (err) {
        console.error('Error loading rules:', err);
        setError('Die Regeln konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRules();
  }, []);

  // Group rules by section
  const preambleRules = rules.filter(rule => rule.section === 'Präambel')
    .sort((a, b) => a.order_index - b.order_index);
  
  const regelwerkRules = rules.filter(rule => rule.section === 'Regelwerk')
    .sort((a, b) => a.order_index - b.order_index);

  // Format rule content based on type
  const formatRuleContent = (rule: Rule) => {
    // First check if this is Rule 16 or has sub-rules - highest priority
    if (hasSubRules(rule)) {
      return renderSubRules(rule.content);
    }
    
    // Then check if this is the special Geldwertung rule
    if (isGeldwertungRule(rule)) {
      return renderFeeTable(rule.content);
    }
    
    // Handle normal paragraphs
    return renderParagraphs(rule.content);
  };

  // Check if rule is the special Geldwertung rule
  const isGeldwertungRule = (rule: Rule) => {
    return (
      rule.number?.includes('§14') || 
      rule.title.toLowerCase().includes('geldwertung') ||
      rule.content.toLowerCase().includes('geldwertung') ||
      rule.content.toLowerCase().includes('folgende vereinbarungen') ||
      rule.content.toLowerCase().includes('scorekarte') ||
      rule.content.toLowerCase().includes('eagle:') ||
      rule.content.toLowerCase().includes('birdie:') ||
      rule.content.toLowerCase().includes('fehlen am dienstag:') ||
      hasFeeStructure(rule.content)
    );
  };

  // Check if content has fee structure (multiple lines with colons)
  const hasFeeStructure = (content: string) => {
    const lines = content.split('\n');
    const feeLineCount = lines.filter(line => 
      line.trim().length > 0 && 
      line.includes(':') && 
      !line.startsWith('http') && 
      !line.includes('://')
    ).length;
    
    return feeLineCount >= 3;
  };

  // Check if content has sub-rules
  const hasSubRules = (rule: Rule) => {
    return (
      rule.content.includes('§16.') || 
      /§\d+\.\d+/.test(rule.content) ||
      rule.number === '§16'
    );
  };

    // Render fee table for Geldwertung rule
  const renderFeeTable = (content: string) => {
    // Normalize the content
    const normalizedContent = content.replace(/\r\n/g, '\n');
    
    // Split into lines to process each line individually
    const lines = normalizedContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Separate table entries from normal text
    const tableEntries: { event: string; amount: string }[] = [];
    const nonTableLines: string[] = [];
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      // Check if there's a space before the colon - only these become table entries
      if (colonIndex > 0 && 
          line.charAt(colonIndex - 1) === ' ' && 
          !line.startsWith('http') && 
          !line.includes('://')) {
        const event = line.substring(0, colonIndex).trim();
        const amount = line.substring(colonIndex + 1).trim();
        tableEntries.push({ event, amount });
      } else {
        // All other lines (including those with colons but no space) become normal text
        nonTableLines.push(line);
      }
    }
    
    // Group non-table lines into paragraphs
    let introText = '';
    let closingText = '';
    
    if (nonTableLines.length > 0) {
      // If we have some non-table lines, first half goes to intro, second half to closing
      const midpoint = Math.floor(nonTableLines.length / 2);
      if (midpoint > 0) {
        introText = nonTableLines.slice(0, midpoint).join('\n');
        closingText = nonTableLines.slice(midpoint).join('\n');
      } else {
        // If we have only one line, put it in the intro
        introText = nonTableLines[0];
      }
    }
    
    // Get header from first row if available, otherwise use defaults
    const headerRow = tableEntries.length > 0 ? tableEntries[0] : { event: 'Ereignis', amount: 'Betrag' };
    // Use remaining rows for the table body
    const bodyRows = tableEntries.length > 0 ? tableEntries.slice(1) : [];
    
    // Render the content
    return (
      <>
        {introText && <p className="regelwerk__intro">{introText}</p>}
        {tableEntries.length > 0 && (
          <table className="regelwerk__fees">
            <thead>
              <tr>
                <th>{headerRow.event}</th>
                <th>{headerRow.amount}</th>
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((fee, index) => (
                <tr key={index}>
                  <td>{fee.event}</td>
                  <td>{fee.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {closingText && <p className="regelwerk__note">{closingText}</p>}
      </>
    );
  };


  // Render sub-rules (like §16.1, §16.2)
  const renderSubRules = (content: string) => {
    const lines = content.split('\n');
    
    return (
      <div className="sub-rules">
        {lines.map((line, idx) => {
          // Match sub-rule patterns
          const match = line.match(/^(§\d+\.\d+)|^(\d+\.\d+)/);
          
          if (match) {
            const sectionNum = match[0];
            const remainingText = line.replace(sectionNum, '').trim();
            return (
              <p key={idx}>
                <strong>{sectionNum}</strong> {remainingText}
              </p>
            );
          } else if (line.trim().length > 0) {
            return <p key={idx}>{line}</p>;
          }
          
          return null;
        }).filter(Boolean)}
      </div>
    );
  };

  // Render normal paragraphs
  const renderParagraphs = (content: string) => {
    // Check for double newlines (paragraphs)
    if (content.includes('\n\n')) {
      return content.split(/\n\n+/).map((paragraph, idx) => (
        <p key={idx}>{paragraph}</p>
      ));
    }
    
    // Check for single newlines
    if (content.includes('\n')) {
      return (
        <>
          {content.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </>
      );
    }
    
    // Default case: just render the content as a paragraph
    return <p>{content}</p>;
  };

  if (isLoading) {
    return (
      <div className="regelwerk">
        <div className="container">
          <h1>TSG Regelwerk</h1>
          <div className="loading">Regelwerk wird geladen...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="regelwerk">
        <div className="container">
          <h1>TSG Regelwerk</h1>
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="regelwerk">
      <div className="container">
        <h1>TSG Regelwerk</h1>

        {preambleRules.length > 0 && (
          <section className="regelwerk__section">
            <h2>Präambel</h2>
            <div className="regelwerk__card">
              {preambleRules.map(rule => (
                <div key={rule.id}>
                  {formatRuleContent(rule)}
                </div>
              ))}
            </div>
          </section>
        )}

        {regelwerkRules.length > 0 && (
          <section className="regelwerk__section">
            <h2>Regelwerk</h2>
            <div className="regelwerk__grid">
              {regelwerkRules.map(rule => (
                <article 
                  key={rule.id} 
                  className={`regelwerk__rule ${rule.number === '§14' || rule.title.toLowerCase().includes('geldwertung') ? 'full-width-rule' : ''}`}
                >
                  <h3>
                    {rule.number && rule.number !== 'null' ? `${rule.number}. ` : ''}
                    {rule.title}
                  </h3>
                  {formatRuleContent(rule)}
                </article>
              ))}
            </div>
          </section>
        )}

        {rules.length === 0 && (
          <div className="empty-state">
            Keine Regeln gefunden. Bitte kontaktieren Sie den Administrator.
          </div>
        )}
      </div>
    </div>
  );
}