import React from 'react';
import { Container, Navbar as BootstrapNavbar } from 'react-bootstrap';
import UserMenu from '../common/UserMenu';
import NotificationsMenu from '../common/NotificationsMenu';
import { Link } from 'react-router-dom';


const Navbar: React.FC = () => {
  return (
    <BootstrapNavbar className="bg-white py-2 shadow-sm" style={{ borderBottom: '1px solid var(--color-stroke)' }}>
      <Container fluid className="px-4">
        <div className="d-flex justify-content-between align-items-center w-100">
          {/* Logo section */}
          <BootstrapNavbar.Brand as={Link} to="/company/dashboard" className="d-flex align-items-center">
            <span className="text-uppercase fw-bold fs-4" style={{ color: 'var(--color-dark-icons)' }}>
              YIELIT
            </span>
          </BootstrapNavbar.Brand>
          
          {/* Right section */}
          <div className="d-flex align-items-center">
            <NotificationsMenu />
            <UserMenu />
          </div>
        </div>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
