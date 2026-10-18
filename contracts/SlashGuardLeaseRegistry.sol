// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SlashGuardLeaseRegistry
 * @dev On-Chain Decentralized Anti-Equivocation Lease Arbiter for Portaldot Network V3.0.
 * Eliminates Split-Brain double-signing between Primary and Standby validator nodes
 * using strict monotonic fencing epochs and block-bounded leases.
 */
contract SlashGuardLeaseRegistry {
    struct ValidatorLease {
        address activeNodeOperator;
        uint256 fencingEpoch;
        uint256 expiresAtBlock;
        bytes32 peerIdHash;
        bool isFenced;
    }

    // Mapping from Validator Stash address (or Operator ID) to their active lease
    mapping(address => ValidatorLease) public leases;

    // Events for real-time observability by DotNexus Dual-Tracker & Prometheus Exporter
    event LeaseAcquired(
        address indexed operator,
        uint256 indexed fencingEpoch,
        uint256 expiresAtBlock,
        bytes32 peerIdHash
    );

    event LeaseRenewed(
        address indexed operator,
        uint256 indexed fencingEpoch,
        uint256 newExpiresAtBlock
    );

    event LeaseRevoked(
        address indexed operator,
        uint256 indexed fencingEpoch,
        string reason
    );

    event SplitBrainAttemptBlocked(
        address indexed operator,
        uint256 attemptedEpoch,
        uint256 currentEpoch,
        address caller
    );

    error StaleFencingEpoch(uint256 attempted, uint256 current);
    error LeaseStillActive(uint256 currentBlock, uint256 expiresAtBlock);
    error UnauthorizedOperator(address caller, address authorized);
    error LeaseAlreadyFenced();

    /**
     * @notice Acquire or emergency-failover a validator signing lease.
     * @dev Enforces strictly monotonic fencing epochs to prevent split-brain dual-signing.
     * @param operator The validator stash or primary operator identity.
     * @param expectedEpoch The epoch number proposed by the failover daemon. Must be > current epoch.
     * @param peerIdHash The cryptographic hash of the libp2p PeerId of the active host.
     * @param leaseDurationBlocks Number of blocks before lease expires if heartbeat ceases.
     */
    function acquireFailoverLease(
        address operator,
        uint256 expectedEpoch,
        bytes32 peerIdHash,
        uint256 leaseDurationBlocks
    ) external returns (bool) {
        ValidatorLease storage currentLease = leases[operator];

        // 1. Monotonic Fencing Epoch Guard: strictly prevent older or duplicate epochs
        if (expectedEpoch <= currentLease.fencingEpoch) {
            emit SplitBrainAttemptBlocked(operator, expectedEpoch, currentLease.fencingEpoch, msg.sender);
            revert StaleFencingEpoch(expectedEpoch, currentLease.fencingEpoch);
        }

        // 2. Safety check: If lease is not expired and not initial, caller must be authorized or previous lease expired
        if (currentLease.fencingEpoch > 0 && block.number < currentLease.expiresAtBlock) {
            if (msg.sender != currentLease.activeNodeOperator && msg.sender != operator) {
                revert LeaseStillActive(block.number, currentLease.expiresAtBlock);
            }
        }

        uint256 newExpiration = block.number + leaseDurationBlocks;

        leases[operator] = ValidatorLease({
            activeNodeOperator: msg.sender,
            fencingEpoch: expectedEpoch,
            expiresAtBlock: newExpiration,
            peerIdHash: peerIdHash,
            isFenced: false
        });

        emit LeaseAcquired(operator, expectedEpoch, newExpiration, peerIdHash);
        return true;
    }

    /**
     * @notice Periodic heartbeat renewal called by the active validator daemon.
     */
    function renewLease(address operator, uint256 epoch, uint256 additionalBlocks) external returns (bool) {
        ValidatorLease storage currentLease = leases[operator];

        if (currentLease.isFenced) revert LeaseAlreadyFenced();
        if (epoch != currentLease.fencingEpoch) revert StaleFencingEpoch(epoch, currentLease.fencingEpoch);
        if (msg.sender != currentLease.activeNodeOperator) revert UnauthorizedOperator(msg.sender, currentLease.activeNodeOperator);

        currentLease.expiresAtBlock = block.number + additionalBlocks;
        emit LeaseRenewed(operator, epoch, currentLease.expiresAtBlock);
        return true;
    }

    /**
     * @notice Self-fencing kill switch: called by the Dead Man's Switch to immediately fence an unhealthy primary.
     */
    function selfFenceNode(address operator, uint256 epoch) external returns (bool) {
        ValidatorLease storage currentLease = leases[operator];
        if (epoch != currentLease.fencingEpoch) revert StaleFencingEpoch(epoch, currentLease.fencingEpoch);
        if (msg.sender != currentLease.activeNodeOperator && msg.sender != operator) {
            revert UnauthorizedOperator(msg.sender, currentLease.activeNodeOperator);
        }

        currentLease.isFenced = true;
        currentLease.expiresAtBlock = block.number; // Immediate expiration
        emit LeaseRevoked(operator, epoch, "Dead Man's Switch Self-Fenced");
        return true;
    }

    /**
     * @notice Read the active lease state for a validator.
     */
    function getLease(address operator) external view returns (
        address activeNodeOperator,
        uint256 fencingEpoch,
        uint256 expiresAtBlock,
        bytes32 peerIdHash,
        bool isFenced,
        bool isCurrentlyValid
    ) {
        ValidatorLease memory l = leases[operator];
        bool valid = (!l.isFenced) && (block.number < l.expiresAtBlock) && (l.fencingEpoch > 0);
        return (l.activeNodeOperator, l.fencingEpoch, l.expiresAtBlock, l.peerIdHash, l.isFenced, valid);
    }
}
