import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from 'matchstick-as/assembly/index'
import { Address, BigInt } from '@graphprotocol/graph-ts'

import { handleNewLock, handleLockUpgraded } from '../src/unlock'
import {
  handleRoleGranted,
  handleLockManagerAdded,
  handleLockManagerRemoved,
  handlePricingChanged,
  handleLockMetadata,
  handleTransfer,
  handleKeyExtended,
  handleKeyGranterAdded,
  handleKeyGranterRemoved,
  handleRoleRevoked,
} from '../src/public-lock'

import {
  createNewLockEvent,
  createRoleGrantedLockManagerAddedEvent, // using RoleGranted
  createLockManagerRemovedEvent,
  createPricingChangedEvent,
  createLockUpgradedEvent,
  createLockMetadata,
  mockDataSourceV8,
  createRoleRevokedKeyGranterRemovedEvent,
} from './locks-utils'
import {
  createKeyExtendedEvent,
  createLockManagerAddedEvent,
  createTransferEvent,
  mockDataSourceV11 as mockKeyDataSourceV11,
  updateExpiration,
  createKeyGranterAddedEvent,
  createKeyGranterRemovedEvent,
  createRoleGrantedKeyGranterAddedEvent,
} from './keys-utils'

import {
  duration,
  keyPrice,
  newKeyPrice,
  lockAddress,
  lockManagers,
  lockOwner,
  tokenAddress,
  nullAddress,
  name,
  symbol,
  baseTokenURI,
  maxNumberOfKeys,
  maxKeysPerAddress,
  lockAddressV8,
  tokenId,
  expiration,
  keyGranters,
  keyOwnerAddress,
} from './constants'

// mock contract functions
import './mocks'

