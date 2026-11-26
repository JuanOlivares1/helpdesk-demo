"""Tests for UTC timestamp serialization."""

from datetime import UTC, datetime, timedelta, timezone

from app.models import Comment, Ticket, User, iso_utc


def test_iso_utc_treats_naive_values_as_utc():
    assert iso_utc(datetime(2026, 1, 1, 12, 30)) == "2026-01-01T12:30:00+00:00"


def test_iso_utc_converts_aware_values_to_utc():
    offset = timezone(timedelta(hours=-5))
    value = datetime(2026, 1, 1, 12, 30, tzinfo=offset)

    assert iso_utc(value) == "2026-01-01T17:30:00+00:00"


def test_iso_utc_keeps_missing_values_empty():
    assert iso_utc(None) is None


def test_model_dicts_emit_utc_timestamps():
    naive = datetime(2026, 1, 1, 12, 30)
    aware = datetime(2026, 1, 2, 8, 15, tzinfo=UTC)

    user = User(email="serialization@test.com", created_at=naive)
    ticket = Ticket(title="Ticket", description="Body", created_at=aware)
    comment = Comment(body="Reply", created_at=naive)

    assert user.to_dict()["created_at"] == "2026-01-01T12:30:00+00:00"
    assert ticket.to_dict()["created_at"] == "2026-01-02T08:15:00+00:00"
    assert comment.to_dict()["created_at"] == "2026-01-01T12:30:00+00:00"
