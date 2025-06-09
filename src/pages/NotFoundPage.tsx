import React from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="text-center">
        <Col>
          <div className="mb-4" style={{ fontSize: '8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            404
          </div>
          <h1 className="mb-3" style={{ color: 'var(--color-text-primary)' }}>
            ¡Ups! Página no encontrada
          </h1>
          <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
          <Button 
            onClick={handleGoHome}
            style={{
              backgroundColor: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
              padding: '0.5rem 2rem',
              fontSize: '1.1rem'
            }}
            className="px-4"
          >
            Volver al inicio
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;