describe('Describe Locks events', () => {
  beforeAll(() => {
    const newLockEvent = createNewLockEvent(
      Address.fromString(lockOwner),
      Address.fromString(lockAddress)
    )
    handleNewLock(newLockEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test('Lock created and stored', () => {
    assert.entityCount('Lock', 1)
    assert.fieldEquals('Lock', lockAddress, 'address', lockAddress)
    assert.fieldEquals('Lock', lockAddress, 'createdAtBlock', '1')
    assert.fieldEquals('Lock', lockAddress, 'version', '11')
    assert.fieldEquals('Lock', lockAddress, 'price', '1000')
    assert.fieldEquals('Lock', lockAddress, 'name', 'My lock graph')
    assert.fieldEquals('Lock', lockAddress, 'expirationDuration', `${duration}`)
    assert.fieldEquals('Lock', lockAddress, 'tokenAddress', nullAddress)
    assert.fieldEquals('Lock', lockAddress, 'lockManagers', `[]`)
    assert.fieldEquals('Lock', lockAddress, 'totalKeys', '0')
    assert.fieldEquals('Lock', lockAddress, 'numberOfReceipts', '0')
    assert.fieldEquals('Lock', lockAddress, 'keyGranters', `[]`)

    assert.fieldEquals(
      'Lock',
      lockAddress,
      'maxNumberOfKeys',
      `${maxNumberOfKeys}`
    )
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'maxKeysPerAddress',
      `${maxKeysPerAddress}`
    )
    assert.fieldEquals('Lock', lockAddress, 'lastKeyMintedAt', 'null')
  })

  test('Lock manager added (using `RoleGranted`)', () => {
    assert.fieldEquals('Lock', lockAddress, 'lockManagers', `[]`)
    const newLockManagerAdded = createRoleGrantedLockManagerAddedEvent(
      Address.fromString(lockManagers[0])
    )
    handleRoleGranted(newLockManagerAdded)
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lockManagers',
      `[${lockManagers[0]}]`
    )

    // support existing managers
    handleRoleGranted(
      createRoleGrantedLockManagerAddedEvent(
        Address.fromString(lockManagers[1])
      )
    )
    handleRoleGranted(
      createRoleGrantedLockManagerAddedEvent(
        Address.fromString(lockManagers[2])
      )
    )
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lockManagers',
      `[${lockManagers[0]}, ${lockManagers[1]}, ${lockManagers[2]}]`
    )

    // avoid duplicate managers
    handleRoleGranted(
      createRoleGrantedLockManagerAddedEvent(
        Address.fromString(lockManagers[1])
      )
    )
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lockManagers',
      `[${lockManagers[0]}, ${lockManagers[1]}, ${lockManagers[2]}]`
    )
  })

  // event should be ignored in v11 as we use `RoleGranted` instead
  test('Lock manager added (using `LockManagerAdded`)', () => {
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lockManagers',
      `[${lockManagers[0]}, ${lockManagers[1]}, ${lockManagers[2]}]`
    )
    const newLockManagerAdded = createLockManagerAddedEvent(
      Address.fromString(lockManagers[1])
    )
    handleLockManagerAdded(newLockManagerAdded)
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lockManagers',
      `[${lockManagers[0]}, ${lockManagers[1]}, ${lockManagers[2]}]`
    )
  })

  test('Lock manager removed', () => {
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lockManagers',
      `[${lockManagers[0]}, ${lockManagers[1]}, ${lockManagers[2]}]`
    )

    const newLockManagerRemoved = createLockManagerRemovedEvent(
      Address.fromString(lockManagers[0])
    )
    handleLockManagerRemoved(newLockManagerRemoved)

    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lockManagers',
      `[${lockManagers[1]}, ${lockManagers[2]}]`
    )
  })

  test('key granter added (using `RoleGranted`)', () => {
    assert.fieldEquals('Lock', lockAddress, 'keyGranters', `[]`)
    const newKeyGranterAdded = createRoleGrantedKeyGranterAddedEvent(
      Address.fromString(keyGranters[0])
    )
    handleRoleGranted(newKeyGranterAdded)
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[0]}]`
    )

    // support existing granters
    handleRoleGranted(
      createRoleGrantedKeyGranterAddedEvent(Address.fromString(keyGranters[1]))
    )
    handleRoleGranted(
      createRoleGrantedKeyGranterAddedEvent(Address.fromString(keyGranters[2]))
    )
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[0]}, ${keyGranters[1]}, ${keyGranters[2]}]`
    )

    // avoid duplicate granters
    handleRoleGranted(
      createRoleGrantedKeyGranterAddedEvent(Address.fromString(keyGranters[1]))
    )
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[0]}, ${keyGranters[1]}, ${keyGranters[2]}]`
    )
  })

  // event should be ignored in v11 as we use `RoleGranted` instead
  test('Key granter added (using `KeyGranterAdded`)', () => {
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[0]}, ${keyGranters[1]}, ${keyGranters[2]}]`
    )
    const newKeyGranterAdded = createKeyGranterAddedEvent(
      Address.fromString(keyOwnerAddress)
    )

    handleKeyGranterAdded(newKeyGranterAdded)
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[0]}, ${keyGranters[1]}, ${keyGranters[2]}]`
    )
  })

  test('Key granter removed', () => {
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[0]}, ${keyGranters[1]}, ${keyGranters[2]}]`
    )

    const newKeyGranterRemoved = createKeyGranterRemovedEvent(
      Address.fromString(keyGranters[0])
    )
    handleKeyGranterRemoved(newKeyGranterRemoved)

    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[1]}, ${keyGranters[2]}]`
    )
  })

  test('key granter removed (using `RoleRevoked`)', () => {
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[1]}, ${keyGranters[2]}]`
    )

    handleRoleRevoked(
      createRoleRevokedKeyGranterRemovedEvent(
        Address.fromString(keyGranters[1])
      )
    )
    assert.fieldEquals(
      'Lock',
      lockAddress,
      'keyGranters',
      `[${keyGranters[2]}]`
    )
  })

  test('Price changed', () => {
    assert.fieldEquals('Lock', lockAddress, 'price', `${keyPrice}`)
    assert.fieldEquals('Lock', lockAddress, 'tokenAddress', nullAddress)

    const newPricingChanged = createPricingChangedEvent(
      BigInt.fromU32(keyPrice),
      BigInt.fromU32(newKeyPrice),
      Address.fromString(nullAddress),
      Address.fromString(tokenAddress)
    )
    handlePricingChanged(newPricingChanged)

    assert.fieldEquals('Lock', lockAddress, 'tokenAddress', tokenAddress)
    assert.fieldEquals('Lock', lockAddress, 'price', `${newKeyPrice}`)
  })

  test('Lock upgraded', () => {
    const version = BigInt.fromU32(12)
    const newLockUpgraded = createLockUpgradedEvent(
      Address.fromString(lockAddress),
      version
    )
    handleLockUpgraded(newLockUpgraded)

    assert.fieldEquals('Lock', lockAddress, 'version', `12`)
  })

  test('Lock metadata', () => {
    assert.fieldEquals('Lock', lockAddress, 'name', 'My lock graph')
    const newLockMetadata = createLockMetadata(name, symbol, baseTokenURI)
    handleLockMetadata(newLockMetadata)

    assert.fieldEquals('Lock', lockAddress, 'name', name)
    assert.fieldEquals('Lock', lockAddress, 'symbol', symbol)
    // assert.fieldEquals('Lock', lockAddress, 'baseTokenURI', `12`)
  })

  test('Lock updated when a new key is added', () => {
    mockKeyDataSourceV11()

    assert.fieldEquals('Lock', lockAddress, 'lastKeyMintedAt', 'null')
    assert.fieldEquals('Lock', lockAddress, 'totalKeys', '0')

    const newTransferEvent = createTransferEvent(
      Address.fromString(nullAddress),
      Address.fromString(lockAddress),
      BigInt.fromU32(tokenId)
    )
    handleTransfer(newTransferEvent)

    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lastKeyMintedAt',
      newTransferEvent.block.timestamp.toString()
    )
    assert.fieldEquals('Lock', lockAddress, 'totalKeys', '1')
  })

  test('Lock updated when a key is renewed', () => {
    assert.fieldEquals('Lock', lockAddress, 'lastKeyRenewedAt', 'null')

    updateExpiration(BigInt.fromU64(expiration + 5000))
    const newKeyExtended = createKeyExtendedEvent(
      BigInt.fromU32(tokenId),
      BigInt.fromU64(expiration + 5000)
    )
    handleKeyExtended(newKeyExtended)

    assert.fieldEquals(
      'Lock',
      lockAddress,
      'lastKeyRenewedAt',
      newKeyExtended.block.timestamp.toString()
    )
  })
})

