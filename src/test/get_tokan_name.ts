import { fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey as MPublicKey } from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

(async() => {
    try {
        const mint = "Ey59PH7Z4BFU4HjyKnyMdWt5GGN76KazTAwQihoUXRnk";
        const umi = await createUmi("https://api.mainnet-beta.solana.com")
        const res =await  fetchDigitalAsset(
                umi,
                <MPublicKey>mint
        )

        console.log("result", res);
    } catch (error) {
        console.log("error", error);
    }


})();
// this._symbol = res.metadata.symbol.toUpperCase()
// this._name = res.metadata.name
// this._decimals = res.mint.decimals
// this._supply = res.mint.supply