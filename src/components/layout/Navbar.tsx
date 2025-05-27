import React from 'react';
import { Container, Navbar as BootstrapNavbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCommentAlt, FaBell, FaUser } from 'react-icons/fa';

const Navbar: React.FC = () => {
  return (
    <BootstrapNavbar className="bg-white py-2 shadow-sm" style={{ borderBottom: '1px solid var(--color-stroke)' }}>
      <Container fluid className="px-4">
        <div className="d-flex justify-content-between align-items-center w-100">
          {/* Logo section */}
          <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span className="text-uppercase fw-bold fs-4" style={{ color: 'var(--color-dark-icons)' }}>
              YIELIT
            </span>
          </BootstrapNavbar.Brand>
          
          {/* Right section with icons and user */}
          <div className="d-flex align-items-center">
            {/* Messages icon */}
            <button className="btn btn-link p-1 me-3 position-relative" style={{ color: 'var(--color-dark-icons)' }}>
              <FaCommentAlt size={18} />
            </button>
            
            {/* Notifications icon */}
            <button className="btn btn-link p-1 me-3 position-relative" style={{ color: 'var(--color-dark-icons)' }}>
              <FaBell size={18} />
            </button>
            
            {/* User profile */}
            <div className="d-flex align-items-center">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center" 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  backgroundColor: 'var(--color-background-secondary)',
                  color: 'var(--color-dark-icons)'
                }}
              >
                <FaUser size={16} />
              </div>
              <span className="ms-2" style={{ color: 'var(--color-dark-icons)', fontSize: '14px' }}>
                Nombre del agente
              </span>
            </div>
          </div>
        </div>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
