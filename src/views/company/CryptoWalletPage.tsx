import React, { useState, useEffect } from 'react';
import { 
  FaWallet, 
  FaCopy, 
  FaEye, 
  FaEyeSlash, 
  FaPlus, 
  FaLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaShoppingCart,
  FaArrowRight,
  FaHistory,
  FaCreditCard
} from 'react-icons/fa';
import { useAuthContext } from '../../contexts/AuthContext';
import { userWalletService } from '../../services/userWallet.service';
import { UserWallet } from '../../services/userWallet.service';
import { toast } from 'react-toastify';
import { BuyCryptoModal } from '../../components/crypto/BuyCryptoModal';
import { TransferForm } from '../../components/crypto/TransferForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'animate.css';
import '../../styles/main.css';

interface NetworkOption {
  id: string;
  name: string;
  symbol: string;
  fee: number;
  minAmount: number;
  confirmations: number;
  contractAddress?: string;
}

const CryptoWalletPage: React.FC = () => {
  const { user } = useAuthContext();
  
  // Estados principales
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyModalPrefilledAmount, setBuyModalPrefilledAmount] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'history'>('overview');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);


  // Redes disponibles para USDT
  const networks: NetworkOption[] = [
    {
      id: 'bsc',
      name: 'BNB Smart Chain (BEP20)',
      symbol: 'BSC',
      fee: 0,
      minAmount: 0.01,
      confirmations: 15,
      contractAddress: '0x55d398326f99059ff775485246999027b3197955'
    },
    {
      id: 'eth',
      name: 'Ethereum (ERC20)',
      symbol: 'ETH',
      fee: 1.2,
      minAmount: 10.0,
      confirmations: 12,
      contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    },
    {
      id: 'trx',
      name: 'TRON (TRC20)',
      symbol: 'TRX',
      fee: 0,
      minAmount: 0.01,
      confirmations: 19,
      contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
    }
  ];

  // Cargar wallet al iniciar - Modo demo: solo verificar si hay usuario válido
  useEffect(() => {
    if (user?.id) {
      loadWallet();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const loadWallet = async () => {
    if (!user?.id) {
      console.warn('❌ No se puede cargar wallet: no hay usuario');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 Cargando wallet para usuario:', user.id);
      
      const userWallet = await userWalletService.getUserWallet(user.id);
      
      if (userWallet) {
        console.log('✅ Wallet encontrada:', userWallet);
        setWallet(userWallet);
      } else {
        console.log('ℹ️ No se encontró wallet, creando una nueva...');
        // Si no existe wallet, crear una nueva
        const walletResult = await userWalletService.createUserWallet(user.id);
        setWallet(walletResult.wallet);
        toast.info('Se ha creado tu wallet automáticamente');
      }
    } catch (error: unknown) {
      console.error('❌ Error al cargar wallet:', error);
      
      // Manejo específico del error 401
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 401) {
          console.error('❌ Token no válido o expirado');
          toast.error('Error de autenticación. Por favor, recarga la página.');
          setWallet(null);
          setIsUnlocked(false);
        } else {
          toast.error('Error al cargar la wallet. Por favor, intenta nuevamente.');
        }
      } else {
        toast.error('Error al cargar la wallet. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet) return;
    
    // Verificar PIN usando el servicio
    const isValidPin = userWalletService.verifyPin(pin, wallet.pin_hash);
    
    console.log('🔍 Verificando PIN:', {
      pinIngresado: pin,
      pinHash: wallet.pin_hash,
      hashDelPinIngresado: userWalletService.hashPin(pin),
      coincide: isValidPin
    });
    
    if (isValidPin) {
      setIsUnlocked(true);
      setPin('');
      setPinAttempts(0);
      toast.success('¡Acceso autorizado a tu wallet!');
    } else {
      setPinAttempts(prev => prev + 1);
      setPin('');
      toast.error(`PIN incorrecto. Intentos: ${pinAttempts + 1}/3`);
      
      if (pinAttempts >= 2) {
        toast.error('Máximo de intentos alcanzado. Intenta más tarde.');
      }
    }
  };

  const handleBuySuccess = async () => {
    console.log('✅ Compra exitosa, recargando wallet...');
    // Recargar wallet para obtener los datos actualizados
    await loadWallet();
    setShowBuyModal(false);
    setBuyModalPrefilledAmount(undefined);
  };

  const handleQuickBuy = (amount: number) => {
    setBuyModalPrefilledAmount(amount);
    setShowBuyModal(true);
  };

  const handleTransferSuccess = async (amount: number, toAddress: string, network: string, txHash: string) => {
    console.log('✅ Transferencia exitosa:', { amount, toAddress, network, txHash });
    // Mostrar mensaje de éxito inmediatamente
    toast.success(`¡Transferencia exitosa! ${amount} USDT enviados a ${toAddress.slice(0, 8)}...${toAddress.slice(-6)}`);
    
    // NO recargar automáticamente - dejar que el usuario vea el paso 4
    // La wallet se recargará cuando el usuario haga una nueva transferencia
  };

  const handleNewTransfer = async () => {
    console.log('🔄 Iniciando nueva transferencia, recargando wallet...');
    await loadWallet();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar si hay usuario válido para modo demo
  if (!user?.id) {
    return (
      <div className="container-fluid p-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card text-center">
              <div className="card-body">
                <FaExclamationTriangle className="text-warning mb-3" size={48} />
                <h5 className="card-title">Acceso Restringido</h5>
                <p className="card-text">
                  Necesitas iniciar sesión para acceder a tu wallet.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/login'}
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border" style={{ color: 'var(--color-primary)' }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }} className="mt-3">Cargando tu wallet...</p>
        </div>
      </div>
    );
  }

  // Modal de acceso con PIN
  if (!isUnlocked && wallet) {
    return (
      <div className="container-fluid p-4">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm" style={{ borderColor: 'var(--color-stroke)' }}>
              <div 
                className="card-header text-center"
                style={{ 
                  backgroundColor: 'var(--color-background-secondary)',
                  borderColor: 'var(--color-stroke)'
                }}
              >
                <FaLock style={{ color: 'var(--color-primary)' }} className="mb-2" size={32} />
                <h5 className="card-title mb-0" style={{ color: 'var(--color-text-primary)' }}>
                  Accede a tu Wallet
                </h5>
                <small style={{ color: 'var(--color-text-secondary)' }}>
                  Introduce tu PIN de 4 dígitos
                </small>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handlePinSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-bold" style={{ color: 'var(--color-text-primary)' }}>
                      Tu PIN de Seguridad
                    </label>
                    <div className="input-group">
                      <input
                        type={showPin ? "text" : "password"}
                        className="form-control form-control-lg text-center"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.slice(0, 4))}
                        placeholder="••••"
                        maxLength={4}
                        style={{
                          letterSpacing: '0.5em',
                          fontSize: '1.5rem',
                          borderColor: 'var(--color-stroke)'
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <small style={{ color: 'var(--color-text-secondary)' }} className="mt-1">
                      PIN de 4 dígitos que se generó automáticamente
                    </small>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-lg w-100 text-white"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)'
                    }}
                    disabled={pin.length !== 4}
                  >
                    {pin.length !== 4 ? (
                      <>
                        <FaLock className="me-2" />
                        Ingresa PIN completo
                      </>
                    ) : (
                      <>
                        <FaCheckCircle className="me-2" />
                        Acceder a Wallet
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay wallet y no está cargando, mostrar error
  if (!wallet && !isLoading) {
    return (
      <div className="container-fluid p-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card text-center">
              <div className="card-body">
                <FaExclamationTriangle className="text-warning mb-3" size={48} />
                <h5 className="card-title">Error al cargar Wallet</h5>
                <p className="card-text">
                  No se pudo cargar tu wallet. Por favor, intenta nuevamente.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => loadWallet()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="me-2" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <FaWallet className="me-2" />
                      Intentar nuevamente
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'var(--color-text-primary)' }} className="mb-1">Crypto Wallet</h2>
          <p style={{ color: 'var(--color-text-secondary)' }} className="mb-0">
            Compra y transfiere USDT de forma segura
          </p>
        </div>
        <button
          onClick={() => setIsUnlocked(false)}
          className="btn btn-outline-secondary btn-sm"
        >
          <FaLock className="me-1" />
          Bloquear
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="card mb-4" style={{ borderColor: 'var(--color-stroke)' }}>
        <div 
          className="card-header p-0"
          style={{ 
            backgroundColor: 'var(--color-background-secondary)',
            borderColor: 'var(--color-stroke)'
          }}
        >
          <nav className="nav nav-pills nav-fill">
            <button
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              style={{
                backgroundColor: activeTab === 'overview' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'overview' ? 'white' : 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: '0'
              }}
            >
              <FaWallet className="me-2" />
              Resumen & Comprar
            </button>
            <button
              className={`nav-link ${activeTab === 'transfer' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfer')}
              style={{
                backgroundColor: activeTab === 'transfer' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'transfer' ? 'white' : 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: '0'
              }}
            >
              <FaArrowRight className="me-2" />
              Transferir
            </button>
            <button
              className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              style={{
                backgroundColor: activeTab === 'history' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'history' ? 'white' : 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: '0'
              }}
            >
              <FaHistory className="me-2" />
              Historial
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="row g-4">
            {/* Balance Card */}
            <div className="col-12">
              <div className="card shadow-sm" style={{ borderColor: 'var(--color-stroke)' }}>
                <div className="card-body p-4">
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-center mb-3">
                        <FaWallet style={{ color: 'var(--color-primary)' }} className="me-3" size={24} />
                        <div>
                          <h5 style={{ color: 'var(--color-text-primary)' }} className="mb-1">Tu Balance</h5>
                          <small style={{ color: 'var(--color-text-secondary)' }}>
                            USDT en todas las redes
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <h2 style={{ color: 'var(--color-text-primary)' }} className="mb-0 me-3">
                          {showBalance ? `${formatCurrency(wallet?.usdt_balance || 0)} USDT` : '••••••'}
                        </h2>
                        <button
                          onClick={() => setShowBalance(!showBalance)}
                          className="btn btn-outline-secondary btn-sm"
                        >
                          {showBalance ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="col-md-4 text-md-end">
                      <div className="d-grid gap-2">
                        <button
                          onClick={() => {
                            setBuyModalPrefilledAmount(undefined);
                            setShowBuyModal(true);
                          }}
                          className="btn text-white"
                          style={{ 
                            backgroundColor: 'var(--color-primary)',
                            borderColor: 'var(--color-primary)'
                          }}
                        >
                          <FaCreditCard className="me-2" />
                          Comprar USDT
                        </button>
                        <button
                          onClick={() => setActiveTab('transfer')}
                          className="btn btn-outline-primary"
                        >
                          <FaArrowRight className="me-2" />
                          Transferir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Info */}
            <div className="col-md-6">
              <div className="card h-100" style={{ borderColor: 'var(--color-stroke)' }}>
                <div 
                  className="card-header"
                  style={{ 
                    backgroundColor: 'var(--color-background-secondary)',
                    borderColor: 'var(--color-stroke)'
                  }}
                >
                  <h6 className="card-title mb-0" style={{ color: 'var(--color-text-primary)' }}>
                    <FaWallet className="me-2" />
                    Información de tu Wallet
                  </h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label small" style={{ color: 'var(--color-text-secondary)' }}>
                      Dirección:
                    </label>
                    <div className="d-flex align-items-center">
                      <code style={{ color: 'var(--color-primary)' }} className="me-2 flex-grow-1">
                        {truncateAddress(wallet?.wallet_address || '')}
                      </code>
                      <button
                        onClick={() => copyToClipboard(wallet?.wallet_address || '', 'Dirección')}
                        className="btn btn-outline-primary btn-sm"
                      >
                        <FaCopy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Buy Actions */}
            <div className="col-md-6">
              <div className="card h-100" style={{ borderColor: 'var(--color-stroke)' }}>
                <div 
                  className="card-header"
                  style={{ 
                    backgroundColor: 'var(--color-background-secondary)',
                    borderColor: 'var(--color-stroke)'
                  }}
                >
                  <h6 className="card-title mb-0" style={{ color: 'var(--color-text-primary)' }}>
                    <FaShoppingCart className="me-2" />
                    Compra Rápida
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-2">
                    {[50, 100, 250].map(amount => (
                      <div key={amount} className="col-4">
                        <button
                          onClick={() => handleQuickBuy(amount)}
                          className="btn btn-outline-primary w-100 d-flex flex-column align-items-center justify-content-center"
                          style={{ height: '60px' }}
                        >
                          <FaPlus className="mb-1" />
                          <small>${amount}</small>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="row justify-content-center animate__animated animate__fadeIn">
            <div className="col-xl-8 col-lg-10">
              {/* Estados del formulario */}
              <TransferForm 
                currentBalance={wallet?.usdt_balance || 0}
                networks={networks}
                walletAddress={wallet?.wallet_address || ''}
                onSuccess={handleTransferSuccess}
                onNewTransfer={handleNewTransfer}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="card" style={{ borderColor: 'var(--color-stroke)' }}>
            <div 
              className="card-header"
              style={{ 
                backgroundColor: 'var(--color-background-secondary)',
                borderColor: 'var(--color-stroke)'
              }}
            >
              <h5 className="card-title mb-0" style={{ color: 'var(--color-text-primary)' }}>
                <FaHistory className="me-2" />
                Historial de Transacciones
              </h5>
            </div>
            <div className="card-body">
              {wallet?.transaction_history.length === 0 ? (
                <div className="text-center py-5">
                  <FaHistory style={{ color: 'var(--color-text-secondary)' }} className="mb-3" size={48} />
                  <h6 style={{ color: 'var(--color-text-secondary)' }}>No hay transacciones aún</h6>
                  <p style={{ color: 'var(--color-text-secondary)' }} className="small">
                    Tus compras y transferencias aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Red</th>
                        <th>Destino</th>
                        <th>TxID</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallet?.transaction_history.map((tx) => {
                        // Determinar si es una transferencia enviada o recibida
                        const isOutgoing = tx.type === 'transfer' && tx.amount < 0;
                        const isIncoming = tx.type === 'transfer' && tx.amount > 0;
                        const isBuy = tx.type === 'buy';
                        
                        // Obtener tipo de transacción para mostrar
                        let transactionType = 'Transferencia';
                        let badgeClass = 'bg-primary';
                        if (isBuy) {
                          transactionType = 'Compra';
                          badgeClass = 'bg-success';
                        } else if (isIncoming) {
                          transactionType = 'Recibido';
                          badgeClass = 'bg-info';
                        } else if (isOutgoing) {
                          transactionType = 'Enviado';
                          badgeClass = 'bg-danger';
                        }
                        
                        return (
                          <tr key={tx.id}>
                            <td>
                              <span className={`badge ${badgeClass}`}>
                                {transactionType}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                              {isBuy || isIncoming ? '+' : ''}{formatCurrency(Math.abs(tx.amount))} USDT
                            </td>
                            <td>
                              <span className="badge bg-warning text-dark">{tx.network}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <code className="small text-muted me-2" style={{ fontSize: '0.75rem' }}>
                                  {truncateAddress(tx.to)}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(tx.to, 'Dirección de destino')}
                                  className="btn btn-outline-secondary btn-sm p-1"
                                  style={{ fontSize: '0.7rem' }}
                                  title="Copiar dirección"
                                >
                                  <FaCopy size={10} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <code className="small text-muted me-2" style={{ fontSize: '0.75rem' }}>
                                  {tx.tx_hash ? tx.tx_hash.substring(0, 12) + '...' : tx.id.substring(0, 12) + '...'}
                                </code>
                                <button
                                  onClick={() => copyToClipboard(tx.tx_hash || tx.id, 'ID de transacción')}
                                  className="btn btn-outline-secondary btn-sm p-1"
                                  style={{ fontSize: '0.7rem' }}
                                  title="Copiar TxID"
                                >
                                  <FaCopy size={10} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                tx.status === 'completed' ? 'bg-success' :
                                tx.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'
                              }`}>
                                {tx.status === 'completed' ? 'Completada' :
                                 tx.status === 'pending' ? 'Pendiente' : 'Falló'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--color-text-secondary)' }} className="small">
                              {formatDate(tx.timestamp)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBuyModal && (
        <BuyCryptoModal
          isOpen={showBuyModal}
          onClose={() => setShowBuyModal(false)}
          onSuccess={handleBuySuccess}
          currentBalance={wallet?.usdt_balance || 0}
          prefilledAmount={buyModalPrefilledAmount}
        />
      )}

      <style>
        {`
          .nav-link {
            transition: all 0.3s ease !important;
          }
          
          .nav-link:hover {
            transform: translateY(-2px);
          }
          
          .card {
            transition: all 0.3s ease;
          }
          
          .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          }
          
          .btn {
            transition: all 0.3s ease;
          }
          
          .btn:hover {
            transform: translateY(-1px);
          }
        `}
      </style>
    </div>
  );
};

export default CryptoWalletPage; 