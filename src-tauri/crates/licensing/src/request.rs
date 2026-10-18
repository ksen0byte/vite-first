use crate::codec::{decode_b64, encode_b64, strip_prefix, DecodeError};
use crate::{InstallationId, UnixTime, PRODUCT_ID};
use serde::{Deserialize, Serialize};

pub const REQUEST_PREFIX: &str = "CNS-REQ1:";

/// What a customer sends to the vendor to obtain a license.
///
/// It is not signed: it carries no secrets, and a forged request only ever yields a
/// license for the installation id written in it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ActivationRequest {
    pub installation_id: InstallationId,
    pub app_version: String,
    pub created_at: UnixTime,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RequestWire {
    product: String,
    installation_id: String,
    app_version: String,
    created_at: u64,
}

impl ActivationRequest {
    pub fn encode(&self) -> String {
        let wire = RequestWire {
            product: PRODUCT_ID.to_owned(),
            installation_id: self.installation_id.as_str().to_owned(),
            app_version: self.app_version.clone(),
            created_at: self.created_at.0,
        };
        let json = serde_json::to_vec(&wire).expect("request wire format is always serializable");
        format!("{REQUEST_PREFIX}{}", encode_b64(&json))
    }

    pub fn decode(code: &str) -> Result<Self, DecodeError> {
        let body = strip_prefix(code, REQUEST_PREFIX)?;
        let bytes = decode_b64(&body)?;
        let wire: RequestWire =
            serde_json::from_slice(&bytes).map_err(|e| DecodeError::Payload(e.to_string()))?;
        if wire.product != PRODUCT_ID {
            return Err(DecodeError::Payload(format!("request is for product '{}'", wire.product)));
        }
        Ok(ActivationRequest {
            installation_id: InstallationId::parse(&wire.installation_id)
                .map_err(|e| DecodeError::Payload(e.to_string()))?,
            app_version: wire.app_version,
            created_at: UnixTime(wire.created_at),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_and_tolerates_wrapping() {
        let request = ActivationRequest {
            installation_id: InstallationId::parse("3F2A-9C01-77BE-0D4E-A1C5").unwrap(),
            app_version: "0.1.0".into(),
            created_at: UnixTime(1_760_000_000),
        };
        let code = request.encode();
        let wrapped: String = code
            .chars()
            .enumerate()
            .flat_map(|(i, c)| if i % 20 == 19 { vec![c, '\n'] } else { vec![c] })
            .collect();
        assert_eq!(ActivationRequest::decode(&format!("  {wrapped}  ")), Ok(request));
    }

    #[test]
    fn rejects_foreign_codes() {
        assert_eq!(ActivationRequest::decode("hello"), Err(DecodeError::UnknownFormat));
        assert!(matches!(
            ActivationRequest::decode("CNS-REQ1:!!!"),
            Err(DecodeError::Encoding(_))
        ));
        let other_product = format!(
            "{REQUEST_PREFIX}{}",
            encode_b64(br#"{"product":"x","installationId":"3F2A-9C01-77BE-0D4E-A1C5","appVersion":"1","createdAt":1}"#)
        );
        assert!(matches!(ActivationRequest::decode(&other_product), Err(DecodeError::Payload(_))));
    }
}
