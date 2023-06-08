task("deploy", "Deploy contract")
  .addParam("account", "Account's address")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const Marketplace = await hre.ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );
    const marketplace = await Marketplace.deploy();

    await marketplace.deployed();

    console.log(
      `Marketplace with owner: ${deployer.address} deployed to ${marketplace.address}`
    );

    console.log(taskArgs.account);
  });

task("create-nft", "Deploy contract")
  .addParam("marketplace", "Contract's address")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const Marketplace = await hre.ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );
    // First option
    // const marketplace = await Marketplace.attach(taskArgs.marketplace);

    // Second option
    const marketplace = new hre.ethers.Contract(
      taskArgs.marketplace,
      Marketplace.interface,
      deployer
    );

    const tx = await marketplace.createNFT("tefsfas");
    const receipt = await tx.wait();

    if (receipt.status === 0) throw new Error("Tx failed");

    console.log(`NFT created!`);
  });

task("claim", "Claim reward")
  .addParam("marketplace", "Contract's address")
  .setAction(async (taskArgs, hre) => {
    const [deployer, firstUser] = await hre.ethers.getSigners();
    const Marketplace = await hre.ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );

    const marketplace = new hre.ethers.Contract(
      taskArgs.marketplace,
      Marketplace.interface,
      deployer
    );

    const marketplaceFirstUser = marketplace.connect(firstUser);

    // Approve contract to use NFT
    const tx = await marketplace.approve(taskArgs.marketplace, 0);
    const receipt = await tx.wait();
    if (receipt.status === 0) throw new Error("Tx failed");

    // List NFT for sale
    const tx2 = await marketplace.listNFTForSale(taskArgs.marketplace, 0, 1);
    const receipt2 = await tx2.wait();
    if (receipt2.status === 0) throw new Error("Tx failed");

    // First User purchases the NFT
    const tx3 = await marketplaceFirstUser.purchaseNFT(
      taskArgs.marketplace,
      0,
      firstUser.address,
      { value: 1 }
    );

    const receipt3 = await tx3.wait();
    if (receipt3.status === 0) throw new Error("Tx failed");

    // Owner claims profit
    const tx4 = await marketplace.claimProfit();
    const receipt4 = tx4.wait();
    if (receipt4.status === 0) throw new Error("Tx failed");
  });
