from app.utils.dates import parse_iso_date


def test_parse_iso_date_accepts_date_only():
    parsed = parse_iso_date("2026-04-13")
    assert parsed.isoformat() == "2026-04-13"


def test_parse_iso_date_accepts_full_iso_datetime():
    parsed = parse_iso_date("2026-04-13T15:30:00Z")
    assert parsed.isoformat() == "2026-04-13"
