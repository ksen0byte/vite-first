//! Vendor-side CLI for issuing offline CNS Test licenses. See `cns-license --help`.
//!
//! Requests and licenses are exchanged as pasted text codes only; the only files the tool
//! touches are the vendor key pair.

use clap::{Parser, Subcommand};
use cns_licensing::{
    issue_license, verify_license, ActivationRequest, CalendarDate, Expiry, InstallationId,
    LicenseId, LicenseTerms, Licensee, UnixTime, VendorPublicKey, VendorSigningKey,
};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::ExitCode;
use std::time::{SystemTime, UNIX_EPOCH};

/// The public key the desktop app is built with (same file the app embeds).
const APP_PUBLIC_KEY: &str = include_str!("../../../keys/license-public.key");

const EXAMPLES: &str = r#"Examples (PowerShell, from the repository root):

  # Once per session: where your secret signing key is
  $env:CNS_LICENSE_SIGNING_KEY = "D:\secure\vendor.signing.key"

  # Look at what a customer sent (paste their code)
  .\cns-license inspect CNS-REQ1:eyJwcm9kdWN0Ijoi...

  # Issue a license; send the printed CNS-LIC1:... code back to the customer
  .\cns-license issue CNS-REQ1:eyJwcm9kdWN0Ijoi... --licensee "Clinic Name" --perpetual
  .\cns-license issue CNS-REQ1:eyJwcm9kdWN0Ijoi... --licensee "Clinic Name" --valid-through 2027-12-31

  # Support: would this license unlock that installation?
  .\cns-license verify CNS-LIC1:eyJwcm9kdWN0Ijoi... --installation-id 3919-85B7-234C-0AFC-07F9"#;

#[derive(Parser)]
#[command(
    name = "cns-license",
    version,
    about = "Offline license issuing for the CNS Test desktop app",
    after_help = EXAMPLES
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Show what an activation request contains.
    #[command(alias = "inspect-request")]
    Inspect {
        /// The CNS-REQ1:... code sent by the customer.
        request: String,
    },
    /// Sign a license for the installation in an activation request.
    Issue {
        /// The CNS-REQ1:... code sent by the customer.
        request: String,
        /// Name shown in the app as the license holder.
        #[arg(long)]
        licensee: String,
        /// The license never expires.
        #[arg(long, conflicts_with = "valid_through", required_unless_present = "valid_through")]
        perpetual: bool,
        /// Last day (UTC) on which the license is valid.
        #[arg(long, value_name = "YYYY-MM-DD")]
        valid_through: Option<String>,
        /// Secret signing key file.
        #[arg(long, env = "CNS_LICENSE_SIGNING_KEY", value_name = "PATH")]
        signing_key: PathBuf,
        /// Custom license id; a random one is generated when omitted.
        #[arg(long)]
        license_id: Option<String>,
    },
    /// Check a license exactly as the app would.
    Verify {
        /// The CNS-LIC1:... code.
        license: String,
        /// Installation id shown on the customer's activation screen.
        #[arg(long)]
        installation_id: String,
        /// Public key to check against; defaults to the one built into the app.
        #[arg(long, value_name = "PATH")]
        public_key: Option<PathBuf>,
    },
    /// Generate a new vendor key pair (one time). Never overwrites an existing signing key.
    Keygen {
        /// Where to write the SECRET signing key. Keep it offline and backed up.
        #[arg(long, value_name = "PATH")]
        signing_key: PathBuf,
        /// Where to write the public key, normally src-tauri/keys/license-public.key.
        #[arg(long, value_name = "PATH")]
        public_key: PathBuf,
    },
}

fn main() -> ExitCode {
    let outcome = match Cli::parse().command {
        Command::Inspect { request } => inspect(&request),
        Command::Issue { request, licensee, perpetual, valid_through, signing_key, license_id } => {
            let expiry = match (perpetual, valid_through) {
                (true, None) => Ok(Expiry::Never),
                (false, Some(date)) => CalendarDate::parse(&date)
                    .map(|d| Expiry::At(d.end_of_day()))
                    .map_err(|e| e.to_string()),
                _ => unreachable!("clap enforces exactly one of --perpetual / --valid-through"),
            };
            expiry.and_then(|expiry| issue(&request, &licensee, expiry, &signing_key, license_id.as_deref()))
        }
        Command::Verify { license, installation_id, public_key } => {
            verify(&license, &installation_id, public_key.as_deref())
        }
        Command::Keygen { signing_key, public_key } => keygen(&signing_key, &public_key),
    };
    match outcome {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            eprintln!("error: {message}");
            ExitCode::FAILURE
        }
    }
}

