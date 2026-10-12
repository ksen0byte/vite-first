use crate::codec::{decode_b64, strip_prefix, DecodeError};
use crate::{InstallationId, UnixTime, VendorPublicKey, PRODUCT_ID};
use ed25519_dalek::Signature;
use serde::{Deserialize, Serialize};
use std::fmt;

pub const LICENSE_PREFIX: &str = "CNS-LIC1:";
/// Domain separation: a signature over a license can never be replayed as anything else.
const SIGNATURE_CONTEXT: &[u8] = b"cns-test/license/v1\n";
const MAX_LICENSE_ID_LEN: usize = 64;
const MAX_LICENSEE_LEN: usize = 200;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LicenseId(String);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidLicenseId(pub String);

impl fmt::Display for InvalidLicenseId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "license id '{}' must be 1-{MAX_LICENSE_ID_LEN} of [A-Za-z0-9-]", self.0)
    }
}

impl std::error::Error for InvalidLicenseId {}

impl LicenseId {
    pub fn parse(text: &str) -> Result<Self, InvalidLicenseId> {
        let valid = !text.is_empty()
            && text.len() <= MAX_LICENSE_ID_LEN
            && text.chars().all(|c| c.is_ascii_alphanumeric() || c == '-');
        if valid {
            Ok(LicenseId(text.to_owned()))
        } else {
            Err(InvalidLicenseId(text.to_owned()))
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Human-readable name of the licensed person or organisation, shown in the app.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Licensee(String);

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidLicensee;

impl fmt::Display for InvalidLicensee {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "licensee must be 1-{MAX_LICENSEE_LEN} characters without control characters")
    }
}

impl std::error::Error for InvalidLicensee {}

impl Licensee {
    pub fn parse(text: &str) -> Result<Self, InvalidLicensee> {
        let trimmed = text.trim();
        let valid = !trimmed.is_empty()
            && trimmed.chars().count() <= MAX_LICENSEE_LEN
            && !trimmed.chars().any(char::is_control);
        if valid {
            Ok(Licensee(trimmed.to_owned()))
        } else {
            Err(InvalidLicensee)
        }
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Expiry {
    Never,
    /// The license stops being valid at this instant (exclusive).
    At(UnixTime),
}

/// The signed content of a license.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LicenseTerms {
    pub license_id: LicenseId,
    pub installation_id: InstallationId,
    pub licensee: Licensee,
    pub issued_at: UnixTime,
    pub expiry: Expiry,
}

/// A license whose signature, installation binding and validity window were all checked.
/// Only [`verify_license`] can construct one.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VerifiedLicense(LicenseTerms);

impl VerifiedLicense {
    pub fn terms(&self) -> &LicenseTerms {
        &self.0
    }
}

/// Why a license code does not unlock this installation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LicenseError {
    /// Not a license code at all, or damaged in transit.
    Malformed(DecodeError),
    /// Well-formed but not signed by the vendor key, or modified after signing.
    BadSignature,
    /// Authentic, but issued for another installation (e.g. copied from another computer).
    WrongInstallation { licensed: InstallationId },
    /// Authentic and bound to this installation, but past its expiry.
    Expired { at: UnixTime },
}

impl fmt::Display for LicenseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LicenseError::Malformed(e) => write!(f, "malformed license: {e}"),
            LicenseError::BadSignature => write!(f, "license signature is not valid"),
            LicenseError::WrongInstallation { licensed } => {
                write!(f, "license belongs to installation {licensed}")
            }
            LicenseError::Expired { at } => write!(f, "license expired at unix time {}", at.0),
        }
    }
}

impl std::error::Error for LicenseError {}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct LicenseWire {
    product: String,
    license_id: String,
    installation_id: String,
    licensee: String,
    issued_at: u64,
    expires_at: Option<u64>,
}

struct SignedLicense {
    payload: Vec<u8>,
    signature: Signature,
}

fn signed_message(payload: &[u8]) -> Vec<u8> {
    [SIGNATURE_CONTEXT, payload].concat()
}

