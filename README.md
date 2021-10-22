# {setters.js}
The Setters.JS SDK of Setheum.JS is a web3 provider that lets existing Ethereum dApps interact with the SetheumEVM ([SEVM](https://github.com/Setheum-Labs/Setheum/tree/master/lib-serml/evm)).

## Getting Started

- Install dependencies

```
yarn
```

## Documentation

Most of the api of sevm.js is compatible with ethers.js. If you are not familiar with ethers.js, you can start by looking at its [documentation](https://docs.ethers.io/v5/single-page/)

### Provider

The Provider provides some api for interacting with nodes and is an instance of `ethers.js` [AbstractProvider](https://docs.ethers.io/v5/single-page/#/v5/api/providers/-%23-providers).

#### Creating Instances

**new Provider( apiOptions )**

apiOptions has the same parameters as when creating an instance of apiPromise for polkadot.js 

```javascript
import { options } from "@setheum-js/setheum.js";
import { Provider } from "@setheum-js/sevm.js";
import { WsProvider } from "@polkadot/api";

const evmprovider = new Provider(
  options({
    provider: new WsProvider("ws://localhost:9944")
  })
);
```

### Wallet

The Wallet class inherits Signer and can sign transactions and messages using a private key.

#### Creating Instances

**new Wallet( privateKey , provider? , keyringPair? )**

"privateKey" is the private key of evm's account. "provider" is an instance of [Provider](#Provider). "keyringPair" is a [key pair for polkadot](https://polkadot.js.org/docs/api/start/keyring). If the "keyringPair" is empty, a key pair will be generated from the 
"privateKey".

```javascript
import { Wallet } from "@setheum-js/sevm.js";
const wallet = new Wallet("0xaa397267eaee48b2262a973fdcab384a758f39a3ad8708025cfb675bb9effc20", provider)
```


### Wallet.claimEvmAccounts()

Use "keyringpair" to bind an evm account generated by "privateKey".

```javascript
wallet.claimEvmAccounts()
```

## Examples

### deploy a contract

```javascript
import { deployContract } from "ethereum-waffle";
import ERC20Abi from "../build/ERC20Abi.json";
import { TestAccountSigningKey, Provider, Signer } from "@setheum-js/sevm.js";
import { WsProvider } from "@polkadot/api";
import { createTestPairs } from "@polkadot/keyring/testingPairs";

const provider = new Provider({
  provider: new WsProvider("ws://127.0.0.1:9944"),
});

const testPairs = createTestPairs();

const signingKey = new TestAccountSigningKey(provider.api.registry);

signingKey.addKeyringPair(Object.values(testPairs));

const wallet = new Signer(provider, testPairs.alice.address, signingKey)

const tokenInstance = await deployContract(master, ERC20Abi, [1000]);
```
