# {setters.js}

The Setters.JS SDK of Setheum.JS is a web3 provider that lets existing Ethereum dApps interact with the SetheumEVM ([SEVM](https://github.com/Setheum-Labs/Setheum/tree/master/lib-serml/evm)).

Packages:

- [setters](./setters)
- [eth-providers](./eth-providers)
- [eth-rpc-adapter](./eth-rpc-adapter)
- [eth-transactions](./eth-transactions)
- [evm-subql](./evm-subql)
- [examples](./examples)

## Getting Started

- install all dependencies

```bash
rush update
```

- build

```bash
rush build // build all
rush build --to @setheum.js/eth-rpc-adaptor //  build all the things that @setheum.js/eth-rpc-adaptor depends on, and also @setheum.js/eth-rpc-adaptor itself
```

- run build when the file changes

```bash
rush build:watch // watch all packages
rush build:watch --to @setheum.js/eth-rpc-adaptor //  watch all the things that @setheum.js/eth-rpc-adaptor depends on, and also @setheum.js/eth-rpc-adaptor itself
```

- run a script defined in project's `package.json`

```bash
cd <project>
rushx <script-name>
```

- add pacakge

```bash
rush add -p <package> --all             # for all projects
cd <project> && rush add -p <package>   # for this project only
```

## Documentation

- This project is managed by [Rushstack](https://github.com/microsoft/rushstack).
- Most of the api of `setters.js` is compatible with [ethers.js](https://docs.ethers.io/v5/single-page/).

## Release Workflow

### manual

```bash
## first let rush determine what projects were changed
rush change --bulk --message "version x.x.x" --bump-type "patch"

## build
rush build

## publish
rush publish -p --set-access-level public -n <paste_npm_token_here>
```

### CI (deprecated, rush has some different workflow)

In order to trigger a auto release, we need to tag the commit with 'v*', any other commit won't trigger the auto publish. Also, remember to update the `version` fields in `package.json`, otherwise publishing will fail.

For example

```bash
git commit -m "bump version to v2.0.8-beta"
git tag v2.0.8-beta

# push code, this won't trigger CI
# if this creates a pull request, make sure to merge it before push tag
git push

# push the tag, this will trigger CI auto release
# do this after the code is actually merged
git push origin v2.0.8-beta
```
