import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaWallet, FaArrowUp, FaArrowDown, FaLock, FaCreditCard, FaCheckCircle, FaCcVisa, FaCcMastercard, FaExchangeAlt, FaUserAlt } from 'react-icons/fa';
import { useCompany, useCompanyByAgent } from '../../features/company/hooks/useCompany';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { companyService } from '../../features/company/services/company.service';

interface CryptoAssets {
  nft_hash?: string;
  usdt: number;
}

interface Company {
  id: number;
  documentId: string;
  name: string;
  crypto_assets: CryptoAssets;
  members?: Agent[];
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

const CryptoBankingPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.rol || user?.role?.name || 'user';
  const isAgent = userRole === 'agente';
  
  // Determine which hook to use based on user role
  const { company: companyFromHook, loading: companyLoading, error: companyError } = useCompany();
  const { company: agentCompanyData, loading: agentCompanyLoading, error: agentCompanyError } = useCompanyByAgent();

  // Use the appropriate data based on role
  const loadedCompany = isAgent ? agentCompanyData : companyFromHook;
  const loading = isAgent ? agentCompanyLoading : companyLoading;
  const error = isAgent ? agentCompanyError : companyError;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [transactionLoading, setTransactionLoading] = useState<boolean>(false);
  const [transactionSuccess, setTransactionSuccess] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  
  // Estados para el flujo de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1);
  const [depositAmountForPayment, setDepositAmountForPayment] = useState<number>(0);
  const [companyHash, setCompanyHash] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userLastName, setUserLastName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [cardHolderName, setCardHolderName] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cardErrors, setCardErrors] = useState({
    number: '',
    expiry: '',
    cvv: '',
    cardHolder: ''
  });
  
  // Añadir estado para indicar si es depósito o retiro
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  
  // Estados para transferencia de USDT a empleado
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferCompanyHash, setTransferCompanyHash] = useState<string>('');
  const [binanceCode, setBinanceCode] = useState<string>('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Convertir los datos del hook a nuestro formato de Company
  useEffect(() => {
    if (loadedCompany) {
      console.log('Compañía cargada desde el hook:', loadedCompany);
      
      // Asegurarse de que crypto_assets tenga la estructura correcta
      const cryptoAssets: CryptoAssets = loadedCompany.crypto_assets 
        ? { 
            nft_hash: loadedCompany.crypto_assets.nft_hash as string,
            usdt: (loadedCompany.crypto_assets.usdt as number) || 0
          }
        : { usdt: 0 };
        
      const formattedCompany = {
        id: loadedCompany.id,
        documentId: loadedCompany.documentId || '',
        name: loadedCompany.name || 'Compañía',
        crypto_assets: cryptoAssets
      };
      
      console.log('Compañía formateada para el estado local:', formattedCompany);
      setCompany(formattedCompany);
    }
  }, [loadedCompany]);
  
  // Cargar datos del usuario desde localStorage al iniciar
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.nombre) setUserName(parsedUser.nombre);
        if (parsedUser.apellido) setUserLastName(parsedUser.apellido);
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario desde localStorage:', error);
    }
  }, []);
  
  // Cargar los agentes desde la compañía
  useEffect(() => {
    if (loadedCompany && loadedCompany.members) {
      setAgents(loadedCompany.members);
    }
  }, [loadedCompany]);
  
  // Función para actualizar el saldo USDT
  const updateUsdtBalance = async (newBalance: number) => {
    if (!company) return false;
    setTransactionLoading(true);
    setTransactionSuccess(null);
    setTransactionError(null);
    try {
      // Obtener todos los datos actuales de la compañía para no perder relaciones
      const currentCompany = await companyService.getCompanyByDocumentId(company.documentId);
      if (!currentCompany) throw new Error('No se pudo obtener la compañía actual');
      // Mezclar el nuevo saldo con el resto de los datos actuales
      const fullPayload = {
        name: currentCompany.name,
        description: currentCompany.description,
        crypto_assets: {
          ...(currentCompany.crypto_assets || {}),
        usdt: newBalance
        },
        members: currentCompany.members,
        bots: currentCompany.bots,
        metrics: currentCompany.metrics,
        users_permissions_users: currentCompany.users_permissions_users
      };
      // Eliminar documentId si existe en el payload o en cualquier subobjeto
      const deepClean = (obj: any) => {
        if (Array.isArray(obj)) return obj.map(deepClean);
        if (obj && typeof obj === 'object') {
          const cleaned: any = {};
          for (const key in obj) {
            if (key !== 'documentId') {
              cleaned[key] = deepClean(obj[key]);
            }
          }
          return cleaned;
        }
        return obj;
      };
      const cleanedPayload = deepClean(fullPayload);
      // Actualizar usando el servicio de compañía
      const updatedCompany = await companyService.updateCompanyByDocumentId(company.documentId, cleanedPayload);
          const updatedCryptoAssets = updatedCompany.crypto_assets || { usdt: newBalance };
      setCompany({
        ...company,
            crypto_assets: {
              ...updatedCryptoAssets,
              usdt: typeof updatedCryptoAssets.usdt === 'number' ? updatedCryptoAssets.usdt : newBalance
            } as CryptoAssets
      });
      return true;
    } catch (error) {
      console.error('Error al actualizar el saldo USDT:', error);
      setTransactionError('No se pudo actualizar el saldo.');
      return false;
    } finally {
      setTransactionLoading(false);
    }
  };
  
  // Función para iniciar el flujo de pago
  const startPaymentFlow = (amount: number, type: 'deposit' | 'withdraw') => {
    setDepositAmountForPayment(amount);
    setTransactionType(type);
    setPaymentStep(1);
    setShowPaymentModal(true);
  };

  // Función para validar el hash de la compañía
  const validateCompanyHash = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        const storedHash = parsedUser.company?.crypto_assets?.nft_hash;
        
        if (storedHash && storedHash === companyHash) {
          setPaymentStep(2);
        } else {
          setTransactionError('Hash de compañía inválido');
        }
      } else {
        setTransactionError('No se encontraron datos de usuario');
      }
    } catch (error) {
      console.error('Error al validar hash:', error);
      setTransactionError('Error al validar datos');
    }
  };

  // Función para validar los datos de tarjeta (simulada)
  const validateCardDetails = () => {
    // Resetear errores previos
    const errors = {
      number: '',
      expiry: '',
      cvv: '',
      cardHolder: ''
    };
    let hasErrors = false;
    
    // Validar número de tarjeta
    if (!cardNumber || cardNumber.length < 16) {
      errors.number = 'El número de tarjeta debe tener 16 dígitos';
      hasErrors = true;
    }
    
    // Validar fecha de vencimiento
    if (!expiryDate || expiryDate.length < 5) {
      errors.expiry = 'Ingrese una fecha de vencimiento válida';
      hasErrors = true;
    } else {
      const [month, year] = expiryDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      const cardMonth = parseInt(month);
      const cardYear = parseInt(year);
      
      if (isNaN(cardMonth) || cardMonth < 1 || cardMonth > 12) {
        errors.expiry = 'Mes inválido (1-12)';
        hasErrors = true;
      } else if (isNaN(cardYear)) {
        errors.expiry = 'Año inválido';
        hasErrors = true;
      } else if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
        errors.expiry = 'La tarjeta ha expirado';
        hasErrors = true;
      }
    }
    
    // Validar CVV
    if (!cvv || cvv.length < 3) {
      errors.cvv = 'El código de seguridad debe tener 3 dígitos';
      hasErrors = true;
    }
    
    // Validar nombre del titular
    if (!cardHolderName || cardHolderName.trim().length < 3) {
      errors.cardHolder = 'Ingrese el nombre del titular de la tarjeta';
      hasErrors = true;
    }
    
    setCardErrors(errors);
    
    if (hasErrors) {
      return;
    }
    
    // Continuar con el proceso de pago
    setPaymentStep(3);
    setIsProcessingPayment(true);
    
    // Simular procesamiento de pago
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentStep(4);
    }, 2000);
  };

  // Función para completar el pago y actualizar el saldo
  const completePayment = async () => {
    setShowPaymentModal(false);
    
    // Actualizar el saldo según el tipo de transacción
    const currentBalance = company?.crypto_assets?.usdt || 0;
    const newBalance = transactionType === 'deposit' 
      ? currentBalance + depositAmountForPayment 
      : currentBalance - depositAmountForPayment;
    
    const success = await updateUsdtBalance(newBalance);
    
    if (success) {
      if (transactionType === 'deposit') {
        setTransactionSuccess(`¡Depósito exitoso! Se han añadido ${depositAmountForPayment} USDT a su cuenta.`);
        setDepositAmount('');
      } else {
        setTransactionSuccess(`¡Retiro exitoso! Se han retirado ${depositAmountForPayment} USDT de su cuenta.`);
        setWithdrawAmount('');
      }
    }
    
    // Resetear el flujo de pago
    setPaymentStep(1);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
  };

  // Modificar el manejador de depósito para usar el nuevo flujo
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransactionError('Ingrese un monto válido mayor a 0');
      return;
    }
    
    // Iniciar flujo de pago con tipo depósito
    startPaymentFlow(amount, 'deposit');
  };
  
  // Manejar retiro de USDT
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransactionError('Ingrese un monto válido mayor a 0');
      return;
    }
    
    const currentBalance = company.crypto_assets.usdt || 0;
    
    if (amount > currentBalance) {
      setTransactionError('Saldo insuficiente para realizar este retiro');
      return;
    }
    
    // Iniciar flujo de pago con tipo retiro
    startPaymentFlow(amount, 'withdraw');
  };
  
  // Función para manejar la transferencia a empleados
  const handleTransferToEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    setTransactionError(null);
    
    try {
      // Validar hash de compañía
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No se encontraron datos de usuario');
      }
      
      const parsedUser = JSON.parse(userData);
      const storedHash = parsedUser.company?.crypto_assets?.nft_hash;
      
      if (!storedHash || storedHash !== transferCompanyHash) {
        throw new Error('Hash de compañía inválido');
      }
      
      // Validar monto
      const amount = parseFloat(transferAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Ingrese un monto válido mayor a 0');
      }
      
      // Validar saldo suficiente
      const currentBalance = company?.crypto_assets?.usdt || 0;
      if (amount > currentBalance) {
        throw new Error('Saldo insuficiente para realizar esta transferencia');
      }
      
      // Validar que se seleccionó un empleado
      if (!selectedAgent) {
        throw new Error('Seleccione un empleado para la transferencia');
      }
      
      // Validar que se ingresó un código de Binance (simulado)
      if (!binanceCode || binanceCode.length < 5) {
        throw new Error('Ingrese un código de Binance válido');
      }
      
      // Procesar la transferencia
      console.log(`Transfiriendo ${amount} USDT al empleado ID: ${selectedAgent}`);
      
      // Actualizar el saldo de la compañía
      const newBalance = currentBalance - amount;
      const success = await updateUsdtBalance(newBalance);
      
      if (success) {
        setTransactionSuccess(`¡Transferencia exitosa! Se han enviado ${amount} USDT al empleado seleccionado.`);
        setTransferAmount('');
        setBinanceCode('');
        setShowTransferModal(false);
      } else {
        throw new Error('Error al procesar la transferencia');
      }
    } catch (error) {
      console.error('Error en transferencia:', error);
      setTransactionError((error as Error).message || 'Error en la transferencia');
    } finally {
      setTransferLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando información de la cuenta...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error al cargar datos</Alert.Heading>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            Verifique su conexión o contacte al administrador del sistema.
          </p>
        </Alert>
      </Container>
    );
  }
  
  if (!company) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>No se encontró información de la compañía</Alert.Heading>
          <p>No se pudo encontrar información de la compañía asociada a su cuenta.</p>
          <hr />
          <p className="mb-0">
            Por favor, verifique que su cuenta esté correctamente configurada o contacte al administrador.
          </p>
        </Alert>
      </Container>
    );
  }
  
  // Renderizar el modal de pago
  const renderPaymentModal = () => {
    return (
      <Modal 
        show={showPaymentModal} 
        onHide={() => setShowPaymentModal(false)}
        backdrop="static"
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {transactionType === 'deposit' ? 'Depósito de USDT' : 'Retiro de USDT'} - 
            {paymentStep === 1 && ' Verificación de Seguridad'}
            {paymentStep === 2 && ' Detalles de Pago'}
            {paymentStep === 3 && ' Procesando Operación'}
            {paymentStep === 4 && ' Operación Completada'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Paso 1: Verificación de seguridad */}
          {paymentStep === 1 && (
            <div>
              <Alert variant="info">
                <FaLock className="me-2" /> 
                {transactionType === 'deposit' 
                  ? `Para continuar con su depósito de ${depositAmountForPayment} USDT, necesitamos verificar su identidad.`
                  : `Para continuar con su retiro de ${depositAmountForPayment} USDT, necesitamos verificar su identidad.`
                }
              </Alert>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={userName} 
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ingrese su nombre"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Apellido</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={userLastName} 
                    onChange={(e) => setUserLastName(e.target.value)}
                    placeholder="Ingrese su apellido"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Hash de Compañía</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={companyHash} 
                    onChange={(e) => setCompanyHash(e.target.value)}
                    placeholder="Ingrese el hash de su compañía"
                  />
                  <Form.Text className="text-muted">
                    Este código se encuentra en la configuración de su compañía.
                  </Form.Text>
                </Form.Group>
              </Form>
            </div>
          )}
          
          {/* Paso 2: Detalles de pago */}
          {paymentStep === 2 && (
            <div>
              <div className="mb-4 text-center">
                <h4>
                  {transactionType === 'deposit' 
                    ? `Monto a depositar: `
                    : `Monto a retirar: `
                  }
                  <span className={transactionType === 'deposit' ? "text-success" : "text-danger"}>
                    {depositAmountForPayment} USDT
                  </span>
                </h4>
                <p className="text-muted">
                  {transactionType === 'deposit'
                    ? 'Complete los detalles de su tarjeta para continuar'
                    : 'Complete los detalles para confirmar el retiro'
                  }
                </p>
                
                <div className="d-flex justify-content-center gap-3 mb-3">
                  <FaCcVisa size={50} className="text-primary" />
                  <FaCcMastercard size={50} className="text-danger" />
                </div>
              </div>
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre en la Tarjeta</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={cardHolderName} 
                    onChange={(e) => setCardHolderName(e.target.value)}
                    placeholder="Nombre como aparece en la tarjeta"
                    isInvalid={!!cardErrors.cardHolder}
                  />
                  <Form.Control.Feedback type="invalid">
                    {cardErrors.cardHolder}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Número de Tarjeta</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={cardNumber} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setCardNumber(value);
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    isInvalid={!!cardErrors.number}
                  />
                  <Form.Control.Feedback type="invalid">
                    {cardErrors.number}
                  </Form.Control.Feedback>
                </Form.Group>
                
                <Row>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Fecha de Expiración</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={expiryDate} 
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^\d/]/g, '');
                          if (value.length > 2 && value[2] !== '/') {
                            value = value.slice(0, 2) + '/' + value.slice(2);
                          }
                          if (value.length <= 5) {
                            setExpiryDate(value);
                          }
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        isInvalid={!!cardErrors.expiry}
                      />
                      <Form.Control.Feedback type="invalid">
                        {cardErrors.expiry}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>CVV</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={cvv} 
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        placeholder="123"
                        maxLength={3}
                        isInvalid={!!cardErrors.cvv}
                      />
                      <Form.Control.Feedback type="invalid">
                        {cardErrors.cvv}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-flex align-items-center mb-3">
                  <FaCreditCard size={24} className="text-primary me-2" />
                  <span>
                    {transactionType === 'deposit' 
                      ? 'Pagos seguros y protegidos' 
                      : 'Retiros seguros y protegidos'
                    }
                  </span>
                </div>
              </Form>
            </div>
          )}
          
          {/* Paso 3: Procesando pago */}
          {paymentStep === 3 && (
            <div className="text-center py-5">
              {isProcessingPayment ? (
                <>
                  <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
                  <h4 className="mt-4">
                    {transactionType === 'deposit'
                      ? 'Procesando su depósito...'
                      : 'Procesando su retiro...'
                    }
                  </h4>
                  <p className="text-muted">Por favor no cierre esta ventana</p>
                </>
              ) : (
                <>
                  <Spinner animation="border" variant="primary" />
                  <p>Verificando información...</p>
                </>
              )}
            </div>
          )}
          
          {/* Paso 4: Pago completado */}
          {paymentStep === 4 && (
            <div className="text-center py-5">
              <FaCheckCircle size={64} className="text-success mb-3" />
              <h3>¡Operación Completada!</h3>
              <p>
                {transactionType === 'deposit'
                  ? `Su depósito de ${depositAmountForPayment} USDT se ha procesado correctamente.`
                  : `Su retiro de ${depositAmountForPayment} USDT se ha procesado correctamente.`
                }
              </p>
              <p className="text-muted">El saldo se actualizará en su cuenta.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {paymentStep === 1 && (
            <>
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={validateCompanyHash}>
                Verificar y Continuar
              </Button>
            </>
          )}
          
          {paymentStep === 2 && (
            <>
              <Button variant="secondary" onClick={() => setPaymentStep(1)}>
                Atrás
              </Button>
              <Button 
                variant={transactionType === 'deposit' ? "success" : "danger"}
                onClick={validateCardDetails}
              >
                {transactionType === 'deposit' ? 'Realizar Depósito' : 'Confirmar Retiro'}
              </Button>
            </>
          )}
          
          {paymentStep === 4 && (
            <Button 
              variant={transactionType === 'deposit' ? "success" : "danger"}
              onClick={completePayment}
            >
              Finalizar
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
  };
  
  // Renderizar modal de transferencia
  const renderTransferModal = () => {
    return (
      <Modal 
        show={showTransferModal} 
        onHide={() => setShowTransferModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Transferir USDT a Empleado</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTransferToEmployee}>
            <Form.Group className="mb-3">
              <Form.Label>Seleccionar Empleado</Form.Label>
              <Form.Control 
                as="select"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                required
              >
                <option value="">Seleccione un empleado</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} - {agent.email} ({agent.role})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Monto a Transferir (USDT)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ingrese cantidad"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                min="0.01"
                step="0.01"
                max={company?.crypto_assets?.usdt || 0}
                required
              />
              <Form.Text className="text-muted">
                Saldo disponible: {company?.crypto_assets?.usdt.toFixed(2) || '0.00'} USDT
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Hash de la Compañía</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el hash de la compañía"
                value={transferCompanyHash}
                onChange={(e) => setTransferCompanyHash(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Código de Binance</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ingrese el código de Binance"
                value={binanceCode}
                onChange={(e) => setBinanceCode(e.target.value)}
                required
              />
            </Form.Group>
            
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit"
                disabled={transferLoading}
              >
                {transferLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                    Procesando...
                  </>
                ) : (
                  'Realizar Transferencia'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    );
  };
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">Crypto Banking</h1>
      
      {/* Saldo actual */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="text-center">
              <FaWallet size={48} className="text-primary mb-3" />
              <h3>Saldo USDT</h3>
              <h2 className="display-4 fw-bold text-success">
                {company?.crypto_assets?.usdt.toFixed(2) || '0.00'}
              </h2>
              <p className="text-muted">Tether USD (USDT)</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Mensajes de transacción */}
      {transactionSuccess && (
        <Alert variant="success" onClose={() => setTransactionSuccess(null)} dismissible>
          {transactionSuccess}
        </Alert>
      )}
      
      {transactionError && (
        <Alert variant="danger" onClose={() => setTransactionError(null)} dismissible>
          {transactionError}
        </Alert>
      )}
      
      {/* Operaciones */}
      <Row>
        {/* Depósito */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light">
              <h4 className="mb-0 d-flex align-items-center">
                <FaArrowDown className="text-success me-2" /> Depositar USDT
              </h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleDeposit}>
                <Form.Group className="mb-3">
                  <Form.Label>Monto a depositar</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Ingrese cantidad"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                    disabled={transactionLoading}
                  />
                </Form.Group>
                <Button 
                  variant="success" 
                  type="submit" 
                  className="w-100"
                  disabled={transactionLoading}
                >
                  {transactionLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Procesando...
                    </>
                  ) : (
                    'Depositar'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Retiro */}
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-light">
              <h4 className="mb-0 d-flex align-items-center">
                <FaArrowUp className="text-danger me-2" /> Retirar USDT
              </h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleWithdraw}>
                <Form.Group className="mb-3">
                  <Form.Label>Monto a retirar</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Ingrese cantidad"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    max={company?.crypto_assets?.usdt || 0}
                    required
                    disabled={transactionLoading}
                  />
                </Form.Group>
                <Button 
                  variant="danger" 
                  type="submit" 
                  className="w-100"
                  disabled={transactionLoading || (company?.crypto_assets?.usdt || 0) <= 0}
                >
                  {transactionLoading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Procesando...
                    </>
                  ) : (
                    'Retirar'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Modal de pago */}
      {renderPaymentModal()}
      {renderTransferModal()}
      
      {/* Transferencia a empleados (reemplazando el historial de transacciones) */}
      <Card className="shadow-sm mt-4">
        <Card.Header className="bg-light">
          <h4 className="mb-0 d-flex align-items-center">
            <FaExchangeAlt className="me-2" /> Transferir USDT a Empleados
          </h4>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <div className="mb-4">
            <FaUserAlt size={48} className="text-primary mb-3" />
            <h5>Enviar USDT a un miembro de su equipo</h5>
            <p className="text-muted">
              Seleccione un empleado y especifique el monto a transferir.
              <br />
              Se requerirá el hash de su compañía para autorizar la transacción.
            </p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => setShowTransferModal(true)}
            disabled={(company?.crypto_assets?.usdt || 0) <= 0}
          >
            Iniciar Transferencia
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CryptoBankingPage; 