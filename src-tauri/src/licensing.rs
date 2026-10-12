//! Host-side licensing adapter: machine identity, license file storage and the IPC contract.
//!
//! All decisions live in the pure `cns_licensing` crate; this module only performs IO and
//! maps domain values onto serializable DTOs consumed by `src/licensing/` in the frontend.

use cns_licensing::{
    verify_license, ActivationRequest, DecodeError, Expiry, InstallSeed, InstallationId,
    LicenseError, MachineFingerprint, UnixTime, VendorPublicKey, VerifiedLicense,
    INSTALL_SEED_LEN,
};
use serde::Serialize;
use std::fs;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

/// Generate with `cns-license keygen`; only the public half ever ships with the app.
const VENDOR_PUBLIC_KEY: &str = include_str!("../keys/license-public.key");
const SEED_FILE: &str = "installation.seed";
const LICENSE_FILE: &str = "license.lic";

/// Identity of this installation, resolved once at startup.
enum Identity {
    Ready { installation_id: InstallationId, data_dir: PathBuf },
    Unavailable { reason: String },
}

pub struct Licensing {
    identity: Identity,
    key: VendorPublicKey,
    app_version: String,
}

impl Licensing {
    /// Production wiring: embedded vendor key and the OS machine identifier.
    pub fn initialize(data_dir: Result<PathBuf, String>, app_version: String) -> Self {
        let key = VendorPublicKey::parse(VENDOR_PUBLIC_KEY)
            .expect("embedded vendor public key is invalid; regenerate keys/license-public.key");
        Licensing::new(key, read_machine(), data_dir, app_version)
    }

    fn new(
        key: VendorPublicKey,
        machine: Result<MachineFingerprint, String>,
        data_dir: Result<PathBuf, String>,
        app_version: String,
    ) -> Self {
        let identity = machine
            .and_then(|machine| {
                let dir = data_dir?;
                let seed = load_or_create_seed(&dir)?;
                Ok(Identity::Ready { installation_id: InstallationId::derive(&machine, &seed), data_dir: dir })
            })
            .unwrap_or_else(|reason| Identity::Unavailable { reason });
        Licensing { identity, key, app_version }
    }

    pub fn status(&self) -> LicenseStatusDto {
        let (installation_id, data_dir) = match &self.identity {
            Identity::Ready { installation_id, data_dir } => (installation_id, data_dir),
            Identity::Unavailable { reason } => {
                return LicenseStatusDto::Unavailable { reason: reason.clone() }
            }
        };
        let now = match now() {
            Ok(now) => now,
            Err(reason) => return LicenseStatusDto::Unavailable { reason },
        };
        let activation_request = ActivationRequest {
            installation_id: installation_id.clone(),
            app_version: self.app_version.clone(),
            created_at: now,
        }
        .encode();

        match read_optional(&data_dir.join(LICENSE_FILE)) {
            Err(reason) => LicenseStatusDto::Unavailable { reason },
            Ok(StoredLicense::Absent) => LicenseStatusDto::Unlicensed {
                installation_id: installation_id.to_string(),
                activation_request,
            },
            Ok(StoredLicense::Present(code)) => {
                match verify_license(&code, &self.key, installation_id, now) {
                    Ok(license) => LicenseStatusDto::Active {
                        installation_id: installation_id.to_string(),
                        license: LicenseDto::from(&license),
                    },
                    Err(error) => LicenseStatusDto::Invalid {
                        installation_id: installation_id.to_string(),
                        activation_request,
                        rejection: RejectionDto::from(error),
                    },
                }
            }
        }
    }

    /// Verifies `code` and, only if it is valid for this installation, stores it.
    /// A rejected code never replaces the currently stored license.
    pub fn import(&self, code: &str) -> ImportOutcomeDto {
        let (installation_id, data_dir) = match &self.identity {
            Identity::Ready { installation_id, data_dir } => (installation_id, data_dir),
            Identity::Unavailable { reason } => {
                return ImportOutcomeDto::Failed { reason: reason.clone() }
            }
        };
        let now = match now() {
            Ok(now) => now,
            Err(reason) => return ImportOutcomeDto::Failed { reason },
        };
        match verify_license(code, &self.key, installation_id, now) {
            Err(error) => ImportOutcomeDto::Rejected { rejection: RejectionDto::from(error) },
            Ok(license) => match write_atomically(&data_dir.join(LICENSE_FILE), code.trim()) {
                Ok(()) => ImportOutcomeDto::Activated { license: LicenseDto::from(&license) },
                Err(reason) => ImportOutcomeDto::Failed { reason },
            },
        }
    }
}

