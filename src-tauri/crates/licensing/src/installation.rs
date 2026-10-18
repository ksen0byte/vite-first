use crate::codec::hex_upper;
use sha2::{Digest, Sha256};
use std::fmt;

pub const INSTALL_SEED_LEN: usize = 16;
const ID_BYTES: usize = 10;
const ID_GROUP: usize = 4;
const DERIVATION_CONTEXT: &[u8] = b"cns-test/installation/v1\n";

/// Random secret generated once per installation and persisted by the host.
///
/// Mixing it into the [`InstallationId`] gives every installation its own identity,
/// even several installations on the same machine.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub struct InstallSeed([u8; INSTALL_SEED_LEN]);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidSeed;

impl fmt::Display for InvalidSeed {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "installation seed must be {} hex characters", INSTALL_SEED_LEN * 2)
    }
}

impl std::error::Error for InvalidSeed {}

impl InstallSeed {
    pub fn from_bytes(bytes: [u8; INSTALL_SEED_LEN]) -> Self {
        InstallSeed(bytes)
    }

    pub fn to_hex(&self) -> String {
        hex_upper(&self.0)
    }

    pub fn parse_hex(text: &str) -> Result<Self, InvalidSeed> {
        let text = text.trim();
        if text.len() != INSTALL_SEED_LEN * 2 || !text.is_ascii() {
            return Err(InvalidSeed);
        }
        let mut bytes = [0u8; INSTALL_SEED_LEN];
        for (i, byte) in bytes.iter_mut().enumerate() {
            *byte = u8::from_str_radix(&text[i * 2..i * 2 + 2], 16).map_err(|_| InvalidSeed)?;
        }
        Ok(InstallSeed(bytes))
    }
}

/// Stable OS-level machine identifier (e.g. Windows `MachineGuid`, `/etc/machine-id`).
///
/// It is only ever hashed into the [`InstallationId`]; the raw value never leaves the machine.
#[derive(Clone, PartialEq, Eq)]
pub struct MachineFingerprint(String);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmptyMachineFingerprint;

impl fmt::Display for EmptyMachineFingerprint {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "the operating system reported an empty machine identifier")
    }
}

impl std::error::Error for EmptyMachineFingerprint {}

impl MachineFingerprint {
    pub fn new(raw: &str) -> Result<Self, EmptyMachineFingerprint> {
        let normalized = raw.trim().to_ascii_lowercase();
        if normalized.is_empty() {
            Err(EmptyMachineFingerprint)
        } else {
            Ok(MachineFingerprint(normalized))
        }
    }
}

/// Public identity of one installation on one machine, e.g. `3F2A-9C01-77BE-0D4E-A1C5`.
///
/// Licenses are bound to this value. Copying a license (or the whole app data folder)
/// to another machine yields a different id, because the machine fingerprint differs.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct InstallationId(String);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidInstallationId(pub String);

impl fmt::Display for InvalidInstallationId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "'{}' is not an installation id (expected XXXX-XXXX-XXXX-XXXX-XXXX)", self.0)
    }
}

impl std::error::Error for InvalidInstallationId {}

impl InstallationId {
    pub fn derive(machine: &MachineFingerprint, seed: &InstallSeed) -> Self {
        let digest = Sha256::new()
            .chain_update(DERIVATION_CONTEXT)
            .chain_update(machine.0.as_bytes())
            .chain_update(b"\n")
            .chain_update(seed.0)
            .finalize();
        let hex = hex_upper(&digest[..ID_BYTES]);
        let groups: Vec<&str> = (0..hex.len())
            .step_by(ID_GROUP)
            .map(|i| &hex[i..i + ID_GROUP])
            .collect();
        InstallationId(groups.join("-"))
    }

    pub fn parse(text: &str) -> Result<Self, InvalidInstallationId> {
        let normalized = text.trim().to_ascii_uppercase();
        let groups: Vec<&str> = normalized.split('-').collect();
        let well_formed = groups.len() == ID_BYTES * 2 / ID_GROUP
            && groups
                .iter()
                .all(|g| g.len() == ID_GROUP && g.chars().all(|c| c.is_ascii_hexdigit()));
        if well_formed {
            Ok(InstallationId(normalized))
        } else {
            Err(InvalidInstallationId(text.to_owned()))
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for InstallationId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn machine(raw: &str) -> MachineFingerprint {
        MachineFingerprint::new(raw).unwrap()
    }

    #[test]
    fn derivation_is_deterministic_and_well_formed() {
        let seed = InstallSeed::from_bytes([7; INSTALL_SEED_LEN]);
        let a = InstallationId::derive(&machine("machine-a"), &seed);
        let b = InstallationId::derive(&machine(" MACHINE-A \n"), &seed);
        assert_eq!(a, b);
        assert_eq!(InstallationId::parse(a.as_str()), Ok(a.clone()));
        assert_eq!(a.as_str().len(), 24);
    }

    #[test]
    fn machine_and_seed_both_change_the_identity() {
        let seed = InstallSeed::from_bytes([7; INSTALL_SEED_LEN]);
        let other_seed = InstallSeed::from_bytes([8; INSTALL_SEED_LEN]);
        let base = InstallationId::derive(&machine("machine-a"), &seed);
        assert_ne!(base, InstallationId::derive(&machine("machine-b"), &seed));
        assert_ne!(base, InstallationId::derive(&machine("machine-a"), &other_seed));
    }

    #[test]
    fn parse_normalizes_case_and_rejects_garbage() {
        assert_eq!(
            InstallationId::parse(" 3f2a-9c01-77be-0d4e-a1c5 ").unwrap().as_str(),
            "3F2A-9C01-77BE-0D4E-A1C5"
        );
        for bad in ["", "3F2A-9C01-77BE-0D4E", "3F2A-9C01-77BE-0D4E-A1CZ", "3F2A9C0177BE0D4EA1C5"] {
            assert!(InstallationId::parse(bad).is_err(), "{bad} should be rejected");
        }
    }

    #[test]
    fn seed_hex_round_trip() {
        let seed = InstallSeed::from_bytes([0xAB; INSTALL_SEED_LEN]);
        assert_eq!(InstallSeed::parse_hex(&seed.to_hex()), Ok(seed));
        assert!(InstallSeed::parse_hex("zz").is_err());
        assert!(MachineFingerprint::new("   ").is_err());
    }
}
