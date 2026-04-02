import argparse
import csv
import os
import getpass
from pathlib import Path

import pyodbc


def _safe_str(v) -> str:
    if v is None:
        return ""
    if isinstance(v, bytes):
        # Access ODBC drivers sometimes return mixed/invalid unicode metadata.
        return v.decode("cp1252", errors="replace")
    return str(v)


def connect(mdb_path: Path, uid: str | None, password: str | None, systemdb: str | None):
    # Requires Microsoft Access Database Engine (ODBC driver) installed.
    driver = "{Microsoft Access Driver (*.mdb, *.accdb)}"
    parts = [f"DRIVER={driver}", f"DBQ={mdb_path}"]
    if uid:
        parts.append(f"UID={uid}")
    if password:
        parts.append(f"PWD={password}")
    if systemdb:
        parts.append(f"SystemDB={systemdb}")
    conn_str = ";".join(parts) + ";"
    conn = pyodbc.connect(conn_str, autocommit=True, unicode_results=False)
    # Be defensive with metadata encoding returned by the driver.
    try:
        conn.setdecoding(pyodbc.SQL_CHAR, encoding="cp1252", errors="replace")
        conn.setdecoding(pyodbc.SQL_WCHAR, encoding="utf-16le", errors="replace")
        conn.setdecoding(pyodbc.SQL_WMETADATA, encoding="utf-16le", errors="replace")
        conn.setencoding(encoding="utf-8")
    except Exception:
        # Some builds/drivers may not support all these knobs; best effort only.
        pass
    return conn


def list_tables(cur):
    # TABLE, SYSTEM TABLE, VIEW
    rows = cur.tables()
    tables = []
    for r in rows:
        if r.table_type in ("TABLE", "VIEW"):
            name = _safe_str(r.table_name)
            # Filter out Access internal tables
            if name.startswith("MSys"):
                continue
            tables.append((_safe_str(r.table_type), name))
    tables.sort(key=lambda x: (x[0], x[1].lower()))
    return tables


def list_columns(cur, table_name: str):
    cols = []
    for c in cur.columns(table=table_name):
        cols.append(
            {
                "name": _safe_str(c.column_name),
                "type": _safe_str(c.type_name),
                "size": c.column_size,
                "nullable": bool(c.nullable),
            }
        )
    return cols


def export_table_to_csv(cur, table_name: str, out_path: Path):
    cur.execute(f"SELECT * FROM [{table_name}]")
    col_names = [d[0] for d in cur.description]

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(col_names)
        for row in cur.fetchall():
            w.writerow(["" if v is None else v for v in row])


def main():
    ap = argparse.ArgumentParser(description="Analyze a password-protected Access .mdb")
    ap.add_argument("--mdb", default=str(Path(__file__).resolve().parents[1] / "intranet.mdb"))
    ap.add_argument("--out", default=str(Path(__file__).resolve().parents[1] / "migration" / "access"))
    ap.add_argument("--export-csv", action="store_true", help="Export all tables to CSV files")
    ap.add_argument("--uid", default=os.environ.get("ACCESS_UID"), help="Access user (env ACCESS_UID)")
    ap.add_argument("--systemdb", default=os.environ.get("ACCESS_SYSTEMDB"), help="Path to .mdw (env ACCESS_SYSTEMDB)")
    args = ap.parse_args()

    mdb_path = Path(args.mdb).resolve()
    out_dir = Path(args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    password = os.environ.get("ACCESS_PASSWORD")
    if password is None:
        password = getpass.getpass("Access password (input hidden, leave empty if none): ")
        if password == "":
            password = None

    uid = args.uid
    if uid == "":
        uid = None

    systemdb = args.systemdb
    if systemdb == "":
        systemdb = None

    with connect(mdb_path, uid, password, systemdb) as conn:
        cur = conn.cursor()
        tables = list_tables(cur)

        schema_path = out_dir / "schema.txt"
        with schema_path.open("w", encoding="utf-8") as f:
            for table_type, name in tables:
                f.write(f"[{table_type}] {name}\n")
                for col in list_columns(cur, name):
                    f.write(
                        f"  - {col['name']}: {col['type']}"
                        f"(size={col['size']}, nullable={col['nullable']})\n"
                    )
                f.write("\n")

        if args.export_csv:
            csv_dir = out_dir / "csv"
            for table_type, name in tables:
                if table_type != "TABLE":
                    continue
                export_table_to_csv(cur, name, csv_dir / f"{name}.csv")

    print(f"Wrote: {schema_path}")
    if args.export_csv:
        print(f"Wrote CSVs to: {out_dir / 'csv'}")


if __name__ == "__main__":
    main()

