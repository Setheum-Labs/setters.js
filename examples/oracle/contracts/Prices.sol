// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

import "@setheum-labs/predeploy-contracts/oracle/IOracle.sol";
import "@setheum-labs/predeploy-contracts/utils/Address.sol";

contract Prices is ADDRESS {
    IOracle oracle = IOracle(ADDRESS.Oracle);

    function getPrice(address token) public view returns (uint256) {
        uint256 price = oracle.getPrice(token);
        return price;
    }
}
