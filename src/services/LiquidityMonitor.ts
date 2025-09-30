import { SolanaService } from './SolanaService';
import { TelegramService } from './TelegramService';
import { WatchlistService } from './WatchlistService';
import { LiquidityAlert } from '../types';

export class LiquidityMonitor {
  private solanaService: SolanaService;
  private telegramService: TelegramService;
  private watchlistService: WatchlistService;
  private alertCooldownMinutes: number;
  private isMonitoring: boolean = false;

  constructor(
    solanaService: SolanaService,
    telegramService: TelegramService,
    watchlistService: WatchlistService,
    alertCooldownMinutes: number = 5
  ) {
    this.solanaService = solanaService;
    this.telegramService = telegramService;
    this.watchlistService = watchlistService;
    this.alertCooldownMinutes = alertCooldownMinutes;
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting liquidity monitoring...');

    // Subscribe to program logs for Raydium and Meteora
    const programIds = [
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
      'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C', // Raydium CPMM
      'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'  // Meteora DLMM
    ];

    await this.solanaService.subscribeToProgramLogs(programIds, (logs) => {
      this.handleProgramLogs(logs);
    });

    console.log('Liquidity monitoring started successfully');
  }

  private async handleProgramLogs(logs: any): Promise<void> {
    try {
      // Parse the logs to detect pool creation and liquidity events
      const alert = this.solanaService.parseTransactionLogs(logs);
      
      if (!alert) {
        return;
      }

      // Check if the contract is in our watchlist
      if (!this.watchlistService.isWatched(alert.contractAddress)) {
        return;
      }

      // Check cooldown to prevent spam
      if (!this.watchlistService.canSendAlert(alert.contractAddress, this.alertCooldownMinutes)) {
        console.log(`Alert cooldown active for ${alert.contractAddress}`);
        return;
      }

      // Send the alert
      await this.telegramService.sendLiquidityAlert(alert);
      
      // Update last alert time
      this.watchlistService.updateLastAlert(alert.contractAddress);

      console.log(`Liquidity alert processed for ${alert.contractAddress}`);
    } catch (error) {
      console.error('Error handling program logs:', error);
    }
  }

  async handleWebhookData(webhookData: any): Promise<void> {
    try {
      // This method would handle webhook data from Helius
      // Parse the webhook data to extract relevant transaction information
      
      if (!webhookData.transaction || !webhookData.transaction.meta) {
        return;
      }

      const transaction = webhookData.transaction;
      const logs = transaction.meta.logMessages || [];

      // Look for pool creation or liquidity addition events
      const isLiquidityEvent = this.detectLiquidityEvent(logs);
      
      if (!isLiquidityEvent) {
        return;
      }

      // Extract contract addresses from the transaction
      const contractAddresses = this.extractContractAddresses(transaction);
      
      // Check if any of the contracts are in our watchlist
      for (const contractAddress of contractAddresses) {
        if (this.watchlistService.isWatched(contractAddress)) {
          // Create alert
          const alert: LiquidityAlert = {
            contractAddress,
            dex: this.detectDEX(logs),
            poolAddress: transaction.transaction.message.accountKeys[0] || 'unknown',
            tokenA: 'SOL', // Would need proper parsing
            tokenB: 'USDC', // Would need proper parsing
            liquidityA: 0, // Would need proper parsing
            liquidityB: 0, // Would need proper parsing
            timestamp: new Date()
          };

          // Check cooldown
          if (this.watchlistService.canSendAlert(contractAddress, this.alertCooldownMinutes)) {
            await this.telegramService.sendLiquidityAlert(alert);
            this.watchlistService.updateLastAlert(contractAddress);
          }
        }
      }
    } catch (error) {
      console.error('Error handling webhook data:', error);
    }
  }

  private detectLiquidityEvent(logs: string[]): boolean {
    // Look for specific log messages that indicate liquidity events
    const liquidityKeywords = [
      'initialize',
      'add_liquidity',
      'create_pool',
      'initialize_pool',
      'mint_liquidity'
    ];

    return logs.some(log => 
      liquidityKeywords.some(keyword => 
        log.toLowerCase().includes(keyword)
      )
    );
  }

  private extractContractAddresses(transaction: any): string[] {
    // Extract contract addresses from transaction account keys
    // This is a simplified version - in production you'd need more sophisticated parsing
    const accountKeys = transaction.transaction.message.accountKeys || [];
    return accountKeys.map((key: any) => key.pubkey).filter(Boolean);
  }

  private detectDEX(logs: string[]): 'raydium' | 'meteora' {
    // Detect which DEX the transaction is from based on log messages
    const raydiumKeywords = ['raydium', '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'];
    const meteoraKeywords = ['meteora', 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo'];

    const logText = logs.join(' ').toLowerCase();
    
    if (raydiumKeywords.some(keyword => logText.includes(keyword.toLowerCase()))) {
      return 'raydium';
    }
    
    if (meteoraKeywords.some(keyword => logText.includes(keyword.toLowerCase()))) {
      return 'meteora';
    }

    return 'raydium'; // Default fallback
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Liquidity monitoring stopped');
  }

  getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }
}
