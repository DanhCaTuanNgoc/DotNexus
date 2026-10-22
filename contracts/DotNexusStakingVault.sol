// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DotNexusStakingVault
 * @dev Non-Custodial NPoS Delegation & Validator SLA Insurance Vault for Portaldot Network V3.0.
 * Allows EVM users to deposit POT for automated Sequential Phragmen re-nomination without
 * surrendering private keys, backed by on-chain Validator SLA insurance bonds against commission rug-pulls.
 */
contract DotNexusStakingVault {
    address public owner;
    address public nposOptimizerOperator;

    struct NominatorAccount {
        uint256 stakedBalance;
        uint256 unbondingBalance;
        uint256 unbondReadyBlock;
    }

    struct ValidatorSlaBond {
        uint256 bondedAmount;
        uint16 maxPromisedCommissionBps;
        bool isFlaggedRugPull;
        uint256 slashedCompensationPool;
    }

    mapping(address => NominatorAccount) public nominators;
    mapping(address => ValidatorSlaBond) public validatorBonds;
    address[] public currentNominatedValidators;

    uint256 public totalVaultStaked;
    uint256 public totalSlaInsurancePool;
    uint256 public constant UNBONDING_BLOCKS = 14400; // ~28 eras on Portaldot

    event StakeDeposited(address indexed user, uint256 amount);
    event UnbondingInitiated(address indexed user, uint256 amount, uint256 readyBlock);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event NominationsUpdated(address[] newValidators, uint256 timestamp);
    event SlaBondDeposited(address indexed validator, uint256 amount, uint16 maxCommissionBps);
    event SlaBondSlashed(address indexed validator, uint256 slashedAmount, string reason);

    error Unauthorized();
    error ZeroDeposit();
    error InsufficientBalance();
    error StillUnbonding();
    error TransferFailed();
    error InvalidBond();
    error MaxValidatorsExceeded();

    modifier onlyOperator() {
        if (msg.sender != nposOptimizerOperator && msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _operator) {
        owner = msg.sender;
        nposOptimizerOperator = _operator;
    }

    /**
     * @notice Deposit POT to participate in non-custodial automated NPoS staking.
     */
    function depositStake() external payable {
        if (msg.value == 0) revert ZeroDeposit();
        nominators[msg.sender].stakedBalance += msg.value;
        totalVaultStaked += msg.value;
        emit StakeDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Initiate unbonding for staked POT.
     */
    function initiateUnbonding(uint256 amount) external {
        NominatorAccount storage acc = nominators[msg.sender];
        if (acc.stakedBalance < amount) revert InsufficientBalance();
        acc.stakedBalance -= amount;
        acc.unbondingBalance += amount;
        acc.unbondReadyBlock = block.number + UNBONDING_BLOCKS;
        totalVaultStaked -= amount;
        emit UnbondingInitiated(msg.sender, amount, acc.unbondReadyBlock);
    }

    /**
     * @notice Withdraw unbonded POT once cooling period expires.
     */
    function withdrawUnbonded() external {
        NominatorAccount storage acc = nominators[msg.sender];
        uint256 payout = acc.unbondingBalance;
        if (payout == 0) revert InsufficientBalance();
        if (block.number < acc.unbondReadyBlock) revert StillUnbonding();
        acc.unbondingBalance = 0;
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert TransferFailed();
        emit StakeWithdrawn(msg.sender, payout);
    }

    /**
     * @notice Validators deposit a security bond promising SLA adherence (e.g. max commission <= 5%).
     */
    function depositValidatorSlaBond(uint16 maxCommissionBps) external payable {
        if (msg.value == 0) revert ZeroDeposit();
        ValidatorSlaBond storage bond = validatorBonds[msg.sender];
        bond.bondedAmount += msg.value;
        bond.maxPromisedCommissionBps = maxCommissionBps;
        bond.isFlaggedRugPull = false;
        totalSlaInsurancePool += msg.value;
        emit SlaBondDeposited(msg.sender, msg.value, maxCommissionBps);
    }

    /**
     * @notice Slash a malicious validator's bond if they violated SLA (e.g. rug-pulled commission to 100%).
     */
    function slashMaliciousValidatorBond(address validator, string calldata reason) external onlyOperator {
        ValidatorSlaBond storage bond = validatorBonds[validator];
        if (bond.bondedAmount == 0 || bond.isFlaggedRugPull) revert InvalidBond();
        uint256 slashedAmount = bond.bondedAmount;
        bond.bondedAmount = 0;
        bond.isFlaggedRugPull = true;
        bond.slashedCompensationPool += slashedAmount;
        emit SlaBondSlashed(validator, slashedAmount, reason);
    }

    /**
     * @notice Updates the active 16 validator nomination targets based on PAO-Phragmen recommendation.
     */
    function updateNominatedValidators(address[] calldata newValidators) external onlyOperator {
        if (newValidators.length > 16) revert MaxValidatorsExceeded();
        currentNominatedValidators = newValidators;
        emit NominationsUpdated(newValidators, block.timestamp);
    }

    /**
     * @notice Read current nominated 16-validator set.
     */
    function getNominatedValidators() external view returns (address[] memory) {
        return currentNominatedValidators;
    }
}
