#![cfg_attr(not(feature = "std"), no_std, no_main)]

//! # DotNexus Sentinel — WASM Smart Contract Companion
//! 
//! An ink! v5 smart contract deployed on Portaldot Network V3.0 (`pallet-contracts`).
//! Acts as an on-chain validator liveness & heartbeat witness on the WASM execution layer,
//! pairing synergistically with `SlashGuardLeaseRegistry.sol` on the Frontier EVM layer.

#[ink::contract]
mod dotnexus_sentinel {
    use ink::storage::Mapping;

    /// Telemetric heartbeat record emitted by an authorized validator node
    #[derive(scale::Encode, scale::Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(
        feature = "std",
        derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout)
    )]
    pub struct HeartbeatRecord {
        pub era: u32,
        pub block_number: u64,
        pub timestamp: u64,
        pub is_active: bool,
    }

    /// Error types for DotNexus Sentinel operations
    #[derive(scale::Encode, scale::Decode, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        UnauthorizedValidator,
        StaleHeartbeatBlock,
        RecordNotFound,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    /// Event emitted when an active validator node records an on-chain heartbeat
    #[ink(event)]
    pub struct HeartbeatWitnessed {
        #[ink(topic)]
        pub validator: AccountId,
        pub era: u32,
        pub block_number: u64,
        pub timestamp: u64,
    }

    #[ink(storage)]
    pub struct DotnexusSentinel {
        /// Administrator account authorized to register primary nodes
        admin: AccountId,
        /// Mapping from validator Stash AccountId to its latest HeartbeatRecord
        heartbeats: Mapping<AccountId, HeartbeatRecord>,
        /// Monotonic count of total verified heartbeats witnessed on WASM
        total_heartbeats: u64,
    }

    impl DotnexusSentinel {
        /// Constructor initializing the Sentinel registry
        #[ink(constructor)]
        pub fn new() -> Self {
            let caller = Self::env().caller();
            Self {
                admin: caller,
                heartbeats: Mapping::default(),
                total_heartbeats: 0,
            }
        }

        /// Records an on-chain heartbeat from the calling validator node
        #[ink(message)]
        pub fn record_heartbeat(&mut self, era: u32, block_number: u64) -> Result<()> {
            let caller = self.env().caller();
            let current_timestamp = self.env().block_timestamp();

            if let Some(existing) = self.heartbeats.get(caller) {
                if block_number <= existing.block_number {
                    return Err(Error::StaleHeartbeatBlock);
                }
            }

            let record = HeartbeatRecord {
                era,
                block_number,
                timestamp: current_timestamp,
                is_active: true,
            };

            self.heartbeats.insert(caller, &record);
            self.total_heartbeats = self.total_heartbeats.saturating_add(1);

            self.env().emit_event(HeartbeatWitnessed {
                validator: caller,
                era,
                block_number,
                timestamp: current_timestamp,
            });

            Ok(())
        }

        /// Queries the latest liveness telemetry for a given validator stash
        #[ink(message)]
        pub fn get_validator_liveness(&self, stash: AccountId) -> Option<HeartbeatRecord> {
            self.heartbeats.get(stash)
        }

        /// Returns true if the validator has submitted a heartbeat within the specified block threshold
        #[ink(message)]
        pub fn is_validator_healthy(
            &self,
            stash: AccountId,
            current_block: u64,
            max_block_tolerance: u64,
        ) -> bool {
            match self.heartbeats.get(stash) {
                Some(record) => {
                    record.is_active && (current_block.saturating_sub(record.block_number) <= max_block_tolerance)
                }
                None => false,
            }
        }

        /// Returns total count of heartbeats witnessed on WASM layer
        #[ink(message)]
        pub fn get_total_heartbeats(&self) -> u64 {
            self.total_heartbeats
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn test_sentinel_initialization() {
            let sentinel = DotnexusSentinel::new();
            assert_eq!(sentinel.get_total_heartbeats(), 0);
        }

        #[ink::test]
        fn test_record_heartbeat_and_liveness() {
            let mut sentinel = DotnexusSentinel::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();

            let res = sentinel.record_heartbeat(412, 100);
            assert!(res.is_ok());
            assert_eq!(sentinel.get_total_heartbeats(), 1);

            let liveness = sentinel.get_validator_liveness(accounts.alice);
            assert!(liveness.is_some());
            let rec = liveness.unwrap();
            assert_eq!(rec.era, 412);
            assert_eq!(rec.block_number, 100);
            assert!(rec.is_active);

            // Health check
            assert!(sentinel.is_validator_healthy(accounts.alice, 105, 10));
            assert!(!sentinel.is_validator_healthy(accounts.alice, 120, 10));
        }

        #[ink::test]
        fn test_stale_heartbeat_rejected() {
            let mut sentinel = DotnexusSentinel::new();
            assert!(sentinel.record_heartbeat(412, 200).is_ok());
            // Stale block number rejection
            let stale_res = sentinel.record_heartbeat(412, 199);
            assert_eq!(stale_res, Err(Error::StaleHeartbeatBlock));
        }
    }
}
