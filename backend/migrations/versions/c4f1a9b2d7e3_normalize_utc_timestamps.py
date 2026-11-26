"""normalize UTC timestamps

Revision ID: c4f1a9b2d7e3
Revises: ea26a6ef442b
Create Date: 2026-11-26 01:10:00.000000

"""

from datetime import UTC, datetime

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "c4f1a9b2d7e3"
down_revision = "ea26a6ef442b"
branch_labels = None
depends_on = None

TABLES: dict[str, tuple[str, ...]] = {
    "users": ("created_at",),
    "tickets": ("created_at", "updated_at"),
    "comments": ("created_at",),
}


def _is_sqlite() -> bool:
    return op.get_bind().dialect.name == "sqlite"


def _alter_types(timezone: bool) -> None:
    """Switch the timestamp columns between aware and naive storage."""
    for table, columns in TABLES.items():
        if not _is_sqlite():
            for column in columns:
                op.alter_column(
                    table,
                    column,
                    existing_type=sa.DateTime(timezone=not timezone),
                    type_=sa.DateTime(timezone=timezone),
                    existing_nullable=True,
                    postgresql_using=f"{column} AT TIME ZONE 'UTC'",
                )
            continue

        with op.batch_alter_table(table) as batch_op:
            for column in columns:
                batch_op.alter_column(
                    column,
                    existing_type=sa.DateTime(timezone=not timezone),
                    type_=sa.DateTime(timezone=timezone),
                    existing_nullable=True,
                )


def _rewrite_values(aware: bool) -> None:
    """Interpret naive values as UTC, or strip the offset on downgrade."""
    connection = op.get_bind()

    for table, columns in TABLES.items():
        column_list = ", ".join(columns)
        rows = connection.execute(
            sa.text(f"SELECT id, {column_list} FROM {table}")
        ).mappings().all()

        for row in rows:
            updates: dict[str, str] = {}
            for column in columns:
                value = row[column]
                if value is None:
                    continue

                parsed = datetime.fromisoformat(value) if isinstance(value, str) else value
                if parsed.tzinfo is None or parsed.utcoffset() is None:
                    parsed = parsed.replace(tzinfo=UTC)
                else:
                    parsed = parsed.astimezone(UTC)

                updates[column] = (
                    parsed.isoformat() if aware else parsed.replace(tzinfo=None).isoformat()
                )

            if not updates:
                continue

            assignments = ", ".join(f"{column} = :{column}" for column in updates)
            connection.execute(
                sa.text(f"UPDATE {table} SET {assignments} WHERE id = :id"),
                {"id": row["id"], **updates},
            )


def upgrade() -> None:
    _alter_types(timezone=True)
    _rewrite_values(aware=True)


def downgrade() -> None:
    _alter_types(timezone=False)
    _rewrite_values(aware=False)
