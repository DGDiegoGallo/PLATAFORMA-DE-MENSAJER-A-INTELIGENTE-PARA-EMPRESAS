import React from 'react';
import { Container, Row, Col, Button, Card, Form, Alert, Badge, Nav, Tabs, Tab } from 'react-bootstrap';

const StylesShowcase: React.FC = () => {
  return (
    <Container className="py-5">
      <h1 className="mb-5 text-center">Guía de Estilos</h1>
      
      {/* Color Palette */}
      <section className="mb-5">
        <h2 className="mb-4">Paleta de Colores</h2>
        <Row>
          <Col md={3} className="mb-3">
            <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#F44123' }}>
              <h5 className="text-white mb-0">Principal</h5>
              <p className="text-white mb-0">#F44123</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#000000' }}>
              <h5 className="text-white mb-0">Primario Texto</h5>
              <p className="text-white mb-0">#000000</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#767179' }}>
              <h5 className="text-white mb-0">Secundario Texto</h5>
              <p className="text-white mb-0">#767179</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#EBC2BB', border: '1px solid #ddd' }}>
              <h5 className="mb-0">Stroke</h5>
              <p className="mb-0">#EBC2BB</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #ddd' }}>
              <h5 className="mb-0">Background Primario</h5>
              <p className="mb-0">#FFFFFF</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#EBEBEB', border: '1px solid #ddd' }}>
              <h5 className="mb-0">Background Secundario</h5>
              <p className="mb-0">#EBEBEB</p>
            </div>
          </Col>
          <Col md={3} className="mb-3">
            <div className="p-4 rounded shadow-sm" style={{ backgroundColor: '#484847' }}>
              <h5 className="text-white mb-0">Dark Icons</h5>
              <p className="text-white mb-0">#484847</p>
            </div>
          </Col>
        </Row>
      </section>

      {/* Typography */}
      <section className="mb-5">
        <h2 className="mb-4">Tipografía</h2>
        <Card className="p-4">
          <h1>Heading 1 - AG BODY</h1>
          <h2>Heading 2 - AG BODY</h2>
          <h3>Heading 3 - AG BODY</h3>
          <h4>Heading 4 - AG BODY</h4>
          <h5>Heading 5 - AG BODY</h5>
          <h6>Heading 6 - AG BODY</h6>
          <p className="mb-2">Párrafo normal - AG BODY</p>
          <p className="text-secondary mb-2">Párrafo secundario - AG BODY</p>
          <p><small>Texto pequeño - AG BODY</small></p>
        </Card>
      </section>

      {/* Buttons */}
      <section className="mb-5">
        <h2 className="mb-4">Botones</h2>
        <Row className="mb-3">
          <Col>
            <Button variant="primary" className="me-2 mb-2">Botón Principal</Button>
            <Button variant="outline-primary" className="me-2 mb-2">Botón Outline</Button>
            <Button variant="secondary" className="me-2 mb-2">Botón Secundario</Button>
            <Button variant="light" className="me-2 mb-2">Botón Light</Button>
            <Button variant="dark" className="me-2 mb-2">Botón Dark</Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <Button variant="primary" size="lg" className="me-2 mb-2">Botón Grande</Button>
            <Button variant="primary" className="me-2 mb-2">Botón Normal</Button>
            <Button variant="primary" size="sm" className="me-2 mb-2">Botón Pequeño</Button>
          </Col>
        </Row>
      </section>

      {/* Form Elements */}
      <section className="mb-5">
        <h2 className="mb-4">Elementos de Formulario</h2>
        <Form>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Campo de Texto</Form.Label>
                <Form.Control type="text" placeholder="Ingrese texto" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Campo con Error</Form.Label>
                <Form.Control type="text" placeholder="Ingrese texto" className="is-invalid" />
                <Form.Control.Feedback type="invalid">
                  Mensaje de error
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Select</Form.Label>
                <Form.Select>
                  <option>Seleccione una opción</option>
                  <option value="1">Opción 1</option>
                  <option value="2">Opción 2</option>
                  <option value="3">Opción 3</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Checkbox</Form.Label>
                <Form.Check type="checkbox" label="Checkbox 1" />
                <Form.Check type="checkbox" label="Checkbox 2" />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </section>

      {/* Cards */}
      <section className="mb-5">
        <h2 className="mb-4">Tarjetas</h2>
        <Row>
          <Col md={4} className="mb-3">
            <Card className="card-custom h-100">
              <Card.Header>Encabezado</Card.Header>
              <Card.Body>
                <Card.Title>Título de Tarjeta</Card.Title>
                <Card.Text>
                  Este es un ejemplo de una tarjeta con el estilo personalizado según la guía de colores.
                </Card.Text>
                <Button variant="primary">Acción</Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="h-100">
              <Card.Img variant="top" src="https://via.placeholder.com/300x150" />
              <Card.Body>
                <Card.Title>Tarjeta con Imagen</Card.Title>
                <Card.Text>
                  Ejemplo de tarjeta con imagen y contenido.
                </Card.Text>
                <Button variant="outline-primary">Ver Más</Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="bg-primary text-white h-100">
              <Card.Body>
                <Card.Title>Tarjeta Destacada</Card.Title>
                <Card.Text>
                  Esta tarjeta utiliza el color principal como fondo.
                </Card.Text>
                <Button variant="light">Acción</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      {/* Alerts */}
      <section className="mb-5">
        <h2 className="mb-4">Alertas</h2>
        <Alert variant="primary">
          Esta es una alerta primaria
        </Alert>
        <Alert variant="success">
          Esta es una alerta de éxito
        </Alert>
        <Alert variant="danger">
          Esta es una alerta de error
        </Alert>
        <Alert variant="warning">
          Esta es una alerta de advertencia
        </Alert>
      </section>

      {/* Badges */}
      <section className="mb-5">
        <h2 className="mb-4">Badges</h2>
        <h4>
          Ejemplo <Badge bg="primary">Nuevo</Badge>
        </h4>
        <Button variant="primary">
          Notificaciones <Badge bg="light" text="dark">4</Badge>
        </Button>
      </section>

      {/* Navigation */}
      <section className="mb-5">
        <h2 className="mb-4">Navegación</h2>
        <Nav className="mb-3">
          <Nav.Item>
            <Nav.Link className="active">Inicio</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link>Mensajes</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link>Perfil</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link>Configuración</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tabs defaultActiveKey="home" className="mb-3">
          <Tab eventKey="home" title="Inicio">
            <p className="p-3 bg-light">Contenido de la pestaña Inicio</p>
          </Tab>
          <Tab eventKey="profile" title="Perfil">
            <p className="p-3 bg-light">Contenido de la pestaña Perfil</p>
          </Tab>
          <Tab eventKey="contact" title="Contacto">
            <p className="p-3 bg-light">Contenido de la pestaña Contacto</p>
          </Tab>
        </Tabs>
      </section>
    </Container>
  );
};

export default StylesShowcase;