describe('Describe Locks events (v8)', () => {
  beforeAll(() => {
    mockDataSourceV8()
    const newLockEvent = createNewLockEvent(
      Address.fromString(lockOwner),
      Address.fromString(lockAddressV8)
    )
    handleNewLock(newLockEvent)
  })
  test('Creation of a new lock (v8)', () => {
    assert.entityCount('Lock', 1)
    assert.fieldEquals('Lock', lockAddressV8, 'address', lockAddressV8)
    assert.fieldEquals('Lock', lockAddressV8, 'createdAtBlock', '1')
    assert.fieldEquals('Lock', lockAddressV8, 'version', '8')
    assert.fieldEquals('Lock', lockAddressV8, 'price', '1000')
    assert.fieldEquals('Lock', lockAddressV8, 'name', 'My lock v8')
    assert.fieldEquals(
      'Lock',
      lockAddressV8,
      'expirationDuration',
      `${duration}`
    )
    assert.fieldEquals('Lock', lockAddressV8, 'tokenAddress', nullAddress)
    assert.fieldEquals('Lock', lockAddressV8, 'lockManagers', `[${lockOwner}]`)
    assert.fieldEquals('Lock', lockAddressV8, 'keyGranters', `[${lockOwner}]`)

    assert.fieldEquals('Lock', lockAddressV8, 'totalKeys', '0')
    assert.fieldEquals('Lock', lockAddressV8, 'numberOfReceipts', '0')
    assert.fieldEquals(
      'Lock',
      lockAddressV8,
      'maxNumberOfKeys',
      `${maxNumberOfKeys}`
    )
    assert.fieldEquals('Lock', lockAddressV8, 'maxKeysPerAddress', '1')
  })

  test('Lock manager added (v8)', () => {
    mockDataSourceV8()
    assert.fieldEquals('Lock', lockAddressV8, 'lockManagers', `[${lockOwner}]`)
    const newLockManagerAdded = createLockManagerAddedEvent(
      Address.fromString(lockManagers[0])
    )
    handleLockManagerAdded(newLockManagerAdded)

    assert.fieldEquals(
      'Lock',
      lockAddressV8,
      'lockManagers',
      `[${lockOwner}, ${lockManagers[0]}]`
    )
  })

  test('Key granter added (v8)', () => {
    mockDataSourceV8()
    assert.fieldEquals('Lock', lockAddressV8, 'keyGranters', `[${lockOwner}]`)
    const newKeyGranterAdded = createKeyGranterAddedEvent(
      Address.fromString(keyGranters[0])
    )
    handleKeyGranterAdded(newKeyGranterAdded)

    assert.fieldEquals(
      'Lock',
      lockAddressV8,
      'keyGranters',
      `[${lockOwner}, ${keyGranters[0]}]`
    )
  })

  afterAll(() => {
    clearStore()
  })
})
