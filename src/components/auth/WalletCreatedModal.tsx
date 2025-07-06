import React, { useState } from 'react';
import { FaWallet, FaShieldAlt, FaEye, FaEyeSlash, FaCopy, FaExclamationTriangle, FaCheckCircle, FaCreditCard, FaArrowRight, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';

interface WalletCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletData?: {
    pin: string;
    address: string;
    balance: number;
    network: string;
  };
  // Backward compatibility
  pin?: string;
  walletAddress?: string;
}

export const WalletCreatedModal: React.FC<WalletCreatedModalProps> = ({
  isOpen,
  onClose,
  walletData,
  pin,
  walletAddress
}) => {
  const [showPin, setShowPin] = useState(false);
  const [pinSaved, setPinSaved] = useState(false);

  // Backward compatibility: create walletData from individual props if not provided
  const wallet = walletData || {
    pin: pin || '0000',
    address: walletAddress || '0x0000000000000000000000000000000000000000',
    balance: 0,
    network: 'BSC (BEP20)'
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const handleContinue = () => {
    if (pinSaved) {
      onClose();
    } else {
      toast.error('Por favor confirma que has guardado tu PIN');
    }
  };

  if (!isOpen) return null;

  const styles = `
    .letter-spacing-wide {
      letter-spacing: 0.25em;
    }
    
    .modal.fade.show {
      backdrop-filter: blur(3px);
    }
    
    .bg-gradient {
      background: linear-gradient(135deg, #28a745, #20c997) !important;
    }
  `;

  // Inject styles
  if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    if (!document.head.querySelector('style[data-wallet-modal]')) {
      styleElement.setAttribute('data-wallet-modal', 'true');
      document.head.appendChild(styleElement);
    }
  }

  return (
    <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg">
          {/* Header */}
          <div className="modal-header bg-gradient text-white p-4" style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
            <div className="w-100 text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-25 rounded-circle p-3 mb-3" style={{ width: '80px', height: '80px' }}>
                <FaWallet size={40} />
              </div>
              <h4 className="modal-title fw-bold mb-2">Bienvenido a tu Crypto Wallet</h4>
              <p className="mb-0 text-white-50">Tu wallet ha sido creada automáticamente como parte de nuestro servicio</p>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {/* Información de la wallet */}
            <div className="card border-success mb-4">
              <div className="card-header bg-success bg-opacity-10 border-success">
                <h6 className="card-title mb-0 text-success fw-bold">
                  <FaWallet className="me-2" />
                  Información de tu Wallet
                </h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Dirección:</span>
                      <div className="d-flex align-items-center">
                        <code className="text-success me-2">{truncateAddress(wallet.address)}</code>
                        <button
                          onClick={() => copyToClipboard(wallet.address, 'Dirección')}
                          className="btn btn-sm btn-outline-success p-1"
                        >
                          <FaCopy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PIN CRÍTICO */}
            <div className="card border-danger mb-4">
              <div className="card-header bg-danger bg-opacity-10 border-danger">
                <h6 className="card-title mb-0 text-danger fw-bold">
                  <FaExclamationTriangle className="me-2" />
                  EXTREMADAMENTE IMPORTANTE
                </h6>
              </div>
              <div className="card-body">
                <div className="alert alert-danger mb-3">
                  <div className="text-center">
                    <h6 className="alert-heading mb-3">
                      <FaLock className="me-2" />
                      Tu PIN de Acceso (4 dígitos)
                    </h6>
                    <div className="d-flex justify-content-center align-items-center">
                      <div className="bg-light border border-danger rounded p-3 me-3">
                        <span className="h2 font-monospace text-danger fw-bold letter-spacing-wide">
                          {showPin ? wallet.pin : '••••'}
                        </span>
                      </div>
                      <div className="d-flex flex-column">
                        <button
                          onClick={() => setShowPin(!showPin)}
                          className="btn btn-sm btn-outline-danger mb-2"
                          title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                        >
                          {showPin ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(wallet.pin, 'PIN')}
                          className="btn btn-sm btn-outline-danger"
                          title="Copiar PIN"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12">
                    <div className="d-flex align-items-start">
                      <FaShieldAlt className="text-danger me-2 mt-1" />
                      <div>
                        <h6 className="text-danger mb-1">Este PIN es IRRECUPERABLE</h6>
                        <p className="text-muted small mb-0">No podemos recuperarlo si lo pierdes. Guárdalo en un lugar seguro.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-warning mb-0">
                  <h6 className="alert-heading mb-2">Se requiere para:</h6>
                  <ul className="list-unstyled mb-0">
                    <li><FaCheckCircle className="text-success me-2" />Acceder a tu wallet</li>
                    <li><FaCheckCircle className="text-success me-2" />Realizar transferencias</li>
                    <li><FaCheckCircle className="text-success me-2" />Ver tu balance privado</li>
                    <li><FaCheckCircle className="text-success me-2" />Gestionar tu cuenta</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmación de guardado */}
            <div className="card border-primary mb-4">
              <div className="card-body">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="pinSaved"
                    checked={pinSaved}
                    onChange={(e) => setPinSaved(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="pinSaved">
                    <span className="fw-bold text-primary">Confirmo que he guardado mi PIN</span>
                    <br />
                    <small className="text-muted">
                      He copiado y guardado mi PIN de 4 dígitos en un lugar seguro. Entiendo que es irrecuperable.
                    </small>
                  </label>
                </div>
              </div>
            </div>

            {/* Próximos pasos */}
            <div className="card border-info mb-4">
              <div className="card-header bg-info bg-opacity-10 border-info">
                <h6 className="card-title mb-0 text-info fw-bold">
                  <FaArrowRight className="me-2" />
                  Próximos pasos
                </h6>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <FaCreditCard className="text-success me-2" />
                    Compra USDT con tu tarjeta de crédito
                  </li>
                  <li className="mb-0">
                    <FaArrowRight className="text-primary me-2" />
                    Transfiere crypto a otras wallets
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              onClick={handleContinue}
              disabled={!pinSaved}
              className={`btn btn-lg w-100 fw-bold ${
                pinSaved
                  ? 'btn-success'
                  : 'btn-secondary'
              }`}
            >
              {pinSaved ? (
                <>
                  <FaArrowRight className="me-2" />
                  Comenzar a usar mi Wallet
                </>
              ) : (
                <>
                  <FaExclamationTriangle className="me-2" />
                  Confirma que guardaste tu PIN
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 