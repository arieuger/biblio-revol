// Locale galego para FullCalendar v6
// Forzar o idioma en todos os niveis

export const galicianLocale = {
  code: 'gl',
  week: {
    dow: 1, // Luns como primeiro día da semana
    doy: 4,
  },
  buttonText: {
    prev: '‹',
    next: '›',
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
  // Nomes dos días (CRÍTICO: FullCalendar usa isto para as cabeceiras)
  // Usar os nomes ABREVIADOS (Lun, Mar, Mér...) para as cabeceiras
  dayNames: ['Domingo', 'Luns', 'Martes', 'Mércores', 'Xoves', 'Venres', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb'],
  dayNamesMin: ['Lun', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb', 'Dom'], // Usar abreviados para cabeceiras
  // Nomes dos meses
  monthNames: [
    'Xaneiro', 'Febreiro', 'Marzo', 'Abril', 'Maio', 'Xuño',
    'Xullo', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Decembro'
  ],
  monthNamesShort: ['Xan', 'Feb', 'Mar', 'Abr', 'Mai', 'Xuñ', 'Xul', 'Ago', 'Set', 'Out', 'Nov', 'Dec'],
};

// Nomes dos meses en galego (minúscula) para uso en funcións de formato
export const GL_MONTHS_LOWER = [
  'xaneiro', 'febreiro', 'marzo', 'abril', 'maio', 'xuño',
  'xullo', 'agosto', 'setembro', 'outubro', 'novembro', 'decembro'
];

// Nomes dos meses en galego (maiúscula inicial) para o título do calendario
export const GL_MONTHS_CAP = [
  'Xaneiro', 'Febreiro', 'Marzo', 'Abril', 'Maio', 'Xuño',
  'Xullo', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Decembro'
];

// Nomes dos días en galego
export const GL_DAYS_FULL = ['Domingo', 'Luns', 'Martes', 'Mércores', 'Xoves', 'Venres', 'Sábado'];
export const GL_DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mér', 'Xov', 'Ven', 'Sáb'];
