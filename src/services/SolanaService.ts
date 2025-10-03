import { Connection, PublicKey } from '@solana/web3.js';
import DLMM from '@meteora-ag/dlmm';
import { TelegramService } from './TelegramService';
import { WatchlistService } from './WatchlistService';
import { RpcAccount} from '@metaplex-foundation/umi';
import axios from 'axios';
import bs58 from "bs58";
import BN from "bn.js";
import  { getTokenMetadata} from "@solana/spl-token";
import { Metadata, deserializeMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { 
    METEORA_DLMM_PROGRAM,
    ADD_LIQUIDITY_BY_START,
    REMOVE_LIQUIDITY_BY_START,
    METADATA_PROGRAM_ID
} from "../constant";
import { PoolInfo, LiquidityAlert } from '../types';

export class SolanaService {
  private connection: Connection;
  private heliusApiKey: string;
  private telegramService: TelegramService | null;
  private watchlistService: WatchlistService | null;

  // Raydium AMM Program IDs
  private readonly RAYDIUM_AMM_PROGRAM = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
  private readonly RAYDIUM_CPMM_PROGRAM = 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C';
  
  // Meteora DLMM Program ID
  private readonly METEORA_DLMM_PROGRAM = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo';

  constructor(rpcUrl: string, heliusApiKey: string, telegramService: TelegramService | null, watchlistService: WatchlistService | null = null) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.heliusApiKey = heliusApiKey;
    this.telegramService = telegramService;
    this.watchlistService = watchlistService;
  }

  setTelegramService(telegramService: TelegramService): void {
    this.telegramService = telegramService;
  }

  setWatchlistService(watchlistService: WatchlistService): void {
    this.watchlistService = watchlistService;
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
        this.connection.onLogs(
          publicKey,
          async (logInfo) => {
            const { logs, signature } = logInfo;
            if (logs.some((l) => l.includes("AddLiquidity"))) {
              await this.decodeTx(signature);
            }
            if (logs.some((l) => l.includes("RemoveLiquidity"))) {
              await this.decodeTx(signature);
            }
          },
          "confirmed"
        )
      }

      console.log('Subscribed to program logs for:', programIds);
    } catch (error) {
      console.error('Error subscribing to program logs:', error);
    }
  }

  async decodeTx(sig: string): Promise<void> {
    const tx = await this.connection.getParsedTransaction(sig, {
      maxSupportedTransactionVersion: 0,
    });
    if(tx?.transaction?.message?.instructions) {
        tx?.transaction?.message?.instructions?.forEach(async(ix: any, i: number) => {
            if(typeof ix.data === 'string') {
                const base58Bytes = bs58.decode(ix.data);
                const hexBytes = Buffer.from(base58Bytes).toString('hex');
                const dataHead = hexBytes.slice(0, 16);
                
                if(ix.programId.toBase58() === METEORA_DLMM_PROGRAM && dataHead === ADD_LIQUIDITY_BY_START) {
                    console.log("Add liquidity index is-----------------------------------------", i)
                    const hexAmountX = hexBytes.slice(16, 32);
                    const bufX = Buffer.from(hexAmountX, 'hex');
                    const amountX = bufX.readBigUInt64LE();

                    const hexAmountY = hexBytes.slice(32, 48);
                    const bufY = Buffer.from(hexAmountY, 'hex');
                    const amountY = bufY.readBigUInt64LE();
                    // Get the instructions of the token when add liquidity
                    const innerInstructions = tx?.meta?.innerInstructions?.find((it: any) => it.index === i);
                    // Find the first and second token transfer instructions (usually index 0 and 1)
                    const parsedInstructions = innerInstructions?.instructions?.filter(
                        (ix: any) => "parsed" in ix
                      ) ?? [];
                    const instructionsX = parsedInstructions?.[0];
                    const instructionsY = parsedInstructions?.[1];

                    // Get the mint address of the token when add liquidity
                    const mintAddressX = (instructionsX && 'parsed' in instructionsX && instructionsX.parsed?.info?.mint) ? instructionsX.parsed.info.mint : undefined;
                    const mintAddressY = (instructionsY && 'parsed' in instructionsY && instructionsY.parsed?.info?.mint) ? instructionsY.parsed.info.mint : undefined;

                    const decimalX = (instructionsX && 'parsed' in instructionsX && instructionsX.parsed?.info?.tokenAmount?.decimals) ? instructionsX.parsed.info.tokenAmount.decimals : undefined;
                    const decimalY = (instructionsY && 'parsed' in instructionsY && instructionsY.parsed?.info?.tokenAmount?.decimals) ? instructionsY.parsed.info.tokenAmount.decimals : undefined;


                    // Check if any of the mint addresses are in the watchlist
                    if (this.watchlistService) {
                        const mintAddresses = [mintAddressX, mintAddressY].filter(Boolean);
                        if (!this.watchlistService.hasWatchedMints(mintAddresses)) {
                            console.log("No watched mints found in transaction, skipping alert");
                            return;
                        }
                        console.log("Found watched mints in transaction:", this.watchlistService.getWatchedMints(mintAddresses));
                    }

                    const tokenInfoX = await this.getTokenInfo(this.connection, mintAddressX);
                    const tokenInfoY = await this.getTokenInfo(this.connection, mintAddressY);
                    let poolAddress;
                    if(tx?.transaction?.message?.instructions?.[i] && typeof tx?.transaction?.message?.instructions?.[i] === 'object' && 'accounts' in tx?.transaction?.message?.instructions?.[i]) {
                        poolAddress = tx?.transaction?.message?.instructions?.[i].accounts?.[1];                        
                    }
                    console.log("poolAddress", poolAddress);

                    // Get quote with pool address
                    try {
                        const dlmm_pool = await DLMM.create(this.connection, poolAddress as PublicKey);
                        
                        const swapAmount = new BN(10 ** decimalX);
                        const swapYtoX = true;
                        const binArrays = await dlmm_pool.getBinArrayForSwap(swapYtoX);

                        const swapQuote = await dlmm_pool.swapQuote(
                            swapAmount,
                            swapYtoX,
                            new BN(1),
                            binArrays
                        )

                        // console.log("swapQuote------------------", swapAmount,swapQuote);
                        console.log(
                            "consumedInAmount: %s, outAmount: %s",
                            (swapQuote.consumedInAmount.toNumber() / 10 ** decimalX).toString(),
                            (swapQuote.outAmount.toNumber() / 10 ** decimalY).toString()
                        );

                        const signature_link = `https://solscan.io/tx/${sig}`;
                        
                        if (this.telegramService) {
                            this.telegramService.addLiquidityAlert({
                                tokenA: tokenInfoX.name,
                                tokenB: tokenInfoY.name,
                                mintA: mintAddressX,
                                mintB: mintAddressY,
                                dex: 'Meteora DLMM',
                                pair: ` ${tokenInfoX.symbol} | ${tokenInfoY.symbol}`,
                                pool: poolAddress?.toBase58().toString(),
                                liquidity: `${amountX !== 0n ? Number(amountX) / (10 ** decimalX) : 0} ${tokenInfoX.symbol} + ${amountY !== 0n ? Number(amountY) / (10 ** decimalY) : 0} ${tokenInfoY.symbol}`,
                                price: (swapQuote.outAmount.toNumber() / 10 ** decimalX).toString(),
                                tx: sig
                            });
                        }
                    } catch (error) {
                        console.warn(`Failed to get swap quote for pool ${poolAddress?.toBase58()}:`, error);
                        
                        // Still send the liquidity alert without price information
                        if (this.telegramService) {
                            this.telegramService.addLiquidityAlert({
                                tokenA: tokenInfoX.name,
                                tokenB: tokenInfoY.name,
                                mintA: mintAddressX,
                                mintB: mintAddressY,
                                dex: 'Meteora DLMM',
                                pair: ` ${tokenInfoX.symbol} | ${tokenInfoY.symbol}`,
                                pool: poolAddress?.toBase58().toString(),
                                liquidity: `${amountX !== 0n ? Number(amountX) / (10 ** decimalX) : 0} ${tokenInfoX.symbol} + ${amountY !== 0n ? Number(amountY) / (10 ** decimalY) : 0} ${tokenInfoY.symbol}`,
                                price: 'N/A (insufficient liquidity for quote)',
                                tx: sig
                            });
                        }
                    }
                }
                if(ix.programId.toBase58() === METEORA_DLMM_PROGRAM && dataHead === REMOVE_LIQUIDITY_BY_START) {
                    console.log("Remove liquidity index is-----------------------------------------", i)
                    return
                }
            }        
        });
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

  getMetadataPDA(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [
          Buffer.from("metadata"),
          new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
          mint.toBuffer(),
      ],
      new PublicKey(METADATA_PROGRAM_ID)
    )[0];
  }
    
  async getTokenInfo(
      connection: Connection,
      mintAddress: string
  ) {
      try {
          const mint = new PublicKey(mintAddress);
          const metadataPda = this.getMetadataPDA(mint);

          const accountInfo = await connection.getAccountInfo(metadataPda);
          if (!accountInfo) {
              const metaData = await getTokenMetadata(connection, new PublicKey(mintAddress));
              return {
                  name: metaData?.name || 'Unknown Token',
                  symbol: metaData?.symbol || 'UNK',
                  uri: '',
                  mintAddress: mintAddress
              };
          }
          
          const metaData = deserializeMetadata(accountInfo as unknown as RpcAccount);
          
          return {
              name: metaData.name || 'Unknown Token',
              symbol: metaData.symbol || 'UNK',
              uri: metaData.uri || '',
              mintAddress: mintAddress
          };
      } catch (error) {
          console.error(`Error getting token info for ${mintAddress}:`, error);
          return {
              name: 'Unknown Token',
              symbol: 'UNK',
              uri: '',
              mintAddress: mintAddress
          };
      }
  }
}
