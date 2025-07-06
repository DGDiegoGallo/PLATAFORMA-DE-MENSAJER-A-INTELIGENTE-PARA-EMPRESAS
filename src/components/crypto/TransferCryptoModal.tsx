import React, { useState } from 'react';
import { FaArrowRight, FaQrcode, FaExclamationTriangle, FaCheckCircle, FaSpinner, FaCopy, FaInfoCircle, FaSearch, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { userWalletService } from '../../services/userWallet.service';

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

interface TransferCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number, toAddress: string, network: string, txHash: string) => void;
  currentBalance: number;
  networks: NetworkOption[];
  walletAddress: string;
}

export const TransferCryptoModal: React.FC<TransferCryptoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
  networks,
  walletAddress
}) => {
  const [step, setStep] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [recipientInput, setRecipientInput] = useState('');
  const [searchMode, setSearchMode] = useState<'walletId' | 'address'>('walletId');
  const [recipientUser, setRecipientUser] = useState<RecipientUser | null>(null);
  const [toAddress, setToAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption>(networks[0]);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showNetworkInfo, setShowNetworkInfo] = useState(false);

  const availableBalance = currentBalance;
  const transferAmount = parseFloat(amount) || 0;
  const networkFee = selectedNetwork.fee;
  const totalCost = transferAmount + networkFee;
  const remainingBalance = availableBalance - totalCost;

  const validateAddress = (address: string) => {
    // Validación básica de dirección Ethereum/BSC
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const searchRecipient = async () => {
    if (!recipientInput.trim()) {
      toast.error('Ingresa un Wallet ID o dirección');
      return;
    }

    setIsSearching(true);
    try {
      if (searchMode === 'walletId') {
        // Buscar por wallet ID
        const user = await userWalletService.findUserByWalletId(recipientInput.trim());
        if (user) {
          setRecipientUser(user);
          setToAddress(user.walletAddress);
          toast.success(`Usuario encontrado: ${user.username}`);
        } else {
          toast.error('Usuario no encontrado con este Wallet ID');
        }
      } else {
        // Buscar por dirección
        if (!validateAddress(recipientInput)) {
          toast.error('Dirección inválida');
          return;
        }
        
        const user = await userWalletService.findUserByWalletAddress(recipientInput);
        if (user) {
          setRecipientUser(user);
          setToAddress(recipientInput);
          toast.success(`Usuario encontrado: ${user.username}`);
        } else {
          // Si no se encuentra usuario, permitir transferencia a dirección externa
          setRecipientUser(null);
          setToAddress(recipientInput);
          toast.info('Transferencia a dirección externa');
        }
      }
    } catch (error) {
      console.error('Error searching recipient:', error);
      toast.error('Error al buscar destinatario');
    } finally {
      setIsSearching(false);
    }
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
    setShowNetworkInfo(false);
  };

  const processTransfer = async () => {
    if (!validateTransfer()) return;

    setIsProcessing(true);
    setStep(3);

    try {
      // Pasos del procesamiento
      setProcessingStep('Iniciando transferencia...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep('Verificando destinatario...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStep('Procesando transacción...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingStep('Confirmando en la red...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Procesar transferencia
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
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const resetModal = () => {
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

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaArrowRight className="text-2xl" />
              <h2 className="text-xl font-bold">Transferir USDT</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Buscar destinatario */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Buscar destinatario</h3>
              </div>

              {/* Modo de búsqueda */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setSearchMode('walletId')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    searchMode === 'walletId'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Wallet ID
                </button>
                <button
                  onClick={() => setSearchMode('address')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    searchMode === 'address'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Dirección
                </button>
              </div>

              {/* Campo de búsqueda */}
              <div className="relative">
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder={searchMode === 'walletId' ? 'Ingresa el Wallet ID del destinatario' : 'Ingresa la dirección de la wallet'}
                  className="w-full p-3 border border-gray-300 rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={searchRecipient}
                  disabled={isSearching}
                  className="absolute right-3 top-3 text-gray-500 hover:text-orange-500 disabled:opacity-50"
                >
                  {isSearching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
                </button>
              </div>

              {/* Información del destinatario */}
              {recipientUser && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FaUser className="text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">{recipientUser.username}</p>
                      <p className="text-sm text-green-600">{recipientUser.email}</p>
                      <p className="text-xs text-gray-500">
                        Wallet ID: {recipientUser.walletId}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información de transferencia externa */}
              {toAddress && !recipientUser && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <FaExclamationTriangle className="text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-800">Transferencia externa</p>
                      <p className="text-sm text-yellow-600">
                        {truncateAddress(toAddress)}
                      </p>
                      <p className="text-xs text-yellow-600">
                        Verifica que la dirección sea correcta
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!toAddress}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configurar transferencia */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Configurar transferencia</h3>
              </div>

              {/* Resumen del destinatario */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Destinatario</p>
                {recipientUser ? (
                  <div>
                    <p className="font-semibold">{recipientUser.username}</p>
                    <p className="text-sm text-gray-500">{truncateAddress(toAddress)}</p>
                  </div>
                ) : (
                  <p className="font-semibold">{truncateAddress(toAddress)}</p>
                )}
              </div>

              {/* Selección de red */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Red de transferencia
                </label>
                <div className="space-y-2">
                  {networks.map((network) => (
                    <div
                      key={network.id}
                      onClick={() => handleNetworkChange(network)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedNetwork.id === network.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{network.name}</p>
                          <p className="text-sm text-gray-500">
                            Comisión: {network.fee} USDT
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Mín: {network.minAmount} USDT
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Monto a transferir
                  </label>
                  <button
                    onClick={handleMaxAmount}
                    className="text-sm text-orange-500 hover:text-orange-600"
                  >
                    Máximo
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 border border-gray-300 rounded-lg pr-16 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    step="0.000001"
                    min="0"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">USDT</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Disponible: {availableBalance.toFixed(6)} USDT
                </p>
              </div>

              {/* Resumen de costos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto a transferir</span>
                    <span>{transferAmount.toFixed(6)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comisión de red</span>
                    <span>{networkFee.toFixed(6)} USDT</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total a pagar</span>
                      <span>{totalCost.toFixed(6)} USDT</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Balance restante</span>
                    <span>{Math.max(0, remainingBalance).toFixed(6)} USDT</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={processTransfer}
                  disabled={!amount || parseFloat(amount) <= 0 || totalCost > availableBalance}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Transferir
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Procesando */}
          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin text-4xl text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Procesando transferencia
                </h3>
                <p className="text-gray-600">{processingStep}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Por favor, no cierres esta ventana mientras se procesa la transferencia.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Completado */}
          {step === 4 && (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <FaCheckCircle className="text-6xl text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡Transferencia exitosa!
                </h3>
                <p className="text-gray-600">
                  Se han transferido {transferAmount.toFixed(6)} USDT
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  {recipientUser ? 
                    `A: ${recipientUser.username}` : 
                    `A: ${truncateAddress(toAddress)}`
                  }
                </p>
                <p className="text-sm text-green-600">
                  Red: {selectedNetwork.name}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 