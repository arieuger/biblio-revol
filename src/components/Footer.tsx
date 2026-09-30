import { Link } from "wouter";
export default function Footer() {
  return <footer className="border-t-2 border-border mt-16"><div className="container py-10 flex flex-wrap justify-between gap-6"><div><p className="font-display text-xl font-bold">A Revolteira</p><p className="text-muted-foreground mt-2">Rúa Falperra, 13, Baixo - A Coruña</p></div><Link href="/biblioteca?modo=catalogo" className="underline underline-offset-4">Explorar o catálogo</Link></div></footer>;
}
