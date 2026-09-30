import { useEffect } from 'react';

export const useFullCalendarLocale = () => {
  useEffect(() => {
    // Force Galician locale for FullCalendar
    const style = document.createElement('style');
    style.textContent = `
      /* Override day names to Galician */
      .fc .fc-col-header-cell[data-datekey] {
        text-transform: capitalize !important;
      }
      
      /* Force Galician day abbreviations */
      .fc-daygrid-day-frame .fc-col-header-cell:nth-child(1)::after {
        content: 'Lun' !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
};

// Galician locale data for FullCalendar
export const galicianLocaleData = {
  code: 'gl',
  week: {
    dow: 1, // Monday
    doy: 4,
  },
  buttonText: {
    prev: 'Ant',
    next: 'Seg',
    today: 'Hoxe',
    year: 'Ano',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    list: 'Axenda',
  },
  weekText: 'Sm',
  allDayText: 'Todo o día',
  moreLinkText: 'máis',
  noEventsText: 'Non hai eventos para amosar',
};
