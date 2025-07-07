import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaRocket, 
  FaUsers, 
  FaChartLine, 
  FaShieldAlt, 
  FaBolt, 
  FaHeart,
  FaCheck,
  FaStar,
  FaQuoteLeft,
  FaArrowRight,
  FaBrain,
  FaGlobe,
  FaMobile,
  FaComments,
  FaUser
} from 'react-icons/fa';
import AnimatedChat from '../components/molecules/AnimatedChat';
import logo from '../assets/images/Logotipo.Preferente 1.png';

const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-vh-100">
      {/* Header - Navbar completamente nueva */}
      <header 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: isScrolled ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          padding: '12px 0',
          boxShadow: isScrolled ? '0 2px 10px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Logo */}
          <Link 
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <FaComments 
              size={28} 
              color={isScrolled ? '#F44123' : '#ffffff'}
              style={{ marginRight: '8px' }}
            />
            <img 
              src={logo} 
              alt="Yielit Logo" 
              height="28"
            />
          </Link>

          {/* Navigation Menu - Desktop */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '30px'
            }}
          >
            {/* Menu Items */}
            <nav style={{ display: 'flex', gap: '25px' }}>
              <button 
                onClick={() => scrollToSection('features')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isScrolled ? '#333333' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isScrolled ? 'rgba(244, 65, 35, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Características
              </button>
              <button 
                onClick={() => scrollToSection('crypto')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isScrolled ? '#333333' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isScrolled ? 'rgba(244, 65, 35, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Crypto
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isScrolled ? '#333333' : '#ffffff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isScrolled ? 'rgba(244, 65, 35, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Testimonios
              </button>
            </nav>

            {/* Auth Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link 
                to="/auth/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  border: `2px solid ${isScrolled ? '#F44123' : '#ffffff'}`,
                  color: isScrolled ? '#F44123' : '#ffffff',
                  backgroundColor: 'transparent',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isScrolled ? '#F44123' : '#ffffff';
                  e.currentTarget.style.color = isScrolled ? '#ffffff' : '#F44123';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = isScrolled ? '#F44123' : '#ffffff';
                }}
              >
                <FaUser size={12} style={{ marginRight: '6px' }} />
                Iniciar Sesión
              </Link>
              
              <Link 
                to="/auth/register"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  border: `2px solid ${isScrolled ? '#F44123' : '#ffffff'}`,
                  backgroundColor: isScrolled ? '#F44123' : '#ffffff',
                  color: isScrolled ? '#ffffff' : '#F44123',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="min-vh-100 d-flex align-items-center position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #FF6B4A  50%, #FF8E7A 100%)',
        }}
      >
        {/* Background decorative elements */}
        <div className="position-absolute w-100 h-100">
          <div 
            className="position-absolute rounded-circle opacity-10"
            style={{
              width: '500px',
              height: '500px',
              background: 'white',
              top: '-250px',
              right: '-250px'
            }}
          ></div>
          <div 
            className="position-absolute rounded-circle opacity-5"
            style={{
              width: '300px',
              height: '300px',
              background: 'white',
              bottom: '-150px',
              left: '-150px'
            }}
          ></div>
        </div>

        <div className="container position-relative">
          <div className="row align-items-center">
            <div className="col-lg-6 text-white">
              <div className="mb-4">
                <span 
                  className="badge rounded-pill px-3 py-2 mb-3"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <FaBolt className="me-2" />
                  Plataforma IA Empresarial
                </span>
              </div>
              
              <h1 className="display-3 fw-bold mb-4">
                Comunícate de forma 
                <span className="d-block" style={{ color: '#FFE5D9' }}>
                  inteligente
                </span>
                con tu equipo
              </h1>
              
              <p className="lead mb-4 opacity-90">
                Optimiza la colaboración, integra IA en tus conversaciones y toma decisiones 
                basadas en datos con nuestra plataforma de mensajería empresarial.
              </p>
              
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Link 
                  to="/auth/register" 
                  className="btn btn-light btn-lg px-4 py-3"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <FaRocket className="me-2" />
                  Comenzar Gratis
                </Link>
              </div>
              
              <div className="d-flex align-items-center gap-4 text-sm opacity-80">
                <div className="d-flex align-items-center">
                  <FaCheck className="me-2 text-success" />
                  14 días gratis
                </div>
                <div className="d-flex align-items-center">
                  <FaCheck className="me-2 text-success" />
                  Sin tarjeta de crédito
                </div>
                <div className="d-flex align-items-center">
                  <FaCheck className="me-2 text-success" />
                  Cancelación instantánea
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mt-5 mt-lg-0">
              <div className="position-relative">
          <AnimatedChat />
                {/* Floating elements */}
                <div 
                  className="position-absolute bg-white rounded-3 shadow-lg p-3 d-flex align-items-center"
                  style={{ 
                    top: '20px', 
                    left: '-20px',
                    animation: 'float 3s ease-in-out infinite'
                  }}
                >
                  <FaBrain className="text-primary me-2" />
                  <span className="small fw-bold">IA Integrada</span>
                </div>
                <div 
                  className="position-absolute bg-white rounded-3 shadow-lg p-3 d-flex align-items-center"
                  style={{ 
                    bottom: '20px', 
                    right: '-20px',
                    animation: 'float 3s ease-in-out infinite 1s'
                  }}
                >
                  <FaShieldAlt className="text-success me-2" />
                  <span className="small fw-bold">100% Seguro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Características Poderosas
            </h2>
            <p className="lead text-secondary">
              Todo lo que necesitas para revolucionar la comunicación empresarial
            </p>
          </div>
          
          <div className="row g-4">
            {[
              {
                icon: <FaBrain />,
                title: 'Inteligencia Artificial',
                description: 'IA integrada que analiza conversaciones y sugiere mejoras automáticamente.'
              },
              {
                icon: <FaUsers />,
                title: 'Colaboración en Tiempo Real',
                description: 'Trabaja con tu equipo de forma sincronizada con actualizaciones instantáneas.'
              },
              {
                icon: <FaChartLine />,
                title: 'Analytics Avanzados',
                description: 'Métricas detalladas para optimizar la productividad de tu equipo.'
              },
              {
                icon: <FaShieldAlt />,
                title: 'Seguridad Empresarial',
                description: 'Cifrado end-to-end y cumplimiento de estándares de seguridad.'
              },
              {
                icon: <FaGlobe />,
                title: 'Acceso Global',
                description: 'Conecta equipos remotos desde cualquier parte del mundo.'
              },
              {
                icon: <FaMobile />,
                title: 'Multiplataforma',
                description: 'Disponible en web, móvil y escritorio para máxima flexibilidad.'
              }
            ].map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div 
                  className="card h-100 border-0 shadow-sm hover-lift"
                  style={{ transition: 'transform 0.3s ease' }}
                >
                  <div className="card-body text-center p-4">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ 
                        width: '60px', 
                        height: '60px',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h5 className="fw-bold mb-3">{feature.title}</h5>
                    <p className="text-secondary">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        className="py-5"
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <div className="container">
          <div className="row text-center">
            {[
              { number: '10K+', label: 'Empresas Activas' },
              { number: '500K+', label: 'Usuarios Registrados' },
              { number: '99.9%', label: 'Tiempo de Actividad' },
              { number: '24/7', label: 'Soporte Técnico' }
            ].map((stat, index) => (
              <div key={index} className="col-6 col-md-3 mb-4">
                <h3 className="display-6 fw-bold" style={{ color: 'var(--color-primary)' }}>
                  {stat.number}
                </h3>
                <p className="text-secondary fw-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crypto Features Highlight */}
      <section id="crypto" className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div 
                className="card border-0 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #FF6B4A 100%)',
                }}
              >
                <div className="card-body text-white p-5">
                  <div className="row align-items-center">
                    <div className="col-lg-8">
                      <h3 className="fw-bold mb-3">
                        🔐 Crypto Wallet USDT Integrada
                      </h3>
                      <p className="mb-3 opacity-90">
                        La primera plataforma de mensajería empresarial con wallet de criptomonedas integrada. 
                        Compra, transfiere y gestiona USDT directamente desde tu espacio de trabajo.
                      </p>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaCheck className="me-2 text-success" />
                            <span className="small">Compra USDT con tarjeta</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaCheck className="me-2 text-success" />
                            <span className="small">Transferencias instantáneas</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaCheck className="me-2 text-success" />
                            <span className="small">Múltiples redes (BSC, ETH, TRX)</span>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="d-flex align-items-center">
                            <FaCheck className="me-2 text-success" />
                            <span className="small">Seguridad bancaria</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 text-center">
                      <div 
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ 
                          width: '100px', 
                          height: '100px',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <span style={{ fontSize: '3rem' }}>₮</span>
                      </div>
                      <h4 className="fw-bold">USDT</h4>
                      <p className="small opacity-80">Moneda estable digital</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        id="testimonials" 
        className="py-5"
        style={{ backgroundColor: 'var(--color-background-secondary)' }}
      >
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Lo que Dicen Nuestros Clientes</h2>
            <p className="lead text-secondary">Miles de empresas confían en Yielit</p>
          </div>
          
          <div className="row g-4">
            {[
              {
                quote: "Yielit transformó nuestra comunicación y pagos internacionales. Ahora transferimos USDT entre oficinas en segundos, todo desde el mismo chat.",
                author: "María González",
                position: "CEO, TechStart",
                rating: 5
              },
              {
                quote: "La wallet USDT integrada es revolucionaria. Eliminamos los bancos tradicionales para pagos a freelancers. Ahorro del 70% en comisiones.",
                author: "Carlos Ramírez",
                position: "Director de IT, GlobalCorp",
                rating: 5
              },
              {
                quote: "Increíble poder chatear y enviar cripto al mismo tiempo. La IA optimiza nuestras transacciones y el equipo se adaptó instantáneamente.",
                author: "Ana Silva",
                position: "Project Manager, InnovateHub",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <FaQuoteLeft 
                      className="mb-3" 
                      style={{ color: 'var(--color-primary)', fontSize: '2rem' }}
                    />
                    <p className="mb-4">{testimonial.quote}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold mb-0">{testimonial.author}</h6>
                        <small className="text-secondary">{testimonial.position}</small>
                      </div>
                      <div>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <FaStar key={i} className="text-warning" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-5"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #FF6B4A 100%)',
        }}
      >
        <div className="container text-center text-white">
          <h2 className="display-5 fw-bold mb-3">
            ¿Listo para Revolucionar tu Comunicación?
          </h2>
          <p className="lead mb-4 opacity-90">
            Únete a miles de empresas que ya transformaron su productividad
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/register" className="btn btn-light btn-lg px-4 py-3">
              <FaRocket className="me-2" />
              Comenzar Ahora
            </Link>
            <button 
              className="btn btn-outline-light btn-lg px-4 py-3"
              onClick={() => scrollToSection('features')}
            >
              Conocer Más
              <FaArrowRight className="ms-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer 
        className="py-5"
        style={{ backgroundColor: '#1a1a1a' }}
      >
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-3">
                <FaComments 
                  size={32} 
                  style={{ color: 'var(--color-primary)' }}
                  className="me-2"
                />
                <img src={logo} alt="Yielit Logo" height="32" />
              </div>
              <p className="text-secondary">
                La plataforma de mensajería empresarial más avanzada con IA y Crypto Wallet USDT integrada.
              </p>
            </div>
            
            <div className="col-md-3">
              <h6 className="text-white fw-bold mb-3">Características</h6>
              <ul className="list-unstyled">
                <li><button className="btn btn-link text-secondary p-0 text-decoration-none" onClick={() => scrollToSection('features')}>Características</button></li>
                <li><button className="btn btn-link text-secondary p-0 text-decoration-none" onClick={() => scrollToSection('crypto')}>Crypto</button></li>
                <li><Link to="/auth/register" className="btn btn-link text-secondary p-0 text-decoration-none">Prueba Gratuita</Link></li>
              </ul>
            </div>
            
            <div className="col-md-3">
              <h6 className="text-white fw-bold mb-3">Soporte</h6>
              <ul className="list-unstyled">
                <li><Link to="/support" className="btn btn-link text-secondary p-0 text-decoration-none">Centro de Ayuda</Link></li>
                <li><Link to="/contact" className="btn btn-link text-secondary p-0 text-decoration-none">Contacto</Link></li>
              </ul>
            </div>
          </div>
          
          <hr className="my-4" style={{ borderColor: '#333' }} />
          
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <p className="text-secondary mb-0">
              &copy; {new Date().getFullYear()} Yielit. Todos los derechos reservados.
            </p>
            <p className="text-secondary mb-0 small">
              Hecho con <FaHeart className="text-danger mx-1" /> para empresas innovadoras
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .hover-lift:hover {
            transform: translateY(-5px) !important;
          }
          
          .transition-all {
            transition: all 0.3s ease !important;
          }
          
          html {
            scroll-behavior: smooth;
          }
          
          .btn-link:hover {
            color: var(--color-primary) !important;
          }
          
          .navbar-nav .btn-link {
            border: none !important;
            padding: 0.5rem 1rem !important;
          }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
