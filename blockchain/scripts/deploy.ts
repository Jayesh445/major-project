import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Deploying SupplyChainAudit contract...\n');

  const [deployer] = await ethers.getSigners();
  console.log('Deployer address:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Deployer balance:', ethers.formatEther(balance), 'ETH\n');

  const SupplyChainAudit = await ethers.getContractFactory('SupplyChainAudit');
  const contract = await SupplyChainAudit.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const receipt = deployTx ? await deployTx.wait() : null;

  console.log('SupplyChainAudit deployed to:', address);
  console.log('Transaction hash:', deployTx?.hash);
  console.log('Block number:', receipt?.blockNumber);
  console.log('Gas used:', receipt?.gasUsed?.toString());

  // Save deployment artifact
  const network = await ethers.provider.getNetwork();
  const artifact = await ethers.getContractFactory('SupplyChainAudit');
  const abi = JSON.parse(artifact.interface.formatJson());

  const deployed = {
    contractName: 'SupplyChainAudit',
    address,
    chainId: Number(network.chainId),
    networkName: network.name === 'unknown' ? 'sepolia' : network.name,
    deployedAt: new Date().toISOString(),
    deployerAddress: deployer.address,
    txHash: deployTx?.hash,
    blockNumber: receipt?.blockNumber,
    gasUsed: receipt?.gasUsed?.toString(),
    abi,
  };

  const outputPath = path.join(__dirname, '..', 'deployed.json');
  fs.writeFileSync(outputPath, JSON.stringify(deployed, null, 2));
  console.log('\nDeployment details saved to:', outputPath);

  console.log('\nNext steps:');
  console.log('  1. Copy the contract address into backend/.env:');
  console.log(`     SUPPLY_CHAIN_CONTRACT_ADDRESS=${address}`);
  console.log('  2. Restart the backend — confirmation worker will pick it up');
  console.log('  3. (Optional) Verify on Etherscan:');
  console.log(`     npx hardhat verify --network sepolia ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
