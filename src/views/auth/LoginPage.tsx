import React, { useState } from 'react';
import './LoginPage.css';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAuth from '../../features/auth/hooks/useAuth';
import { LoginCredentials } from '../../features/auth/types/auth.types';

const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      const response = await login(credentials);
      
      // Determinar la ruta basada en el rol del usuario
      const userRole = response?.user?.rol || response?.user?.role?.name || 'user';
      
      if (['admin', 'superadmin', 'administrator'].includes(userRole.toLowerCase())) {
        window.location.href = '/admin/dashboard';
      } else if (userRole === 'agent') {
        window.location.href = '/agent/dashboard';
      } else {
        window.location.href = '/company/dashboard';
      }
    } catch (err) {
      console.error('Error de login:', err);
      // El error ya se maneja en el hook useAuth
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      padding: '1rem',
      backgroundColor: '#FFFFFF'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
        border: '1px solid #EBC2BB',
        padding: '1.5rem'
      }}>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '1.25rem',
          direction: 'ltr'
        }}>
          <h2 
            className="animate__animated animate__fadeIn"
            style={{ 
              fontWeight: 'bold', 
              color: '#000000',
              marginBottom: '0.5rem',
              direction: 'ltr',
              textAlign: 'center',
              display: 'block',
              fontSize: '1.75rem'
            }}
          >Iniciar Sesión</h2>
          
          <p style={{ 
            color: '#767179',
            marginBottom: '0',
            direction: 'ltr',
            textAlign: 'center',
            display: 'block',
            fontSize: '1rem'
          }}>Accede a tu cuenta para continuar</p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1.25rem',
            marginBottom: '1rem',
            border: '1px solid #f5c2c7',
            borderRadius: '0.25rem',
            backgroundColor: '#f8d7da',
            color: '#842029'
          }}>
            {error}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} style={{ direction: 'ltr' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label 
              htmlFor="formEmail" 
              style={{ 
                display: 'block', 
                marginBottom: '0.25rem',
                fontWeight: '500',
                color: '#000000',
                direction: 'ltr',
                textAlign: 'left',
                fontSize: '1.2rem'
              }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              id="formEmail"
              name="email"
              placeholder="correo@ejemplo.com"
              value={credentials.email}
              onChange={handleChange}
              required
              className="animate__animated animate__fadeIn"
              style={{
                display: 'block',
                width: '100%',
                padding: '0.375rem 0.5rem',
                fontSize: '1.2rem',
                fontWeight: '400',
                lineHeight: '1.4',
                color: '#212529',
                backgroundColor: '#fff',
                backgroundClip: 'padding-box',
                border: '1px solid #EBC2BB',
                borderRadius: '0.25rem',
                transition: 'all 0.3s ease',
                direction: 'ltr'
              }}
            />
            {validated && !credentials.email && (
              <div style={{ color: '#dc3545', marginTop: '0.25rem', fontSize: '1rem' }}>
                Por favor ingresa un correo electrónico válido.
              </div>
            )}
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label 
              htmlFor="formPassword" 
              style={{ 
                display: 'block', 
                marginBottom: '0.25rem',
                fontWeight: '500',
                color: '#000000',
                direction: 'ltr',
                textAlign: 'left',
                fontSize: '1.2rem'
              }}
            >
              Contraseña
            </label>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'stretch',
              width: '100%'
            }}>
              <input
                type={showPassword ? "text" : "password"}
                id="formPassword"
                name="password"
                placeholder="Contraseña"
                value={credentials.password}
                required
                minLength={1}
                onChange={handleChange}
                style={{
                  display: 'block',
                  flex: '1 1 auto',
                  width: '1%',
                  padding: '0.375rem 0.5rem',
                  fontSize: '1rem',
                  fontWeight: '400',
                  lineHeight: '1.4',
                  color: '#212529',
                  backgroundColor: '#fff',
                  backgroundClip: 'padding-box',
                  border: '1px solid #EBC2BB',
                  borderRadius: '0.25rem 0 0 0.25rem',
                  transition: 'all 0.3s ease',
                  direction: 'ltr'
                }}
              />
              <button 
                type="button" 
                onClick={togglePasswordVisibility}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.375rem 0.5rem',
                  fontSize: '1rem',
                  fontWeight: '400',
                  lineHeight: '1.4',
                  color: '#767179',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  border: '1px solid #EBC2BB',
                  borderRadius: '0 0.25rem 0.25rem 0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {validated && !credentials.password && (
              <div style={{ color: '#dc3545', marginTop: '0.25rem', fontSize: '0.75em' }}>
                La contraseña debe tener al menos 6 caracteres.
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem',
            direction: 'ltr'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={credentials.rememberMe}
                onChange={handleChange}
                style={{ marginRight: '0.3rem' }}
              />
              <label 
                htmlFor="rememberMe" 
                style={{ 
                  margin: 0,
                  color: '#000000',
                  direction: 'ltr',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                }}
              >
                Recuérdame
              </label>
            </div>
            <Link 
              to="/auth/forgot-password" 
              style={{ 
                color: '#F44123', 
                textDecoration: 'none',
                direction: 'ltr',
                textAlign: 'right',
                display: 'block',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease'
              }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="animate__animated animate__fadeIn"
            style={{ 
              display: 'block',
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              fontWeight: '500',
              lineHeight: '1.4',
              color: '#fff',
              textAlign: 'center',
              textDecoration: 'none',
              backgroundColor: '#F44123',
              border: '1px solid #F44123',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              direction: 'ltr',
              marginBottom: '0.75rem'
            }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '0.5rem',
            direction: 'ltr'
          }}>
            <p style={{ 
              margin: 0,
              direction: 'ltr',
              textAlign: 'center',
              display: 'block',
              fontSize: '0.8rem'
            }}>
              ¿No tienes cuenta? <Link 
                to="/auth/register" 
                style={{ 
                  color: '#F44123', 
                  textDecoration: 'none', 
                  fontWeight: '500',
                  direction: 'ltr'
                }}
              >Crear una cuenta</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
