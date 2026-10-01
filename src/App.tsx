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
import { DownloadsPage } from './pages/DownloadsPage';
import { ContactPage } from './pages/ContactPage';
import { DownloadableProduct } from './types/downloads';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfUsePage } from './pages/TermsOfUsePage';
import { AccountPage } from './pages/AccountPage';
import { DesktopAuthPage } from './pages/DesktopAuthPage';
import { LanguageProvider } from './i18n/LanguageContext';

import { AuthProvider } from './context/AuthContext';

interface AppProps {
  initialPath?: string;
}

const AppContent: React.FC<AppProps> = ({ initialPath }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (initialPath) return initialPath;
    if (typeof window !== 'undefined') return window.location.pathname || '/';
    return '/';
  });
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
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

    // Check downloads route with optional /downloads/:product/:version
    if (currentPath === '/downloads' || currentPath.startsWith('/downloads/')) {
      const parts = currentPath.split('/').filter(Boolean);
      // parts[0] = 'downloads', parts[1] = product, parts[2] = version
      const product = parts[1] as DownloadableProduct | undefined;
      const version = parts[2];

      return (
        <DownloadsPage
          initialProduct={product}
          initialVersion={version}
          onNavigate={navigate}
          onOpenContact={() => setIsContactOpen(true)}
        />
      );
    }

    switch (currentPath) {
      case '/contact':
        return <ContactPage />;
      case '/privacy':
        return <PrivacyPolicyPage />;
      case '/terms':
        return <TermsOfUsePage />;
      case '/my':
      case '/account':
        return <AccountPage onNavigate={navigate} />;
      case '/auth/desktop':
        return <DesktopAuthPage />;
      case '/solutions':

        return (
          <SolutionsPage
            onNavigate={navigate}
            onOpenContact={() => setIsContactOpen(true)}
          />
        );
      case '/developers':
        return <DevelopersPage onNavigate={navigate} />;
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

export const App: React.FC<AppProps> = ({ initialPath }) => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent initialPath={initialPath} />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
