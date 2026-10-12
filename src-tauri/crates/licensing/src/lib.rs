//! Offline licensing domain for CNS Test.
//!
//! Flow: the desktop app derives an [`InstallationId`] and exports it as an
//! [`ActivationRequest`] code; the vendor signs [`LicenseTerms`] bound to that id;
//! the app checks the resulting license code with [`verify_license`] against the
//! embedded [`VendorPublicKey`].
//!
//! This crate is pure: callers supply the machine fingerprint, randomness, keys and
//! the current time. All IO lives in the Tauri host and the vendor CLI.

mod codec;
mod installation;
mod keys;
mod license;
mod request;
mod time;

pub use codec::DecodeError;
pub use installation::{
    InstallSeed, InstallationId, InvalidInstallationId, InvalidSeed, MachineFingerprint,
    EmptyMachineFingerprint, INSTALL_SEED_LEN,
};
pub use keys::{KeyError, VendorPublicKey};
#[cfg(feature = "issuer")]
pub use keys::VendorSigningKey;
pub use license::{
    verify_license, Expiry, InvalidLicenseId, InvalidLicensee, LicenseError, LicenseId,
    LicenseTerms, Licensee, VerifiedLicense, LICENSE_PREFIX,
};
#[cfg(feature = "issuer")]
pub use license::issue_license;
pub use request::{ActivationRequest, REQUEST_PREFIX};
pub use time::{CalendarDate, InvalidDate, UnixTime};

/// Product identifier embedded in every request and license, so codes for other
/// products signed with the same key can never unlock this one.
pub const PRODUCT_ID: &str = "cns-test";
