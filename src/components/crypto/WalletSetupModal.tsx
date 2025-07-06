import React, { useState } from 'react';
import { FaWallet, FaShieldAlt, FaEye, FaEyeSlash, FaCopy, FaExclamationTriangle } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

interface WalletSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletCreated: (wallet: CreatedWallet) => void;
  user: UserProps;
}

interface UserProps {
  id: string;
  email: string;
  nombre?: string;
}

interface CreatedWallet {
  id: string;
  address: string;
  usdt_balance: number;
  pin_hash: string;
  encrypted_data: {
    private_key: string;
    mnemonic: string;
    public_key: string;
  };
  transaction_history: [];
  created_at: string;
  last_access: string;
  is_active: boolean;
}

export const WalletSetupModal: React.FC<WalletSetupModalProps> = ({
  isOpen,
  onClose,
  onWalletCreated
}) => {
  const [step, setStep] = useState(1);
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdWallet, setCreatedWallet] = useState<CreatedWallet | null>(null);

  // Generar PIN automáticamente
  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos
    setGeneratedPin(pin);
    setStep(2);
  };

  // Confirmar PIN y crear wallet
  const handlePinConfirmation = async () => {
    if (confirmPin !== generatedPin) {
      toast.error('El PIN no coincide');
      return;
    }

    setIsCreating(true);
    try {
      // Crear wallet con ethers.js
      const wallet = ethers.Wallet.createRandom();
      
      // Crear datos de la wallet
      const walletData: CreatedWallet = {
        id: uuidv4(),
        address: wallet.address,
        usdt_balance: 0,
        pin_hash: btoa(generatedPin), // Simulación simple de hash
        encrypted_data: {
          private_key: wallet.privateKey,
          mnemonic: wallet.mnemonic?.phrase || '',
          public_key: wallet.publicKey
        },
        transaction_history: [],
        created_at: new Date().toISOString(),
        last_access: new Date().toISOString(),
        is_active: true
      };

      setCreatedWallet(walletData);
      setStep(3);
      
    } catch (error) {
      console.error('Error al crear wallet:', error);
      toast.error('Error al crear wallet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFinish = () => {
    if (createdWallet && pinConfirmed) {
      onWalletCreated(createdWallet);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaWallet className="text-2xl" />
              <h2 className="text-xl font-bold">Configurar Crypto Wallet</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Introducción */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaWallet className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Crear Tu Crypto Wallet
                </h3>
                <p className="text-gray-600">
                  Se generará una wallet segura para comprar y transferir USDT
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaExclamationTriangle className="text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">Importante</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Se generará un PIN de 6 dígitos que será IRRECUPERABLE. 
                  Debes guardarlo en un lugar seguro ya que será necesario para acceder a tu wallet.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Wallet segura con claves privadas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Soporte para USDT en múltiples redes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Compra con tarjeta de crédito</span>
                </div>
              </div>

              <button
                onClick={generatePin}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Generar PIN y Crear Wallet
              </button>
            </div>
          )}

          {/* Step 2: Mostrar PIN */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaShieldAlt className="text-red-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡Guarda tu PIN!
                </h3>
                <p className="text-gray-600">
                  Este PIN es IRRECUPERABLE. Guárdalo en un lugar seguro.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="text-center">
                  <label className="block text-sm font-medium text-red-800 mb-3">
                    Tu PIN de Seguridad
                  </label>
                  <div className="bg-white border-2 border-red-300 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-mono font-bold text-red-600 tracking-widest">
                        {showPin ? generatedPin : '••••••'}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowPin(!showPin)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          {showPin ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(generatedPin, 'PIN')}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    Escribe este PIN en un lugar seguro. Lo necesitarás para acceder a tu wallet.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Confirma tu PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Ingresa el PIN mostrado arriba"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handlePinConfirmation}
                  disabled={!confirmPin || isCreating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isCreating ? 'Creando...' : 'Confirmar PIN'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Wallet creada */}
          {step === 3 && createdWallet && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaWallet className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡Wallet Creada Exitosamente!
                </h3>
                <p className="text-gray-600">
                  Tu wallet de criptomonedas está lista para usar
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">
                      Dirección de la Wallet
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">
                        {truncateAddress(createdWallet.address)}
                      </code>
                      <button
                        onClick={() => copyToClipboard(createdWallet.address, 'Dirección')}
                        className="p-2 text-green-600 hover:text-green-800"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-800 mb-1">
                      Wallet ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border text-sm">
                        {createdWallet.id}
                      </code>
                      <button
                        onClick={() => copyToClipboard(createdWallet.id, 'Wallet ID')}
                        className="p-2 text-green-600 hover:text-green-800"
                      >
                        <FaCopy />
                      </button>
                  </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaShieldAlt className="text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Seguridad</h4>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Tu PIN es tu única forma de acceder a la wallet</li>
                  <li>• Nunca compartas tu PIN con nadie</li>
                  <li>• Guarda tu PIN en un lugar seguro</li>
                  <li>• Si pierdes tu PIN, no podrás acceder a tus fondos</li>
                </ul>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="pinConfirmation"
                  checked={pinConfirmed}
                  onChange={(e) => setPinConfirmed(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="pinConfirmation" className="text-sm text-gray-700">
                  Confirmo que he guardado mi PIN en un lugar seguro
                </label>
              </div>

              <button
                onClick={handleFinish}
                disabled={!pinConfirmed}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                Completar Configuración
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 