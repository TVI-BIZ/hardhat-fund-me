// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
//import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
//import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./PriceConverter.sol";

//868276
//
error FundMe__NotOwner();

/**
 * @title A contract for crowd funding
 * @author Vlad Tagunkov
 * @notice This contract a demo of funding contract
 * @dev This implements price feed as our library.
 */
contract FundMe {
    //Type Declaration
    //using SafeMath for uint256;
    using PriceConverter for uint256;

    //State Variables
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    address private immutable i_owner;
    uint256 public constant minimumUSD = 50 * 10 ** 18;
    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner() {
        //require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address priceFeed) {
        s_priceFeed = AggregatorV3Interface(priceFeed);
        i_owner = msg.sender;
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        // $50
        require(
            msg.value.getConversionRate(s_priceFeed) >= minimumUSD,
            "You need to spend more ETH!"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
        //what ETH-> USD rate
    }

    function withdraw() public payable onlyOwner {
        //msg.sender.transfer(address(this).balance);
        // require msg.sen
        //payable(msg.sender).transfer(address(this).balance);
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        //transfer
        //payable(msg.sender).transfer(address(this).balance); //max 22000 gas
        //send
        //bool sendsucess = payable(msg.sender).send(address(this).balance); //max 23000 gas
        //require(sendSuccess,"Send failed");
        //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }(""); // best way today
        require(callSuccess, "Send failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool sucess, ) = i_owner.call{value: address(this).balance}("");
        require(sucess);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
