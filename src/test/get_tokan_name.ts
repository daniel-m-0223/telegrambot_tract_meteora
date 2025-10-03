import { fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey as MPublicKey } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { Connection, PublicKey } from "@solana/web3.js";
import  { getTokenMetadata} from "@solana/spl-token";

const connection = new Connection("https://api.mainnet-beta.solana.com");

(async() => {
    const mintAddress = "pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn";
    const metaData = await getTokenMetadata(connection, new PublicKey(mintAddress));
    console.log("metaData", metaData);
})();

