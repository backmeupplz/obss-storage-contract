import { ethers, run, upgrades } from 'hardhat'
import parseError from './parseError'

export default async function ({
  proxyAddress,
  constructorArguments,
  contractName,
  chainName,
  initializer = 'initialize',
}: {
  proxyAddress: string
  constructorArguments: string[]
  contractName: string
  chainName: string
  initializer?: string
}) {
  console.log('---------------')
  console.log(`Upgrading ${contractName} at proxy address ${proxyAddress}...`)
  const contractFactory = await ethers.getContractFactory(contractName)
  const contract = await upgrades.upgradeProxy(proxyAddress, contractFactory)
  const contractImplementationAddress =
    await upgrades.erc1967.getImplementationAddress(contract.address)
  const contractAdminAddress = await upgrades.erc1967.getAdminAddress(
    contract.address
  )

  console.log(`${contractName} Upgraded`)
  console.log(`${contractName} Proxy address: `, contract.address)
  console.log(
    `${contractName} Implementation address: `,
    contractImplementationAddress
  )
  console.log(`${contractName} Admin address: `, contractAdminAddress)

  console.log('Wait for 15 seconds to make sure blockchain is updated')
  await new Promise((resolve) => setTimeout(resolve, 15 * 1000))

  console.log(`Initializing ${contractName} Implementation contract`)
  await contract[initializer](...constructorArguments)

  console.log(`Verifying ${contractName} Implementation contract`)
  try {
    await run('verify:verify', { address: contractImplementationAddress })
  } catch (err) {
    console.error('Error verifying contract on Etherscan:', parseError(err))
  }

  // Print out the information
  console.log(`${contractName} upgraded, initialized and verified!`)
  console.log(`${contractName} contract address (proxy): `, contract.address)
  console.log(
    `${contractName} scanner URL:`,
    `https://${
      chainName === 'polygon' ? '' : `${chainName}.`
    }polygonscan.com/address/${contract.address}`
  )
  console.log('---------------')

  return contract
}
