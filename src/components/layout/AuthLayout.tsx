import React, { ReactNode } from 'react';
import { Container } from 'react-bootstrap';

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Layout específico para páginas de autenticación
 * No incluye navbar ni footer para una experiencia más limpia
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Container>
        {children}
      </Container>
    </div>
  );
};

export default AuthLayout;
