import React, { createContext, useContext, useState, useEffect } from 'react';

type CookieConsent = 'accepted' | 'rejected' | 'undecided';

interface CookieContextType {
  consent: CookieConsent;
  acceptCookies: () => void;
  rejectCookies: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

export const CookieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<CookieConsent>('undecided');

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie-consent') as CookieConsent;
    if (savedConsent) {
      setConsent(savedConsent);
    }
  }, []);

  const acceptCookies = () => {
    setConsent('accepted');
    localStorage.setItem('cookie-consent', 'accepted');
  };

  const rejectCookies = () => {
    setConsent('rejected');
    localStorage.setItem('cookie-consent', 'rejected');
  };

  return (
    <CookieContext.Provider value={{ consent, acceptCookies, rejectCookies }}>
      {children}
    </CookieContext.Provider>
  );
};

export const useCookies = () => {
  const context = useContext(CookieContext);
  if (context === undefined) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
};
