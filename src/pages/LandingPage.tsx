import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedChat from '../components/molecules/AnimatedChat';
import logo from '../assets/images/Logotipo.Preferente 1.png';

const LandingPage: React.FC = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light text-dark">
      {/* Header */}
      <header className="container py-4 d-flex justify-content-between align-items-center px-3">
        <img src={logo} alt="Yielit Logo" className="h-8" />
        <nav>
          <Link to="/login" className="btn btn-outline-primary mx-2">Iniciar Sesión</Link>
          <Link to="/register" className="btn btn-primary mx-2">Registrarse</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container py-5 text-center d-flex flex-column flex-md-row align-items-center justify-content-center flex-grow-1">
        <div className="col-md-6 text-md-start">
          <h1 className="display-4 fw-bold mb-4">Comunícate de forma <span className="text-principal">inteligente</span> con tu equipo</h1>
          <p className="lead text-secondary mb-4">Optimiza la colaboración, integra IA en tus conversaciones y toma decisiones basadas en datos con nuestra plataforma de mensajería para empresas.</p>
          <Link to="/register" className="btn btn-primary btn-lg">Comenzar ahora</Link>
        </div>
        <div className="col-md-6 mt-5 mt-md-0">
          <AnimatedChat />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} Yielit. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
