import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { PoolInfo, LiquidityAlert } from '../types';

export class SolanaService {
  private connection: Connection;
  private heliusApiKey: string;

  // Raydium AMM Program IDs
  private readonly RAYDIUM_AMM_PROGRAM = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  private readonly RAYDIUM_CPMM_PROGRAM = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';
  
  // Meteora DLMM Program ID
  private readonly METEORA_DLMM_PROGRAM = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo';

  constructor(rpcUrl: string, heliusApiKey: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.heliusApiKey = heliusApiKey;
  }

  async getAccountInfo(address: string): Promise<any> {
    try {
      const publicKey = new PublicKey(address);
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      return accountInfo;
    } catch (error) {
      console.error(`Error getting account info for ${address}:`, error);
      return null;
    }
  }

  async getTokenAccountBalance(address: string): Promise<number> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getTokenAccountBalance(publicKey);
      return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
    } catch (error) {
      console.error(`Error getting token balance for ${address}:`, error);
      return 0;
    }
  }

  async getPoolInfo(poolAddress: string): Promise<PoolInfo | null> {
    try {
      const accountInfo = await this.getAccountInfo(poolAddress);
      if (!accountInfo) return null;

      // Check if it's a Raydium pool
      if (accountInfo.owner.toBase58() === this.RAYDIUM_AMM_PROGRAM || 
          accountInfo.owner.toBase58() === this.RAYDIUM_CPMM_PROGRAM) {
        return await this.parseRaydiumPool(poolAddress, accountInfo);
      }

      // Check if it's a Meteora DLMM pool
      if (accountInfo.owner.toBase58() === this.METEORA_DLMM_PROGRAM) {
        return await this.parseMeteoraPool(poolAddress, accountInfo);
      }

      return null;
    } catch (error) {
      console.error(`Error getting pool info for ${poolAddress}:`, error);
      return null;
    }
  }

  private async parseRaydiumPool(poolAddress: string, accountInfo: any): Promise<PoolInfo | null> {
    try {
      // This is a simplified parser - in production you'd need to properly decode the account data
      // based on Raydium's account structure
      const data = accountInfo.data;
      
      // For now, we'll use a placeholder structure
      // In reality, you'd need to decode the specific account layout
      return {
        address: poolAddress,
        tokenA: 'SOL', // Placeholder - would need proper parsing
        tokenB: 'USDC', // Placeholder - would need proper parsing
        liquidityA: 0, // Would need to parse from account data
        liquidityB: 0, // Would need to parse from account data
        dex: 'raydium'
      };
    } catch (error) {
      console.error('Error parsing Raydium pool:', error);
      return null;
    }
  }

  private async parseMeteoraPool(poolAddress: string, accountInfo: any): Promise<PoolInfo | null> {
    try {
      // Similar to Raydium, this would need proper account data parsing
      return {
        address: poolAddress,
        tokenA: 'SOL', // Placeholder
        tokenB: 'USDC', // Placeholder
        liquidityA: 0, // Would need to parse from account data
        liquidityB: 0, // Would need to parse from account data
        dex: 'meteora'
      };
    } catch (error) {
      console.error('Error parsing Meteora pool:', error);
      return null;
    }
  }

  async subscribeToProgramLogs(programIds: string[], callback: (logs: any) => void): Promise<void> {
    try {
      const publicKeys = programIds.map(id => new PublicKey(id));
      
      // Subscribe to logs for each program individually
      for (const publicKey of publicKeys) {
        this.connection.onLogs(
          publicKey,
          (logs, context) => {
            callback({
              signature: logs.signature,
              logs: logs.logs,
              slot: context.slot,
              err: logs.err
            });
          },
          'confirmed'
        );
      }

      console.log('Subscribed to program logs for:', programIds);
    } catch (error) {
      console.error('Error subscribing to program logs:', error);
    }
  }

  async setupHeliusWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `https://api.helius.xyz/v0/webhooks?api-key=${this.heliusApiKey}`,
        {
          webhookURL: webhookUrl,
          transactionTypes: ['Any'],
          accountAddresses: [this.RAYDIUM_AMM_PROGRAM, this.RAYDIUM_CPMM_PROGRAM, this.METEORA_DLMM_PROGRAM],
          webhookType: 'enhanced'
        }
      );

      console.log('Helius webhook setup response:', response.data);
      return true;
    } catch (error) {
      console.error('Error setting up Helius webhook:', error);
      return false;
    }
  }

  parseTransactionLogs(logs: any): LiquidityAlert | null {
    try {
      // This would parse the actual transaction logs to detect pool creation
      // For now, returning a placeholder structure
      return {
        contractAddress: 'placeholder',
        dex: 'raydium',
        poolAddress: 'placeholder',
        tokenA: 'SOL',
        tokenB: 'USDC',
        liquidityA: 1000,
        liquidityB: 50000,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error parsing transaction logs:', error);
      return null;
    }
  }
}
