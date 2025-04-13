import pandas as pd
import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Path to the CSV file
excel_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data", "Processed_2nd_Year_2023_Batch.csv"))
print(f"Looking for file at: {excel_path}")

# Load the CSV
df = pd.read_csv(excel_path)

# Replace real NaN and string "nan"/"NaN" with None
df = df.where(pd.notna(df), None)
for col in df.columns:
    df[col] = df[col].apply(lambda x: None if str(x).strip().lower() == "nan" else x)

# Connect to DB
conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    port=3306,
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASS"),
    database=os.getenv("DB_NAME")
)
cursor = conn.cursor()

# Initial student count
cursor.execute("SELECT COUNT(*) FROM students")
initial_count = cursor.fetchone()[0]
print(f"Initial student count: {initial_count}")

# Get existing roll numbers
cursor.execute("SELECT roll_no FROM students")
existing_roll_nos = {row[0] for row in cursor.fetchall()}

# Track results
skipped_students = []
added_students = []
failed_inserts = []

for _, row in df.iterrows():
    roll_no = row["Roll No"]
    name = row["Name"]
    mobile = row["Phone Number"]
    email = row["Email"]
    branch = row["Branch"]
    batch = row["Batch"]

    # Validate required fields
    if not roll_no or not name:
        failed_inserts.append((roll_no, "Missing roll_no or name"))
        continue

    # Skip already present
    if roll_no in existing_roll_nos:
        skipped_students.append(roll_no)
        continue

    sql = """
    INSERT IGNORE INTO students (roll_no, name, mobile_no, email, branch, batch)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (roll_no, name, mobile, email, branch, batch)
    try:
        cursor.execute(sql, values)
        if cursor.rowcount > 0:  # Actually inserted
            added_students.append(roll_no)
        else:
            failed_inserts.append((roll_no, "INSERT IGNORE skipped (duplicate or constraint)"))
    except Exception as e:
        failed_inserts.append((roll_no, str(e)))

# Commit changes
conn.commit()

# Final count
cursor.execute("SELECT COUNT(*) FROM students")
final_count = cursor.fetchone()[0]
new_students = final_count - initial_count

cursor.close()
conn.close()

# ✅ Summary
print(f"\nData import completed successfully!")
print(f"Total students in database: {final_count}")
print(f"New students added (confirmed): {new_students}")
print(f"\nSkipped {len(skipped_students)} already existing students")
print(f"Added {len(added_students)} new students")
print(f"Failed inserts: {len(failed_inserts)}")

if skipped_students:
    print("\nFirst 5 skipped students:")
    for roll_no in skipped_students[:5]:
        print(f"- {roll_no}")

if added_students:
    print("\nFirst 5 added students:")
    for roll_no in added_students[:5]:
        print(f"- {roll_no}")

if failed_inserts:
    print("\nFirst 5 failed inserts:")
    for roll_no, reason in failed_inserts[:5]:
        print(f"- {roll_no}: {reason}")
