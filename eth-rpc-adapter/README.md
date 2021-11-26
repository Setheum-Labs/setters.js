# @setheum.js/eth-rpc-adaptor
A node service that allows existing Ethereum dApp to be able to interact with [Setheum EVM](https://github.com/Setheum-Labs/Setheum/tree/master/lib-serml/evm).

## Run
- provide an optional `.env` file for:
  - **ENDPOINT_URL**: setheum node WS url
  - **HTTP_PORT**: HTTP port for requests
  - **WS_PORT**: WS port for requests

for example:
```
ENDPOINT_URL=ws://localhost:9944  # default WS port that setheum node exposes
HTTP_PORT=8545                    # default http port that hardhat looks for
```

- install dependencies
```
rush update
```

- run the dev server:
```
rushx dev
```

## Usage
Now that the adaptor service is running and listening to HTTP_PORT, we can send EVM related requests to this port.

For example
```
### request
GET http://localhost:8545
{
    "jsonrpc": "2.0",
    "method": "eth_chainId",
    "params": [],
    "id": 1
}

### response
{
    "id": 1,
    "jsonrpc": "2.0",
    "result": "0x253"
}
```

## Test
`rushx test`