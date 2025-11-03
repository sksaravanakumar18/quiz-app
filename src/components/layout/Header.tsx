import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
    title: string;
}

// Basic Header - Add styles in index.css or Header.css
const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header style={{ backgroundColor: '#2d3748', color: 'white', padding: '1rem' }}> {/* Example inline style */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.25rem', fontWeight: 'bold' }}>
            {title}
          </Link>
        </div>
        <div>
           <Link to="/settings" style={{ color: '#cbd5e0', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}
                 onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4a5568')}
                 onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
           >
              Settings
           </Link>
          {/* Add other nav links if needed */}
        </div>
      </nav>
    </header>
  );
};

export default Header;