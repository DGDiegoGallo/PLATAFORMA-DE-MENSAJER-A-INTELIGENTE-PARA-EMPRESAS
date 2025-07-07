import React, { useState } from 'react';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import LoadingModal from './LoadingModal';

const LoadingModalDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleShowLoading = () => {
    setShowModal(true);
    setIsLoading(true);
    
    // Simular carga de 3 segundos
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const handleShowSuccess = () => {
    setShowModal(true);
    setIsLoading(false);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h3 className="mb-4 text-center">Demo del LoadingModal</h3>
              <p className="text-center text-muted mb-4">
                Prueba las diferentes funcionalidades del modal de carga y éxito
              </p>
              
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Button 
                  variant="primary" 
                  onClick={handleShowLoading}
                  disabled={showModal}
                >
                  Mostrar Carga (3s)
                </Button>
                
                <Button 
                  variant="success" 
                  onClick={handleShowSuccess}
                  disabled={showModal}
                >
                  Mostrar Éxito
                </Button>
                
                <Button 
                  variant="secondary" 
                  onClick={handleClose}
                  disabled={!showModal}
                >
                  Cerrar Modal
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <small className="text-muted">
                  Estado actual: {showModal ? (isLoading ? 'Cargando...' : 'Éxito') : 'Cerrado'}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <LoadingModal
        show={showModal}
        isLoading={isLoading}
        loadingText="Procesando datos..."
        successText="¡Operación completada!"
        loadingSubtext="Por favor, espere mientras procesamos su solicitud"
        successSubtext="La operación se ha completado exitosamente"
        onClose={handleClose}
        autoCloseDelay={5000}
      />
    </Container>
  );
};

export default LoadingModalDemo; 