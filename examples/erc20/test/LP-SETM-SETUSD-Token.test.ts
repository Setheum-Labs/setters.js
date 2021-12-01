import { expect, use } from 'chai';
import { ethers, Contract, BigNumber } from 'ethers';
import { deployContract, solidity } from 'ethereum-waffle';
import { TestAccountSigningKey, TestProvider, Signer, evmChai } from '@setheum.js/setters';
import { WsProvider } from '@polkadot/api';
import { createTestPairs } from '@polkadot/keyring/testingPairs';
import ADDRESS from '@setheum-labs/predeploy-contracts/utils/Address';

use(solidity);
use(evmChai);

const provider = new TestProvider({
  provider: new WsProvider('ws://127.0.0.1:9944')
});

const ERC20_ABI = require('@setheum-labs/predeploy-contracts/build/contracts/Token.json').abi;
const DEX_ABI = require('@setheum-labs/predeploy-contracts/build/contracts/DEX.json').abi;

describe('LP SETM-SETUSD Token', () => {
  let wallet: Signer;
  let walletTo: Signer;
  let dex: Contract;
  let token: Contract;

  before(async () => {
    [wallet, walletTo] = await provider.getWallets();
    dex = new ethers.Contract(ADDRESS.DEX, DEX_ABI, wallet as any);
    token = new ethers.Contract(ADDRESS.LP_SETM_SETUSD, ERC20_ABI, wallet as any);

    let pool_1 = await dex.getLiquidityPool(ADDRESS.SETM, ADDRESS.SETUSD);
    expect(
      await dex.addLiquidity(ADDRESS.SETM, ADDRESS.SETUSD, 1_000_000_000_000, 1_000_000_000_000, 0, {
        gasLimit: 2_000_000
      })
    ).to.be.ok;
    let pool_2 = await dex.getLiquidityPool(ADDRESS.SETM, ADDRESS.SETUSD);
    expect(pool_2[1].sub(pool_1[1])).to.equal(1_000_000_000_000);
  });

  after(async () => {
    provider.api.disconnect();
  });

  it('get token name', async () => {
    const name = await token.name();
    expect(name).to.equal('LP Setheum - Setheum Dollar');
  });

  it('get token symbol', async () => {
    const symbol = await token.symbol();
    expect(symbol).to.equal('LP_SETM_SETUSD');
  });

  it('get token decimals', async () => {
    const decimals = await token.decimals();
    expect(decimals).to.equal(12);
  });

  it('Transfer adds amount to destination account', async () => {
    const balance = await token.balanceOf(await walletTo.getAddress());
    await token.transfer(await walletTo.getAddress(), 700_000_000_000);
    expect((await token.balanceOf(await walletTo.getAddress())).sub(balance)).to.equal(700_000_000_000);
  });

  it('Transfer emits event', async () => {
    await expect(token.transfer(await walletTo.getAddress(), 700_000_000_000))
      .to.emit(token, 'Transfer')
      .withArgs(await wallet.getAddress(), await walletTo.getAddress(), 700_000_000_000);
  });

  it('Can not transfer above the amount', async () => {
    const balance = await token.balanceOf(await wallet.getAddress());
    await expect(token.transfer(await walletTo.getAddress(), balance.add(7))).to.be.reverted;
  });
});
