const tokenContractAddressETH = "0x808688c820AB080A6Ff1019F03E5EC227D9b522B";
const tokenContractAddressBlast = "0xb9dfCd4CF589bB8090569cb52FaC1b88Dbe4981F";
const bridgeContractAddress = "0x697402166Fbf2F22E970df8a6486Ef171dbfc524";
const blastRPC = "https://rpc.blast.io";
let accounts, tokenContractETH, tokenContractBlast, bridgeContract, web3Blast;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Document loaded. Initializing...");
    await init();
    await updateBalanceETH();
    await updateBalanceBlast();
    await updateAllowance();
});


document.getElementById('maxButton').addEventListener('click', () => {
    const maxBalance = document.getElementById('tokenBalanceETH').innerText;
    document.getElementById('amountToBridge').value = maxBalance;
    updateButtonStates(); // Make sure this function updates the state of the buttons based on the new input value
});


async function init() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        web3Blast = new Web3(new Web3.providers.HttpProvider(blastRPC));
        try {
            console.log("Requesting account access...");
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("Accounts received:", accounts);
            const tokenABI = await fetch('tokenABI.json').then(response => response.json());
            tokenContractETH = new web3.eth.Contract(tokenABI, tokenContractAddressETH);
            tokenContractBlast = new web3Blast.eth.Contract(tokenABI, tokenContractAddressBlast);
            const bridgeABI = await fetch('bridgeABI.json').then(response => response.json());
            bridgeContract = new web3.eth.Contract(bridgeABI, bridgeContractAddress);
            console.log("Contracts initialized.");
        } catch (error) {
            console.error("Could not get accounts", error);
        }
    } else {
        console.error('MetaMask is not installed!');
        alert('MetaMask is not installed!');
    }
}

async function updateBalanceETH() {
    console.log("Updating ETH balance...");
    const balance = await tokenContractETH.methods.balanceOf(accounts[0]).call();
    document.getElementById('tokenBalanceETH').innerText = web3.utils.fromWei(balance, 'ether');
    console.log("ETH Balance updated:", balance);
}

async function updateBalanceBlast() {
    console.log("Updating Blast balance...");
    // Assuming the account address format is compatible with Blast; otherwise, additional steps may be needed.
    const balance = await tokenContractBlast.methods.balanceOf(accounts[0]).call();
    document.getElementById('tokenBalanceBlast').innerText = web3Blast.utils.fromWei(balance, 'ether');
    console.log("Blast Balance updated:", balance);
}

async function updateAllowance() {
    console.log("Updating allowance...");
    const allowance = await tokenContractETH.methods.allowance(accounts[0], bridgeContractAddress).call();
    //document.getElementById('allowance').innerText = web3.utils.fromWei(allowance, 'ether');
    console.log("Allowance updated:", allowance);
    updateButtonStates();
}

async function updateButtonStates() {
    console.log("Updating button states...");
    const amountToBridgeETH = document.getElementById('amountToBridge').value || "0";
    const amountToBridgeWEI = web3.utils.toWei(amountToBridgeETH, 'ether');
    console.log("Amount to bridge in WEI:", amountToBridgeWEI);
    const allowanceWEI = await tokenContractETH.methods.allowance(accounts[0], bridgeContractAddress).call();
    console.log("Current allowance in WEI:", allowanceWEI);

    if (BigInt(amountToBridgeWEI) > 0n && BigInt(allowanceWEI) >= BigInt(amountToBridgeWEI)) {
        console.log("Enabling bridge button, disabling approve button.");
        document.getElementById('approveButton').disabled = true;
        document.getElementById('bridgeButton').disabled = false;
    } else if (BigInt(amountToBridgeWEI) > 0n) {
        console.log("Enabling approve button, disabling bridge button.");
        document.getElementById('approveButton').disabled = false;
        document.getElementById('bridgeButton').disabled = true;
    } else {
        console.log("Disabling both buttons.");
        document.getElementById('approveButton').disabled = true;
        document.getElementById('bridgeButton').disabled = true;
    }
}

document.getElementById('approveButton').addEventListener('click', async () => {
    const amountToBridgeETH = document.getElementById('amountToBridge').value;
    const amountToBridgeWEI = web3.utils.toWei(amountToBridgeETH, 'ether');
    console.log("Approving...", amountToBridgeWEI);
    await tokenContractETH.methods.approve(bridgeContractAddress, amountToBridgeWEI).send({ from: accounts[0] });
    await updateAllowance();
});

document.getElementById('bridgeButton').addEventListener('click', async () => {
    const amountToBridgeETH = document.getElementById('amountToBridge').value;
    const amountToBridgeWEI = web3.utils.toWei(amountToBridgeETH, 'ether');
    console.log("Bridging...", amountToBridgeWEI);
    await bridgeContract.methods.bridgeERC20(tokenContractAddressETH, tokenContractAddressBlast, amountToBridgeWEI, '750000', '0x').send({ from: accounts[0] });
    // After bridging, you might want to update balances or perform other actions
});
