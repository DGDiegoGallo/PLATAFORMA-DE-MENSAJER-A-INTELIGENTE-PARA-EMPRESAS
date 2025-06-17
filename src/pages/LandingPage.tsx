import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedChat from '../components/molecules/AnimatedChat';
import logo from '../assets/images/Logotipo.Preferente 1.png';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-primario text-primario-texto font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <img src={logo} alt="Yielit Logo" className="h-8" />
        <nav>
          <Link to="/login" className="text-secundario-texto hover:text-principal mx-2">Iniciar Sesión</Link>
          <Link to="/register" className="bg-principal text-white px-4 py-2 rounded-md hover:opacity-90 mx-2">Registrarse</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 text-center flex flex-col md:flex-row items-center justify-center">
        <div className="md:w-1/2 md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Comunícate de forma <span className="text-principal">inteligente</span> con tu equipo</h1>
          <p className="text-lg text-secundario-texto mb-8">Optimiza la colaboración, integra IA en tus conversaciones y toma decisiones basadas en datos con nuestra plataforma de mensajería para empresas.</p>
          <Link to="/register" className="bg-principal text-white px-6 py-3 rounded-md text-lg hover:opacity-90">Comenzar ahora</Link>
        </div>
        <div className="md:w-1/2 mt-12 md:mt-0">
          <AnimatedChat />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background-secundario py-6 mt-16">
        <div className="container mx-auto px-6 text-center text-secundario-texto">
          <p>&copy; {new Date().getFullYear()} Yielit. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
