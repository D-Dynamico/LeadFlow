"""create app_meta

Revision ID: 2465824dd1f3
Revises: 5bcaf615e336
Create Date: 2026-10-15 03:15:58.629432

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2465824dd1f3'
down_revision: Union[str, Sequence[str], None] = '5bcaf615e336'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('app_meta',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('seeded_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('app_meta')
