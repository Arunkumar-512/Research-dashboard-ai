import os
from decimal import Decimal

import pandas as pd
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()


# ==========================================================
# DATABASE URL (Neon)
# ==========================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable not found."
    )


# ==========================================================
# SQLAlchemy Engine
# ==========================================================

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)


# ==========================================================
# PostgreSQL Connection
# ==========================================================

def get_pg_connection():
    """
    Returns a psycopg2 connection to Neon PostgreSQL.
    """
    return psycopg2.connect(DATABASE_URL)


# ==========================================================
# Upload dataframe to Neon
# ==========================================================

def init_db_from_dataframe(df: pd.DataFrame):
    """
    Creates/Replaces dataset table inside Neon.
    """

    df.columns = [
        str(c)
        .strip()
        .lower()
        .replace(" ", "_")
        .replace("-", "_")
        for c in df.columns
    ]

    try:

        df.to_sql(
            name="dataset",
            con=engine,
            if_exists="replace",
            index=False,
            method="multi",
            chunksize=1000,
        )

        print("✅ Dataset uploaded successfully to Neon.")

    except Exception as e:
        print("❌ Upload Failed:", e)
        raise


# ==========================================================
# Execute SQL
# ==========================================================

def execute_sql_query(sql):

    conn = get_pg_connection()

    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:

        cursor.execute(sql)

        if cursor.description:

            rows = cursor.fetchall()

            result = []

            for row in rows:

                clean = {}

                for key, value in dict(row).items():

                    if isinstance(value, Decimal):
                        clean[key] = float(value)

                    elif pd.isna(value):
                        clean[key] = None

                    else:
                        clean[key] = value

                result.append(clean)

        else:

            result = []

        conn.commit()

        return {
            "success": True,
            "data": result,
            "error": None,
        }

    except Exception as e:

        conn.rollback()

        return {
            "success": False,
            "data": None,
            "error": str(e),
        }

    finally:

        cursor.close()
        conn.close()


# ==========================================================
# Get Schema
# ==========================================================

def get_sql_schema():

    conn = get_pg_connection()

    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT
                column_name,
                data_type
            FROM information_schema.columns
            WHERE table_name='dataset'
            ORDER BY ordinal_position;
        """)

        schema = {}

        for column, datatype in cursor.fetchall():
            schema[column] = datatype

        return schema

    finally:

        cursor.close()
        conn.close()


# ==========================================================
# Close Engine (optional)
# ==========================================================

def close_engine():
    engine.dispose()