/*
  Calendario.tsx – Revolteira
  ─────────────────────────────────────────────────────────────────────────
  ESTRATEXIA 7 EVOLUCIONADA:
  1. Vista de Mes: FullCalendar nativo (estética 100% orixinal)
  2. Vista de Axenda: React personalizado (réplica estética FullCalendar)
  3. Formato garantido: "Luns 2 de marzo"
  4. Sen petardeo: Control total da carga e espazo
  5. Sincronización real: API de Google Calendar
*/

import { Card, CardContent } from "@/components/ui/card";
import { Info, Copy, Check, Calendar as CalendarIcon, X, Sparkles, List } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SEO from "@/components/SEO";

// FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import { galicianLocale, GL_MONTHS_LOWER, GL_MONTHS_CAP, GL_DAYS_FULL, GL_DAYS_SHORT } from "@/lib/fullcalendar-gl";
import "@/styles/fullcalendar-pizarra.css";

// ─── Tipos ────────────────────────────────────────────────────────────────

interface EventDetail {
  title: string;
  dateLabel: string;   // "Luns, 2 de marzo de 2026"
  timeRange: string;   // "17:00 – 19:00"
  location?: string;
  description?: string;
}

interface EventColor {
  title: string;
  color: string;
  searchIn?: 'title' | 'description' | 'both';
  matchType?: 'exact' | 'contains';
}

interface AgendaEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
}

// ─── Utilidades de formato ────────────────────────────────────────────────

/** "Marzo de 2026" (con "de" en minúscula) */
function formatTitleGL(date: Date): string {
  return `${GL_MONTHS_CAP[date.getMonth()]} de ${date.getFullYear()}`;
}

/** "Luns, 2 de marzo de 2026" */
function formatDateFullGL(date: Date): string {
  const day = GL_DAYS_FULL[date.getDay()];
  const num = date.getDate();
  const month = GL_MONTHS_LOWER[date.getMonth()];
  const year = date.getFullYear();
  return `${day}, ${num} de ${month} de ${year}`;
}

