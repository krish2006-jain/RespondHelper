import React, { createContext, useContext, useState, useEffect } from 'react';

const EmergencyDraftContext = createContext(null);

const DRAFT_KEY = 'relief_sos_draft';

export const EmergencyDraftProvider = ({ children }) => {
  const [draft, setDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const saveDraft = (data) => {
    setDraft(data);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  };

  const clearDraft = () => {
    setDraft(null);
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <EmergencyDraftContext.Provider value={{ draft, saveDraft, clearDraft }}>
      {children}
    </EmergencyDraftContext.Provider>
  );
};

export const useEmergencyDraft = () => useContext(EmergencyDraftContext);
