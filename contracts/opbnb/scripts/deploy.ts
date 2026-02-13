import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Sport Performance Protocol contracts to opBNB L2...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB\n");

  // 1. Deploy SPPToken
  console.log("📝 Deploying SPPToken...");
  const initialSupply = ethers.parseEther("1000000000"); // 1 billion tokens
  const SPPToken = await ethers.getContractFactory("SPPToken");
  const sppToken = await SPPToken.deploy(initialSupply);
  await sppToken.waitForDeployment();
  const tokenAddress = await sppToken.getAddress();
  console.log("✅ SPPToken deployed to:", tokenAddress);
  console.log("   Initial supply:", ethers.formatEther(initialSupply), "SPP\n");

  // 2. Deploy PerformanceOracle
  console.log("📝 Deploying PerformanceOracle...");
  const PerformanceOracle = await ethers.getContractFactory("PerformanceOracle");
  const performanceOracle = await PerformanceOracle.deploy();
  await performanceOracle.waitForDeployment();
  const oracleAddress = await performanceOracle.getAddress();
  console.log("✅ PerformanceOracle deployed to:", oracleAddress, "\n");

  // 3. Deploy RewardTiers
  console.log("📝 Deploying RewardTiers...");
  const RewardTiers = await ethers.getContractFactory("RewardTiers");
  const rewardTiers = await RewardTiers.deploy();
  await rewardTiers.waitForDeployment();
  const tiersAddress = await rewardTiers.getAddress();
  console.log("✅ RewardTiers deployed to:", tiersAddress, "\n");

  // 4. Deploy DeflatinaryBurn
  console.log("📝 Deploying DeflatinaryBurn...");
  const DeflatinaryBurn = await ethers.getContractFactory("DeflatinaryBurn");
  const deflatinaryBurn = await DeflatinaryBurn.deploy(tokenAddress, oracleAddress);
  await deflatinaryBurn.waitForDeployment();
  const burnAddress = await deflatinaryBurn.getAddress();
  console.log("✅ DeflatinaryBurn deployed to:", burnAddress, "\n");

  // 5. Configure contracts
  console.log("⚙️  Configuring contracts...");

  // Set burn contract in token
  console.log("   Setting burn contract in SPPToken...");
  const tx1 = await sppToken.setBurnContract(burnAddress);
  await tx1.wait();
  console.log("   ✅ Burn contract set");

  // Authorize deployer as oracle (for testing)
  console.log("   Authorizing deployer as oracle...");
  const tx2 = await performanceOracle.setOracleAuthorization(deployer.address, true);
  await tx2.wait();
  console.log("   ✅ Oracle authorized\n");

  // 6. Verify tier configuration
  console.log("🔍 Verifying tier configuration...");
  const tierNames = [
    "Nifty Fifty",
    "Gayle Storm",
    "Five Wicket Haul",
    "Hat Trick",
    "Maiden Master",
    "Run Machine",
    "Golden Arm",
    "All Rounder",
  ];

  for (let i = 0; i < 8; i++) {
    const [multiplier, baseReward] = await deflatinaryBurn.getRewardTier(i);
    console.log(`   Tier ${i} (${tierNames[i]}):`,
      `${multiplier / 10n}x multiplier,`,
      ethers.formatEther(baseReward), "SPP base reward"
    );
  }

  // 7. Summary
  console.log("\n" + "=".repeat(80));
  console.log("📋 DEPLOYMENT SUMMARY - opBNB");
  console.log("=".repeat(80));
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  console.log("  SPPToken:", tokenAddress);
  console.log("  PerformanceOracle:", oracleAddress);
  console.log("  DeflatinaryBurn:", burnAddress);
  console.log("  RewardTiers:", tiersAddress);
  console.log("\n⚠️  IMPORTANT: Save these addresses for your .env file!");
  console.log("=".repeat(80));

  // 8. Generate .env format
  console.log("\n📝 Copy to your .env file:\n");
  console.log(`OPBNB_SPP_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`OPBNB_PERFORMANCE_ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`OPBNB_DEFLATINARY_BURN_ADDRESS=${burnAddress}`);
  console.log(`OPBNB_REWARD_TIERS_ADDRESS=${tiersAddress}`);
  console.log();

  // 9. Verification commands
  console.log("🔐 To verify contracts on opBNBScan, run:");
  console.log(`\nnpx hardhat verify --network opBNBMainnet ${tokenAddress} "${initialSupply}"`);
  console.log(`npx hardhat verify --network opBNBMainnet ${oracleAddress}`);
  console.log(`npx hardhat verify --network opBNBMainnet ${burnAddress} "${tokenAddress}" "${oracleAddress}"`);
  console.log(`npx hardhat verify --network opBNBMainnet ${tiersAddress}`);
  console.log();

  console.log("✨ Deployment complete!\n");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
