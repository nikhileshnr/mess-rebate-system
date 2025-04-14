import mysql.connector
import time
import sys

# Connect to MySQL database
conn = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="20122003@Nn",
    database="mess_rebate"
)
cursor = conn.cursor()

start_time = time.time()

# Set cutoff date to April 30, 2025
cutoff_date = "2025-04-30"

# First count how many entries will be affected
cursor.execute(
    "SELECT COUNT(*) FROM rebates WHERE start_date > %s",
    [cutoff_date]
)
count = cursor.fetchone()[0]
print(f"Found {count} rebate entries with start_date after April 30, 2025")

if count == 0:
    print("No entries to delete")
    cursor.close()
    conn.close()
    sys.exit(0)

# Confirm before deletion
confirm = input(f"Are you sure you want to delete {count} rebate entries? (y/n): ")
if confirm.lower() != 'y':
    print("Operation cancelled")
    cursor.close()
    conn.close()
    sys.exit(0)

try:
    # Delete entries
    cursor.execute(
        "DELETE FROM rebates WHERE start_date > %s",
        [cutoff_date]
    )
    conn.commit()
    print(f"Successfully deleted {cursor.rowcount} rebate entries")
except mysql.connector.Error as err:
    print(f"Error: {err}")
    conn.rollback()
    cursor.close()
    conn.close()
    sys.exit(1)

# Close connection
cursor.close()
conn.close()

total_time = time.time() - start_time
print(f"Script completed in {total_time:.2f} seconds") 