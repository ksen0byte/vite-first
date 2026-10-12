use std::fmt;

/// Seconds since the Unix epoch (UTC).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct UnixTime(pub u64);

const SECONDS_PER_DAY: u64 = 86_400;

/// A proleptic Gregorian calendar date in UTC.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct CalendarDate {
    year: i64,
    month: u32,
    day: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InvalidDate(pub String);

impl fmt::Display for InvalidDate {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid date '{}', expected YYYY-MM-DD on or after 1970-01-01", self.0)
    }
}

impl std::error::Error for InvalidDate {}

impl CalendarDate {
    /// Parses `YYYY-MM-DD`, rejecting impossible dates such as `2027-02-30`.
    pub fn parse(text: &str) -> Result<Self, InvalidDate> {
        let invalid = || InvalidDate(text.to_owned());
        let parts: Vec<&str> = text.trim().split('-').collect();
        let [y, m, d] = parts.as_slice() else {
            return Err(invalid());
        };
        let year: i64 = y.parse().map_err(|_| invalid())?;
        let month: u32 = m.parse().map_err(|_| invalid())?;
        let day: u32 = d.parse().map_err(|_| invalid())?;
        if !(1..=12).contains(&month) || !(1..=31).contains(&day) || year < 1970 {
            return Err(invalid());
        }
        let date = CalendarDate { year, month, day };
        // Round-tripping through the day count rejects days past the end of the month.
        if CalendarDate::from_days(date.days_since_epoch()) != date {
            return Err(invalid());
        }
        Ok(date)
    }

    pub fn start_of_day(&self) -> UnixTime {
        UnixTime(self.days_since_epoch() as u64 * SECONDS_PER_DAY)
    }

    /// The first instant after this date ends, i.e. midnight UTC of the next day.
    pub fn end_of_day(&self) -> UnixTime {
        UnixTime((self.days_since_epoch() as u64 + 1) * SECONDS_PER_DAY)
    }

    pub fn of(time: UnixTime) -> Self {
        CalendarDate::from_days((time.0 / SECONDS_PER_DAY) as i64)
    }

    // Howard Hinnant's days_from_civil / civil_from_days algorithms.
    fn days_since_epoch(&self) -> i64 {
        let y = if self.month <= 2 { self.year - 1 } else { self.year };
        let era = if y >= 0 { y } else { y - 399 } / 400;
        let yoe = y - era * 400;
        let mp = (self.month as i64 + 9) % 12;
        let doy = (153 * mp + 2) / 5 + self.day as i64 - 1;
        let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        era * 146_097 + doe - 719_468
    }

    fn from_days(days: i64) -> Self {
        let z = days + 719_468;
        let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
        let doe = z - era * 146_097;
        let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
        let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
        let mp = (5 * doy + 2) / 153;
        let day = (doy - (153 * mp + 2) / 5 + 1) as u32;
        let month = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
        let year = yoe + era * 400 + if month <= 2 { 1 } else { 0 };
        CalendarDate { year, month, day }
    }
}

impl fmt::Display for CalendarDate {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:04}-{:02}-{:02}", self.year, self.month, self.day)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_and_formats_round_trip() {
        let date = CalendarDate::parse("2027-12-31").unwrap();
        assert_eq!(date.to_string(), "2027-12-31");
        assert_eq!(CalendarDate::of(date.start_of_day()), date);
        assert_eq!(CalendarDate::of(date.end_of_day()).to_string(), "2028-01-01");
    }

    #[test]
    fn epoch_is_day_zero() {
        assert_eq!(CalendarDate::parse("1970-01-01").unwrap().start_of_day(), UnixTime(0));
        assert_eq!(CalendarDate::parse("2000-03-01").unwrap().start_of_day(), UnixTime(951_868_800));
    }

    #[test]
    fn rejects_impossible_dates() {
        for text in ["2027-02-29", "2027-13-01", "2027-00-10", "1969-12-31", "2027-1", "abc"] {
            assert!(CalendarDate::parse(text).is_err(), "{text} should be rejected");
        }
        assert!(CalendarDate::parse("2028-02-29").is_ok());
    }
}
