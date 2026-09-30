import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ContactModal } from './components/ContactModal';
import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AboutPage } from './pages/AboutPage';
import { LanguageProvider } from './i18n/LanguageContext';

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    // If it's a hash jump on home page
    if (path.startsWith('/#')) {
      if (currentPath !== '/') {
        window.history.pushState({}, '', '/');
        setCurrentPath('/');
      }
      setTimeout(() => {
        const hash = path.replace('/#', '');
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  const renderCurrentPage = () => {
    // Check product routes: /products/:slug
    if (currentPath.startsWith('/products/')) {
      const slug = currentPath.replace('/products/', '').toLowerCase();
      return (
        <ProductPage
          slug={slug}
          onNavigate={navigate}
          onOpenContact={() => setIsContactOpen(true)}
        />
      );
    }

    switch (currentPath) {
      case '/solutions':
        return (
          <SolutionsPage
            onNavigate={navigate}
            onOpenContact={() => setIsContactOpen(true)}
          />
        );
      case '/developers':
        return <DevelopersPage />;
      case '/resources':
        return <ResourcesPage />;
      case '/about':
        return <AboutPage onOpenContact={() => setIsContactOpen(true)} />;
      case '/':
      default:
        return (
          <HomePage
            onNavigate={navigate}
            onOpenContact={() => setIsContactOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300">
      <Navbar
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenContact={() => setIsContactOpen(true)}
      />

      <main className="flex-1">{renderCurrentPage()}</main>

      <Footer
        onNavigate={navigate}
        onOpenContact={() => setIsContactOpen(true)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
