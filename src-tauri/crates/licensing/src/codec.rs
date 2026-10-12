use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use std::fmt;

/// Why a textual code (request, license, key) could not be decoded.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DecodeError {
    /// The code does not start with the expected format prefix.
    UnknownFormat,
    /// The code has the right prefix but its structure or base64 is broken.
    Encoding(String),
    /// The decoded content is structurally valid but its fields are not.
    Payload(String),
}

impl fmt::Display for DecodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DecodeError::UnknownFormat => write!(f, "unrecognised format"),
            DecodeError::Encoding(detail) => write!(f, "broken encoding: {detail}"),
            DecodeError::Payload(detail) => write!(f, "invalid content: {detail}"),
        }
    }
}

impl std::error::Error for DecodeError {}

pub(crate) fn encode_b64(bytes: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(bytes)
}

pub(crate) fn decode_b64(text: &str) -> Result<Vec<u8>, DecodeError> {
    URL_SAFE_NO_PAD
        .decode(text)
        .map_err(|e| DecodeError::Encoding(e.to_string()))
}

/// Strips the format prefix after removing all whitespace, so codes survive
/// e-mail line wrapping and copy/paste padding.
pub(crate) fn strip_prefix(code: &str, prefix: &str) -> Result<String, DecodeError> {
    let compact: String = code.chars().filter(|c| !c.is_whitespace()).collect();
    compact
        .strip_prefix(prefix)
        .map(str::to_owned)
        .ok_or(DecodeError::UnknownFormat)
}

pub(crate) fn hex_upper(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02X}")).collect()
}
