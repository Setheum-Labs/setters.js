import { Contract, BigNumber, ContractFactory } from 'ethers';
import ADDRESS from '@setheum-labs/predeploy-contracts/utils/Address';
import { expect, use } from 'chai';
import { evmChai } from '@setheum.js/setters';

import setup from './setup';
import Arbitrager from '../build/Arbitrager.json';
import UniswapFactory from '../artifacts/UniswapV2Factory.json';
import UniswapRouter from '../artifacts/UniswapV2Router02.json';
import IERC20 from '../artifacts/IERC20.json';

const dollar = BigNumber.from('1000000000000');
use(evmChai);

const deploy = async () => {
  const { wallet, provider } = await setup();
  const deployerAddress = await wallet.getAddress();
  const tokenSETM = new Contract(ADDRESS.SETM, IERC20.abi, wallet);
  const tokenSERP = new Contract(ADDRESS.SERP, IERC20.abi, wallet);

  // deploy factory
  const factory = await ContractFactory.fromSolidity(UniswapFactory).connect(wallet).deploy(deployerAddress);

  // deploy router
  const router = await ContractFactory.fromSolidity(UniswapRouter)
    .connect(wallet)
    .deploy(factory.address, ADDRESS.SETM);

  console.log('Deploy done');
  console.log({
    factory: factory.address,
    router: router.address
  });

  // approve
  await tokenSETM.approve(router.address, dollar.mul(100));
  await tokenSERP.approve(router.address, dollar.mul(100));

  // add liquidity
  await router.addLiquidity(ADDRESS.SETM, ADDRESS.SERP, dollar.mul(2), dollar, 0, 0, deployerAddress, 10000000000);

  // check
  const tradingPairAddress = await factory.getPair(ADDRESS.SETM, ADDRESS.SERP);
  const tradingPair = new Contract(tradingPairAddress, IERC20.abi, wallet);
  const lpTokenAmount = await tradingPair.balanceOf(deployerAddress);
  const setmAmount = await tokenSETM.balanceOf(tradingPairAddress);
  const serpAmount = await tokenSERP.balanceOf(tradingPairAddress);

  console.log({
    tradingPair: tradingPairAddress,
    lpTokenAmount: lpTokenAmount.toString(),
    liquidityPoolSetmAmount: setmAmount.toString(),
    liquidityPoolSerpAmount: serpAmount.toString()
  });

  provider.api.disconnect();

  return router.address;
};

const trade = async (routerAddress: string) => {
  console.log(`##### start trading with router ${routerAddress} ...`);

  const { wallet, provider } = await setup();
  const deployerAddress = await wallet.getAddress();
  const tokenSETM = new Contract(ADDRESS.SETM, IERC20.abi, wallet);
  const tokenSERP = new Contract(ADDRESS.SERP, IERC20.abi, wallet);

  const router = new Contract(routerAddress, UniswapRouter.abi, wallet);
  const factory = new Contract(await router.factory(), UniswapFactory.abi, wallet);

  // approve
  await tokenSETM.approve(router.address, dollar.mul(100));
  await tokenSERP.approve(router.address, dollar.mul(100));

  // before
  const setmAmountBefore = await tokenSETM.balanceOf(deployerAddress);
  const serpAmountBefore = await tokenSERP.balanceOf(deployerAddress);

  console.log({
    setmAmountBefore: setmAmountBefore.toString(),
    serpAmountBefore: serpAmountBefore.toString()
  });

  // trade

  const path = [ADDRESS.SERP, ADDRESS.SETM];
  const buyAmount = dollar;

  console.log('Trade', {
    path,
    buyAmount: buyAmount.toString()
  });

  await router.swapExactTokensForTokens(buyAmount, 0, path, deployerAddress, 10000000000);

  // check
  const tradingPairAddress = await factory.getPair(ADDRESS.SETM, ADDRESS.SERP);
  const tradingPair = new Contract(tradingPairAddress, IERC20.abi, wallet);
  const lpTokenAmount = await tradingPair.balanceOf(deployerAddress);
  const lpSetmAmount = await tokenSETM.balanceOf(tradingPairAddress);
  const lpSerpAmount = await tokenSERP.balanceOf(tradingPairAddress);
  const setmAmountAfter = await tokenSETM.balanceOf(deployerAddress);
  const serpAmountAfter = await tokenSERP.balanceOf(deployerAddress);

  console.log({
    tradingPair: tradingPairAddress,
    lpTokenAmount: lpTokenAmount.toString(),
    liquidityPoolSetmAmount: lpSetmAmount.toString(),
    liquidityPoolSerpAmount: lpSerpAmount.toString(),
    setmAmountAfter: setmAmountAfter.toString(),
    serpAmountAfter: serpAmountAfter.toString()
  });

  provider.api.disconnect();
};

const main = async () => {
  const routerAddress = await deploy();
  await trade(routerAddress);
};

main();
