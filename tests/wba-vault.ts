import * as anchor from "@coral-xyz/anchor";
import { WbaVault, IDL } from "../target/types/wba_vault";
const { web3 } = anchor;

describe("wba-vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const keypair = anchor.web3.Keypair.generate();
  const connection = new web3.Connection("http://localhost:8899");
  const commitment = "confirmed";

  const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment });

  const programId = new web3.PublicKey("Gss8LX9bLNVB9e37eUrtqouWMGeuqNTUyJEhCkYZNhVK");
  const program = new anchor.Program<WbaVault>(IDL, programId, provider);

  const confirmTransaction = async (signature: string) => {
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      commitment
    );
  }

  it("aidrop", async () => {
    const signature = await connection.requestAirdrop(keypair.publicKey, 2 * web3.LAMPORTS_PER_SOL);
    await confirmTransaction(signature);
  })

  it("Is initialized!", async () => {
    const vaultState = web3.Keypair.generate();
    console.log(`vaultState keypair: ${vaultState.publicKey.toBase58()}`);

    const vault_auth_seeds = [Buffer.from("auth"), vaultState.publicKey.toBuffer()];
    const vaultAuth = web3.PublicKey.findProgramAddressSync(vault_auth_seeds, program.programId)[0];

    const vault_seeds = [Buffer.from("vault"), vaultAuth.toBuffer()];
    const vault = web3.PublicKey.findProgramAddressSync(vault_seeds, program.programId)[0];

    const signature = await program.methods
      .initialize()
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth,
        vault,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([
        keypair,
        vaultState,
      ]).rpc();

    console.log(`signature: ${signature}`);
    await confirmTransaction(signature);
  });
});

