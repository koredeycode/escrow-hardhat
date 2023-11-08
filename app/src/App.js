import { ethers } from "ethers";
// import { useEffect, useState } from "react";
import { useState } from "react";
import deploy from "./deploy";
import Escrow from "./Escrow";

// const provider = new ethers.providers.Web3Provider(window.ethereum);

const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(0);

  // useEffect(() => {
  //   async function getAccounts() {
  //     const accounts = await provider.send("eth_requestAccounts", []);

  //     setAccount(accounts[0]);
  //     setSigner(provider.getSigner());
  //   }

  //   getAccounts();
  // }, [account]);

  async function newContract() {
    const beneficiary = document.getElementById("beneficiary").value;
    const arbiter = document.getElementById("arbiter").value;
    const value = ethers.utils.parseEther(document.getElementById("eth").value);
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: ethers.utils.formatEther(value),
      handleApprove: async () => {
        escrowContract.on("Approved", () => {
          document.getElementById(escrowContract.address).className =
            "complete";
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows([...escrows, escrow]);
  }
  async function connectWallet() {
    console.log(provider._network.chainId);
    const accounts = await provider.send("eth_requestAccounts", []);
    // console.log(accounts);
    const _signer = provider.getSigner();
    const _addy = await _signer.getAddress();
    // console.log(_signer);
    setSigner(_signer);
    setAccount(_addy);
    setBalance(ethers.utils.formatEther(await provider.getBalance(_addy)));
    setIsConnected(true);
  }

  async function disconnectWallet() {
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    // console.log(provider);
    // const accounts = await provider.send("eth_requestAccounts", []);
    // console.log(accounts);
    // setAccount(accounts[0]);;
    setIsConnected(false);
    // setSigner(provider.getSigner());
  }
  async function checkAndSwitchNetwork() {
    try {
      // Check the current chain ID
      const currentChainId = await window.ethereum.request({
        method: "eth_requestChainId",
      });

      // Chain ID of the local development network (31337)
      const targetChainId = "0x7a69"; // Hexadecimal representation of 31337

      if (currentChainId !== targetChainId) {
        // Check if the network is already added
        const networks = await window.ethereum.request({
          method: "wallet_getEthereumChain",
        });
        const isNetworkAdded = networks.some(
          (network) => network.chainId === targetChainId
        );

        if (isNetworkAdded) {
          // If the network is already added, switch to it
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetChainId }],
          });
          console.log(
            "Switched to the local development network successfully!"
          );
        } else {
          // If the network is not added, prompt the user to add it
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetChainId,
                chainName: "Local Development Network",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["http://127.0.0.1:8545/"], // Replace with your local development network URL
              },
            ],
          });
          console.log("Added the local development network to the wallet.");
        }
      } else {
        console.log("Already connected to the local development network.");
      }
    } catch (error) {
      console.error("Error checking or switching network:", error);
    }
  }

  // Call the function to check and switch the network
  // checkAndSwitchNetwork();

  window.ethereum.on("accountsChanged", async () => {
    // Handle account change, update UI, etc.
    // console.log("changed", accts);
    // const provider = new ethers.providers.Web3Provider(window.ethereum);
    // console.log(provider);
    // const accounts = await provider.send("eth_requestAccounts", []);
    // console.log(accounts);
    const _signer = provider.getSigner();
    const _addy = await _signer.getAddress();
    console.log(_signer);
    setSigner(_signer);
    setAccount(_addy);
    setBalance(ethers.utils.formatEther(await provider.getBalance(_addy)));
  });

  return (
    <>
      {isConnected ? (
        <div className="account">
          <div>
            <span>
              {`Address: ${account.substring(0, 5)}...${account.substring(38)}`}
            </span>
            <span> Bal: {Math.floor(balance * 100) / 100}</span>
          </div>

          <button className="button" onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      ) : (
        <div className="account">
          <button className="button" onClick={connectWallet}>
            Connect
          </button>
        </div>
      )}
      <div className="main">
        <div className="contract">
          <h1> New Contract </h1>
          <label>
            Arbiter Address
            <input type="text" id="arbiter" />
          </label>

          <label>
            Beneficiary Address
            <input type="text" id="beneficiary" />
          </label>

          <label>
            Deposit Amount (in Eth)
            <input type="text" id="eth" />
          </label>

          <div
            className="button"
            id="deploy"
            onClick={(e) => {
              e.preventDefault();

              newContract();
            }}
          >
            Deploy
          </div>
        </div>

        <div className="existing-contracts">
          <h1> Existing Contracts </h1>

          <div id="container">
            {escrows.map((escrow) => {
              return <Escrow key={escrow.address} {...escrow} />;
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
