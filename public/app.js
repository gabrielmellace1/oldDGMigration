document.addEventListener('DOMContentLoaded', async () => {
    await init();
});

const oldTokenContractAddress = "0xEE06A81a695750E71a662B51066F2c74CF4478a0";
const newTokenContractAddress = "0x4b520c812e8430659fc9f12f6d0c39026c83588d";
let accounts, oldTokenContract, newTokenContract, web3;

async function init() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("Accounts received:", accounts);

            const oldTokenABI = await fetch('oldDG.json').then(response => response.json());
            oldTokenContract = new web3.eth.Contract(oldTokenABI, oldTokenContractAddress);

            const newTokenABI = await fetch('newDG.json').then(response => response.json());
            newTokenContract = new web3.eth.Contract(newTokenABI, newTokenContractAddress);

            console.log("Contracts initialized with their respective ABIs.");
            await updateBalances();
            await updateAllowance();
            document.getElementById('amountToBridge').disabled = false;
        } catch (error) {
            console.error("Could not get accounts", error);
        }
    } else {
        console.error('MetaMask is not installed!');
        alert('MetaMask is not installed!');
    }
}

async function updateBalances() {
    const oldBalance = await oldTokenContract.methods.balanceOf(accounts[0]).call();
    document.getElementById('oldTokenBalance').innerText = web3.utils.fromWei(oldBalance, 'ether');

    const newBalance = await newTokenContract.methods.balanceOf(accounts[0]).call();
    document.getElementById('newTokenBalance').innerText = web3.utils.fromWei(newBalance, 'ether');
}

async function updateAllowance() {
    const allowance = await oldTokenContract.methods.allowance(accounts[0], newTokenContractAddress).call();
    updateButtonStates();
}

async function updateButtonStates() {
    if (typeof web3 === 'undefined') {
        console.error('web3 is not initialized.');
        return;
    }

    const amountToMigrate = document.getElementById('amountToBridge').value || "0";
    const amountToMigrateWEI = web3.utils.toWei(amountToMigrate, 'ether');
    const allowanceWEI = await oldTokenContract.methods.allowance(accounts[0], newTokenContractAddress).call();

    if (BigInt(amountToMigrateWEI) > 0n && BigInt(allowanceWEI) >= BigInt(amountToMigrateWEI)) {
        document.getElementById('approveButton').disabled = true;
        document.getElementById('migrateButton').disabled = false;
    } else if (BigInt(amountToMigrateWEI) > 0n) {
        document.getElementById('approveButton').disabled = false;
        document.getElementById('migrateButton').disabled = true;
    } else {
        document.getElementById('approveButton').disabled = true;
        document.getElementById('migrateButton').disabled = true;
    }
}

document.getElementById('approveButton').addEventListener('click', async () => {
    const amountToApproveWEI = web3.utils.toWei(document.getElementById('amountToBridge').value, 'ether');
    console.log(amountToApproveWEI);
    await oldTokenContract.methods.approve(newTokenContractAddress, amountToApproveWEI).send({ from: accounts[0] });
    console.log("Approval successful");
    await updateAllowance();
});

document.getElementById('migrateButton').addEventListener('click', async () => {
    const amountToMigrateWEI = web3.utils.toWei(document.getElementById('amountToBridge').value, 'ether');
    await newTokenContract.methods.goLight(amountToMigrateWEI).send({ from: accounts[0] });
    console.log("Migration successful");
    await updateBalances();
});