fn inspect(request: &str) -> Result<(), String> {
    let request = read_request(request)?;
    println!("Installation id: {}", request.installation_id);
    println!("App version:     {}", request.app_version);
    println!("Created:         {}", CalendarDate::of(request.created_at));
    Ok(())
}

fn issue(
    request: &str,
    licensee: &str,
    expiry: Expiry,
    signing_key_path: &Path,
    license_id: Option<&str>,
) -> Result<(), String> {
    let key = VendorSigningKey::parse(&read_text(signing_key_path)?).map_err(|e| e.to_string())?;
    let app_key = app_public_key()?;
    if key.public_key() != app_key {
        return Err(format!(
            "{} does not match the public key built into the app (src-tauri/keys/license-public.key); \
             licenses signed with it would be rejected",
            signing_key_path.display()
        ));
    }
    let request = read_request(request)?;
    let terms = LicenseTerms {
        license_id: match license_id {
            Some(id) => LicenseId::parse(id).map_err(|e| e.to_string())?,
            None => random_license_id()?,
        },
        installation_id: request.installation_id,
        licensee: Licensee::parse(licensee).map_err(|e| e.to_string())?,
        issued_at: now()?,
        expiry,
    };
    let code = issue_license(&terms, &key);
    // Self-check: the license must pass the exact check the app performs.
    verify_license(&code, &app_key, &terms.installation_id, terms.issued_at)
        .map_err(|e| format!("issued license failed self-check: {e}"))?;

    println!("License id:      {}", terms.license_id.as_str());
    println!("Licensee:        {}", terms.licensee.as_str());
    println!("Installation id: {}", terms.installation_id);
    println!("Valid through:   {}", describe_expiry(terms.expiry));
    println!();
    println!("Send this license code to the customer:");
    println!();
    println!("{code}");
    Ok(())
}

fn verify(license: &str, installation_id: &str, public_key: Option<&Path>) -> Result<(), String> {
    let key = match public_key {
        Some(path) => VendorPublicKey::parse(&read_text(path)?).map_err(|e| e.to_string())?,
        None => app_public_key()?,
    };
    let installation = InstallationId::parse(installation_id).map_err(|e| e.to_string())?;
    let verified = verify_license(license, &key, &installation, now()?).map_err(|e| e.to_string())?;
    let terms = verified.terms();
    println!("Valid: license {} for {}", terms.license_id.as_str(), terms.licensee.as_str());
    println!("Valid through: {}", describe_expiry(terms.expiry));
    Ok(())
}

fn keygen(signing_path: &Path, public_path: &Path) -> Result<(), String> {
    let signing = VendorSigningKey::from_seed(random_bytes()?);
    OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(signing_path)
        .and_then(|mut file| file.write_all(signing.encode().as_bytes()))
        .map_err(|e| format!("cannot create {}: {e}", signing_path.display()))?;
    // The public key file normally already exists (the one in the repo); replacing it is intended.
    fs::write(public_path, signing.public_key().encode())
        .map_err(|e| format!("cannot write {}: {e}", public_path.display()))?;
    println!("Signing key (SECRET): {}", signing_path.display());
    println!("Public key:           {}", public_path.display());
    println!("Rebuild the app so it embeds the new public key. Licenses from the old key stop working.");
    Ok(())
}

fn app_public_key() -> Result<VendorPublicKey, String> {
    VendorPublicKey::parse(APP_PUBLIC_KEY).map_err(|e| format!("app public key: {e}"))
}

fn describe_expiry(expiry: Expiry) -> String {
    match expiry {
        Expiry::Never => "perpetual".to_owned(),
        // `At` is exclusive, so the last valid day is the one before it.
        Expiry::At(at) => CalendarDate::of(UnixTime(at.0 - 1)).to_string(),
    }
}

fn read_request(code: &str) -> Result<ActivationRequest, String> {
    ActivationRequest::decode(code).map_err(|e| format!("activation request: {e}"))
}

fn read_text(path: &Path) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("cannot read {}: {e}", path.display()))
}

fn random_bytes<const N: usize>() -> Result<[u8; N], String> {
    let mut bytes = [0u8; N];
    getrandom::fill(&mut bytes).map_err(|e| format!("system randomness unavailable: {e}"))?;
    Ok(bytes)
}

fn random_license_id() -> Result<LicenseId, String> {
    let bytes: [u8; 6] = random_bytes()?;
    let hex: String = bytes.iter().map(|b| format!("{b:02X}")).collect();
    LicenseId::parse(&format!("L-{hex}")).map_err(|e| e.to_string())
}

fn now() -> Result<UnixTime, String> {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| UnixTime(d.as_secs()))
        .map_err(|_| "system clock is before 1970".to_owned())
}
