const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex, tokenA, tokenB;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");

    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);

    // Owner approvals
    await tokenA.approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.approve(dex.address, ethers.utils.parseEther("1000000"));

    // Mint tokens to addr1
    await tokenA.mint(addr1.address, ethers.utils.parseEther("1000000"));
    await tokenB.mint(addr1.address, ethers.utils.parseEther("1000000"));

    // addr1 approvals
    await tokenA.connect(addr1).approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.connect(addr1).approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  /* ===================== Liquidity Management ===================== */

  describe("Liquidity Management", function () {
    it("should allow initial liquidity provision", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const [rA, rB] = await dex.getReserves();
      expect(rA).to.equal(ethers.utils.parseEther("100"));
      expect(rB).to.equal(ethers.utils.parseEther("200"));
    });

    it("should mint correct LP tokens for first provider", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const totalLiquidity = await dex.totalLiquidity();
      expect(totalLiquidity).to.be.gt(0);
    });

    it("should allow subsequent liquidity additions", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await dex.connect(addr1).addLiquidity(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("100")
      );

      const [rA, rB] = await dex.getReserves();
      expect(rA).to.equal(ethers.utils.parseEther("150"));
      expect(rB).to.equal(ethers.utils.parseEther("300"));
    });

    it("should maintain price ratio on liquidity addition", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await expect(
        dex.connect(addr1).addLiquidity(
          ethers.utils.parseEther("50"),
          ethers.utils.parseEther("120")
        )
      ).to.be.revertedWith("Ratio mismatch");
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const lp = await dex.totalLiquidity();
      await dex.removeLiquidity(lp.div(2));

      const [rA, rB] = await dex.getReserves();
      expect(rA).to.equal(ethers.utils.parseEther("50"));
      expect(rB).to.equal(ethers.utils.parseEther("100"));
    });

    it("should return correct token amounts on liquidity removal", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const lp = await dex.totalLiquidity();
      const balBefore = await tokenA.balanceOf(owner.address);

      await dex.removeLiquidity(lp);

      const balAfter = await tokenA.balanceOf(owner.address);
      expect(balAfter.sub(balBefore)).to.equal(ethers.utils.parseEther("100"));
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(dex.addLiquidity(0, 0)).to.be.revertedWith("Zero amount");
    });

    it("should revert when removing more liquidity than owned", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const lp = await dex.totalLiquidity();
      await expect(
        dex.connect(addr1).removeLiquidity(lp)
      ).to.be.revertedWith("Not enough LP");
    });
  });

  /* ===================== Token Swaps ===================== */

  describe("Token Swaps", function () {
    beforeEach(async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
    });

    it("should swap token A for token B", async function () {
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const [rA] = await dex.getReserves();
      expect(rA).to.be.gt(ethers.utils.parseEther("100"));
    });

    it("should swap token B for token A", async function () {
      await dex.swapBForA(ethers.utils.parseEther("10"));
      const [, rB] = await dex.getReserves();
      expect(rB).to.be.gt(ethers.utils.parseEther("200"));
    });

    it("should calculate correct output amount with fee", async function () {
      const out = await dex.getAmountOut(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      expect(out).to.be.gt(0);
    });

    it("should update reserves after swap", async function () {
      const before = await dex.getReserves();
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const after = await dex.getReserves();

      expect(after[0]).to.be.gt(before[0]);
      expect(after[1]).to.be.lt(before[1]);
    });

    it("should increase k after swap due to fees", async function () {
      const before = await dex.getReserves();
      const kBefore = before[0].mul(before[1]);

      await dex.swapAForB(ethers.utils.parseEther("10"));

      const after = await dex.getReserves();
      const kAfter = after[0].mul(after[1]);

      expect(kAfter).to.be.gt(kBefore);
    });

    it("should revert on zero swap amount", async function () {
      await expect(dex.swapAForB(0)).to.be.revertedWith("Zero input");
    });

    it("should handle large swaps with high price impact", async function () {
      await dex.swapAForB(ethers.utils.parseEther("50"));
      const [, rB] = await dex.getReserves();
      expect(rB).to.be.lt(ethers.utils.parseEther("200"));
    });

    it("should handle multiple consecutive swaps", async function () {
      await dex.swapAForB(ethers.utils.parseEther("5"));
      await dex.swapAForB(ethers.utils.parseEther("5"));
      await dex.swapBForA(ethers.utils.parseEther("5"));

      const [rA, rB] = await dex.getReserves();
      expect(rA).to.be.gt(0);
      expect(rB).to.be.gt(0);
    });
  });

  /* ===================== Price Calculations ===================== */

  describe("Price Calculations", function () {
    it("should return correct initial price", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const price = await dex.getPrice();
      expect(price).to.equal(2);
    });

    it("should update price after swaps", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await dex.swapAForB(ethers.utils.parseEther("10"));
      const price = await dex.getPrice();
      expect(price).to.not.equal(2);
    });

    it("should handle price queries with zero reserves gracefully", async function () {
      await expect(dex.getPrice()).to.be.revertedWith("No liquidity");
    });
  });

  /* ===================== Fee Distribution ===================== */

  describe("Fee Distribution", function () {
    it("should accumulate fees for liquidity providers", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await dex.swapAForB(ethers.utils.parseEther("10"));
      const [rA, rB] = await dex.getReserves();

      expect(rA.mul(rB)).to.be.gt(
        ethers.utils.parseEther("100").mul(
          ethers.utils.parseEther("200")
        )
      );
    });

    it("should distribute fees proportionally to LP share", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await dex.connect(addr1).addLiquidity(
        ethers.utils.parseEther("50"),
        ethers.utils.parseEther("100")
      );

      await dex.swapAForB(ethers.utils.parseEther("10"));

      const lpOwner = await dex.liquidity(owner.address);
      const lpAddr1 = await dex.liquidity(addr1.address);

      expect(lpOwner).to.be.gt(lpAddr1);
    });
  });

  /* ===================== Edge Cases ===================== */

  describe("Edge Cases", function () {
    it("should handle very small liquidity amounts", async function () {
      await dex.addLiquidity(1, 2);
      const [rA] = await dex.getReserves();
      expect(rA).to.equal(1);
    });

    it("should handle very large liquidity amounts", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100000"),
        ethers.utils.parseEther("200000")
      );

      const [rA] = await dex.getReserves();
      expect(rA).to.equal(ethers.utils.parseEther("100000"));
    });

    it("should prevent unauthorized access", async function () {
      await expect(
        dex.connect(addr1).removeLiquidity(1)
      ).to.be.reverted;
    });
  });

  /* ===================== Events ===================== */

  describe("Events", function () {
    it("should emit LiquidityAdded event", async function () {
      await expect(
        dex.addLiquidity(
          ethers.utils.parseEther("100"),
          ethers.utils.parseEther("200")
        )
      ).to.emit(dex, "LiquidityAdded");
    });

    it("should emit LiquidityRemoved event", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      const lp = await dex.totalLiquidity();

      await expect(
        dex.removeLiquidity(lp)
      ).to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap event", async function () {
      await dex.addLiquidity(
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );

      await expect(
        dex.swapAForB(ethers.utils.parseEther("10"))
      ).to.emit(dex, "Swap");
    });
  });
});
