const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { describe, beforeEach } = require("node:test")
const { exitCode } = require("process")
//const { ethers, JsonRpcProvider } = require("ethers")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.parseEther("1")

          beforeEach(async function () {
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContractAt("FundMe", deployer)
              console.log("get fund me!")
              console.log(fundMe)
              mockV3Aggregator = await ethers.getContractAt(
                  "MockV3Aggregator",
                  deployer
              )
              console.log(mockV3Aggregator)
          })
          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.s_priceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("fund", async function () {
              it("Fails if you do not send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH"
                  )
              })
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Add s_funders to array of s_funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.s_funders(0)
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", async function () {
              beforeEach(async function () {
                  fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async function () {
                  const startingFundMeBlance = await fundMe.provider.gatBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.gatBalance(deployer)
                  const transansactionResponse = await fundMe.withdraw()
                  const transansactionReceipt =
                      await transansactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transansactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBalance = await fundMe.provider.gatBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.gatBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBlance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw with multiple s_funders", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBlance = await fundMe.provider.gatBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.gatBalance(deployer)
                  const transansactionResponse = await fundMe.withdraw()
                  const transansactionReceipt =
                      await transansactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transansactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBlance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  await expect(fundMe.s_funders(0)).to.be.reverted()
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("only allows to the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
              it("cheaper withdraw testing ...", async function () {
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBlance = await fundMe.provider.gatBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.gatBalance(deployer)
                  const transansactionResponse = await fundMe.cheaperWithdraw()
                  const transansactionReceipt =
                      await transansactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transansactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBlance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  await expect(fundMe.s_s_funders(0)).to.be.reverted()
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
          })
      })
