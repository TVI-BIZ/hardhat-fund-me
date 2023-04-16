const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContractAt("FundMe", deployer)
    console.log("Funding Contract...")
    const transansactionResponse = await fundMe.withdraw()
    await transansactionResponse.wait(1)
    console.log("Got it!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
