import axios from 'axios';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import API_URL from '../config/api';

export interface WalletTransaction {
  id: string;
  type: 'buy' | 'transfer';
  amount: number;
  from: string;
  to: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  network: 'BSC' | 'ETH' | 'TRX';
  tx_hash?: string;
  fee?: number;
  dollar_amount?: number;
}

export interface UserWallet {
  id: number;
  documentId: string;
  wallet_address: string;
  usdt_balance: number;
  pin_hash: string;
  encrypted_data: {
    private_key: string;
    mnemonic: string;
    public_key: string;
  };
  transaction_history: WalletTransaction[];
  is_active: boolean;
  users_permissions_user: number | { id: number };
}

export interface RecipientUser {
  id: number;
  username: string;
  email: string;
  walletAddress: string;
  walletId: string;
}

class UserWalletService {
  private readonly baseURL = `${API_URL}/api`;

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Si hay token, usarlo
    if (token && token !== '') {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
    }
    
    // Si no hay token pero hay usuario (modo demo), usar headers básicos
    if (user) {
      return {
        'Content-Type': 'application/json'
      };
    }
    
    // Por defecto, headers básicos
    return {
      'Content-Type': 'application/json'
    };
  }

  // Generar PIN de 4 dígitos
  generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Hash del PIN
  hashPin(pin: string): string {
    return CryptoJS.SHA256(pin).toString();
  }

  // Verificar PIN
  verifyPin(enteredPin: string, storedHash: string): boolean {
    const enteredHash = CryptoJS.SHA256(enteredPin).toString();
    return enteredHash === storedHash;
  }

  // Obtener wallet del usuario actual
  async getUserWallet(userId: number): Promise<UserWallet | null> {
    try {
      const response = await axios.get(
        `${this.baseURL}/user-wallets?filters[users_permissions_user][id][$eq]=${userId}&populate=*`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user wallet:', error);
      throw error;
    }
  }

  // Crear wallet inicial para el usuario
  async createUserWallet(userId: number): Promise<{ wallet: UserWallet; pin: string }> {
    try {
      // Generar wallet con ethers.js
      const wallet = ethers.Wallet.createRandom();
      const pin = this.generatePin();

      console.log('🔐 PIN generado:', pin);
      console.log('🔐 Hash del PIN:', this.hashPin(pin));

      const walletData = {
        users_permissions_user: userId,
        wallet_address: wallet.address,
        usdt_balance: 0,
        pin_hash: this.hashPin(pin),
        encrypted_data: {
          private_key: wallet.privateKey,
          mnemonic: wallet.mnemonic?.phrase || '',
          public_key: wallet.publicKey
        },
        transaction_history: [],
        is_active: true
      };

      const response = await axios.post(
        `${this.baseURL}/user-wallets`,
        { data: walletData },
        { headers: this.getAuthHeaders() }
      );

      return {
        wallet: response.data.data,
        pin: pin // Retornar el PIN original para mostrarlo al usuario
      };
    } catch (error) {
      console.error('Error creating user wallet:', error);
      throw error;
    }
  }

  // Actualizar wallet con nueva transacción (usando PUT con documentID)
  async updateWalletWithTransaction(
    documentId: string, 
    currentWallet: UserWallet, 
    newTransaction: WalletTransaction,
    newBalance: number
  ): Promise<UserWallet> {
    try {
      // Preservar todos los campos existentes y solo actualizar lo necesario
      const updatedTransactionHistory = [
        newTransaction,
        ...(currentWallet.transaction_history || [])
      ];

      const updateData = {
        data: {
          // Preservar todos los campos existentes
          users_permissions_user: typeof currentWallet.users_permissions_user === 'object' 
            ? currentWallet.users_permissions_user.id 
            : currentWallet.users_permissions_user,
          wallet_address: currentWallet.wallet_address,
          pin_hash: currentWallet.pin_hash,
          encrypted_data: currentWallet.encrypted_data,
          is_active: currentWallet.is_active,
          // Actualizar solo el balance y el historial
          usdt_balance: newBalance,
          transaction_history: updatedTransactionHistory
        }
      };

      console.log('Actualizando wallet con documentID:', documentId);
      console.log('Datos a enviar:', updateData);
      
      const response = await axios.put(
        `${this.baseURL}/user-wallets/${documentId}`,
        updateData,
        { headers: this.getAuthHeaders() }
      );

      console.log('Wallet actualizado exitosamente:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  }

  // Procesar compra de USDT
  async processBuyTransaction(
    userId: number,
    dollarAmount: number,
    usdtAmount: number,
    txHash: string
  ): Promise<{ success: boolean; wallet: UserWallet | null; transaction: WalletTransaction }> {
    try {
      // 1. Obtener wallet actual
      let wallet = await this.getUserWallet(userId);
      
      // 2. Si no existe wallet, crear uno
      if (!wallet) {
        const walletResult = await this.createUserWallet(userId);
        wallet = walletResult.wallet;
      }

      // 3. Crear nueva transacción
      const newTransaction: WalletTransaction = {
        id: Date.now().toString(),
        type: 'buy',
        amount: usdtAmount,
        from: 'Stripe Payment',
        to: wallet.wallet_address,
        timestamp: new Date().toISOString(),
        status: 'completed',
        network: 'BSC',
        tx_hash: txHash,
        fee: 0,
        dollar_amount: dollarAmount
      };

      // 4. Calcular nuevo balance
      const newBalance = (wallet.usdt_balance || 0) + usdtAmount;

      // 5. Actualizar wallet
      const updatedWallet = await this.updateWalletWithTransaction(
        wallet.documentId,
        wallet,
        newTransaction,
        newBalance
      );

      return {
        success: true,
        wallet: updatedWallet,
        transaction: newTransaction
      };
    } catch (error) {
      console.error('Error processing buy transaction:', error);
      throw error;
    }
  }

  // Obtener historial de transacciones
  async getTransactionHistory(userId: number): Promise<WalletTransaction[]> {
    try {
      const wallet = await this.getUserWallet(userId);
      return wallet?.transaction_history || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // Buscar usuario por wallet ID
  async findUserByWalletId(walletId: string): Promise<RecipientUser | null> {
    try {
      console.log('🔍 Buscando destinatario por Wallet ID:', walletId);
      
      const response = await axios.get(
        `${this.baseURL}/user-wallets?filters[wallet_address][$eq]=${walletId}&populate=*`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.data && response.data.data.length > 0) {
        const wallet = response.data.data[0];
        const user = wallet.users_permissions_user;
        
        const recipientUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: wallet.wallet_address,
          walletId: wallet.wallet_address
        };
        
        console.log('✅ Destinatario encontrado (transferencia interna):');
        console.log('   - Nombre de usuario:', recipientUser.username);
        console.log('   - Email:', recipientUser.email);
        console.log('   - ID de usuario:', recipientUser.id);
        console.log('   - Dirección de wallet:', recipientUser.walletAddress);
        
        return recipientUser;
      }
      
      console.log('❌ No se encontró usuario con ese Wallet ID');
      return null;
    } catch (error) {
      console.error('Error finding user by wallet ID:', error);
      return null;
    }
  }

  // Buscar usuario por dirección de wallet
  async findUserByWalletAddress(address: string): Promise<RecipientUser | null> {
    try {
      console.log('🔍 Buscando destinatario por dirección de wallet:', address);
      
      const response = await axios.get(
        `${this.baseURL}/user-wallets?filters[wallet_address][$eq]=${address}&populate=*`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data.data && response.data.data.length > 0) {
        const wallet = response.data.data[0];
        const user = wallet.users_permissions_user;
        
        const recipientUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          walletAddress: wallet.wallet_address,
          walletId: wallet.wallet_address
        };
        
        console.log('✅ Destinatario encontrado (transferencia interna):');
        console.log('   - Nombre de usuario:', recipientUser.username);
        console.log('   - Email:', recipientUser.email);
        console.log('   - ID de usuario:', recipientUser.id);
        console.log('   - Dirección de wallet:', recipientUser.walletAddress);
        
        return recipientUser;
      }
      
      console.log('❌ No se encontró usuario con esa dirección - será transferencia externa');
      return null;
    } catch (error) {
      console.error('Error finding user by wallet address:', error);
      return null;
    }
  }

  // Procesar transferencia entre usuarios usando rutas normales de Strapi
  async processTransfer(
    amount: number,
    toAddress: string,
    networkId: string,
    recipientUserId: number | null
  ): Promise<{ success: boolean; txHash: string; message?: string }> {
    try {
      console.log('🔍 Iniciando transferencia:', { amount, toAddress, networkId, recipientUserId });
      
      const token = localStorage.getItem('token');
      console.log('🔑 Token obtenido:', token ? 'Token encontrado' : 'No hay token');
      
      // Obtener el userId del usuario almacenado en localStorage
      // En el sistema actual, el JWT puede estar vacío, así que obtenemos el userId directamente
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('❌ No se encontró información del usuario en localStorage');
        throw new Error('No user information found');
      }

      let userData;
      try {
        userData = JSON.parse(userStr);
        console.log('✅ Usuario encontrado en localStorage:', { userId: userData.id });
      } catch (parseError) {
        console.error('❌ Error parseando datos del usuario:', parseError);
        throw new Error('Invalid user data format');
      }

      if (!userData || !userData.id) {
        console.error('❌ Usuario sin ID válido:', userData);
        throw new Error('Invalid user ID');
      }
      
      const senderUserId = userData.id;

      // Obtener wallet del remitente
      console.log('🔍 Obteniendo wallet del remitente, userId:', senderUserId);
      const senderWallet = await this.getUserWallet(senderUserId);
      if (!senderWallet) {
        console.error('❌ Wallet del remitente no encontrada para userId:', senderUserId);
        throw new Error('Wallet del remitente no encontrada');
      }
      console.log('✅ Wallet del remitente encontrada:', senderWallet.wallet_address);

      // Obtener configuración de red
      const networks = [
        {
          id: 'bsc',
          name: 'BNB Smart Chain (BEP20)',
          fee: 0,
          minAmount: 0.01,
        },
        {
          id: 'eth',
          name: 'Ethereum (ERC20)',
          fee: 1.2,
          minAmount: 10.0,
        },
        {
          id: 'trx',
          name: 'TRON (TRC20)',
          fee: 0,
          minAmount: 0.01,
        }
      ];

      const selectedNetwork = networks.find(n => n.id === networkId);
      if (!selectedNetwork) {
        throw new Error('Red no válida');
      }
      console.log('🌐 Red seleccionada:', selectedNetwork.name, 'Fee:', selectedNetwork.fee);

      const totalCost = amount + selectedNetwork.fee;
      console.log('💰 Costo total:', totalCost, '(Monto:', amount, '+ Fee:', selectedNetwork.fee, ')');

      // Validar balance
      if (senderWallet.usdt_balance < totalCost) {
        console.error('❌ Balance insuficiente. Balance actual:', senderWallet.usdt_balance, 'Costo total:', totalCost);
        throw new Error('Balance insuficiente');
      }

      // Información sobre el destinatario
      if (recipientUserId) {
        console.log('👤 TRANSFERENCIA INTERNA - Destinatario userId:', recipientUserId);
        console.log('📍 Dirección de destino:', toAddress);
      } else {
        console.log('🌐 TRANSFERENCIA EXTERNA - Dirección de destino:', toAddress);
      }

      // Generar hash de transacción simulado
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      console.log('🔐 Hash de transacción generado:', txHash);
      
      // Crear transacción del remitente
      const senderTransaction: WalletTransaction = {
        id: Date.now().toString(),
        type: 'transfer',
        amount: -amount,
        from: senderWallet.wallet_address,
        to: toAddress,
        timestamp: new Date().toISOString(),
        status: 'completed',
        network: networkId.toUpperCase() as 'BSC' | 'ETH' | 'TRX',
        tx_hash: txHash,
        fee: selectedNetwork.fee
      };

      // Actualizar wallet del remitente usando PUT con documentID
      const newSenderBalance = senderWallet.usdt_balance - totalCost;
      const updatedSenderHistory = [senderTransaction, ...(senderWallet.transaction_history || [])];

      console.log('🔄 Actualizando wallet del remitente - Nuevo balance:', newSenderBalance);

      // Mapear completamente los datos del remitente para evitar reemplazos
      const senderUpdateData = {
        data: {
          users_permissions_user: typeof senderWallet.users_permissions_user === 'object' 
            ? senderWallet.users_permissions_user.id 
            : senderWallet.users_permissions_user,
          wallet_address: senderWallet.wallet_address,
          pin_hash: senderWallet.pin_hash,
          encrypted_data: senderWallet.encrypted_data,
          is_active: senderWallet.is_active,
          usdt_balance: newSenderBalance,
          transaction_history: updatedSenderHistory
        }
      };

      await axios.put(
        `${this.baseURL}/user-wallets/${senderWallet.documentId}`,
        senderUpdateData,
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ Wallet del remitente actualizada exitosamente');

      // Si es una transferencia interna (a otro usuario de la plataforma)
      if (recipientUserId) {
        console.log('🔄 Procesando transferencia interna para userId:', recipientUserId);
        const recipientWallet = await this.getUserWallet(recipientUserId);
        if (recipientWallet) {
          console.log('👤 Wallet del destinatario encontrada:', recipientWallet.wallet_address);
          
          // Crear transacción del destinatario
          const recipientTransaction: WalletTransaction = {
            id: (Date.now() + 1).toString(),
            type: 'transfer',
            amount: amount,
            from: senderWallet.wallet_address,
            to: recipientWallet.wallet_address,
            timestamp: new Date().toISOString(),
            status: 'completed',
            network: networkId.toUpperCase() as 'BSC' | 'ETH' | 'TRX',
            tx_hash: txHash,
            fee: 0
          };

          // Actualizar wallet del destinatario usando PUT con documentID
          const newRecipientBalance = recipientWallet.usdt_balance + amount;
          const updatedRecipientHistory = [recipientTransaction, ...(recipientWallet.transaction_history || [])];

          console.log('🔄 Actualizando wallet del destinatario - Nuevo balance:', newRecipientBalance);

          // Mapear completamente los datos del destinatario para evitar reemplazos
          const recipientUpdateData = {
            data: {
              users_permissions_user: typeof recipientWallet.users_permissions_user === 'object' 
                ? recipientWallet.users_permissions_user.id 
                : recipientWallet.users_permissions_user,
              wallet_address: recipientWallet.wallet_address,
              pin_hash: recipientWallet.pin_hash,
              encrypted_data: recipientWallet.encrypted_data,
              is_active: recipientWallet.is_active,
              usdt_balance: newRecipientBalance,
              transaction_history: updatedRecipientHistory
            }
          };

          await axios.put(
            `${this.baseURL}/user-wallets/${recipientWallet.documentId}`,
            recipientUpdateData,
            { headers: this.getAuthHeaders() }
          );

          console.log('✅ Wallet del destinatario actualizada exitosamente');
        } else {
          console.error('❌ No se pudo encontrar wallet del destinatario para userId:', recipientUserId);
        }
      }

      console.log('🎉 TRANSFERENCIA COMPLETADA EXITOSAMENTE');
      console.log('📊 Resumen de la transferencia:');
      console.log('   - Monto:', amount, 'USDT');
      console.log('   - Comisión:', selectedNetwork.fee, 'USDT');
      console.log('   - Total debitado:', totalCost, 'USDT');
      console.log('   - Red:', selectedNetwork.name);
      console.log('   - Hash:', txHash);
      console.log('   - Remitente:', senderWallet.wallet_address);
      console.log('   - Destinatario:', toAddress);
      console.log('   - Tipo:', recipientUserId ? 'Transferencia interna' : 'Transferencia externa');
      
      // Información adicional sobre el destinatario
      if (recipientUserId) {
        console.log('👥 INFORMACIÓN DEL DESTINATARIO:');
        console.log('   - ID de usuario:', recipientUserId);
        console.log('   - Dirección de wallet:', toAddress);
        console.log('   - Monto recibido:', amount, 'USDT');
        console.log('   - Comisión pagada por destinatario: 0 USDT (transferencia interna)');
      } else {
        console.log('🌐 TRANSFERENCIA EXTERNA:');
        console.log('   - Dirección de destino:', toAddress);
        console.log('   - Nota: No se puede verificar la recepción en transferencias externas');
      }

      return {
        success: true,
        txHash,
        message: 'Transferencia procesada exitosamente'
      };

    } catch (error) {
      console.error('❌ Error processing transfer:', error);
      return {
        success: false,
        txHash: '',
        message: error instanceof Error ? error.message : 'Error en la transferencia'
      };
    }
  }

  // Buscar usuario por email
  async findUserByEmail(email: string): Promise<RecipientUser | null> {
    try {
      console.log('🔍 Buscando destinatario por email:', email);
      
      const response = await axios.get(
        `${this.baseURL}/users?filters[email][$eq]=${encodeURIComponent(email)}&populate=*`,
        { headers: this.getAuthHeaders() }
      );

      if (response.data && response.data.length > 0) {
        const user = response.data[0];
        
        // Verificar si el usuario tiene wallet
        const walletResponse = await axios.get(
          `${this.baseURL}/user-wallets?filters[users_permissions_user][id][$eq]=${user.id}&populate=*`,
          { headers: this.getAuthHeaders() }
        );

        if (walletResponse.data.data && walletResponse.data.data.length > 0) {
          const wallet = walletResponse.data.data[0];
          
          const recipientUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            walletAddress: wallet.wallet_address,
            walletId: wallet.wallet_address
          };
          
          console.log('✅ Usuario encontrado por email:');
          console.table(recipientUser);
          
          return recipientUser;
        } else {
          console.log('❌ Usuario encontrado pero no tiene wallet');
          return null;
        }
      }
      
      console.log('❌ No se encontró usuario con ese email');
      return null;
    } catch (error) {
      console.error('Error searching by email:', error);
      throw error;
    }
  }

  // Obtener miembros de la empresa del usuario actual
  async getCompanyMembers(currentUserId: number): Promise<RecipientUser[]> {
    try {
      console.log('🔍 Buscando miembros de la empresa para usuario:', currentUserId);
      
      // Buscar la empresa del usuario actual
      const response = await axios.get(
        `${this.baseURL}/companies?populate=users_permissions_users&populate=users_permissions_users.user_wallet`,
        { headers: this.getAuthHeaders() }
      );

      if (!response.data.data || response.data.data.length === 0) {
        console.log('❌ No se encontraron empresas');
        return [];
      }

      // Encontrar la empresa que contiene al usuario actual
      let currentUserCompany = null;
      for (const company of response.data.data) {
        const hasCurrentUser = company.users_permissions_users.some((user: any) => user.id === currentUserId);
        if (hasCurrentUser) {
          currentUserCompany = company;
          break;
        }
      }

      if (!currentUserCompany) {
        console.log('❌ Usuario actual no pertenece a ninguna empresa');
        return [];
      }

      console.log('✅ Empresa encontrada:', currentUserCompany.name);

      // Obtener todos los usuarios de la empresa (excepto el actual) con sus wallets
      const members: RecipientUser[] = [];
      
      for (const user of currentUserCompany.users_permissions_users) {
        if (user.id !== currentUserId) {
          try {
            // Buscar wallet del usuario
            const walletResponse = await axios.get(
              `${this.baseURL}/user-wallets?filters[users_permissions_user][id][$eq]=${user.id}&populate=*`,
              { headers: this.getAuthHeaders() }
            );

            if (walletResponse.data.data && walletResponse.data.data.length > 0) {
              const wallet = walletResponse.data.data[0];
              
              members.push({
                id: user.id,
                username: user.username,
                email: user.email,
                walletAddress: wallet.wallet_address,
                walletId: wallet.wallet_address
              });
            }
          } catch (error) {
            console.warn(`No se pudo obtener wallet para usuario ${user.username}:`, error);
          }
        }
      }

      console.log('✅ Miembros de la empresa encontrados:');
      console.table(members);

      return members;
    } catch (error) {
      console.error('Error getting company members:', error);
      throw error;
    }
  }
}

export const userWalletService = new UserWalletService();