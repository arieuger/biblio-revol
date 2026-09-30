import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useLayoutEffect, useRef } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieProvider } from "./contexts/CookieContext";
// import CookieBanner from "./components/CookieBanner";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Calendario from "./pages/Calendario";
import Obradoiros from "./pages/Obradoiros";
import Recursos from "./pages/Recursos";
import HazteSocio from "./pages/HazteSocio";
import Contacto from "./pages/Contacto";
import Biblioteca from "./pages/Biblioteca";
import BibliotecaExemplar from "./pages/BibliotecaExemplar";
import LibraryCompositionCmsEditor from "./pages/LibraryCompositionCmsEditor";
import LibraryShelfMappingsCmsEditor from "./pages/LibraryShelfMappingsCmsEditor";
import AvisoLegal from "./pages/AvisoLegal";
import Privacidade from "./pages/Privacidade";
import Cookies from "./pages/Cookies";
import Condicions from "./pages/Condicions";
// import Admin from "./pages/Admin";

function isBlogListingPath(path: string) {
  return path === "/blog" || /^\/blog\/paxina\/\d+\/?$/.test(path);
}

function ScrollRestoration() {
  const [location] = useLocation();
  const previousLocation = useRef(location);
  const currentScrollY = useRef(0);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    window.history.scrollRestoration = "manual";

    const handleScroll = () => {
      currentScrollY.current = window.scrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const shouldPreserveBlogScroll =
      isBlogListingPath(previousLocation.current) && isBlogListingPath(location);

    window.scrollTo(0, shouldPreserveBlogScroll ? currentScrollY.current : 0);
    previousLocation.current = location;
  }, [location]);

  return null;
}


function Router() {
  const [location] = useLocation();

  if (location === "/admin/composicion-biblioteca") {
    return <>
      <ScrollRestoration />
      <LibraryCompositionCmsEditor />
    </>;
  }
  if (location === "/admin/correspondencias-biblioteca") {
    return <><ScrollRestoration /><LibraryShelfMappingsCmsEditor /></>;
  }

  return (
    <>
      <ScrollRestoration />
      <Header />
      <main>
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/blog"} component={Blog} />
          <Route path={"/blog/paxina/:page"} component={Blog} />
          <Route path={"/blog/:slug"} component={BlogPost} />
          <Route path={"/calendario"} component={Calendario} />
          <Route path={"/obradoiros"} component={Obradoiros} />
          <Route path={"/recursos"} component={Recursos} />
          <Route path={"/biblioteca"} component={Biblioteca} />
          <Route path={"/biblioteca/:id"} component={BibliotecaExemplar} />
          <Route path={"/asociate"} component={HazteSocio} />
          <Route path={"/hazte-socio"} component={HazteSocio} />
          <Route path={"/contacto"} component={Contacto} />
          <Route path={"/aviso-legal"} component={AvisoLegal} />
          <Route path={"/privacidade"} component={Privacidade} />
          <Route path={"/cookies"} component={Cookies} />
          <Route path={"/condicions"} component={Condicions} />

          <Route path="/404" component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CookieProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CookieProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