fn read_machine() -> Result<MachineFingerprint, String> {
    let raw = machine_uid::get().map_err(|e| format!("cannot read the machine identifier: {e}"))?;
    MachineFingerprint::new(&raw).map_err(|e| e.to_string())
}

/// The seed is created on first launch. A damaged seed is reported rather than silently
/// replaced, because replacing it changes the installation id and voids the license.
fn load_or_create_seed(data_dir: &Path) -> Result<InstallSeed, String> {
    let path = data_dir.join(SEED_FILE);
    match read_optional(&path)? {
        StoredLicense::Present(text) => InstallSeed::parse_hex(&text)
            .map_err(|e| format!("{} is damaged ({e}); delete it to re-activate", path.display())),
        StoredLicense::Absent => {
            let mut bytes = [0u8; INSTALL_SEED_LEN];
            getrandom::fill(&mut bytes).map_err(|e| format!("system randomness unavailable: {e}"))?;
            let seed = InstallSeed::from_bytes(bytes);
            write_atomically(&path, &seed.to_hex())?;
            Ok(seed)
        }
    }
}

enum StoredLicense {
    Absent,
    Present(String),
}

fn read_optional(path: &Path) -> Result<StoredLicense, String> {
    match fs::read_to_string(path) {
        Ok(text) => Ok(StoredLicense::Present(text)),
        Err(e) if e.kind() == ErrorKind::NotFound => Ok(StoredLicense::Absent),
        Err(e) => Err(format!("cannot read {}: {e}", path.display())),
    }
}

fn write_atomically(path: &Path, contents: &str) -> Result<(), String> {
    let describe = |e: std::io::Error| format!("cannot write {}: {e}", path.display());
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(describe)?;
    }
    let temp = path.with_extension("tmp");
    fs::write(&temp, contents).map_err(describe)?;
    fs::rename(&temp, path).map_err(describe)
}

fn now() -> Result<UnixTime, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| UnixTime(d.as_secs()))
        .map_err(|_| "system clock is set before 1970".to_owned())
}

// ---- IPC contract (mirrored by src/licensing/ipc.ts) ----

#[derive(Serialize)]
#[serde(tag = "_tag", rename_all_fields = "camelCase")]
pub enum LicenseStatusDto {
    Unavailable { reason: String },
    Unlicensed { installation_id: String, activation_request: String },
    Active { installation_id: String, license: LicenseDto },
    Invalid { installation_id: String, activation_request: String, rejection: RejectionDto },
}

