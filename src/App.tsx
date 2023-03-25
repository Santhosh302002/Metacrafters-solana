
// import functionalities
import React from 'react';
import './App.css';
import {
  PublicKey,
  Transaction,
  Keypair,
  Connection,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {useEffect , useState } from "react";
import './App.css'
import { Buffer } from 'buffer';

// @ts-ignore
window.Buffer = Buffer;

// create types
type DisplayEncoding = "utf8" | "hex";

type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

// create a provider interface (hint: think of this as an object) to store the Phantom Provider
interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

 /**
 * @description gets Phantom provider, if it exists
 */
 const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    // @ts-ignore
    const provider = window.solana as any;
    if (provider.isPhantom) return provider as PhantomProvider;
  }
};

export default function App() {
  // create state variable for the provider
  const [provider, setProvider] = useState<PhantomProvider | undefined>(
    undefined
  );

	// create state variable for the wallet key
  const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(
  undefined
  );

  const [senderWalletSecretKey, setSenderWalletSecretKey] = useState([] as any);

  const [transactionSuccess, setTransactionSuccess] = useState(false);

  // this is the function that runs whenever the component updates (e.g. render, refresh)
  useEffect(() => {
	  const provider = getProvider();

		// if the phantom provider exists, set this as the provider
	  if (provider) setProvider(provider);
	  else setProvider(undefined);
  }, []);

  /**
   * @description prompts user to connect wallet if it exists.
	 * This function is called when the connect wallet button is clicked
   */
  const connectWallet = async () => {
    // @ts-ignore
    const { solana } = window;

		// checks if phantom wallet exists
    if (solana) {
      try {
        const response = await solana.connect();
        console.log('wallet account ', response.publicKey.toString());
        setWalletKey(response.publicKey.toString());
  
      } catch (err) {

      }
    }
  };

  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  const createAccount = async () => {
    // Create a new keypair
    const newPair = Keypair.generate();
    setSenderWalletSecretKey(newPair.secretKey);

  try {
    // Connect to the Devnet and make a wallet from privateKey
    const connection1 = new Connection(clusterApiUrl("devnet"), "confirmed");
  
    // Request airdrop of 2 SOL to the wallet
    console.log("Airdropping some SOL to my wallet!");
    const fromAirDropSignature = await connection1.requestAirdrop(
        new PublicKey(newPair.publicKey),
        2 * LAMPORTS_PER_SOL
    );
    await connection1.confirmTransaction(fromAirDropSignature);
  sleep(5000);
  const fromAirDropSignature2 = await connection1.requestAirdrop(
    new PublicKey(newPair.publicKey),
    1 * LAMPORTS_PER_SOL
  );
  await connection1.confirmTransaction(fromAirDropSignature2);
  
  } catch (error) {
    console.log(error);
  }
    
  };

  const transferSolana = async () => {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const secret = Uint8Array.from(senderWalletSecretKey);
    const senderKeypair = Keypair.fromSecretKey(secret);
    var transaction = new Transaction().add(
      SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(walletKey.toString()),
          lamports: 2 * LAMPORTS_PER_SOL
      })
    );

    var signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [senderKeypair]
    );

    if (signature) {
      setTransactionSuccess(true);
    }

    console.log("SIGNATURE", signature);
  };

	// HTML code for the app
  return (
    <div className="App">
      <header className="App-header">
        <div className='Banner'>
      <button
        style={{
          boxShadow:"3px 3px 3px",
          fontSize: "16px",
          padding: "15px",
          fontWeight: "bold",
          borderRadius: "5px",
        }}
        onClick={createAccount}
      >
        Create a new Solana account wallet
      </button>
      
      {provider && !walletKey && (
      <button
        style={{
          boxShadow:"3px 3px 3px",
          fontSize: "16px",
          padding: "15px",
          fontWeight: "bold",
          borderRadius: "5px",
          margin:"50px"
        }}
        onClick={connectWallet}
      >
        Connect Wallet
      </button
      >
        )}
        {provider && walletKey && <p>Connected account</p> }

        {!provider && (
          <p>
            No provider found. Install{" "}
            <a href="https://phantom.app/">Phantom Browser extension</a>
          </p>
        )}

        <button
          style={{
            boxShadow:"3px 3px 3px",
            fontSize: "16px",
            padding: "15px",
            fontWeight: "bold",
            borderRadius: "5px",
          }}
          onClick={transferSolana}
        >
          Transfer to the new wallet
        </button>

        {transactionSuccess && <h3>Transaction successfully completed</h3>}
        </div>
        </header>
    </div>
  );
}