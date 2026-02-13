import { expect } from "chai";
import { ethers } from "hardhat";
import { SPPToken, PerformanceOracle, DeflatinaryBurn, RewardTiers } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Sport Performance Protocol - BNB Smart Chain", function () {
  let sppToken: SPPToken;
  let performanceOracle: PerformanceOracle;
  let deflatinaryBurn: DeflatinaryBurn;
  let rewardTiers: RewardTiers;
  let owner: SignerWithAddress;
  let oracle: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion

  beforeEach(async function () {
    [owner, oracle, player1, player2] = await ethers.getSigners();

    // Deploy SPPToken
    const SPPToken = await ethers.getContractFactory("SPPToken");
    sppToken = await SPPToken.deploy(INITIAL_SUPPLY);
    await sppToken.waitForDeployment();

    // Deploy PerformanceOracle
    const PerformanceOracle = await ethers.getContractFactory("PerformanceOracle");
    performanceOracle = await PerformanceOracle.deploy();
    await performanceOracle.waitForDeployment();

    // Deploy RewardTiers
    const RewardTiers = await ethers.getContractFactory("RewardTiers");
    rewardTiers = await RewardTiers.deploy();
    await rewardTiers.waitForDeployment();

    // Deploy DeflatinaryBurn
    const DeflatinaryBurn = await ethers.getContractFactory("DeflatinaryBurn");
    deflatinaryBurn = await DeflatinaryBurn.deploy(
      await sppToken.getAddress(),
      await performanceOracle.getAddress()
    );
    await deflatinaryBurn.waitForDeployment();

    // Configure contracts
    await sppToken.setBurnContract(await deflatinaryBurn.getAddress());
    await performanceOracle.setOracleAuthorization(oracle.address, true);
  });

  describe("SPPToken", function () {
    it("Should deploy with correct initial supply", async function () {
      expect(await sppToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await sppToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct name and symbol", async function () {
      expect(await sppToken.name()).to.equal("Sport Performance Protocol Token");
      expect(await sppToken.symbol()).to.equal("SPP");
    });

    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await sppToken.mint(player1.address, mintAmount);
      expect(await sppToken.balanceOf(player1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        sppToken.connect(player1).mint(player1.address, mintAmount)
      ).to.be.reverted;
    });

    it("Should allow burning tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      await sppToken.burn(burnAmount);

      expect(await sppToken.totalSupply()).to.equal(INITIAL_SUPPLY - burnAmount);
      expect(await sppToken.totalBurned()).to.equal(burnAmount);
    });

    it("Should transfer tokens correctly", async function () {
      const transferAmount = ethers.parseEther("1000");
      await sppToken.transfer(player1.address, transferAmount);

      expect(await sppToken.balanceOf(player1.address)).to.equal(transferAmount);
      expect(await sppToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - transferAmount);
    });
  });

  describe("PerformanceOracle", function () {
    const matchId = ethers.id("MATCH_001");

    it("Should allow authorized oracle to register match", async function () {
      await performanceOracle.connect(oracle).registerMatch(matchId);

      const matchData = await performanceOracle.getMatchDetails(matchId);
      expect(matchData.isFinalized).to.be.false;
      expect(matchData.organizer).to.equal(oracle.address);
    });

    it("Should not allow unauthorized user to register match", async function () {
      await expect(
        performanceOracle.connect(player1).registerMatch(matchId)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should record player performance", async function () {
      await performanceOracle.connect(oracle).registerMatch(matchId);

      await performanceOracle.connect(oracle).recordPerformance(
        matchId,
        player1.address,
        75, // runs
        2,  // wickets
        50, // balls faced
        24, // balls bowled
        0,  // tier (Nifty Fifty)
        85  // effort score
      );

      const perf = await performanceOracle.getPlayerPerformance(matchId, player1.address);
      expect(perf.runsScored).to.equal(75);
      expect(perf.wicketsTaken).to.equal(2);
      expect(perf.tier).to.equal(0);
      expect(perf.verified).to.be.true;
    });

    it("Should finalize match", async function () {
      await performanceOracle.connect(oracle).registerMatch(matchId);

      const dataHash = ethers.id("match_data_hash");
      await performanceOracle.connect(oracle).finalizeMatch(matchId, dataHash, 11);

      const matchData = await performanceOracle.getMatchDetails(matchId);
      expect(matchData.isFinalized).to.be.true;
      expect(matchData.dataHash).to.equal(dataHash);
      expect(matchData.totalPlayers).to.equal(11);
    });

    it("Should not allow performance recording after finalization", async function () {
      await performanceOracle.connect(oracle).registerMatch(matchId);

      const dataHash = ethers.id("match_data_hash");
      await performanceOracle.connect(oracle).finalizeMatch(matchId, dataHash, 11);

      await expect(
        performanceOracle.connect(oracle).recordPerformance(
          matchId,
          player1.address,
          75, 2, 50, 24, 0, 85
        )
      ).to.be.revertedWithCustomError(performanceOracle, "MatchAlreadyFinalized");
    });
  });

  describe("DeflatinaryBurn", function () {
    const matchId = ethers.id("MATCH_002");

    it("Should calculate reward correctly", async function () {
      // Tier 0 (Nifty Fifty): 1.5x multiplier, 50 SPP base
      // Effort 85%: (50 * 85 / 100) * 15 / 10 = 63.75 SPP
      const tier = 0;
      const effortScore = 85;

      const reward = await deflatinaryBurn.calculateReward(tier, effortScore);
      expect(reward).to.be.closeTo(
        ethers.parseEther("63.75"),
        ethers.parseEther("0.01")
      );
    });

    it("Should execute burn for performance", async function () {
      const tier = 0;
      const effortScore = 85;

      const tx = await deflatinaryBurn.connect(oracle).burnForPerformance(
        matchId,
        player1.address,
        tier,
        effortScore
      );

      await expect(tx)
        .to.emit(deflatinaryBurn, "TokensBurned")
        .withArgs(matchId, player1.address, anyValue, anyValue, tier);

      const burnTx = await deflatinaryBurn.getBurnTransaction(matchId, player1.address);
      expect(burnTx.executed).to.be.true;
      expect(burnTx.tier).to.equal(tier);
    });

    it("Should not allow duplicate burn transactions", async function () {
      const tier = 0;
      const effortScore = 85;

      await deflatinaryBurn.connect(oracle).burnForPerformance(
        matchId,
        player1.address,
        tier,
        effortScore
      );

      await expect(
        deflatinaryBurn.connect(oracle).burnForPerformance(
          matchId,
          player1.address,
          tier,
          effortScore
        )
      ).to.be.revertedWithCustomError(deflatinaryBurn, "BurnAlreadyExecuted");
    });

    it("Should track player rewards and burns", async function () {
      const tier = 0;
      const effortScore = 85;

      await deflatinaryBurn.connect(oracle).burnForPerformance(
        matchId,
        player1.address,
        tier,
        effortScore
      );

      const playerRewards = await deflatinaryBurn.getPlayerRewards(player1.address);
      const playerBurned = await deflatinaryBurn.getPlayerBurned(player1.address);

      expect(playerRewards).to.be.gt(0);
      expect(playerBurned).to.equal(playerRewards / 10n); // 10% burn
    });
  });

  describe("RewardTiers", function () {
    it("Should have 8 tiers configured", async function () {
      expect(await rewardTiers.getTotalTiers()).to.equal(8);
    });

    it("Should return correct tier details", async function () {
      const [name, description, multiplier, baseReward, isActive] =
        await rewardTiers.getTierDetails(0);

      expect(name).to.equal("Nifty Fifty");
      expect(multiplier).to.equal(15); // 1.5x
      expect(isActive).to.be.true;
    });

    it("Should allow owner to update tier", async function () {
      await rewardTiers.updateTier(0, 20, ethers.parseEther("100"));

      const [multiplier, baseReward] = await rewardTiers.getTierMultiplier(0);
      expect(multiplier).to.equal(20);
      expect(baseReward).to.equal(ethers.parseEther("100"));
    });

    it("Should not allow non-owner to update tier", async function () {
      await expect(
        rewardTiers.connect(player1).updateTier(0, 20, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should activate/deactivate tiers", async function () {
      await rewardTiers.setTierActive(0, false);
      expect(await rewardTiers.isTierActive(0)).to.be.false;

      await rewardTiers.setTierActive(0, true);
      expect(await rewardTiers.isTierActive(0)).to.be.true;
    });
  });

  describe("Integration", function () {
    const matchId = ethers.id("MATCH_INT_001");

    it("Should complete full match flow", async function () {
      // 1. Register match
      await performanceOracle.connect(oracle).registerMatch(matchId);

      // 2. Record player performance
      await performanceOracle.connect(oracle).recordPerformance(
        matchId,
        player1.address,
        100, // runs
        3,   // wickets
        65,  // balls faced
        30,  // balls bowled
        1,   // tier (Gayle Storm)
        90   // effort score
      );

      // 3. Execute burn
      await deflatinaryBurn.connect(oracle).burnForPerformance(
        matchId,
        player1.address,
        1,
        90
      );

      // 4. Finalize match
      const dataHash = ethers.id("final_match_data");
      await performanceOracle.connect(oracle).finalizeMatch(matchId, dataHash, 11);

      // Verify all data
      const matchData = await performanceOracle.getMatchDetails(matchId);
      const performance = await performanceOracle.getPlayerPerformance(matchId, player1.address);
      const burnTx = await deflatinaryBurn.getBurnTransaction(matchId, player1.address);

      expect(matchData.isFinalized).to.be.true;
      expect(performance.verified).to.be.true;
      expect(burnTx.executed).to.be.true;
    });
  });
});

// Helper for anyValue in event matching
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
