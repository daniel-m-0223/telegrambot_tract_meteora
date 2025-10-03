import { WatchlistItem } from '../types';

export class WatchlistService {
  private watchlist: Map<string, WatchlistItem> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 5) {
    this.maxSize = maxSize;
  }

  addContract(contractAddress: string): { success: boolean; message: string } {
    if (this.watchlist.has(contractAddress)) {
      return { success: false, message: 'Contract address is already being watched' };
    }

    if (this.watchlist.size >= this.maxSize) {
      return { success: false, message: `Maximum watchlist size of ${this.maxSize} reached` };
    }

    this.watchlist.set(contractAddress, {
      contractAddress,
      addedAt: new Date(),
    });

    return { success: true, message: `Added ${contractAddress} to watchlist` };
  }

  removeContract(contractAddress: string): { success: boolean; message: string } {
    if (!this.watchlist.has(contractAddress)) {
      return { success: false, message: 'Contract address is not being watched' };
    }

    this.watchlist.delete(contractAddress);
    return { success: true, message: `Removed ${contractAddress} from watchlist` };
  }

  getWatchlist(): WatchlistItem[] {
    return Array.from(this.watchlist.values());
  }

  isWatched(contractAddress: string): boolean {
    return this.watchlist.has(contractAddress);
  }

  updateLastAlert(contractAddress: string): void {
    const item = this.watchlist.get(contractAddress);
    if (item) {
      item.lastAlert = new Date();
    }
  }

  canSendAlert(contractAddress: string, cooldownMinutes: number): boolean {
    const item = this.watchlist.get(contractAddress);
    if (!item || !item.lastAlert) {
      return true;
    }

    const now = new Date();
    const timeDiff = now.getTime() - item.lastAlert.getTime();
    const cooldownMs = cooldownMinutes * 60 * 1000;

    return timeDiff >= cooldownMs;
  }

  /**
   * Check if any of the provided mint addresses are in the watchlist
   * @param mintAddresses Array of mint addresses to check
   * @returns Array of watched mint addresses that match the input
   */
  getWatchedMints(mintAddresses: string[]): string[] {
    const watchedMints: string[] = [];
    const watchlistAddresses = Array.from(this.watchlist.keys());
    
    for (const mintAddress of mintAddresses) {
      if (watchlistAddresses.includes(mintAddress)) {
        watchedMints.push(mintAddress);
      }
    }
    
    return watchedMints;
  }

  /**
   * Check if any of the provided mint addresses are in the watchlist
   * @param mintAddresses Array of mint addresses to check
   * @returns boolean indicating if any mint is watched
   */
  hasWatchedMints(mintAddresses: string[]): boolean {
    return this.getWatchedMints(mintAddresses).length > 0;
  }

  /**
   * Get all watched contract addresses
   * @returns Array of all watched contract addresses
   */
  getWatchedAddresses(): string[] {
    return Array.from(this.watchlist.keys());
  }
}
