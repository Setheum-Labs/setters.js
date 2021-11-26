import { TestProvider, Signer, TestAccountSigningKey, evmChai } from '@setheum.js/setters';
import { WsProvider } from '@polkadot/api';
import { createTestPairs } from '@polkadot/keyring/testingPairs';
import { expect, use } from 'chai';
import { deployContract, solidity } from 'ethereum-waffle';
import { Contract, BigNumber } from 'ethers';
import Prices from '../build/Prices.json';
import ADDRESS from '@setheum-labs/predeploy-contracts/utils/Address';

use(solidity);
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider('ws://127.0.0.1:9944')
});

const testPairs = createTestPairs();

const feedValues = async (token: string, price: number) => {
  return new Promise((resolve) => {
    provider.api.tx.setheumOracle
      .feedValues([[{ Token: token }, price]])
      .signAndSend(testPairs.alice.address, (result) => {
        if (result.status.isInBlock) {
          resolve(undefined);
        }
      });
  });
};

describe('Prices', () => {
  let prices: Contract;

  before(async () => {
    const [wallet] = await provider.getWallets();
    prices = await deployContract(wallet as any, Prices);
  });

  after(async () => {
    provider.api.disconnect();
  });

  it('getPrice works', async () => {
    await feedValues('DNAR', BigNumber.from(34_500).mul(BigNumber.from(10).pow(18)).toString());
    expect(await prices.getPrice(ADDRESS.DNAR)).to.equal(
      BigNumber.from(34_500).mul(BigNumber.from(10).pow(18)).toString()
    );

    await feedValues('DNAR', BigNumber.from(33_800).mul(BigNumber.from(10).pow(18)).toString());
    expect(await prices.getPrice(ADDRESS.DNAR)).to.equal(
      BigNumber.from(33_800).mul(BigNumber.from(10).pow(18)).toString()
    );

    await feedValues('SERP', BigNumber.from(15).mul(BigNumber.from(10).pow(18)).toString());
    expect(await prices.getPrice(ADDRESS.SERP)).to.equal(BigNumber.from(15).mul(BigNumber.from(10).pow(18)).toString());

    await feedValues('SERP', BigNumber.from(16).mul(BigNumber.from(10).pow(18)).toString());
    expect(await prices.getPrice(ADDRESS.SERP)).to.equal(BigNumber.from(16).mul(BigNumber.from(10).pow(18)).toString());

    expect(await prices.getPrice(ADDRESS.SETUSD)).to.equal(
      BigNumber.from(1).mul(BigNumber.from(10).pow(18)).toString()
    );
  });

  it('ignores invalid address as CurrencyId::erc20', async () => {
    // not system contract
    expect(await prices.getPrice('0x1000000000000000000000000000000000000000')).to.equal(0);
    // Zero address
    await expect(prices.getPrice('0x0000000000000000000000000000000000000000')).to.be.reverted;
  });
});