/** "17:00" */
function formatTimeGL(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleTimeString('gl-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** URL de localización: Google Maps */
function buildLocationUrl(location: string): string {
  const encoded = encodeURIComponent(location);
  return `https://www.google.com/maps/search/${encoded}`;
}

// ─── Compoñente principal ─────────────────────────────────────────────────

export default function Calendario() {
  const [copied, setCopied] = useState(false);
  const [eventColors, setEventColors] = useState<EventColor[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [currentView, setCurrentView] = useState<'month' | 'agenda'>(isMobile ? 'agenda' : 'month');
  const [currentDate, setCurrentDate] = useState(new Date()); // Data sincronizada entre vistas
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  const googleCalendarId =
    "REEMPLAZAR_CALENDAR_ID@group.calendar.google.com";
  const googleApiKey = "REEMPLAZAR_GOOGLE_CALENDAR_API_KEY";
  const icalUrl =
    "https://calendar.google.com/calendar/ical/23e03747b15c83eb6c080cfb2682c70d090034a7be2cc1f93d3b0d317afab632%40group.calendar.google.com/public/basic.ics";


  const isCurrentMonth = useMemo(() => {
    const today = new Date();
    return currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  }, [currentDate]);

  // ── Detectar móbil ────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Sincronizar FullCalendar coa data ─────────────────────────────────
  useEffect(() => {
    if (currentView === 'month' && calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (api.getDate().getTime() !== currentDate.getTime()) {
        api.gotoDate(currentDate);
      }
    }
  }, [currentDate, currentView]);

  // ── Cargar cores dos eventos desde DecapCMS ────────────────────────────
  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await fetch('/settings/calendar.json');
        const data = await response.json();
        if (data?.eventColors && Array.isArray(data.eventColors)) {
          setEventColors(data.eventColors);
        }
      } catch (err) {
        console.error("Erro ao cargar cores do calendario:", err);
      }
    };
    loadColors();
  }, []);

    // ── Cargar eventos para a axenda personalizada ────────────────────
  useEffect(() => {
    if (currentView !== 'agenda') return;

    const fetchEvents = async () => {
      setLoadingAgenda(true);
      try {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
        
        const timeMin = startOfMonth.toISOString();
        const timeMax = endOfMonth.toISOString();
        
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId)}/events?key=${googleApiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.items) {
          setAgendaEvents(data.items);
        } else {
          setAgendaEvents([]);
        }
      } catch (err) {
        console.error("Erro ao cargar eventos de Google:", err);
        setAgendaEvents([]);
      } finally {
        setLoadingAgenda(false);
      }
    };

    fetchEvents();
  }, [currentView, currentDate, googleCalendarId, googleApiKey]);

  // ── Asignar cores aos eventos (Vista Mes) ─────────────────────────────
  const handleEventDidMount = useCallback((info: any) => {
    const title = info.event.title.toLowerCase();
    const description = (info.event.extendedProps?.description || '').toLowerCase();
    
    const matchesColor = (eventColor: EventColor): boolean => {
      const searchTerm = eventColor.title.toLowerCase();
      const searchIn = eventColor.searchIn || 'both';
      const matchType = eventColor.matchType || 'contains';
      
      const isMatch = (text: string) => {
        if (matchType === 'exact') {
          return text === searchTerm;
        } else {
          return text.includes(searchTerm);
        }
      };
      
      if (searchIn === 'title') {
        return isMatch(title);
      } else if (searchIn === 'description') {
        return isMatch(description);
      } else {
        return isMatch(title) || isMatch(description);
      }
    };
    
    const matched = eventColors.find(matchesColor);
    const color = matched ? matched.color : "#2d5a27";
    info.el.style.setProperty('background-color', color, 'important');
    info.el.style.setProperty('border-color', color, 'important');
    
    const titleEl = info.el.querySelector('.fc-event-title');
    if (titleEl) {
      (titleEl as HTMLElement).style.setProperty('color', 'white', 'important');
    }
    const mainEl = info.el.querySelector('.fc-event-main');
    if (mainEl) {
      (mainEl as HTMLElement).style.setProperty('background-color', color, 'important');
    }
  }, [eventColors]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    toast.success("URL copiada ao portapapeis");
    setTimeout(() => setCopied(false), 2000);
  };



  // AVISO: Se modificas o texto da descrición do calendario, 
  // lembra que tamén se utiliza como descrición para os Open Graphs (SEO).
  const calendarioDescription = "Consulta a nosa axenda de obradoiros, actividades e asembleas abertas.";

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <SEO title="Calendario" description={calendarioDescription} />

      {/* Header */}
      <section className="relative bg-muted/30 border-b-2 border-border py-12 md:pt-24 md:pb-16">
        <img
          src="/assets/hedra.png"
          alt=""
          className="absolute top-0 left-0 w-full h-auto min-h-[40px] object-cover opacity-80 pointer-events-none"
          aria-hidden="true"
        />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Calendario</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {calendarioDescription}
          </p>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="container py-12 md:py-16">
        <div className="max-w-5xl mx-auto">

          {/* FullCalendar Section */}
          <div className="mb-16 fc fc-media-screen fc-direction-ltr fc-theme-standard">
            
            {/* Custom Toolbar (Idéntico ao de FullCalendar) */}
            {isMobile ? (
              <div className="fc-header-toolbar fc-toolbar mb-4" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0', alignItems: 'center' }}>
                {/* Botóns de navegación (esquerda) */}
                <div className="fc-toolbar-chunk" style={{ display: 'flex', justifyContent: 'flex-start', gap: '0' }}>
                  <button 
                    className="fc-prev-button fc-button fc-button-primary" 
                    onClick={() => {
                      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
                      setCurrentDate(newDate);
                    }}
                    style={{ padding: '4px 8px', borderRadius: '4px 0 0 4px' }}
                  >
                    <span className="fc-icon fc-icon-chevron-left"></span>
                  </button>
                  <button 
                    className="fc-next-button fc-button fc-button-primary"
                    onClick={() => {
                      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
                      setCurrentDate(newDate);
                    }}
                    style={{ padding: '4px 8px', borderRadius: '0 4px 4px 0', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    <span className="fc-icon fc-icon-chevron-right"></span>
                  </button>
                </div>
                
                {/* Título (centro) */}
                <div className="fc-toolbar-chunk" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%' }}>
                  <div className="fc-toolbar-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', lineHeight: '1.1', margin: '0', padding: '0', width: '100%' }}>
                    <span style={{ fontSize: '0.85rem', color: '#333', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>{currentDate.getFullYear()}</span>
                    <span style={{ fontSize: '1.05rem', color: '#333', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>{GL_MONTHS_CAP[currentDate.getMonth()]}</span>
                  </div>
                </div>
                
                {/* Botóns de vista (dereita) */}
                <div className="fc-toolbar-chunk" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0' }}>
                  <button 
                    className={`fc-dayGridMonth-button fc-button fc-button-primary ${currentView === 'month' ? 'fc-button-active' : ''}`}
                    onClick={() => setCurrentView('month')}
                    title="Mes"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: '4px 0 0 4px' }}
                  >
                    <CalendarIcon size={20} />
                  </button>
                  <button 
                    className={`fc-listMonth-button fc-button fc-button-primary ${currentView === 'agenda' ? 'fc-button-active' : ''}`}
                    onClick={() => setCurrentView('agenda')}
                    title="Axenda"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: '0 4px 4px 0', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="fc-header-toolbar fc-toolbar mb-4">
                <div className="fc-toolbar-chunk">
                  <div className="fc-button-group">
                    <button 
                      className="fc-prev-button fc-button fc-button-primary" 
                      onClick={() => {
                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
                        setCurrentDate(newDate);
                        if (currentView === 'month') {
                          calendarRef.current?.getApi().gotoDate(newDate);
                        }
                      }}
                    >
                      <span className="fc-icon fc-icon-chevron-left"></span>
                    </button>
                    <button 
                      className="fc-next-button fc-button fc-button-primary"
                      onClick={() => {
                        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
                        setCurrentDate(newDate);
                        if (currentView === 'month') {
                          calendarRef.current?.getApi().gotoDate(newDate);
                        }
                      }}
                    >
                      <span className="fc-icon fc-icon-chevron-right"></span>
                    </button>
                    <button 
                      className="fc-today-button fc-button fc-button-primary"
                      disabled={isCurrentMonth}
                      style={isCurrentMonth ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      onClick={() => {
                        const today = new Date();
                        setCurrentDate(today);
                        if (currentView === 'month') {
                          calendarRef.current?.getApi().today();
                        }
                      }}
                    >
                      hoxe
                    </button>
                  </div>
                </div>
                <div className="fc-toolbar-chunk">
                  <h2 className="fc-toolbar-title">
                    {formatTitleGL(currentDate)}
                  </h2>
                </div>
                <div className="fc-toolbar-chunk">
                  <div className="fc-button-group">
                    <button 
                      className={`fc-dayGridMonth-button fc-button fc-button-primary ${currentView === 'month' ? 'fc-button-active' : ''}`}
                      onClick={() => {
                        setCurrentView('month');
                        calendarRef.current?.getApi().gotoDate(currentDate);
                      }}
                    >
                      Mes
                    </button>
                    <button 
                      className={`fc-listMonth-button fc-button fc-button-primary ${currentView === 'agenda' ? 'fc-button-active' : ''}`}
                      onClick={() => setCurrentView('agenda')}
                    >
                      Axenda
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Vista de Mes (FullCalendar Nativo) */}
            <div className={currentView === 'month' ? 'block' : 'hidden'}>
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, googleCalendarPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false} // Usamos o noso toolbar personalizado
                titleFormat={(date) => {
                  const d = new Date(date.date.year, date.date.month, 1);
                  return formatTitleGL(d);
                }}
                dayHeaderContent={(arg: any) => {
                  const dayOfWeek = arg.date.getDay();
                  return GL_DAYS_SHORT[dayOfWeek];
                }}
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: false,
                  hour12: false,
                }}
                events={{
                  googleCalendarId,
                  googleCalendarApiKey: googleApiKey,
                }}
                locale={galicianLocale}
                firstDay={1}
                height="auto"
                contentHeight="auto"
                initialDate={currentDate}
                eventDidMount={handleEventDidMount}
                eventClick={handleEventClick}
                showNonCurrentDates={false}
                fixedWeekCount={false}
              />
            </div>

            {/* Vista de Axenda (Mimetización perfecta de .fc-list) */}
            {currentView === 'agenda' && (
              <div className="fc-view-harness animate-in fade-in duration-300" style={{ height: 'auto', minHeight: '400px' }}>
                <div className="fc-listMonth-view fc-list fc-view">
                  <div className="fc-scroller" style={{ overflow: 'hidden auto' }}>
                    <table className="fc-list-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {loadingAgenda ? (
                          <tr>
                            <td colSpan={3} className="py-20 text-center">
                              <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                              <p className="text-muted-foreground font-medium">Cargando eventos...</p>
                            </td>
                          </tr>
                        ) : agendaEvents.length > 0 ? (
                          (() => {
                            const groups: { [key: string]: AgendaEvent[] } = {};
                            agendaEvents.forEach(event => {
                              const startValue = event.start.dateTime || event.start.date;
                              if (!startValue) return;
                              const date = new Date(startValue);
                              if (Number.isNaN(date.getTime())) return;
                              const key = date.toISOString().split('T')[0];
                              if (!groups[key]) groups[key] = [];
                              groups[key].push(event);
                            });

                            return Object.keys(groups).sort().map(dateKey => {
                              const date = new Date(dateKey);
                              const dayName = GL_DAYS_FULL[date.getDay()];
                              const dayNum = date.getDate();
                              const monthName = GL_MONTHS_LOWER[date.getMonth()];
                              const dateLabel = `${dayName} ${dayNum} de ${monthName}`;
                              const isToday = date.toDateString() === new Date().toDateString();

                              return (
                                <div key={dateKey} style={{ display: 'contents' }}>
                                  <tr className="fc-list-day" data-date={dateKey}>
                                    <th colSpan={3} style={{ padding: '8px 0', border: 'none' }}>
                                      <div style={{
                                        padding: '10px 16px',
                                        backgroundColor: isToday ? '#8c4e36' : '#e0dbd3', // Terracota escuro ou beige máis escuro
                                        borderRadius: '8px',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)',
                                        width: '100%',
                                        textAlign: 'center'
                                      }}>
                                        <span style={{
                                          fontWeight: 'bold',
                                          fontSize: '0.95rem',
                                          color: isToday ? '#fff' : '#333'
                                        }}>{dateLabel}</span>
                                      </div>
                                    </th>
                                  </tr>
                                  {groups[dateKey].map((event) => {
                                    const startValue = event.start.dateTime || event.start.date;
                                    if (!startValue) return null;
                                    const start = new Date(startValue);
                                    const endValue = event.end?.dateTime || event.end?.date;
                                    const end = endValue ? new Date(endValue) : null;
                                    const timeRange = event.start.dateTime 
                                      ? `${formatTimeGL(start)}${end ? ` – ${formatTimeGL(end)}` : ''}`
                                      : "Todo o día";
                                    
                                    const title = event.summary.toLowerCase();
                                    const description = (event.description || '').toLowerCase();
                                    
                                    const matchesColor = (eventColor: EventColor): boolean => {
                                      const searchTerm = eventColor.title.toLowerCase();
                                      const searchIn = eventColor.searchIn || 'both';
                                      const matchType = eventColor.matchType || 'contains';
                                      
                                      const isMatch = (text: string) => {
                                        if (matchType === 'exact') {
                                          return text === searchTerm;
                                        } else {
                                          return text.includes(searchTerm);
                                        }
                                      };
                                      
                                      if (searchIn === 'title') {
                                        return isMatch(title);
                                      } else if (searchIn === 'description') {
                                        return isMatch(description);
                                      } else {
                                        return isMatch(title) || isMatch(description);
                                      }
                                    };
                                    
                                    const matched = eventColors.find(matchesColor);
                                    const eventColor = matched ? matched.color : "#2d5a27";

                                    return (
                                      <tr 
                                        key={event.id} 
                                        className="fc-list-event hover:bg-muted/30 cursor-pointer"
                                        onClick={() => {
                                          setSelectedEvent({
                                            title: event.summary,
                                            dateLabel: formatDateFullGL(start),
                                            timeRange,
                                            location: event.location || '',
                                            description: event.description || '',
                                          });
                                        }}
                                      >
                                        <td style={{ padding: '8px 4px 8px 16px', verticalAlign: 'middle', width: '1%', whiteSpace: 'nowrap' }}>
                                          <div style={{ fontSize: '0.88rem', color: '#666', fontWeight: '500' }}>
                                            {timeRange}
                                          </div>
                                        </td>
                                        <td style={{ padding: '8px 6px', verticalAlign: 'middle', width: '1%', textAlign: 'center' }}>
                                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: eventColor, display: 'block' }}></div>
                                        </td>
                                        <td style={{ padding: '8px 16px 8px 4px', verticalAlign: 'middle' }}>
                                          <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#222', lineHeight: '1.3' }}>
                                            {event.summary}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </div>
                              );
                            });
                          })()
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-20 text-center">
                              <p className="text-muted-foreground font-medium">Non hai eventos programados para este mes.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal de Detalle de Evento */}
          {selectedEvent && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setSelectedEvent(null)}
            >
              <div
                className="bg-background border-2 border-border rounded-lg shadow-lg max-w-md w-full p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Pechar"
                >
                  <X size={24} />
                </button>

                <h3 className="text-xl font-display font-bold mb-4 pr-8 leading-snug">
                  {selectedEvent.title}
                </h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-0.5">
                      Data e Hora
                    </p>
                    <p className="text-foreground font-medium">{selectedEvent.dateLabel}</p>
                    {selectedEvent.timeRange && (
                      <p className="text-foreground">{selectedEvent.timeRange}</p>
                    )}
                  </div>

                  {selectedEvent.location && (
                    <div>
                      <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-0.5">
                        Localización
                      </p>
                      <a
                        href={buildLocationUrl(selectedEvent.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:opacity-70 transition-opacity break-words"
                      >
                        {selectedEvent.location}
                      </a>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div>
                      <p className="text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-0.5">
                        Descrición
                      </p>
                      <p
                        className="text-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedEvent.description }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="mt-6 w-full bg-primary text-primary-foreground font-bold py-2 px-4 rounded-sm hover:opacity-90 transition-opacity"
                >
                  Pechar
                </button>
              </div>
            </div>
          )}



          {/* Sincroniza o calendario */}
          <Card className="border-2 border-accent/30 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="text-accent flex-shrink-0 mt-0.5" size={20} />
                <div className="w-full">
                  <h3 className="font-display font-bold text-lg mb-3">Sincroniza o calendario</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    Podes engadir o noso calendario á túa aplicación de calendario preferida para
                    incorporar os eventos do centro social, que se actualizarán automaticamente, e
                    mesmo recibir notificacións se activas a opción:
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        readOnly
                        value={icalUrl}
                        className="w-full px-4 py-2 text-xs border-2 border-border rounded-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="border-2 border-border hover:bg-muted shrink-0 flex items-center gap-2"
                    >
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                      {copied ? "Copiado" : "Copiar URL"}
                    </Button>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-2">
                      <span className="font-semibold text-foreground min-w-[120px]">Google Calendar:</span>
                      <span className="text-muted-foreground">
                        Fai clic <a href="https://calendar.google.com/calendar/u/0/r?cid=REEMPLAZAR_CALENDAR_ID@group.calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold hover:opacity-70 transition-opacity">aquí</a>. Se non funciona: Configuración → Engadir calendario → A través de URL → Pega a URL
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-2">
                      <span className="font-semibold text-foreground min-w-[120px]">Outlook:</span>
                      <span className="text-muted-foreground">Engadir calendario → Engadir desde directorio → Subscribirse desde a web → Pega a URL</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-2">
                      <span className="font-semibold text-foreground min-w-[120px]">Apple Calendar:</span>
                      <span className="text-muted-foreground">Na app nativa de iPhone accede a Calendarios → Engadir calendario → Engadir subscrición a calendario → Pega a URL</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-2">
                      <span className="font-semibold text-foreground min-w-[120px]">Outras apps:</span>
                      <span className="text-muted-foreground">Procura a opción de engadir calendario mediante URL ou subscrición → Pega a URL</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground text-center">
            <Sparkles className="text-accent/60 shrink-0" size={18} />
            <p>
              Explora calendarios alternativos de código aberto <a href="https://alternativeto.net/software/ical/?license=opensource" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary transition-colors font-medium">nesta ligazón</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  // ── Clic nun evento: abrir modal ─────────────────────────────────────
  function handleEventClick(info: any) {
    info.jsEvent.preventDefault();
    info.jsEvent.stopPropagation();
    info.jsEvent.stopImmediatePropagation();

    const event = info.event;
    const startDate: Date | null = event.start;
    const endDate: Date | null = event.end;

    const dateLabel = startDate ? formatDateFullGL(startDate) : '';
    const startTime = formatTimeGL(startDate);
    const endTime = formatTimeGL(endDate);
    const timeRange = endTime ? `${startTime} – ${endTime}` : startTime;

    setSelectedEvent({
      title: event.title,
      dateLabel,
      timeRange,
      location: event.extendedProps?.location || '',
      description: event.extendedProps?.description || '',
    });
  }
}
