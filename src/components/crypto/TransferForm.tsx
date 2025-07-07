import React, { useState, useEffect } from 'react';
import { FaArrowRight, FaSearch, FaUser, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaInfoCircle, FaWallet, FaEnvelope, FaBuilding, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { userWalletService } from '../../services/userWallet.service';
import { useAuthContext } from '../../contexts/AuthContext';
import 'animate.css';

interface NetworkOption {
  id: string;
  name: string;
  symbol: string;
  fee: number;
  minAmount: number;
  confirmations: number;
  contractAddress?: string;
}

interface RecipientUser {
  id: number;
  username: string;
  email: string;
  walletAddress: string;
  walletId: string;
}

interface TransferFormProps {
  currentBalance: number;
  networks: NetworkOption[];
  walletAddress: string;
  onSuccess: (amount: number, toAddress: string, network: string, txHash: string) => void;
  onNewTransfer?: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  currentBalance,
  networks,
  walletAddress,
  onSuccess,
  onNewTransfer
}) => {
  const { user } = useAuthContext();
  const [step, setStep] = useState(1);
  const [recipientInput, setRecipientInput] = useState('');
  const [searchMode, setSearchMode] = useState<'walletId' | 'email' | 'company'>('walletId');
  const [recipientUser, setRecipientUser] = useState<RecipientUser | null>(null);
  const [toAddress, setToAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption>(networks[0]);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [companyMembers, setCompanyMembers] = useState<RecipientUser[]>([]);
  const [showMembersList, setShowMembersList] = useState(false);

  // Resetear searchMode si el usuario no tiene rol 'company' y está en modo 'company'
  useEffect(() => {
    if (user?.rol !== 'company' && searchMode === 'company') {
      setSearchMode('walletId');
      setShowMembersList(false);
      setCompanyMembers([]);
    }
  }, [user?.rol, searchMode]);

  const availableBalance = currentBalance;
  const transferAmount = parseFloat(amount) || 0;
  const networkFee = selectedNetwork.fee;
  const totalCost = transferAmount + networkFee;
  const remainingBalance = availableBalance - totalCost;

  const validateAddress = (address: string) => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const searchRecipient = async () => {
    if (searchMode === 'company') {
      // Para búsqueda por empresa, cargar la lista de miembros
      await loadCompanyMembers();
      return;
    }

    if (!recipientInput.trim()) {
      toast.error(searchMode === 'email' ? 'Ingresa un email' : 'Ingresa un Wallet ID');
      return;
    }

    setIsSearching(true);
    try {
      if (searchMode === 'walletId') {
        const user = await userWalletService.findUserByWalletId(recipientInput.trim());
        if (user) {
          setRecipientUser(user);
          setToAddress(user.walletAddress);
          toast.success(`Usuario encontrado: ${user.username}`);
        } else {
          toast.error('Usuario no encontrado con este Wallet ID');
        }
      } else if (searchMode === 'email') {
        if (!validateEmail(recipientInput.trim())) {
          toast.error('Email inválido');
          return;
        }
        
        const user = await userWalletService.findUserByEmail(recipientInput.trim());
        if (user) {
          setRecipientUser(user);
          setToAddress(user.walletAddress);
          toast.success(`Usuario encontrado: ${user.username} (${user.email})`);
        } else {
          toast.error('Usuario no encontrado con este email o no tiene wallet');
        }
      }
    } catch (error) {
      console.error('Error searching recipient:', error);
      toast.error('Error al buscar destinatario');
    } finally {
      setIsSearching(false);
    }
  };

  const loadCompanyMembers = async () => {
    if (!user?.id) {
      toast.error('No se pudo identificar el usuario actual');
      return;
    }

    setIsSearching(true);
    try {
      const members = await userWalletService.getCompanyMembers(user.id);
      if (members.length > 0) {
        setCompanyMembers(members);
        setShowMembersList(true);
        toast.info(`Se encontraron ${members.length} miembro(s) de tu empresa`);
      } else {
        toast.warning('No se encontraron otros miembros en tu empresa con wallet');
      }
    } catch (error) {
      console.error('Error loading company members:', error);
      toast.error('Error al cargar miembros de la empresa');
    } finally {
      setIsSearching(false);
    }
  };

  const selectMember = (member: RecipientUser) => {
    setRecipientUser(member);
    setToAddress(member.walletAddress);
    setShowMembersList(false);
    toast.success(`Miembro seleccionado: ${member.username} (${member.email})`);
  };

  const validateTransfer = () => {
    if (!toAddress) {
      toast.error('Busca y selecciona un destinatario');
      return false;
    }

    if (!validateAddress(toAddress)) {
      toast.error('Dirección de destino inválida');
      return false;
    }

    if (toAddress.toLowerCase() === walletAddress.toLowerCase()) {
      toast.error('No puedes transferir a tu propia wallet');
      return false;
    }

    if (transferAmount < selectedNetwork.minAmount) {
      toast.error(`El monto mínimo es ${selectedNetwork.minAmount} USDT`);
      return false;
    }

    if (transferAmount > availableBalance) {
      toast.error('Balance insuficiente');
      return false;
    }

    if (totalCost > availableBalance) {
      toast.error('Balance insuficiente para cubrir la comisión');
      return false;
    }

    return true;
  };

  const handleMaxAmount = () => {
    const maxAmount = Math.max(0, availableBalance - networkFee);
    setAmount(maxAmount.toFixed(6));
  };

  const handleNetworkChange = (network: NetworkOption) => {
    setSelectedNetwork(network);
  };

  const processTransfer = async () => {
    if (!validateTransfer()) return;

    setIsProcessing(true);
    setStep(3);

    try {
      setProcessingStep('Iniciando transferencia...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep('Verificando destinatario...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStep('Procesando transacción...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingStep('Confirmando en la red...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await userWalletService.processTransfer(
        transferAmount,
        toAddress,
        selectedNetwork.id,
        recipientUser?.id || null
      );
      
      if (result.success) {
        onSuccess(transferAmount, toAddress, selectedNetwork.id, result.txHash);
        setStep(4);
      } else {
        throw new Error(result.message || 'Error en la transferencia');
      }
      
    } catch (error) {
      console.error('Error en transferencia:', error);
      toast.error('Error al procesar la transferencia');
      setIsProcessing(false);
      setStep(2);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const resetForm = () => {
    setStep(1);
    setRecipientInput('');
    setRecipientUser(null);
    setToAddress('');
    setAmount('');
    setSelectedNetwork(networks[0]);
    setIsProcessing(false);
    setProcessingStep('');
    setSearchMode('walletId');
  };

  return (
    <div className="transfer-container">
      {/* Header con balance */}
      <div className="card border-0 shadow-sm mb-4 animate__animated animate__slideInDown">
        <div className="card-body bg-gradient-primary text-white">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h4 className="mb-1">
                <FaWallet className="me-2" />
                Balance Disponible
              </h4>
              <h2 className="mb-0 fw-bold">{availableBalance.toFixed(6)} USDT</h2>
            </div>
            <div className="col-md-4 text-md-end">
              <div className="balance-icon">
                <FaArrowRight size={32} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="card border-0 shadow-lg">
        <div className="card-body p-0">
          
          {/* Progress Steps */}
          <div className="progress-steps p-4 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="d-flex align-items-center">
                  <div className={`step-circle ${step >= stepNum ? 'active' : ''} ${step > stepNum ? 'completed' : ''}`}>
                    {step > stepNum ? <FaCheckCircle /> : stepNum}
                  </div>
                  {stepNum < 4 && <div className={`step-line ${step > stepNum ? 'completed' : ''}`}></div>}
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between mt-2">
              <small className="text-muted">Destinatario</small>
              <small className="text-muted">Configurar</small>
              <small className="text-muted">Procesar</small>
              <small className="text-muted">Completado</small>
            </div>
          </div>

          {/* Step 1: Buscar destinatario */}
          {step === 1 && (
            <div className="p-4 animate__animated animate__fadeIn">
              <h5 className="mb-4">
                <FaSearch className="me-2 text-primary" />
                Buscar destinatario
              </h5>

              {/* Modo de búsqueda */}
              <div className="btn-group w-100 mb-4" role="group">
                <input type="radio" className="btn-check" name="searchMode" id="walletId" autoComplete="off" 
                       checked={searchMode === 'walletId'} onChange={() => setSearchMode('walletId')} />
                <label className="btn btn-outline-primary" htmlFor="walletId">
                  <FaWallet className="me-2" />
                  Wallet ID
                </label>

                <input type="radio" className="btn-check" name="searchMode" id="email" autoComplete="off" 
                       checked={searchMode === 'email'} onChange={() => setSearchMode('email')} />
                <label className="btn btn-outline-primary" htmlFor="email">
                  <FaEnvelope className="me-2" />
                  Email
                </label>

                {/* Solo mostrar opción "Empresa" para usuarios con rol "company" */}
                {user?.rol === 'company' && (
                  <>
                    <input type="radio" className="btn-check" name="searchMode" id="company" autoComplete="off" 
                           checked={searchMode === 'company'} onChange={() => setSearchMode('company')} />
                    <label className="btn btn-outline-primary" htmlFor="company">
                      <FaBuilding className="me-2" />
                      Empresa
                    </label>
                  </>
                )}
              </div>

              {/* Campo de búsqueda - ocultar para empresa */}
              {searchMode !== 'company' && (
                <div className="input-group mb-4">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    placeholder={searchMode === 'walletId' ? 'Ingresa el Wallet ID del destinatario' : searchMode === 'email' ? 'Ingresa el email del destinatario' : ''}
                  />
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={searchRecipient}
                    disabled={isSearching}
                  >
                    {isSearching ? <FaSpinner className="fa-spin" /> : <FaSearch />}
                  </button>
                </div>
              )}

              {/* Botón para buscar miembros de empresa */}
              {searchMode === 'company' && !showMembersList && (
                <div className="text-center mb-4">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={searchRecipient}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <FaSpinner className="fa-spin me-2" />
                        Buscando miembros...
                      </>
                    ) : (
                      <>
                        <FaUsers className="me-2" />
                        Ver miembros de mi empresa
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Lista de miembros de la empresa */}
              {showMembersList && companyMembers.length > 0 && (
                <div className="mb-4 animate__animated animate__fadeIn">
                  <h6 className="mb-3">
                    <FaUsers className="me-2 text-primary" />
                    Miembros de tu empresa ({companyMembers.length})
                  </h6>
                  <div className="row g-3">
                    {companyMembers.map((member) => (
                      <div key={member.id} className="col-md-6">
                        <div 
                          className="card border border-primary-subtle cursor-pointer h-100 hover-shadow"
                          onClick={() => selectMember(member)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body p-3">
                            <div className="d-flex align-items-center">
                              <div className="avatar-circle me-3">
                                <FaUser className="text-primary" />
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold">{member.username}</h6>
                                <small className="text-muted d-block">{member.email}</small>
                                <small className="text-muted">{member.walletId.slice(0, 12)}...</small>
                              </div>
                              <FaArrowRight className="text-primary" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3">
                    <button 
                      className="btn btn-link"
                      onClick={() => setShowMembersList(false)}
                    >
                      Ocultar lista
                    </button>
                  </div>
                </div>
              )}

              {/* Información del destinatario */}
              {recipientUser && (
                <div className="alert alert-success border-0 animate__animated animate__zoomIn" role="alert">
                  <div className="d-flex align-items-center">
                    <FaUser className="text-success me-3" size={24} />
                    <div>
                      <h6 className="alert-heading mb-1">{recipientUser.username}</h6>
                      <p className="mb-1 small">{recipientUser.email}</p>
                      <small className="text-muted">Wallet ID: {recipientUser.walletId}</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Información de transferencia externa */}
              {toAddress && !recipientUser && (
                <div className="alert alert-warning border-0 animate__animated animate__zoomIn" role="alert">
                  <div className="d-flex align-items-center">
                    <FaExclamationTriangle className="text-warning me-3" size={24} />
                    <div>
                      <h6 className="alert-heading mb-1">Transferencia externa</h6>
                      <p className="mb-1 small">{truncateAddress(toAddress)}</p>
                      <small className="text-muted">Verifica que la dirección sea correcta</small>
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end mt-4">
                <button
                  className="btn btn-primary btn-lg px-5"
                  onClick={() => setStep(2)}
                  disabled={!toAddress}
                >
                  Continuar
                  <FaArrowRight className="ms-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configurar transferencia */}
          {step === 2 && (
            <div className="p-4 animate__animated animate__fadeIn">
              <h5 className="mb-4">
                <FaArrowRight className="me-2 text-primary" />
                Configurar transferencia
              </h5>

              <div className="row">
                <div className="col-lg-6">
                  {/* Resumen del destinatario */}
                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body">
                      <h6 className="card-title text-muted mb-2">Destinatario</h6>
                      {recipientUser ? (
                        <div>
                          <p className="fw-bold mb-1">{recipientUser.username}</p>
                          <small className="text-muted">{truncateAddress(toAddress)}</small>
                        </div>
                      ) : (
                        <p className="fw-bold mb-0">{truncateAddress(toAddress)}</p>
                      )}
                    </div>
                  </div>

                  {/* Selección de red */}
                  <div className="mb-4">
                    <label className="form-label fw-bold">Red de transferencia</label>
                    <div className="row g-2">
                      {networks.map((network) => (
                        <div key={network.id} className="col-12">
                          <div
                            className={`card border cursor-pointer network-card ${
                              selectedNetwork.id === network.id ? 'border-primary bg-primary bg-opacity-10' : ''
                            }`}
                            onClick={() => handleNetworkChange(network)}
                          >
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-1">{network.name}</h6>
                                  <small className="text-muted">Comisión: {network.fee} USDT</small>
                                </div>
                                <div className="text-end">
                                  <small className="text-muted">Mín: {network.minAmount} USDT</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-lg-6">
                  {/* Monto */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label fw-bold mb-0">Monto a transferir</label>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={handleMaxAmount}
                      >
                        Máximo
                      </button>
                    </div>
                    <div className="input-group input-group-lg">
                      <input
                        type="number"
                        className="form-control"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.000001"
                        min="0"
                      />
                      <span className="input-group-text">USDT</span>
                    </div>
                    <small className="text-muted">
                      Disponible: {availableBalance.toFixed(6)} USDT
                    </small>
                  </div>

                  {/* Resumen de costos */}
                  <div className="card border-0 bg-light">
                    <div className="card-body">
                      <h6 className="card-title mb-3">Resumen de costos</h6>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Monto a transferir</span>
                        <span className="fw-bold">{transferAmount.toFixed(6)} USDT</span>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Comisión de red</span>
                        <span>{networkFee.toFixed(6)} USDT</span>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between mb-2">
                        <span className="fw-bold">Total a pagar</span>
                        <span className="fw-bold text-primary">{totalCost.toFixed(6)} USDT</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Balance restante</span>
                        <span className="text-muted small">{Math.max(0, remainingBalance).toFixed(6)} USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between mt-4">
                <button
                  className="btn btn-outline-secondary btn-lg px-4"
                  onClick={() => setStep(1)}
                >
                  <FaArrowRight className="me-2" style={{transform: 'rotate(180deg)'}} />
                  Atrás
                </button>
                <button
                  className="btn btn-primary btn-lg px-5"
                  onClick={processTransfer}
                  disabled={!amount || parseFloat(amount) <= 0 || totalCost > availableBalance || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="fa-spin me-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Transferir Ahora
                      <FaArrowRight className="ms-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Procesando */}
          {step === 3 && (
            <div className="d-flex flex-column justify-content-center align-items-center py-5 animate__animated animate__fadeIn">
              <div className="mb-4 d-flex justify-content-center">
                <div className="spinner-border text-primary" style={{width: '4rem', height: '4rem'}} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <div className="text-center w-100">
                <h5 className="mb-3 text-center">Procesando transferencia</h5>
                <p className="text-muted mb-4 text-center">{processingStep}</p>
              </div>
              <div className="alert alert-info border-0">
                <FaInfoCircle className="me-2" />
                Por favor, no cierres esta ventana mientras se procesa la transferencia.
              </div>
            </div>
          )}

          {/* Step 4: Completado */}
          {step === 4 && (
            <div className="d-flex flex-column justify-content-center align-items-center py-5 animate__animated animate__bounceIn">
              <div className="mb-4 d-flex justify-content-center">
                <FaCheckCircle className="text-success" size={64} />
              </div>
              <div className="text-center w-100">
                <h4 className="text-success mb-3 text-center">¡Transferencia exitosa!</h4>
                <p className="mb-4 text-center">
                  Se han transferido <strong>{transferAmount.toFixed(6)} USDT</strong>
                </p>
              </div>
              <div className="card border-0 bg-light mb-4" style={{ maxWidth: '400px' }}>
                <div className="card-body">
                  <p className="mb-1">
                    <strong>A:</strong> {recipientUser ? recipientUser.username : truncateAddress(toAddress)}
                  </p>
                  <p className="mb-0">
                    <strong>Red:</strong> {selectedNetwork.name}
                  </p>
                </div>
              </div>
              <button
                className="btn btn-primary btn-lg px-5"
                onClick={() => {
                  resetForm();
                  if (onNewTransfer) {
                    onNewTransfer();
                  }
                }}
              >
                Nueva Transferencia
              </button>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .bg-gradient-primary {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        
        .transfer-container {
          animation: fadeIn 0.6s ease-in-out;
        }
        
        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #dee2e6;
          background: white;
          color: #6c757d;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .step-circle.active {
          border-color: #0d6efd;
          color: #0d6efd;
        }
        
        .step-circle.completed {
          background: #198754;
          border-color: #198754;
          color: white;
        }
        
        .step-line {
          flex: 1;
          height: 2px;
          background: #dee2e6;
          margin: 0 15px;
          transition: all 0.3s ease;
        }
        
        .step-line.completed {
          background: #198754;
        }
        
        .network-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .network-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .card {
          transition: all 0.3s ease;
        }
        
        .btn {
          transition: all 0.3s ease;
        }
        
        .btn:hover {
          transform: translateY(-1px);
        }
        
        .balance-icon {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .fa-spin {
          animation: fa-spin 2s infinite linear;
        }
        
        @keyframes fa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f8f9fa;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dee2e6;
        }
        
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        `
      }} />
    </div>
  );
}; 