fn decode_signed(code: &str) -> Result<SignedLicense, DecodeError> {
    let body = strip_prefix(code, LICENSE_PREFIX)?;
    let (payload_b64, signature_b64) = body
        .split_once('.')
        .ok_or_else(|| DecodeError::Encoding("missing signature part".into()))?;
    let payload = decode_b64(payload_b64)?;
    let signature_bytes: [u8; 64] = decode_b64(signature_b64)?
        .try_into()
        .map_err(|_| DecodeError::Encoding("signature must be 64 bytes".into()))?;
    Ok(SignedLicense { payload, signature: Signature::from_bytes(&signature_bytes) })
}

fn parse_terms(payload: &[u8]) -> Result<LicenseTerms, DecodeError> {
    let invalid = |e: &dyn fmt::Display| DecodeError::Payload(e.to_string());
    let wire: LicenseWire = serde_json::from_slice(payload).map_err(|e| invalid(&e))?;
    if wire.product != PRODUCT_ID {
        return Err(DecodeError::Payload(format!("license is for product '{}'", wire.product)));
    }
    Ok(LicenseTerms {
        license_id: LicenseId::parse(&wire.license_id).map_err(|e| invalid(&e))?,
        installation_id: InstallationId::parse(&wire.installation_id).map_err(|e| invalid(&e))?,
        licensee: Licensee::parse(&wire.licensee).map_err(|e| invalid(&e))?,
        issued_at: UnixTime(wire.issued_at),
        expiry: wire.expires_at.map_or(Expiry::Never, |at| Expiry::At(UnixTime(at))),
    })
}

/// Checks, in order: format, vendor signature, payload, installation binding, expiry.
///
/// The signature is checked before the payload is interpreted, so any tampering is
/// reported as [`LicenseError::BadSignature`] rather than as a content problem.
pub fn verify_license(
    code: &str,
    key: &VendorPublicKey,
    installation: &InstallationId,
    now: UnixTime,
) -> Result<VerifiedLicense, LicenseError> {
    let signed = decode_signed(code).map_err(LicenseError::Malformed)?;
    key.0
        .verify_strict(&signed_message(&signed.payload), &signed.signature)
        .map_err(|_| LicenseError::BadSignature)?;
    let terms = parse_terms(&signed.payload).map_err(LicenseError::Malformed)?;
    if &terms.installation_id != installation {
        return Err(LicenseError::WrongInstallation { licensed: terms.installation_id });
    }
    match terms.expiry {
        Expiry::At(at) if now >= at => Err(LicenseError::Expired { at }),
        Expiry::At(_) | Expiry::Never => Ok(VerifiedLicense(terms)),
    }
}