#[derive(Serialize)]
#[serde(tag = "_tag", rename_all_fields = "camelCase")]
pub enum ImportOutcomeDto {
    Activated { license: LicenseDto },
    Rejected { rejection: RejectionDto },
    Failed { reason: String },
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseDto {
    license_id: String,
    licensee: String,
    issued_at: u64,
    expiry: ExpiryDto,
}

#[derive(Serialize)]
#[serde(tag = "_tag", rename_all_fields = "camelCase")]
pub enum ExpiryDto {
    Never,
    At { at: u64 },
}

#[derive(Serialize)]
#[serde(tag = "_tag", rename_all_fields = "camelCase")]
pub enum RejectionDto {
    Malformed { detail: String },
    BadSignature,
    WrongInstallation { licensed_installation_id: String },
    Expired { expired_at: u64 },
}

impl From<&VerifiedLicense> for LicenseDto {
    fn from(license: &VerifiedLicense) -> Self {
        let terms = license.terms();
        LicenseDto {
            license_id: terms.license_id.as_str().to_owned(),
            licensee: terms.licensee.as_str().to_owned(),
            issued_at: terms.issued_at.0,
            expiry: match terms.expiry {
                Expiry::Never => ExpiryDto::Never,
                Expiry::At(at) => ExpiryDto::At { at: at.0 },
            },
        }
    }
}

impl From<LicenseError> for RejectionDto {
    fn from(error: LicenseError) -> Self {
        match error {
            LicenseError::Malformed(DecodeError::UnknownFormat) => {
                RejectionDto::Malformed { detail: "not a CNS Test license".to_owned() }
            }
            LicenseError::Malformed(e) => RejectionDto::Malformed { detail: e.to_string() },
            LicenseError::BadSignature => RejectionDto::BadSignature,
            LicenseError::WrongInstallation { licensed } => {
                RejectionDto::WrongInstallation { licensed_installation_id: licensed.to_string() }
            }
            LicenseError::Expired { at } => RejectionDto::Expired { expired_at: at.0 },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cns_licensing::{issue_license, LicenseId, LicenseTerms, Licensee, VendorSigningKey};

    struct TempDir(PathBuf);

    impl TempDir {
        fn new() -> Self {
            let mut suffix = [0u8; 8];
            getrandom::fill(&mut suffix).unwrap();
            let name: String = suffix.iter().map(|b| format!("{b:02x}")).collect();
            TempDir(std::env::temp_dir().join(format!("cns-licensing-test-{name}")))
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn vendor() -> VendorSigningKey {
        VendorSigningKey::from_seed([9; 32])
    }

    fn host(dir: &TempDir, machine: &str) -> Licensing {
        Licensing::new(
            vendor().public_key(),
            Ok(MachineFingerprint::new(machine).unwrap()),
            Ok(dir.0.clone()),
            "0.1.0".into(),
        )
    }

    fn license_for(status: &LicenseStatusDto) -> String {
        let LicenseStatusDto::Unlicensed { activation_request, .. } = status else {
            panic!("expected an unlicensed installation");
        };
        let request = ActivationRequest::decode(activation_request).unwrap();
        let terms = LicenseTerms {
            license_id: LicenseId::parse("L-TEST").unwrap(),
            installation_id: request.installation_id,
            licensee: Licensee::parse("Test Clinic").unwrap(),
            issued_at: UnixTime(0),
            expiry: Expiry::Never,
        };
        issue_license(&terms, &vendor())
    }

    #[test]
    fn embedded_public_key_is_valid() {
        assert!(VendorPublicKey::parse(VENDOR_PUBLIC_KEY).is_ok());
    }

    #[test]
    fn full_activation_flow_survives_restart() {
        let dir = TempDir::new();
        let first_run = host(&dir, "machine-a");
        let code = license_for(&first_run.status());

        assert!(matches!(first_run.import("garbage"), ImportOutcomeDto::Rejected { .. }));
        assert!(!dir.0.join(LICENSE_FILE).exists(), "rejected codes must not be stored");

        assert!(matches!(first_run.import(&code), ImportOutcomeDto::Activated { .. }));
        assert!(matches!(first_run.status(), LicenseStatusDto::Active { .. }));
        assert!(matches!(host(&dir, "machine-a").status(), LicenseStatusDto::Active { .. }));
    }

    #[test]
    fn copied_app_data_does_not_unlock_another_machine() {
        let dir = TempDir::new();
        let original = host(&dir, "machine-a");
        let code = license_for(&original.status());
        assert!(matches!(original.import(&code), ImportOutcomeDto::Activated { .. }));

        // Same seed and license file, different machine: as if the folder was copied.
        let status = host(&dir, "machine-b").status();
        assert!(matches!(
            status,
            LicenseStatusDto::Invalid { rejection: RejectionDto::WrongInstallation { .. }, .. }
        ));
    }

    #[test]
    fn each_installation_gets_its_own_identity() {
        let (a, b) = (TempDir::new(), TempDir::new());
        let code_for_a = license_for(&host(&a, "machine-a").status());
        assert!(matches!(
            host(&b, "machine-a").import(&code_for_a),
            ImportOutcomeDto::Rejected { rejection: RejectionDto::WrongInstallation { .. } }
        ));
    }

    #[test]
    fn damaged_seed_is_reported_not_replaced() {
        let dir = TempDir::new();
        fs::create_dir_all(&dir.0).unwrap();
        fs::write(dir.0.join(SEED_FILE), "not hex").unwrap();
        assert!(matches!(host(&dir, "machine-a").status(), LicenseStatusDto::Unavailable { .. }));
        assert_eq!(fs::read_to_string(dir.0.join(SEED_FILE)).unwrap(), "not hex");
    }
}
