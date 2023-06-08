const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

function getContractWithFirstUser(marketplace, firstUser) {
  return marketplace.connect(firstUser);
}

describe("NFTMarketplace", function () {
  let marketplaceFirstUser, deployer, firstUser, secondUser;

  this.beforeAll(async function () {
    [deployer, firstUser, secondUser] = await ethers.getSigners();

    const { marketplace } = await loadFixture(deployAndMint);
    marketplaceFirstUser = getContractWithFirstUser(marketplace, firstUser);
  });

  async function deployAndMint() {
    const Marketplace = await ethers.getContractFactory(
      "NFTMarketplace",
      deployer
    );
    const marketplace = await Marketplace.deploy();
    const marketplaceFirstUser = marketplace.connect(firstUser);
    await marketplaceFirstUser.createNFT("ttest");

    return { marketplace, deployer, firstUser };
  }

  async function listNFT() {
    const { marketplace } = await loadFixture(deployAndMint);
    const price = ethers.utils.parseEther("1");
    await marketplaceFirstUser.approve(marketplace.address, 0);
    await marketplaceFirstUser.listNFTForSale(marketplace.address, 0, price);

    return { marketplace };
  }

  describe("Listing", function () {
    it("reverts when price = 0", async function () {
      const { marketplace } = await loadFixture(deployAndMint);
      await expect(
        marketplace.listNFTForSale(marketplace.address, 0, 0)
      ).to.be.revertedWith("Price has to be > 0");
    });

    it("reverts when NFT is already for sale", async function () {
      const { marketplace } = await loadFixture(deployAndMint);
      const price = ethers.utils.parseEther("1");
      await marketplaceFirstUser.approve(marketplace.address, 0);
      await marketplaceFirstUser.listNFTForSale(marketplace.address, 0, price);

      await expect(
        marketplaceFirstUser.listNFTForSale(marketplace.address, 0, price)
      ).to.be.revertedWith("NFT is already for sale");
    });

    it("should succeed", async function () {
      const { marketplace } = await loadFixture(deployAndMint);
      const price = ethers.utils.parseEther("1");
      await marketplaceFirstUser.approve(marketplace.address, 0);
      await expect(
        marketplaceFirstUser.listNFTForSale(marketplace.address, 0, price)
      )
        .to.emit(marketplaceFirstUser, "ListNFTSuccess")
        .withArgs(marketplace.address, 0, price);
    });
  });

  describe("Purchase", function () {
    it("reverts when not listed", async function () {
      const { marketplace } = await loadFixture(deployAndMint);
      await expect(
        marketplace.purchaseNFT(marketplace.address, 0, secondUser.address)
      ).to.be.revertedWith("NFT is not listed for sale");
    });

    it("reverts when price is lower", async function () {
      const { marketplace } = await loadFixture(listNFT);
      const wrongPrice = ethers.utils.parseEther("0.1");
      await expect(
        marketplace.purchaseNFT(marketplace.address, 0, secondUser.address, {
          value: wrongPrice,
        })
      ).to.be.revertedWith("Incorrect price");
    });

    it("purchase success", async function () {
      const { marketplace } = await loadFixture(listNFT);
      const price = ethers.utils.parseEther("1");
      await marketplace.purchaseNFT(
        marketplace.address,
        0,
        secondUser.address,
        { value: price }
      );
      expect(
        (await marketplace.nftSales(marketplace.address, 0)).price
      ).to.equal(0);
      expect(await marketplace.ownerOf(0)).to.equal(secondUser.address);
    });
  });
});
