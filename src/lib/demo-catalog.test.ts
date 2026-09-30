import { describe, it, expect } from 'vitest';
import { demoResponse, demoBooks } from './demo-catalog';
const request = (path: string) => demoResponse(new URL(`http://localhost/api/biblioteca/${path}`));
describe('catálogo de demostración', () => {
  it('busca sen depender de maiúsculas ou acentos', async () => {
    const result = await request('libros?q=LUA').json();
    expect(result.resultados[0].autoria).toBe('Lúa Varela');
    expect(result.total).toBe(1);
  });
  it('combina filtros e paxinación', async () => {
    const result = await request('libros?idioma=Galego&andel=A1&porPaxina=1&paxina=2').json();
    expect(result.total).toBe(2);
    expect(result.resultados).toHaveLength(1);
    expect(result.resultados[0].slug).toBe('memorias-do-barrio');
  });
  it('distingue detalles existentes e ausentes', async () => {
    expect((await request(`libros/${demoBooks[0].slug}`).json()).id).toBe(demoBooks[0].id);
    expect(request('libros/inexistente').status).toBe(404);
  });
  it('devolve resultados baleiros para filtros sen coincidencias', async () => {
    expect((await request('libros?av_titulo=inexistente').json()).total).toBe(0);
  });
});
