import React, { useState } from 'react';
import './LoginPage.css'; // Reutilizamos los estilos de LoginPage
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import useAuth from '../../features/auth/hooks/useAuth';
import { RegisterCredentials } from '../../features/auth/types/register.types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validated, setValidated] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Verificar que las contraseñas coincidan cuando se modifica alguna de ellas
    if (name === 'password' || name === 'confirmPassword') {
      const password = name === 'password' ? value : credentials.password;
      const confirmPassword = name === 'confirmPassword' ? value : credentials.confirmPassword;
      setPasswordsMatch(password === confirmPassword || confirmPassword === '');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const form = e.currentTarget;
    if (form.checkValidity() === false || !passwordsMatch || !credentials.termsAccepted) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    try {
      await register(credentials);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error de registro:', err);
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
          >Crear Cuenta</h2>
          
          <p style={{ 
            color: '#767179',
            marginBottom: '0',
            direction: 'ltr',
            textAlign: 'center',
            display: 'block',
            fontSize: '1rem'
          }}>Regístrate para comenzar</p>
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
          {/* Campo de Nombre de Usuario */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label 
              htmlFor="formUsername" 
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
              Nombre de usuario
            </label>
            <input
              type="text"
              id="formUsername"
              name="username"
              placeholder="Tu nombre de usuario"
              value={credentials.username}
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
            {validated && !credentials.username && (
              <div style={{ color: '#dc3545', marginTop: '0.25rem', fontSize: '1rem' }}>
                Por favor ingresa un nombre de usuario.
              </div>
            )}
          </div>

          {/* Campo de Email */}
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

          {/* Campo de Contraseña */}
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
                onChange={handleChange}
                required
                minLength={6}
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

          {/* Campo de Confirmar Contraseña */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label 
              htmlFor="formConfirmPassword" 
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
              Confirmar Contraseña
            </label>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'stretch',
              width: '100%'
            }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="formConfirmPassword"
                name="confirmPassword"
                placeholder="Confirmar Contraseña"
                value={credentials.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
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
                onClick={toggleConfirmPasswordVisibility}
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
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {validated && !credentials.confirmPassword && (
              <div style={{ color: '#dc3545', marginTop: '0.25rem', fontSize: '0.75em' }}>
                Por favor confirma tu contraseña.
              </div>
            )}
            {validated && credentials.confirmPassword && !passwordsMatch && (
              <div style={{ color: '#dc3545', marginTop: '0.25rem', fontSize: '0.75em' }}>
                Las contraseñas no coinciden.
              </div>
            )}
          </div>

          {/* Aceptación de Términos */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '1rem',
            direction: 'ltr'
          }}>
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={credentials.termsAccepted}
              onChange={handleChange}
              style={{ marginRight: '0.3rem' }}
            />
            <label 
              htmlFor="termsAccepted" 
              style={{ 
                margin: 0,
                color: '#000000',
                direction: 'ltr',
                textAlign: 'left',
                fontSize: '0.9rem'
              }}
            >
              Acepto los <Link 
                to="/terms" 
                style={{ 
                  color: '#F44123', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >Términos y Condiciones</Link>
            </label>
          </div>
          {validated && !credentials.termsAccepted && (
            <div style={{ color: '#dc3545', marginTop: '-0.5rem', marginBottom: '1rem', fontSize: '0.75em' }}>
              Debes aceptar los términos y condiciones para continuar.
            </div>
          )}

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
            {isLoading ? 'Registrando...' : 'Crear cuenta'}
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
              ¿Ya tienes cuenta? <Link 
                to="/auth/login" 
                style={{ 
                  color: '#F44123', 
                  textDecoration: 'none', 
                  fontWeight: '500',
                  direction: 'ltr'
                }}
              >Iniciar sesión</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
