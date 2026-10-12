use crate::codec::{decode_b64, encode_b64, strip_prefix, DecodeError};
use ed25519_dalek::VerifyingKey;
use std::fmt;

const PUBLIC_PREFIX: &str = "CNS-PUB1:";
#[cfg(feature = "issuer")]
const SIGNING_PREFIX: &str = "CNS-SIGN1:";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct KeyError(pub DecodeError);

impl fmt::Display for KeyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid key: {}", self.0)
    }
}

impl std::error::Error for KeyError {}

fn decode_key_bytes(text: &str, prefix: &str) -> Result<[u8; 32], KeyError> {
    let body = strip_prefix(text, prefix).map_err(KeyError)?;
    decode_b64(&body)
        .map_err(KeyError)?
        .try_into()
        .map_err(|_| KeyError(DecodeError::Encoding("expected 32 key bytes".into())))
}

/// The vendor's Ed25519 public key, compiled into the desktop app.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct VendorPublicKey(pub(crate) VerifyingKey);

impl VendorPublicKey {
    pub fn parse(text: &str) -> Result<Self, KeyError> {
        let bytes = decode_key_bytes(text, PUBLIC_PREFIX)?;
        VerifyingKey::from_bytes(&bytes)
            .map(VendorPublicKey)
            .map_err(|_| KeyError(DecodeError::Payload("not a valid Ed25519 point".into())))
    }

    pub fn encode(&self) -> String {
        format!("{PUBLIC_PREFIX}{}", encode_b64(self.0.as_bytes()))
    }
}

/// The vendor's Ed25519 signing key. Only the vendor CLI ever holds one.
#[cfg(feature = "issuer")]
pub struct VendorSigningKey(pub(crate) ed25519_dalek::SigningKey);

#[cfg(feature = "issuer")]
impl VendorSigningKey {
    /// Builds a key from 32 bytes of secure randomness supplied by the caller.
    pub fn from_seed(seed: [u8; 32]) -> Self {
        VendorSigningKey(ed25519_dalek::SigningKey::from_bytes(&seed))
    }

    pub fn parse(text: &str) -> Result<Self, KeyError> {
        decode_key_bytes(text, SIGNING_PREFIX).map(Self::from_seed)
    }

    pub fn encode(&self) -> String {
        format!("{SIGNING_PREFIX}{}", encode_b64(&self.0.to_bytes()))
    }

    pub fn public_key(&self) -> VendorPublicKey {
        VendorPublicKey(self.0.verifying_key())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keys_round_trip_and_are_not_interchangeable() {
        let signing = VendorSigningKey::from_seed([42; 32]);
        let public = signing.public_key();
        assert_eq!(VendorPublicKey::parse(&public.encode()), Ok(public.clone()));
        assert_eq!(VendorSigningKey::parse(&signing.encode()).unwrap().public_key(), public);
        assert!(VendorPublicKey::parse(&signing.encode()).is_err());
        assert!(VendorSigningKey::parse(&public.encode()).is_err());
    }
}
