import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
from decimal import Decimal

# 🔧 CONFIGURATION: Ensure these parameters accurately reflect your local setup
DB_USER = "postgres"
DB_PASSWORD = "54321"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "analytics_db"

def get_pg_connection():
    """Establishes a connection to the PostgreSQL instance."""
    return psycopg2.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME
    )

def init_db_from_dataframe(df: pd.DataFrame):
    """
    Cleans column schemas and stream-inserts the active pandas dataframe 
    directly into a dedicated PostgreSQL table named 'dataset'.
    """
    # Sanitize columns: strip spaces, lower-case them, and swap hyphens for underscores
    df.columns = [c.strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]
    
    try:
        # ⚡ OPTIMIZATION: Rely directly on SQLAlchemy's native 'replace' routine.
        # This prevents connection deadlocks between psycopg2 and the engine pool.
        from sqlalchemy import create_engine
        engine = create_engine(f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}')
        
        df.to_sql("dataset", engine, index=False, if_exists="replace")
        print("✅ Production PostgreSQL 'dataset' table created and loaded completely.")
    except Exception as e:
        print(f"❌ PostgreSQL Data Initialization Failed: {e}")
        raise e

def execute_sql_query(sql_string: str) -> dict:
    """
    Executes a structured SQL string against the live PostgreSQL container
    and returns rows as JSON-safe record maps.
    """
    conn = get_pg_connection()
    # RealDictCursor returns rows as standard Python dictionaries matching column names
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute(sql_string)
        
        # Check if the query returns rows (e.g., SELECT statements vs updates)
        if cursor.description:
            rows = cursor.fetchall()
            
            # ⚡ SAFETY FIX: Convert any Decimal/Numeric structures to native floats 
            # so FastAPI can serialize them into JSON strings without throwing errors.
            result_data = []
            for row in rows:
                clean_row = {}
                for key, val in dict(row).items():
                    if isinstance(val, Decimal):
                        clean_row[key] = float(val)
                    else:
                        clean_row[key] = val
                result_data.append(clean_row)
        else:
            result_data = []
            
        conn.commit()
        return {"success": True, "data": result_data, "error": None}
    except Exception as error:
        conn.rollback()
        return {"success": False, "data": None, "error": str(error)}
    finally:
        cursor.close()
        conn.close()
def get_sql_schema() -> dict:
    """
    Probes the PostgreSQL information_schema to extract current runtime 
    headers along with their exact data types.
    """
    conn = get_pg_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'dataset'
            ORDER BY ordinal_position;
        """)
        # Create a dictionary map: { "product_name": "text", "shipping_cost": "numeric" }
        schema_map = {row[0]: row[1] for row in cursor.fetchall()}
        return schema_map
    except Exception:
        return {}
    finally:
        cursor.close()
        conn.close()
   