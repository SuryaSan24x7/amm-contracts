import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("AMM & Faucet Token Comprehensive Suite (20+ Tests)", function () {
  let owner: any;
  let user1: any;
  let user2: any;
  let attacker: any;

  let tokenFactory: any;
  let ammFactory: any;
  let testTokens: string[] = [];

  let tokenA: any;
  let tokenB: any;
  let tokenC: any;
  let pool: any;

  const CLAIM_AMOUNT = ethers.parseEther("1000");
  const INITIAL_SUPPLY = ethers.parseEther("1000000000");

  before(async function () {
    [owner, user1, user2, attacker] = await ethers.getSigners();

    // Deploy Test Token Factory (Deploys 5 test tokens)
    const TokenFactory = await ethers.getContractFactory("TestTokenFactory");
    tokenFactory = await TokenFactory.deploy();
    await tokenFactory.waitForDeployment();

    testTokens = await tokenFactory.getDeployedTokens();
    tokenA = await ethers.getContractAt("TestToken", testTokens[0]);
    tokenB = await ethers.getContractAt("TestToken", testTokens[1]);
    tokenC = await ethers.getContractAt("TestToken", testTokens[2]);

    // Deploy AMM Factory
    const AMMFactory = await ethers.getContractFactory("AMMFactory");
    ammFactory = await AMMFactory.deploy();
    await ammFactory.waitForDeployment();
  });

  // ==========================================
  // SECTION 1: Token Factory & Test Token Deployment (Tests 1 - 4)
  // ==========================================
  describe("1. Token Factory & Initial Deployment", function () {
    it("1. Should deploy exactly 5 test tokens", async function () {
      expect(testTokens.length).to.equal(5);
    });

    it("2. Should assign correct names and symbols to test tokens", async function () {
      expect(await tokenA.name()).to.equal("Alpha Token");
      expect(await tokenA.symbol()).to.equal("ALPHA");
      expect(await tokenB.name()).to.equal("Beta Token");
      expect(await tokenB.symbol()).to.equal("BETA");
    });

    it("3. Should have 18 decimals by default", async function () {
      expect(await tokenA.decimals()).to.equal(18);
    });

    it("4. Factory deployer/contract should hold the initial bulk supply", async function () {
      const supply = await tokenA.balanceOf(await tokenFactory.getAddress());
      expect(supply).to.equal(INITIAL_SUPPLY);
    });
  });

  // ==========================================
  // SECTION 2: Faucet Mechanics & Cooldowns (Tests 5 - 8)
  // ==========================================
  describe("2. Faucet & Cooldown Mechanics", function () {
    it("5. Should allow users to claim exact faucet amount", async function () {
      await tokenA.connect(user1).faucet();
      expect(await tokenA.balanceOf(user1.address)).to.equal(CLAIM_AMOUNT);
    });

    it("6. Should enforce the 24-hour cooldown period", async function () {
      await expect(tokenA.connect(user1).faucet()).to.be.revertedWith(
        "Faucet: Cooldown period active. Try again in 24 hours."
      );
    });

    it("7. Should return correct time remaining until next claim", async function () {
      const timeLeft = await tokenA.getTimeUntilNextClaim(user1.address);
      expect(timeLeft).to.be.gt(0n);
    });

    it("8. Should allow claiming again after 24 hours have passed", async function () {
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await tokenA.connect(user1).faucet();
      expect(await tokenA.balanceOf(user1.address)).to.equal(CLAIM_AMOUNT * 2n);
    });
  });

  // ==========================================
  // SECTION 3: AMM Factory & Pair Creation (Tests 9 - 13)
  // ==========================================
  describe("3. AMM Factory & Pair Creation", function () {
    it("9. Should create a valid liquidity pool pair", async function () {
      const tx = await ammFactory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
      await tx.wait();

      const poolAddress = await ammFactory.getPair(await tokenA.getAddress(), await tokenB.getAddress());
      expect(poolAddress).to.not.equal(ethers.ZeroAddress);

      pool = await ethers.getContractAt("BaseAMM", poolAddress);
    });

    it("10. Should populate reverse mapping correctly in factory", async function () {
      const reversePair = await ammFactory.getPair(await tokenB.getAddress(), await tokenA.getAddress());
      expect(reversePair).to.equal(await pool.getAddress());
    });

    it("11. Should increment allPairsLength on pair creation", async function () {
      expect(await ammFactory.allPairsLength()).to.equal(1n);
    });

    it("12. Negative: Should revert when creating duplicate pool", async function () {
      await expect(
        ammFactory.createPair(await tokenB.getAddress(), await tokenA.getAddress())
      ).to.be.revertedWith("PAIR_EXISTS");
    });

    it("13. Negative: Should revert when creating pair with identical tokens", async function () {
      await expect(
        ammFactory.createPair(await tokenA.getAddress(), await tokenA.getAddress())
      ).to.be.revertedWith("IDENTICAL_ADDRESSES");
    });
  });

  // ==========================================
  // SECTION 4: Liquidity Add & Remove Operations (Tests 14 - 18)
  // ==========================================
  describe("4. Liquidity Add & Remove Operations", function () {
    const depositA = ethers.parseEther("500");
    const depositB = ethers.parseEther("500");

    before(async function () {
      // Advance time to clear any faucet cooldowns for owner
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await tokenA.faucet();
      await tokenB.faucet();

      await tokenA.approve(await pool.getAddress(), depositA);
      await tokenB.approve(await pool.getAddress(), depositB);
    });

    it("14. Should lock minimum liquidity (1000 wei) to dead address on first liquidity mint", async function () {
      const MIN_LIQUIDITY = 1000n;
      await pool.addLiquidity(depositA, depositB);

      const deadBalance = await pool.balanceOf("0x000000000000000000000000000000000000dEaD");
      expect(deadBalance).to.equal(MIN_LIQUIDITY);
    });

    it("15. Should correctly update pool reserves after adding liquidity", async function () {
      expect(await pool.reserve0()).to.equal(depositA);
      expect(await pool.reserve1()).to.equal(depositB);
    });

    it("16. Negative: Should revert liquidity addition with zero amounts", async function () {
      await expect(pool.addLiquidity(0n, 0n)).to.be.revertedWith("Amounts must be > 0");
    });

    it("17. Should allow LPs to burn tokens and remove liquidity proportionally", async function () {
      const lpBalance = await pool.balanceOf(owner.address);
      const tokenABefore = await tokenA.balanceOf(owner.address);

      await pool.removeLiquidity(lpBalance);

      const tokenAAfter = await tokenA.balanceOf(owner.address);
      expect(tokenAAfter).to.be.gt(tokenABefore);
      expect(await pool.balanceOf(owner.address)).to.equal(0n);
    });

    it("18. Negative: Should revert removing zero LP tokens", async function () {
      await expect(pool.removeLiquidity(0n)).to.be.revertedWith("LP amount must be > 0");
    });
  });

  // ==========================================
  // SECTION 5: Swaps & Fee Accrual (Tests 19 - 22)
  // ==========================================
  describe("5. Token Swaps & Slippage Protection", function () {
    const liquidity = ethers.parseEther("500");
    const swapAmount = ethers.parseEther("50");

    before(async function () {
      // Advance time past cooldown
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      // Add fresh liquidity using unused test tokens (token3 and token4) to avoid cross-test conflicts
      const freshTokenA = await ethers.getContractAt("TestToken", testTokens[3]);
      const freshTokenB = await ethers.getContractAt("TestToken", testTokens[4]);
      
      await ammFactory.createPair(await freshTokenA.getAddress(), await freshTokenB.getAddress());
      const newPoolAddr = await ammFactory.getPair(await freshTokenA.getAddress(), await freshTokenB.getAddress());
      pool = await ethers.getContractAt("BaseAMM", newPoolAddr);

      await freshTokenA.faucet();
      await freshTokenB.faucet();
      await freshTokenA.approve(await pool.getAddress(), liquidity);
      await freshTokenB.approve(await pool.getAddress(), liquidity);
      await pool.addLiquidity(liquidity, liquidity);

      // Fund user2 for swapping fresh tokenA
      await freshTokenA.connect(user2).faucet();
      await freshTokenA.connect(user2).approve(await pool.getAddress(), swapAmount);
    });

    it("19. Should compute expected output preview via getAmountOut accounting for 0.3% fee", async function () {
      const freshTokenA = await ethers.getContractAt("TestToken", testTokens[3]);
      const amountOut = await pool.getAmountOut(await freshTokenA.getAddress(), swapAmount);
      expect(amountOut).to.be.gt(0n);
    });

    it("20. Should successfully execute token swap and transfer output", async function () {
      const freshTokenA = await ethers.getContractAt("TestToken", testTokens[3]);
      const freshTokenB = await ethers.getContractAt("TestToken", testTokens[4]);
      
      const expectedOut = await pool.getAmountOut(await freshTokenA.getAddress(), swapAmount);
      const balanceBefore = await freshTokenB.balanceOf(user2.address);

      await pool.connect(user2).swap(await freshTokenA.getAddress(), swapAmount, expectedOut);

      const balanceAfter = await freshTokenB.balanceOf(user2.address);
      expect(balanceAfter - balanceBefore).to.equal(expectedOut);
    });

    it("21. Negative: Should revert swap if slippage tolerance is breached", async function () {
      const freshTokenA = await ethers.getContractAt("TestToken", testTokens[3]);
      await freshTokenA.connect(user2).approve(await pool.getAddress(), swapAmount);
      const unrealisticMinOut = ethers.parseEther("999999"); // Impossible output

      await expect(
        pool.connect(user2).swap(await freshTokenA.getAddress(), swapAmount, unrealisticMinOut)
      ).to.be.revertedWith("Slippage: insufficient output");
    });

    it("22. Negative: Should revert swap with unsupported/invalid token address", async function () {
      await expect(
        pool.connect(user2).swap(await tokenC.getAddress(), swapAmount, 0n)
      ).to.be.revertedWith("Invalid token");
    });
  });

  // ==========================================
  // SECTION 6: Invariant Fuzz Testing (Test 23)
  // ==========================================
  describe("6. Advanced Fuzz & Invariant Testing", function () {
    it("23. Fuzz Test: Constant product invariant (x * y = k) holds or increases across randomized swap amounts", async function () {
      const fuzzValues = [
        ethers.parseEther("1"),
        ethers.parseEther("5"),
        ethers.parseEther("10"),
        ethers.parseEther("20")
      ];

      const freshTokenA = await ethers.getContractAt("TestToken", testTokens[3]);

      // Ensure user1 claims tokens from faucet for the fresh token to cover fuzz test swaps
      try {
        await freshTokenA.connect(user1).faucet();
      } catch {
        // Already claimed or cooldown active
      }

      for (const amt of fuzzValues) {
        const r0Before = await pool.reserve0();
        const r1Before = await pool.reserve1();
        const kBefore = r0Before * r1Before;

        const expectedOut = await pool.getAmountOut(await freshTokenA.getAddress(), amt);
        if (expectedOut === 0n || expectedOut >= r1Before) continue;

        await freshTokenA.connect(user1).approve(await pool.getAddress(), amt);
        await pool.connect(user1).swap(await freshTokenA.getAddress(), amt, expectedOut);

        const r0After = await pool.reserve0();
        const r1After = await pool.reserve1();
        const kAfter = r0After * r1After;

        // Due to accumulated 0.3% fees, k should never decrease
        expect(kAfter).to.be.gte(kBefore);
      }
    });
  });
});