import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../features/auth/hooks/useAuth';
import { RegisterCredentials } from '../../features/auth/types/register.types';
import InputField from '../../components/common/InputField';
import PasswordField from '../../components/common/PasswordField';
import { WalletCreatedModal } from '../../components/auth/WalletCreatedModal';

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();

  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '',
    email: '',
    phone: '',
    fullName: '',
    idType: 'DNI',
    idNumber: '',
    address: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  // Estado para el modal de wallet creada
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletData, setWalletData] = useState<{
    pin: string;
    walletAddress: string;
  } | null>(null);

  // Eliminada validación HTML5 adicional

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Determine the correct value depending on the type of control
    const newValue =
      e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
        ? e.target.checked
        : value;

    setCredentials((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      console.log('🚀 Iniciando proceso de registro...');
      const response = await register(credentials);
      
      // Verificar si se creó la wallet automáticamente
      if (response.walletData) {
        console.log('🎉 Wallet creada durante el registro, mostrando modal:', response.walletData);
        setWalletData({
          pin: response.walletData.pin,
          walletAddress: response.walletData.wallet.wallet_address
        });
        setShowWalletModal(true);
      } else {
        console.log('⚠️ No se encontraron datos de wallet, navegando directamente...');
        // Si no hay datos de wallet, navegar directamente
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('❌ Error durante el registro:', error);
      /* error handled in useAuth */
    }
  };

  const handleWalletModalClose = () => {
    console.log('📱 Usuario confirmó que guardó el PIN, navegando al dashboard...');
    setShowWalletModal(false);
    setWalletData(null);
    navigate('/dashboard');
  };

  const passwordsMatch =
    credentials.password === credentials.confirmPassword ||
    credentials.confirmPassword === '';

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white p-3">
      <div className="card shadow-sm border-1" style={{ maxWidth: 800, width: '100%' }}>
        <div className="card-body">
          <h2 className="text-center fw-bold mb-2">Crear Cuenta</h2>
          <p className="text-center text-muted mb-4">Regístrate para comenzar</p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row row-cols-1 row-cols-md-2 g-3">
              <InputField
                label="Nombre de usuario"
                name="username"
                placeholder="Tu nombre de usuario"
                value={credentials.username}
                onChange={handleChange}
              />

              <InputField
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={credentials.email}
                onChange={handleChange}
              />

              <InputField
                label="Número de teléfono"
                name="phone"
                placeholder="+00 000 000 0000"
                value={credentials.phone}
                onChange={handleChange}
              />

              <InputField
                label="Nombre completo"
                name="fullName"
                placeholder="Nombre y Apellido"
                value={credentials.fullName}
                onChange={handleChange}
              />

              {/* Tipo de identificación */}
              <div className="mb-3">
                <label htmlFor="idType" className="form-label fw-medium">
                  Tipo de identificación
                </label>
                <select
                  id="idType"
                  name="idType"
                  className="form-select"
                  value={credentials.idType}
                  onChange={handleChange}
                >
                  <option value="DNI">DNI</option>
                  <option value="PAS">Pasaporte</option>
                  <option value="RUC">RUC</option>
                </select>
              </div>

              <InputField
                label="Número de identificación"
                name="idNumber"
                placeholder="00000000"
                value={credentials.idNumber}
                onChange={handleChange}
              />

              <InputField
                label="Dirección"
                name="address"
                placeholder="Ciudad, Calle, Residencia"
                value={credentials.address}
                onChange={handleChange}
              />

              <InputField
                label="Fecha de nacimiento"
                name="birthDate"
                type="date"
                value={credentials.birthDate}
                onChange={handleChange}
              />

              <PasswordField
                label="Contraseña"
                name="password"
                placeholder="Contraseña"
                value={credentials.password}
                onChange={handleChange}
                required
                minLength={6}
              />

              <PasswordField
                label="Confirmar contraseña"
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                value={credentials.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
              {!passwordsMatch && (
                <div className="col-12 text-danger small">
                  Las contraseñas no coinciden.
                </div>
              )}
            </div>

            {/* Términos */}
            <div className="form-check mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="termsAccepted"
                name="termsAccepted"
                checked={credentials.termsAccepted}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="termsAccepted">
                Acepto los{' '}
                <Link to="/terms" className="text-decoration-none text-primary fw-medium">
                  Términos y Condiciones
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mt-3"
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'Crear cuenta'}
            </button>

            <p className="text-center mt-3 small">
              ¿Ya tienes cuenta?{' '}
              <Link to="/auth/login" className="text-decoration-none fw-medium">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Modal para mostrar PIN de wallet creada */}
      {showWalletModal && walletData && (
        <WalletCreatedModal
          isOpen={showWalletModal}
          onClose={handleWalletModalClose}
          pin={walletData.pin}
          walletAddress={walletData.walletAddress}
        />
      )}
    </div>
  );
};

export default RegisterForm;
