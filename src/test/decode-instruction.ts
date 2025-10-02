import  { Connection, PublicKey } from "@solana/web3.js";
import DLMM from '@meteora-ag/dlmm';
import BN from "bn.js";
import { Metadata, deserializeMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { RpcAccount} from '@metaplex-foundation/umi';
import { BorshCoder, Idl } from "@coral-xyz/anchor";
import { IDL as meteoraIdl } from "../dlmm/idl";
import bs58 from "bs58";
import { 
    METEORA_DLMM_PROGRAM,
    ADD_LIQUIDITY_BY_START,
    REMOVE_LIQUIDITY_BY_START 
} from "../constant";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const signatureStr = "LrWryECNjvNTfpncCVpoQ4SYe2rjeLBDGZstqUKK1e3QruqNZ3jwbU5JPJQKLrrcLeZ1gPH3Su5iBe7bPHNhw79";

decodeTx(signatureStr);

async function decodeTx(sig: string) {
    const tx = await connection.getParsedTransaction(sig, {
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

                    console.log(`amountX: ${amountX} \n amountY: ${amountY}`)

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

                    console.log("mintAddressX------------------", mintAddressX);
                    console.log("mintAddressY------------------", mintAddressY);

                    const tokenInfoX = await getTokenInfo(connection, mintAddressX);
                    const tokenInfoY = await getTokenInfo(connection, mintAddressY);
                    let poolAddress;
                    if(tx?.transaction?.message?.instructions?.[i] && typeof tx?.transaction?.message?.instructions?.[i] === 'object' && 'accounts' in tx?.transaction?.message?.instructions?.[i]) {
                        poolAddress = tx?.transaction?.message?.instructions?.[i].accounts?.[1];                        
                    }
                    console.log("poolAddress------------------", poolAddress);

                    // Get quote with pool address
                    const dlmm_pool = await DLMM.create(connection, poolAddress as PublicKey);
                    
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

                    console.log("Token A", tokenInfoX.name, tokenInfoX.symbol);
                    console.log("Token B", tokenInfoY.name, tokenInfoY.symbol);
                    console.log("poolAddress------------------", poolAddress?.toBase58().toString());

                    const signature_link = `https://solscan.io/tx/${sig}`;
                    
                    
                }
                if(ix.programId.toBase58() === METEORA_DLMM_PROGRAM && dataHead === REMOVE_LIQUIDITY_BY_START) {
                    console.log("Remove liquidity index is-----------------------------------------", i)
                }
            }        
        });
    }
}

const METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

function getMetadataPDA(mint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        METADATA_PROGRAM_ID
    )[0];
}
  
export async function getTokenInfo(
    connection: Connection,
    mintAddress: string
) {
    const mint = new PublicKey(mintAddress);
    const metadataPda = getMetadataPDA(mint);
  
    const accountInfo = await connection.getAccountInfo(metadataPda);
    if (!accountInfo) throw new Error("No metadata found for this token");
    
    const metaData = deserializeMetadata(accountInfo as unknown as RpcAccount);
    
    return {
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.uri,
    }
}
