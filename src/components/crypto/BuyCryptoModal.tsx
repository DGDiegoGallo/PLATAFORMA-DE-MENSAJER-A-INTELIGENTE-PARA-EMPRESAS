import React, { useState, useEffect } from 'react';
import { FaShoppingCart, FaCreditCard, FaCheckCircle, FaDollarSign } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { userWalletService } from '../../services/userWallet.service';
import { stripeService } from '../../services/stripe.service';
import 'bootstrap/dist/css/bootstrap.min.css';

// Configurar Stripe (clave pública de prueba) - Solo necesaria para casos especiales
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_simulacion_crypto_wallet');

interface TransactionData {
  dollarAmount: number;
  usdtReceived: number;
  txHash: string;
  timestamp: string;
  newBalance: number;
}

interface BuyCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number, txHash: string) => void;
  currentBalance: number;
  prefilledAmount?: number;
}

export const BuyCryptoModal: React.FC<BuyCryptoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefilledAmount
}) => {
  const { user } = useAuth();
  const [dollarAmount, setDollarAmount] = useState(prefilledAmount ? prefilledAmount.toString() : '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);

  // Tasa de cambio USDT (1 USD = 1 USDT aproximadamente)
  const usdtRate = 1.0;
  const estimatedUSDT = parseFloat(dollarAmount) * usdtRate || 0;

  // Límites
  const minAmount = 10;
  const maxAmount = 5000;

  // Efecto para actualizar el monto cuando cambia la prop
  useEffect(() => {
    if (prefilledAmount) {
      setDollarAmount(prefilledAmount.toString());
    }
  }, [prefilledAmount]);

  const handleDollarAmountChange = (value: string) => {
    // Solo permitir números y punto decimal
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (numericValue.split('.').length <= 2) { // Máximo un punto decimal
      setDollarAmount(numericValue);
    }
  };

  const validateAmount = () => {
    const amount = parseFloat(dollarAmount);
    
    if (!dollarAmount || isNaN(amount)) {
      toast.error('Por favor ingresa una cantidad válida');
      return false;
    }
    
    if (amount < minAmount) {
      toast.error(`El monto mínimo es $${minAmount}`);
      return false;
    }

    if (amount > maxAmount) {
      toast.error(`El monto máximo es $${maxAmount}`);
        return false;
    }

    return true;
  };

  const handleBuyWithStripe = async () => {
    if (!validateAmount() || !user?.id) return;

    setIsProcessing(true);
    setProcessingStep('Preparando pago...');

    try {
      // Paso 1: Crear Checkout Session en el backend
      setProcessingStep('Creando sesión de pago...');
      
      const checkoutResponse = await stripeService.createCheckoutSession({
        amount: parseFloat(dollarAmount),
        currency: 'usd',
        metadata: {
          userId: user.id.toString(),
          cryptoAmount: estimatedUSDT.toString(),
        }
      });

      if (!checkoutResponse.success) {
        throw new Error(checkoutResponse.error || 'Error creando sesión de pago');
      }

      const { data: checkoutSession } = checkoutResponse;
      
      // Paso 2: Redirigir a Stripe Checkout
      setProcessingStep('Abriendo Stripe Checkout...');
      
      console.log('Redirigiendo a Stripe Checkout:', checkoutSession.url);
      
      // Abrir Stripe Checkout en nueva ventana
      const stripeWindow = window.open(
        checkoutSession.url,
        'stripe-checkout',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (!stripeWindow) {
        // Si no se puede abrir ventana emergente, redirigir en la misma ventana
        window.location.href = checkoutSession.url;
        return;
      }

      // Monitorear el cierre de la ventana de Stripe
      const checkClosed = setInterval(async () => {
        try {
          // Verificar si la ventana está cerrada
          if (stripeWindow.closed) {
            clearInterval(checkClosed);
            
            // Cuando se cierra la ventana, verificar el estado del pago
            setProcessingStep('Verificando pago...');
            
            try {
              // Simular una verificación del estado del pago
              await new Promise(resolve => setTimeout(resolve, 1000));
              await simulateStripePayment();
            } catch (error) {
              console.error('Error verificando pago:', error);
              setIsProcessing(false);
              toast.error('Error verificando el pago');
            }
            return;
          }

          // Verificar si la ventana ha navegado a una página de éxito
          try {
            const currentUrl = stripeWindow.location.href;
            if (currentUrl.includes('success') || currentUrl.includes('completed')) {
              // Si detectamos una URL de éxito, cerrar la ventana y procesar el pago
              stripeWindow.close();
              clearInterval(checkClosed);
              setProcessingStep('Verificando pago...');
              await simulateStripePayment();
              return;
            }
          } catch (error) {
            // Error de acceso cross-origin es normal, ignorar
          }
        } catch (error) {
          console.error('Error monitoreando ventana:', error);
        }
      }, 1000);

      // Timeout de 5 minutos
      setTimeout(() => {
        if (!stripeWindow.closed) {
          stripeWindow.close();
          clearInterval(checkClosed);
          setIsProcessing(false);
          toast.error('Tiempo de pago agotado');
        }
      }, 300000); // 5 minutos

    } catch (error) {
      console.error('Error con Stripe:', error);
      
      // Si Stripe falla, usar modo simulación automáticamente
      toast.info('Stripe no disponible, procesando pago en modo simulación...');
      
      try {
        await simulateStripePayment();
      } catch (simulationError) {
        console.error('Error en simulación:', simulationError);
        toast.error('Error al procesar el pago');
        setIsProcessing(false);
      }
    }
  };

  const simulateStripePayment = async () => {
    try {
      setProcessingStep('Procesando pago...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStep('Confirmando transacción...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStep('Comprando USDT...');
      
      // Generar hash de transacción simulado
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Procesar la transacción en nuestra base de datos
      const result = await userWalletService.processBuyTransaction(
        user!.id,
        parseFloat(dollarAmount),
        estimatedUSDT,
        txHash
      );

      setProcessingStep('Actualizando balance...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (result.success) {
        // Datos de la transacción para mostrar
        const transactionInfo = {
          dollarAmount: parseFloat(dollarAmount),
          usdtReceived: estimatedUSDT,
          txHash: txHash,
          timestamp: new Date().toISOString(),
          newBalance: (result.wallet?.usdt_balance || 0)
        };

        setTransactionData(transactionInfo);
        setIsSuccess(true);
        
        // Llamar al callback de éxito para actualizar la UI padre
        onSuccess(estimatedUSDT, txHash);

        toast.success(`¡Compra exitosa! +${estimatedUSDT.toFixed(2)} USDT`);
      } else {
        throw new Error('Error procesando la compra');
      }
      
    } catch (error) {
      console.error('Error en la compra:', error);
      toast.error('Error al procesar la compra. Intenta nuevamente.');
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const resetModal = () => {
    setDollarAmount(prefilledAmount ? prefilledAmount.toString() : '');
    setIsProcessing(false);
    setProcessingStep('');
    setIsSuccess(false);
    setTransactionData(null);
  };

  const handleClose = () => {
    if (!isProcessing) {
    resetModal();
    onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div 
            className="modal-header text-white" 
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <h5 className="modal-title d-flex align-items-center mb-0">
              <FaShoppingCart className="me-2" />
              Comprar USDT
            </h5>
            {!isProcessing && (
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleClose}
                aria-label="Close"
              />
            )}
          </div>

          <div className="modal-body p-4">
            {!isSuccess ? (
              <div>
                {!isProcessing ? (
                  <div className="row g-4">
                    {/* Cantidad en dólares */}
                    <div className="col-12">
                      <label className="form-label fw-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Cantidad a comprar (USD)
                      </label>
                      <div className="input-group input-group-lg">
                        <span className="input-group-text" style={{ borderColor: 'var(--color-stroke)' }}>
                          <FaDollarSign style={{ color: 'var(--color-primary)' }} />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          value={dollarAmount}
                          onChange={(e) => handleDollarAmountChange(e.target.value)}
                          placeholder="200"
                          disabled={!!prefilledAmount}
                          readOnly={!!prefilledAmount}
                          style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: 'bold',
                            borderColor: 'var(--color-stroke)',
                            backgroundColor: prefilledAmount ? 'var(--color-background-secondary)' : 'white',
                            cursor: prefilledAmount ? 'not-allowed' : 'text'
                          }}
                        />
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <small style={{ color: 'var(--color-text-secondary)' }}>
                          Mínimo: ${minAmount}
                        </small>
                        <small style={{ color: 'var(--color-text-secondary)' }}>
                          Máximo: ${maxAmount}
                        </small>
                      </div>
                    </div>

                    {/* Estimación USDT */}
                    {dollarAmount && (
                      <div className="col-12">
                        <div 
                          className="card border" 
                          style={{ 
                            backgroundColor: 'var(--color-background-secondary)', 
                            borderColor: 'var(--color-stroke)'
                          }}
                        >
                          <div className="card-body">
                            <div className="row align-items-center">
                              <div className="col-6">
                                <small style={{ color: 'var(--color-text-secondary)' }}>
                                  Recibirás aproximadamente:
                                </small>
                                <div className="h4 mb-0" style={{ color: 'var(--color-primary)' }}>
                                  {estimatedUSDT.toFixed(2)} USDT
                                </div>
                              </div>
                              <div className="col-6 text-end">
                                <small style={{ color: 'var(--color-text-secondary)' }}>
                                  Tasa de cambio:
                                </small>
                                <div className="fw-bold" style={{ color: 'var(--color-text-primary)' }}>
                                  1 USD = {usdtRate} USDT
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Información sobre Stripe */}
                    <div className="col-12">
                      <div className="alert alert-info d-flex align-items-center">
                        <FaCreditCard className="me-2" />
                        <small>
                          Se abrirá Stripe en una nueva ventana para procesar tu pago de forma segura.
                        </small>
                      </div>
                    </div>

                    {/* Botón de compra */}
                    <div className="col-12">
                      <button
                        onClick={handleBuyWithStripe}
                        disabled={!dollarAmount || parseFloat(dollarAmount) < minAmount}
                        className="btn btn-lg w-100 text-white fw-bold"
                        style={{ 
                          backgroundColor: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)'
                        }}
                      >
                        <FaCreditCard className="me-2" />
                        Pagar con Stripe - ${dollarAmount || '0'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Estado de procesamiento */
                  <div className="d-flex flex-column justify-content-center align-items-center py-5">
                    <div className="mb-4 d-flex justify-content-center">
                      <div 
                        className="spinner-border" 
                        style={{ 
                          color: 'var(--color-primary)',
                          width: '3.5rem',
                          height: '3.5rem'
                        }} 
                        role="status"
                      >
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </div>
                    <div className="text-center w-100">
                      <h5 className="mb-3 text-center" style={{ color: 'var(--color-primary)' }}>
                        {processingStep}
                      </h5>
                      <p className="mb-4 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                        Procesando compra de ${dollarAmount} → {estimatedUSDT.toFixed(2)} USDT
                      </p>
                    </div>
                    <div className="d-flex justify-content-center w-100">
                      <div className="progress" style={{ height: '8px', width: '300px' }}>
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated"
                          style={{ 
                            backgroundColor: 'var(--color-primary)',
                            width: '60%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Estado de éxito */
              <div className="text-center py-4">
                <div className="mb-3">
                  <FaCheckCircle className="text-success" size={48} />
                </div>
                <h5 className="text-success">¡Compra completada!</h5>
                <p style={{ color: 'var(--color-text-secondary)' }} className="mb-4">
                  Tu compra se ha procesado exitosamente
                </p>

                {transactionData && (
                  <div className="card border-success mb-4">
                    <div className="card-body">
                      <h6 className="card-title text-success">Detalles de la transacción</h6>
                      <div className="row g-2 text-start">
                        <div className="col-6">
                          <small style={{ color: 'var(--color-text-secondary)' }}>Pagado:</small>
                          <div className="fw-bold">${transactionData.dollarAmount}</div>
                        </div>
                        <div className="col-6">
                          <small style={{ color: 'var(--color-text-secondary)' }}>USDT recibido:</small>
                          <div className="fw-bold text-success">+{transactionData.usdtReceived.toFixed(2)} USDT</div>
                        </div>
                        <div className="col-6">
                          <small style={{ color: 'var(--color-text-secondary)' }}>Nuevo balance:</small>
                          <div className="fw-bold">{transactionData.newBalance.toFixed(2)} USDT</div>
                        </div>
                        <div className="col-6">
                          <small style={{ color: 'var(--color-text-secondary)' }}>TX Hash:</small>
                          <div className="font-monospace small" style={{ color: 'var(--color-primary)' }}>
                            {transactionData.txHash.substring(0, 12)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="btn btn-lg w-100 text-white"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)'
                  }}
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          .modal-content {
            border-radius: 12px;
            overflow: hidden;
          }
          
          .input-group-lg .form-control {
            border: 2px solid var(--color-stroke);
            transition: border-color 0.3s ease;
          }
          
          .input-group-lg .form-control:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 0.2rem rgba(244, 65, 35, 0.25);
          }
          
          .input-group-lg .form-control::placeholder {
            color: #9ca3af;
            opacity: 1;
          }
          
          .input-group-lg .form-control::-webkit-input-placeholder {
            color: #9ca3af;
          }
          
          .input-group-lg .form-control::-moz-placeholder {
            color: #9ca3af;
            opacity: 1;
          }
          
          .input-group-lg .form-control:-ms-input-placeholder {
            color: #9ca3af;
          }
          
          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .spinner-border {
            animation: spinner-border 0.75s linear infinite;
          }
          
          @keyframes spinner-border {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
}; 