/// Signs `terms` into a license code. Vendor-side only.
#[cfg(feature = "issuer")]
pub fn issue_license(terms: &LicenseTerms, key: &crate::VendorSigningKey) -> String {
    use crate::codec::encode_b64;
    use ed25519_dalek::Signer;

    let wire = LicenseWire {
        product: PRODUCT_ID.to_owned(),
        license_id: terms.license_id.as_str().to_owned(),
        installation_id: terms.installation_id.as_str().to_owned(),
        licensee: terms.licensee.as_str().to_owned(),
        issued_at: terms.issued_at.0,
        expires_at: match terms.expiry {
            Expiry::Never => None,
            Expiry::At(at) => Some(at.0),
        },
    };
    let payload = serde_json::to_vec(&wire).expect("license wire format is always serializable");
    let signature = key.0.sign(&signed_message(&payload));
    format!("{LICENSE_PREFIX}{}.{}", encode_b64(&payload), encode_b64(&signature.to_bytes()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::codec::encode_b64;
    use crate::VendorSigningKey;

    fn installation(id: &str) -> InstallationId {
        InstallationId::parse(id).unwrap()
    }

    fn terms(expiry: Expiry) -> LicenseTerms {
        LicenseTerms {
            license_id: LicenseId::parse("LIC-0001").unwrap(),
            installation_id: installation("3F2A-9C01-77BE-0D4E-A1C5"),
            licensee: Licensee::parse("Test Clinic").unwrap(),
            issued_at: UnixTime(1_000),
            expiry,
        }
    }

    fn vendor() -> VendorSigningKey {
        VendorSigningKey::from_seed([1; 32])
    }

    #[test]
    fn accepts_a_genuine_license_for_this_installation() {
        let code = issue_license(&terms(Expiry::Never), &vendor());
        let verified = verify_license(
            &code,
            &vendor().public_key(),
            &installation("3F2A-9C01-77BE-0D4E-A1C5"),
            UnixTime(2_000),
        )
        .unwrap();
        assert_eq!(verified.terms(), &terms(Expiry::Never));
    }

    #[test]
    fn rejects_a_license_copied_from_another_installation() {
        let code = issue_license(&terms(Expiry::Never), &vendor());
        let result = verify_license(
            &code,
            &vendor().public_key(),
            &installation("0000-0000-0000-0000-0000"),
            UnixTime(2_000),
        );
        assert_eq!(
            result,
            Err(LicenseError::WrongInstallation { licensed: installation("3F2A-9C01-77BE-0D4E-A1C5") })
        );
    }

    #[test]
    fn rejects_licenses_signed_by_someone_else() {
        let forged = issue_license(&terms(Expiry::Never), &VendorSigningKey::from_seed([2; 32]));
        let result = verify_license(
            &forged,
            &vendor().public_key(),
            &installation("3F2A-9C01-77BE-0D4E-A1C5"),
            UnixTime(2_000),
        );
        assert_eq!(result, Err(LicenseError::BadSignature));
    }

    #[test]
    fn rejects_a_tampered_payload() {
        let code = issue_license(&terms(Expiry::Never), &vendor());
        let (payload_b64, signature_b64) =
            code.strip_prefix(LICENSE_PREFIX).unwrap().split_once('.').unwrap();
        let original = String::from_utf8(decode_b64(payload_b64).unwrap()).unwrap();
        let rebound = original.replace("3F2A-9C01-77BE-0D4E-A1C5", "0000-0000-0000-0000-0000");
        let tampered = format!("{LICENSE_PREFIX}{}.{signature_b64}", encode_b64(rebound.as_bytes()));
        let result = verify_license(
            &tampered,
            &vendor().public_key(),
            &installation("0000-0000-0000-0000-0000"),
            UnixTime(2_000),
        );
        assert_eq!(result, Err(LicenseError::BadSignature));
    }

    #[test]
    fn enforces_expiry_as_an_exclusive_bound() {
        let code = issue_license(&terms(Expiry::At(UnixTime(5_000))), &vendor());
        let check = |now| {
            verify_license(&code, &vendor().public_key(), &installation("3F2A-9C01-77BE-0D4E-A1C5"), UnixTime(now))
        };
        assert!(check(4_999).is_ok());
        assert_eq!(check(5_000), Err(LicenseError::Expired { at: UnixTime(5_000) }));
    }

    #[test]
    fn reports_garbage_as_malformed() {
        let check = |code: &str| {
            verify_license(code, &vendor().public_key(), &installation("3F2A-9C01-77BE-0D4E-A1C5"), UnixTime(0))
        };
        assert_eq!(check(""), Err(LicenseError::Malformed(DecodeError::UnknownFormat)));
        assert!(matches!(check("CNS-LIC1:abc"), Err(LicenseError::Malformed(DecodeError::Encoding(_)))));
        assert!(matches!(check("CNS-LIC1:abc.def"), Err(LicenseError::Malformed(DecodeError::Encoding(_)))));
    }

    #[test]
    fn survives_line_wrapping() {
        let code = issue_license(&terms(Expiry::Never), &vendor());
        let (head, tail) = code.split_at(40);
        let wrapped = format!("\r\n{head}\r\n  {tail}\n");
        assert!(verify_license(
            &wrapped,
            &vendor().public_key(),
            &installation("3F2A-9C01-77BE-0D4E-A1C5"),
            UnixTime(0)
        )
        .is_ok());
    }

    #[test]
    fn validates_identifiers() {
        assert!(LicenseId::parse("").is_err());
        assert!(LicenseId::parse("has space").is_err());
        assert!(Licensee::parse("  ").is_err());
        assert!(Licensee::parse("line\nbreak").is_err());
        assert_eq!(Licensee::parse("  Clinic  ").unwrap().as_str(), "Clinic");
    }
}
