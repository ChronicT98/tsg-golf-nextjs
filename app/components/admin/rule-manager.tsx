'use client';

import React, { useState, useEffect } from 'react';

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

interface RuleFormData {
  id?: string;
  section: string;
  number: string;
  title: string;
  content: string;
  order_index?: number;
}

export default function RuleManager() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<RuleFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [collapsedRules, setCollapsedRules] = useState<string[]>([]);

  // Fetch rules on component mount
  useEffect(() => {
    fetchRules();
  }, []);

  // Fetch all rules from the API
  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rules');
      if (!response.ok) {
        throw new Error('Failed to fetch rules');
      }
      const data = await response.json();
      const fetchedRules = data.rules || [];
      setRules(fetchedRules);
      
      // Set all rules to be collapsed by default
      if (fetchedRules.length > 0) {
        const allRuleIds = fetchedRules.map((rule: Rule) => rule.id);
        setCollapsedRules(allRuleIds);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Laden der Regeln. Bitte versuchen Sie es später erneut.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group rules by section and sort by order_index
  const preambleRules = rules.filter(rule => rule.section === 'Präambel')
    .sort((a, b) => a.order_index - b.order_index);
  const regelwerkRules = rules.filter(rule => rule.section === 'Regelwerk')
    .sort((a, b) => a.order_index - b.order_index);

  // Open the modal for creating a new rule
  const handleAddRule = (section: string) => {
    setSelectedRule({
      section,
      number: section === 'Präambel' ? '' : generateNextRuleNumber(),
      title: '',
      content: ''
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Open the modal for editing an existing rule
  const handleEditRule = (rule: Rule) => {
    setSelectedRule({
      id: rule.id,
      section: rule.section,
      number: rule.number || '',
      title: rule.title,
      content: rule.content
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Generate the next rule number for new Regelwerk rules
  const generateNextRuleNumber = (): string => {
    if (regelwerkRules.length === 0) {
      return '§1';
    }
    
    // Find the highest rule number
    const highestNumber = regelwerkRules
      .map(rule => rule.number || '')
      .filter(number => number.startsWith('§'))
      .map(number => parseInt(number.substring(1), 10))
      .reduce((max, current) => (current > max ? current : max), 0);
    
    return `§${highestNumber + 1}`;
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (selectedRule) {
      setSelectedRule({ ...selectedRule, [name]: value });
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!selectedRule) return false;

    if (!selectedRule.title.trim()) {
      setMessage({
        type: 'error',
        text: 'Bitte geben Sie einen Titel ein'
      });
      return false;
    }

    if (!selectedRule.content.trim()) {
      setMessage({
        type: 'error',
        text: 'Bitte geben Sie einen Inhalt ein'
      });
      return false;
    }

    if (selectedRule.section === 'Regelwerk' && !selectedRule.number.trim()) {
      setMessage({
        type: 'error',
        text: 'Bitte geben Sie eine Regelnummer ein'
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setMessage(null);

      const method = isEditMode ? 'PUT' : 'POST';
      const endpoint = '/api/rules';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedRule),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving rule');
      }

      await response.json();

      setMessage({
        type: 'success',
        text: isEditMode ? 'Regel erfolgreich aktualisiert' : 'Neue Regel erfolgreich hinzugefügt'
      });

      // Close modal and refresh rules
      setIsModalOpen(false);
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unbekannter Fehler beim Speichern der Regel'
      });
    }
  };

  // Prepare for rule deletion (show confirmation dialog)
  const handleDeleteClick = (rule: Rule) => {
    setRuleToDelete(rule);
    setShowDeleteConfirm(true);
  };

  // Handle rule deletion
  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;

    try {
      const response = await fetch(`/api/rules?id=${ruleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting rule');
      }

      setMessage({
        type: 'success',
        text: `Regel "${ruleToDelete.title}" erfolgreich gelöscht`
      });

      // Refresh rules and close confirmation dialog
      fetchRules();
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
    } catch (error) {
      console.error('Error deleting rule:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen der Regel'
      });
      setShowDeleteConfirm(false);
    }
  };

  // Cancel delete operation
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRuleToDelete(null);
  };

  // Helper function to check if a rule is the Geldwertung rule
  const isGeldwertungRule = (rule: Rule): boolean => {
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

  // Helper function to check if content has fee structure
  const hasFeeStructure = (content: string): boolean => {
    const lines = content.split('\n');
    const feeLineCount = lines.filter(line => 
      line.trim().length > 0 && 
      line.includes(':') && 
      !line.startsWith('http') && 
      !line.includes('://')
    ).length;
    
    return feeLineCount >= 3;
  };

  // Helper function to check if a rule has sub-rules
  const hasSubRules = (rule: Rule): boolean => {
    return (
      rule.content.includes('§16.') || 
      /§\d+\.\d+/.test(rule.content) ||
      rule.number === '§16'
    );
  };

  // Toggle rule content collapse state
  const toggleRuleCollapse = (ruleId: string) => {
    setCollapsedRules(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(id => id !== ruleId);
      } else {
        return [...prev, ruleId];
      }
    });
  };

  // Get rule type class
  const getRuleTypeClass = (rule: Rule): string => {
    if (rule.section === 'Präambel') {
      return 'preamble';
    } else if (isGeldwertungRule(rule)) {
      return 'geldwertung';
    } else if (hasSubRules(rule)) {
      return 'has-sub-rules';
    }
    return '';
  };

  // Render a rule item
  const renderRuleItem = (rule: Rule) => {
    const ruleTypeClass = getRuleTypeClass(rule);
    const isCollapsed = collapsedRules.includes(rule.id);
    
    return (
      <div key={rule.id} className={`rule-card ${ruleTypeClass}`}>
        <div className="rule-header">
          <h4>{rule.number ? `${rule.number}. ${rule.title}` : rule.title}</h4>
          <div className="rule-actions">
            <button 
              onClick={() => handleEditRule(rule)}
              className="edit-button"
              title="Regel bearbeiten"
            >
              ✏️
            </button>
            <button 
              onClick={() => handleDeleteClick(rule)}
              className="delete-button"
              title="Regel löschen"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div className={`rule-content ${isCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="toggle-button" 
            onClick={() => toggleRuleCollapse(rule.id)}
            title={isCollapsed ? "Inhalt anzeigen" : "Inhalt ausblenden"}
          >
            {isCollapsed ? '▼ Anzeigen' : '▲ Ausblenden'}
          </button>
          
          <div className="content-body">
            {rule.content.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rule-manager">
      <h2>Regelwerk Verwaltung</h2>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      {isLoading ? (
        <div className="loading">Regeln werden geladen...</div>
      ) : (
        <div className="rule-sections">
          <section className="rule-section">
            <div className="section-header">
              <h3>Präambel</h3>
              <button 
                onClick={() => handleAddRule('Präambel')}
                className="add-button"
              >
                + Neue Präambel
              </button>
            </div>
            
            <div className="rule-list">
              {preambleRules.length === 0 ? (
                <div className="empty-message">
                  Keine Präambel vorhanden. Fügen Sie eine neue hinzu.
                </div>
              ) : (
                preambleRules.map(rule => renderRuleItem(rule))
              )}
            </div>
          </section>
          
          <section className="rule-section">
            <div className="section-header">
              <h3>Regelwerk</h3>
              <button 
                onClick={() => handleAddRule('Regelwerk')}
                className="add-button"
              >
                + Neue Regel
              </button>
            </div>
            
            <div className="rule-list">
              {regelwerkRules.length === 0 ? (
                <div className="empty-message">
                  Keine Regeln vorhanden. Fügen Sie neue Regeln hinzu.
                </div>
              ) : (
                regelwerkRules.map(rule => renderRuleItem(rule))
              )}
            </div>
          </section>
        </div>
      )}
      
      {/* Regel-Bearbeitungsformular */}
      {isModalOpen && selectedRule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditMode ? 'Regel bearbeiten' : 'Neue Regel hinzufügen'}</h3>
            
            <form onSubmit={handleSubmit} className="rule-form">
              <div className="form-group">
                <label htmlFor="section">Bereich:</label>
                <select
                  id="section"
                  name="section"
                  value={selectedRule.section}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="Präambel">Präambel</option>
                  <option value="Regelwerk">Regelwerk</option>
                </select>
              </div>
              
              {selectedRule.section === 'Regelwerk' && (
                <div className="form-group">
                  <label htmlFor="number">Regelnummer:</label>
                  <input
                    type="text"
                    id="number"
                    name="number"
                    value={selectedRule.number}
                    onChange={handleInputChange}
                    placeholder="z.B. §1"
                    className="form-input"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="title">Titel:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={selectedRule.title}
                  onChange={handleInputChange}
                  placeholder="Titel der Regel"
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="content">Inhalt:</label>
                <textarea
                  id="content"
                  name="content"
                  value={selectedRule.content}
                  onChange={handleInputChange}
                  placeholder="Inhalt der Regel"
                  className="form-textarea"
                  rows={8}
                  required
                />
                
                <div className="formatting-help">
                  <h4>Formatierungshilfe:</h4>
                  <ul>
                    <li>
                      <strong>Es sind keine Absätze möglich nur Zeilenumbrüche</strong>
                    </li>
                    <li>
                      <strong>Tabellen erstellen (wie bei §14 Geldwertung)</strong>:<br></br> 
                      Jede Zeile im Format &quot;Ereignis : Betrag&quot; eingeben. Der Header ist immer die erste Zeile.
                    </li>
                    <li>
                      <strong>Unterregeln erstellen (wie bei §16)</strong>:<br></br> 
                      Jede Unterregel auf einer neuen Zeile mit Format &quot;§16.1 ...&quot; usw. eingeben
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {isEditMode ? 'Aktualisieren' : 'Hinzufügen'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    setMessage(null);
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Löschbestätigungsdialog */}
      {showDeleteConfirm && ruleToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="admin-editor">
              <h2>Regel löschen</h2>
              
              <div className="warning-message">
                <p>Soll die Regel <strong>{ruleToDelete.title}</strong> wirklich gelöscht werden?</p>
                <p>Diese Aktion kann nicht rückgängig gemacht werden!</p>
              </div>
              
              <div className="button-group">
                <button 
                  className="cancel-button" 
                  onClick={handleDeleteCancel}
                >
                  Abbrechen
                </button>
                
                <button 
                  className="delete-button" 
                  onClick={handleDeleteConfirm}
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}