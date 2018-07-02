pragma solidity ^0.4.18;

/**
 * @title The Unlock contract
 * @author Julien Genestoux (unlock-protocol.com)
 * This smart contract has 2 main roles:
 *  1. Distribute discounts to discount token holders
 *  2. Grant dicount tokens to users making referrals and/or publishers granting discounts.
 * In order to achieve these 2 elements, it keeps track of several things such as
 *  a. Deployed locks addresses and balances of discount tokens granted by each lock.
 *  b. The total network product (sum of all key sales, net of discounts)
 *  c. Total of discounts granted
 *  d. Balances of discount tokens, including "frozen" tokens (which have been used to claim discounts and cannot be used/transfered for a given period)
 *  e. Growth rate of Network Product
 *  f. Growth rate of Discount tokens supply
 * The smart contract has an owner who only can perform the following
 *  - Upgrades
 *  - Change in golden rules (20% of GDP available in discounts, and supply growth rate is at most 50% of GNP growth rate)
 * NOTE: This smart contract is partially implemented for now until enough Locks are deployed and in the wild.
 * The partial implementation includes the following features:
 *  a. Keeping track of deployed locks
 *  b. Keeping track of GNP
 */

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import './Lock.sol';

contract Unlock is Ownable {

  // The struct for a lock
  struct LockBalances {
    bool deployed; // keeping track of deployments. This is required because both totalSales and yieldedDiscountTokens are 0 when initialized, which would be the same values when the lock is not set.
    uint totalSales; // This is in wei
    uint yieldedDiscountTokens;
  }

  modifier onlyFromDeployedLock() {
    require(locks[msg.sender].deployed, 'Only from previously deployed locks');
    _;
  }


  uint public grossNetworkProduct;

  uint public totalDiscountGranted;

  // We keep track of deployed locks to ensure that callers are all deployed locks.
  mapping (address => LockBalances) public locks;

  // Events
  event NewLock(
    address indexed lockOwner,
    address indexed newLockAddress
  );

  constructor(
    address _owner
  )
    public
  {
      owner = _owner;
      grossNetworkProduct = 0;
      totalDiscountGranted = 0;
  }


  /**
  * @dev Create lock
  * This deploys a lock for a creator. It also keeps track of the deployed lock.
  */
  function createLock(
    Lock.KeyReleaseMechanisms _keyReleaseMechanism,
    uint _expirationDuration,
    uint _keyPrice,
    uint _maxNumberOfKeys
  )
    public
    returns (Lock lock)
  {

    // create lock
    Lock newLock = new Lock(
      msg.sender,
      _keyReleaseMechanism,
      _expirationDuration,
      _keyPrice,
      _maxNumberOfKeys
    );

    // Assign the new Lock
    locks[address(newLock)] = LockBalances({
      deployed: true,
      totalSales: 0,
      yieldedDiscountTokens: 0
    });

    // trigger event
    emit NewLock(msg.sender, address(newLock));

    // return the created lock
    return newLock;
  }

  /**
   * This function returns the discount available for a user, when purchasing a
   * a key from a lock.
   * This does not modify the state. It returns both the discount and the number of tokens
   * consumed to grant that discount.
   * TODO: actually implement this.
   */
  function computeAvailableDiscountFor(
    address _purchaser,
    uint _keyPrice
  )
    public
    pure
    returns (uint discount, uint tokens)
  {
    // TODO: implement me
    return (0, 0);
  }

  /**
   * This function keeps track of the added GDP, as well as grants of discount tokens
   * to the referrer, if applicable.
   * The number of discount tokens granted is based on the value of the referal,
   * the current growth rate and the lock's discount token distribution rate
   * This function is invoked by a previously deployed lock only.
   * TODO: actually implement
   */
  function recordKeyPurchase(
    uint _value,
    address _referrer
  )
    public
    onlyFromDeployedLock()
  {
    // TODO: implement me
    grossNetworkProduct += _value;
    return;
  }

  /**
   * This function will keep track of consumed discounts by a given user.
   * It will also grant discount tokens to the creator who is granting the discount based on the
   * amount of discount and compensation rate.
   * This function is invoked by a previously deployed lock only.
   */
  function recordConsumedDiscount(
    uint _discount,
    uint _tokens
  )
    public
    onlyFromDeployedLock()
  {
    // TODO: implement me
    totalDiscountGranted += _discount;
    return;
  }

}
