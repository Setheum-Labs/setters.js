import { expect, use } from 'chai';
import { Contract, ContractFactory, BigNumber } from 'ethers';
import { evmChai } from '@setheum.js/setters';
import ADDRESS from '@setheum-labs/predeploy-contracts/utils/Address';

import UniswapFactory from '../artifacts/UniswapV2Factory.json';
import UniswapRouter from '../artifacts/UniswapV2Router02.json';
import Arbitrager from '../build/Arbitrager.json';
import IERC20 from '../artifacts/IERC20.json';
import setup from './setup';

use(evmChai);

const main = async () => {
  const { wallet, provider, pair } = await setup();
  const deployerAddress = await wallet.getAddress();
  const tokenSETM = new Contract(ADDRESS.SETM, IERC20.abi, wallet);
  const tokenSETUSD = new Contract(ADDRESS.SETUSD, IERC20.abi, wallet);
  const tokenSERP = new Contract(ADDRESS.SERP, IERC20.abi, wallet);

  console.log('Deploy Uniswap');

  // deploy factory
  const factory = await ContractFactory.fromSolidity(UniswapFactory).connect(wallet).deploy(deployerAddress);

  // deploy router
  const router = await ContractFactory.fromSolidity(UniswapRouter)
    .connect(wallet)
    .deploy(factory.address, ADDRESS.SETM);

  console.log({
    factory: factory.address,
    router: router.address
  });

  expect((await tokenSETUSD.allowance(deployerAddress, router.address)).toString()).to.equal('0');
  await tokenSETUSD.approve(router.address, BigNumber.from(10).pow(18));
  expect((await tokenSETUSD.allowance(deployerAddress, router.address)).toString()).to.equal('1000000000000000000');
  expect((await tokenSERP.allowance(deployerAddress, router.address)).toString()).to.equal('0');
  await tokenSERP.approve(router.address, BigNumber.from(10).pow(18));
  expect((await tokenSERP.allowance(deployerAddress, router.address)).toString()).to.equal('1000000000000000000');

  await router.addLiquidity(
    ADDRESS.SETUSD,
    ADDRESS.SERP,
    BigNumber.from(10).pow(15),
    BigNumber.from(10).pow(15),
    0,
    0,
    deployerAddress,
    10000000000
  );

  // check
  const tradingPairAddress = await factory.getPair(ADDRESS.SETUSD, ADDRESS.SERP);
  const tradingPair = new Contract(tradingPairAddress, IERC20.abi, wallet);
  const lpTokenAmount = await tradingPair.balanceOf(deployerAddress);
  const amountSETUSD = await tokenSETUSD.balanceOf(tradingPairAddress);
  const amountSERP = await tokenSERP.balanceOf(tradingPairAddress);

  console.log({
    tradingPair: tradingPairAddress,
    lpTokenAmount: lpTokenAmount.toString(),
    liquidityPoolAmountSETUSD: amountSETUSD.toString(),
    liquidityPoolAmountSERP: amountSERP.toString()
  });

  console.log('Deploy Arbitrager');

  // deploy arbitrager, scheduled every 3 blocks

  const arbitrager = await ContractFactory.fromSolidity(Arbitrager)
    .connect(wallet)
    .deploy(factory.address, router.address, ADDRESS.SETUSD, ADDRESS.SERP, 1);

  if (!process.argv.includes('--with-ethereum-compatibility')) {
    // The contract is charged by the Scheduler for handling fees and needs to be transferred first
    await tokenSETM.transfer(arbitrager.address, BigNumber.from(10).pow(13));
  }
  await arbitrager.initialize();

  await tokenSETUSD.transfer(arbitrager.address, BigNumber.from(10).pow(13));
  await tokenSERP.transfer(arbitrager.address, BigNumber.from(10).pow(13));

  const printBalance = async () => {
    const amountSETUSD = await tokenSETUSD.balanceOf(arbitrager.address);
    const amountSERP = await tokenSERP.balanceOf(arbitrager.address);
    const lpAmountSETUSD = await tokenSETUSD.balanceOf(tradingPairAddress);
    const lpAmountSERP = await tokenSERP.balanceOf(tradingPairAddress);

    console.log({
      arbitrager: arbitrager.address,
      amountSETUSD: amountSETUSD.toString(),
      amountSERP: amountSERP.toString(),
      lpAmountSETUSD: lpAmountSETUSD.toString(),
      lpAmountSERP: lpAmountSERP.toString()
    });
  };

  await provider.api.tx.setheumOracle
    .feedValues([
      [{ Token: 'SETUSD' }, 1000],
      [{ Token: 'SERP' }, 2000]
    ])
    .signAndSend(pair);

  await printBalance();

  const nextBlock = async () => {
    return new Promise((resolve) => {
      provider.api.tx.system.remark('').signAndSend(pair, (result) => {
        if (result.status.isInBlock) {
          resolve(undefined);
        }
      });
    });
  };

  await nextBlock();
  await nextBlock();

  await printBalance();

  await nextBlock();
  await provider.api.tx.setheumOracle
    .feedValues([
      [{ Token: 'SETUSD' }, 2000],
      [{ Token: 'SERP' }, 1000]
    ])
    .signAndSend(pair);

  await printBalance();

  await nextBlock();
  await nextBlock();

  await printBalance();

  provider.api.disconnect();
};

main();
