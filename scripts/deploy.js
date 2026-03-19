const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer ? deployer.address : "Unknown");

  // Deploy SubscriptionManager
  const SubManager = await hre.ethers.getContractFactory("SubscriptionManager");
  const subManager = await SubManager.deploy();
  await subManager.waitForDeployment();
  console.log("SubscriptionManager deployed to:", await subManager.getAddress());

  // Deploy NFTReceipt
  const NFTReceipt = await hre.ethers.getContractFactory("NFTReceipt");
  const nftReceipt = await NFTReceipt.deploy();
  await nftReceipt.waitForDeployment();
  console.log("NFTReceipt deployed to:", await nftReceipt.getAddress());

  // Deploy BillTracker
  const BillTracker = await hre.ethers.getContractFactory("BillTracker");
  const billTracker = await BillTracker.deploy();
  await billTracker.waitForDeployment();
  console.log("BillTracker deployed to:", await billTracker.getAddress());

  console.log("Done!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
