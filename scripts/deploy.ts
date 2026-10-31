import { network } from "hardhat";

const { ethers } = await network.create({
  network: "hardhatOp",
  chainType: "op",
});

async function main() {
  console.log("Starting deployment of AMM ecosystem...");

  // 1. Deploy Test Token Factory (Deploys 5 test tokens automatically)
  const TestTokenFactory = await ethers.getContractFactory("TestTokenFactory");
  const tokenFactory = await TestTokenFactory.deploy();
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();
  console.log(`TestTokenFactory deployed to: ${tokenFactoryAddress}`);

  // Fetch deployed test token addresses
  const deployedTokens: string[] = await tokenFactory.getDeployedTokens();
  console.log("Deployed 5 Test Tokens:");
  for (let i = 0; i < deployedTokens.length; i++) {
    console.log(`  Token [${i}]: ${deployedTokens[i]}`);
  }

  // 2. Deploy AMM Factory
  const AMMFactory = await ethers.getContractFactory("AMMFactory");
  const ammFactory = await AMMFactory.deploy();
  await ammFactory.waitForDeployment();
  const ammFactoryAddress = await ammFactory.getAddress();
  console.log(`AMMFactory deployed to: ${ammFactoryAddress}`);

  // 3. Automatically create an initial liquidity pool pair (Token 0 & Token 1)
  console.log("Creating initial liquidity pool pair (Token 0 / Token 1)...");
  const tx = await ammFactory.createPair(deployedTokens[0], deployedTokens[1]);
  await tx.wait();

  const pairAddress = await ammFactory.getPair(deployedTokens[0], deployedTokens[1]);
  console.log(`Initial BaseAMM pool created at: ${pairAddress}`);

  console.log("Deployment completed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});