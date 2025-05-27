import React, { ReactNode } from 'react';
import { Container } from 'react-bootstrap';
import Navbar from './layout/Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      <main className="flex-grow-1">
        {children}
      </main>
      
      <footer className="bg-dark text-white py-4 mt-auto">
        <Container>
          <div className="d-flex justify-content-between">
            <div>
              <p className="mb-0">&copy; 2025 Plataforma de Mensajería Inteligente</p>
            </div>
            <div>
              <ul className="list-unstyled d-flex mb-0">
                <li className="me-3">
                  <a href="#" className="text-white text-decoration-none">Términos</a>
                </li>
                <li>
                  <a href="#" className="text-white text-decoration-none">Privacidad</a>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Layout;
