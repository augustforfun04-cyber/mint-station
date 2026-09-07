// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ManualToken
/// @notice ERC-20 with a custom initial mint split and optional post-deploy minting.
contract ManualToken {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;
    uint256 public immutable maxSupply;
    bool public immutable mintable;
    bool public immutable burnable;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        uint256 maxSupply_,
        address destination,
        uint256 destinationAmount,
        address remainderTo,
        bool mintable_,
        bool burnable_
    ) {
        require(bytes(name_).length > 0, "name");
        require(bytes(symbol_).length > 0, "symbol");
        require(destinationAmount <= totalSupply_, "mint > supply");
        if (maxSupply_ > 0) {
            require(totalSupply_ <= maxSupply_, "supply > max");
        }

        name = name_;
        symbol = symbol_;
        decimals = decimals_;
        maxSupply = maxSupply_;
        mintable = mintable_;
        burnable = burnable_;
        owner = msg.sender;
        totalSupply = totalSupply_;
        emit OwnershipTransferred(address(0), msg.sender);

        if (destinationAmount > 0) {
            require(destination != address(0), "destination");
            balanceOf[destination] = destinationAmount;
            emit Transfer(address(0), destination, destinationAmount);
        }

        uint256 rest = totalSupply_ - destinationAmount;
        if (rest > 0) {
            address to = remainderTo == address(0) ? msg.sender : remainderTo;
            balanceOf[to] += rest;
            emit Transfer(address(0), to, rest);
        }
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(mintable, "not mintable");
        require(to != address(0), "to");
        require(amount > 0, "amount");
        uint256 next = totalSupply + amount;
        if (maxSupply > 0) {
            require(next <= maxSupply, "max supply");
        }
        totalSupply = next;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) external {
        require(burnable, "not burnable");
        uint256 bal = balanceOf[msg.sender];
        require(bal >= amount, "balance");
        unchecked {
            balanceOf[msg.sender] = bal - amount;
            totalSupply -= amount;
        }
        emit Transfer(msg.sender, address(0), amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "allowance");
            unchecked {
                allowance[from][msg.sender] = allowed - amount;
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "to");
        uint256 bal = balanceOf[from];
        require(bal >= amount, "balance");
        unchecked {
            balanceOf[from] = bal - amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }
}
