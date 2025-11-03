import React from 'react';
import Header from './Header';

interface MainLayoutProps {
    children: React.ReactNode;
    appTitle: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, appTitle }) => {
  return (
    // Basic structure - CSS would handle layout better
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header title={appTitle} />
      {/* Add className="container" if defined in index.css */}
      <main className="container" style={{ flexGrow: 1 }}>
        {children}
      </main> 
    </div>
  );
};

export default MainLayout;