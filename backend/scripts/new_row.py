import mysql.connector
import random
import string
import time
import sys

# Connect to your MySQL database
conn = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="20122003@Nn",  # Enter your correct MySQL password here
    database="mess_rebate"
)
cursor = conn.cursor()

start_time = time.time()

# Check if gate_pass_no column exists
print("Checking if gate_pass_no column exists...")
cursor.execute("SHOW COLUMNS FROM rebates LIKE 'gate_pass_no'")
column_exists = cursor.fetchone() is not None

if not column_exists:
    print("Column doesn't exist, adding it now...")
    try:
        # First add without NOT NULL constraint to avoid issues with existing data
        cursor.execute('ALTER TABLE rebates ADD COLUMN gate_pass_no VARCHAR(10) UNIQUE')
        conn.commit()
        print("Gate pass column added successfully with UNIQUE constraint")
    except mysql.connector.Error as err:
        print(f"Error adding column: {err}")
        if "Duplicate entry" in str(err):
            print("Column might exist but with a different definition")
else:
    print("gate_pass_no column already exists")

# Check if the column was successfully added
cursor.execute("SHOW COLUMNS FROM rebates LIKE 'gate_pass_no'")
if cursor.fetchone() is None:
    print("ERROR: Failed to add or find the gate_pass_no column")
    cursor.close()
    conn.close()
    exit(1)

# First check total number of records
cursor.execute('SELECT COUNT(*) FROM rebates')
total_records = cursor.fetchone()[0]
print(f"Total records in rebates table: {total_records}")

# Check records with gate_pass_no
cursor.execute('SELECT COUNT(*) FROM rebates WHERE gate_pass_no IS NOT NULL')
filled_records = cursor.fetchone()[0]
print(f"Records with gate_pass_no: {filled_records}")

# Check records without gate_pass_no
cursor.execute('SELECT COUNT(*) FROM rebates WHERE gate_pass_no IS NULL')
empty_records = cursor.fetchone()[0]
print(f"Records without gate_pass_no: {empty_records}")

print(f"Verification: {filled_records} + {empty_records} = {filled_records + empty_records} (should equal {total_records})")

# Get all existing gate_pass_no values to avoid duplicates
print("Loading existing gate pass numbers...")
cursor.execute('SELECT gate_pass_no FROM rebates WHERE gate_pass_no IS NOT NULL')
existing_gate_pass = set()
for row in cursor.fetchall():
    if row[0] is not None:
        existing_gate_pass.add(row[0])

print(f"Found {len(existing_gate_pass)} unique existing gate pass numbers")

# Function to generate a new batch of gate pass numbers with a given prefix
def generate_gate_pass_batch(prefix, existing_numbers):
    new_numbers = []
    for i in range(1, 10000):
        gate_pass = f"{prefix}-{i:04d}"
        if gate_pass not in existing_numbers:
            new_numbers.append(gate_pass)
    return new_numbers

# Generate available gate pass numbers with different prefixes if needed
available_numbers = []
prefixes = list(string.ascii_uppercase)  # A-Z prefixes
random.shuffle(prefixes)  # Randomize for better distribution

# Start with B as the first prefix (since that's the example format)
if 'B' in prefixes:
    prefixes.remove('B')
    prefixes.insert(0, 'B')

# Generate numbers until we have enough for all empty records
for prefix in prefixes:
    if len(available_numbers) >= empty_records:
        break
    
    prefix_numbers = generate_gate_pass_batch(prefix, existing_gate_pass)
    available_numbers.extend(prefix_numbers)
    print(f"Generated {len(prefix_numbers)} numbers with prefix {prefix}")
    
    # Add these to existing set to avoid duplicates in next batch
    existing_gate_pass.update(prefix_numbers)

# Shuffle the available numbers for randomness
random.shuffle(available_numbers)
print(f"Total available unique gate pass numbers: {len(available_numbers)}")

if len(available_numbers) < empty_records:
    print(f"WARNING: Not enough unique gate pass numbers available. Need {empty_records}, have {len(available_numbers)}.")
    print("Consider using a different format or expanding the range.")

# Get all roll_no and start_date where gate_pass_no is NULL
batch_to_process = empty_records  # Process all records in one run
cursor.execute(f'SELECT roll_no, start_date FROM rebates WHERE gate_pass_no IS NULL LIMIT {batch_to_process}')
rebate_keys = cursor.fetchall()
print(f"Found {len(rebate_keys)} records to update")

if len(rebate_keys) == 0:
    print("No records need updating. All records already have gate pass numbers.")
    
    # Now we can add the NOT NULL constraint if needed
    if empty_records == 0:
        try:
            print("Adding NOT NULL constraint to gate_pass_no column...")
            cursor.execute('ALTER TABLE rebates MODIFY COLUMN gate_pass_no VARCHAR(10) NOT NULL UNIQUE')
            conn.commit()
            print("NOT NULL constraint added successfully")
        except mysql.connector.Error as err:
            print(f"Error adding NOT NULL constraint: {err}")
    
    cursor.close()
    conn.close()
    exit()

# Prepare data for batch update
batch_size = 100  # Increased batch size for efficiency
updates = []

print(f"Starting updates - this may take a few minutes...")
sys.stdout.flush()

try:
    for i, (roll_no, start_date) in enumerate(rebate_keys):
        # Print progress every 100 records
        if i % 100 == 0:
            print(f"Processing record {i+1}/{len(rebate_keys)} ({(i+1)/len(rebate_keys)*100:.1f}%)")
            sys.stdout.flush()
        
        # Get the next available gate pass number
        gate_pass_no = available_numbers[i]
        
        # Add to batch
        updates.append((gate_pass_no, roll_no, start_date))
        
        # Commit in batches
        if (i + 1) % batch_size == 0 or i == len(rebate_keys) - 1:
            # Use executemany for better performance
            cursor.executemany(
                "UPDATE rebates SET gate_pass_no = %s WHERE roll_no = %s AND start_date = %s AND gate_pass_no IS NULL",
                updates
            )
            conn.commit()
            print(f"Committed batch of {len(updates)} updates")
            updates = []  # Reset the batch
            
except Exception as e:
    print(f"ERROR: Unexpected error occurred: {e}")
    conn.rollback()  # Roll back any pending transactions

# Check if there are more records to update
cursor.execute('SELECT COUNT(*) FROM rebates WHERE gate_pass_no IS NULL')
remaining = cursor.fetchone()[0]
if remaining > 0:
    print(f"There are still {remaining} records without gate pass numbers. Run the script again to update them.")
else:
    # Now we can add the NOT NULL constraint
    try:
        print("Adding NOT NULL constraint to gate_pass_no column...")
        cursor.execute('ALTER TABLE rebates MODIFY COLUMN gate_pass_no VARCHAR(10) NOT NULL UNIQUE')
        conn.commit()
        print("NOT NULL constraint added successfully")
    except mysql.connector.Error as err:
        print(f"Error adding NOT NULL constraint: {err}")

# Close connection
cursor.close()
conn.close()

total_time = time.time() - start_time
print(f"Script completed in {total_time:.2f} seconds")
print("Script completed successfully")