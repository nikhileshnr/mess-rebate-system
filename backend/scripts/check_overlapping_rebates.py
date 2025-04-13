import mysql.connector
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=3306,
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME")
    )

def find_overlapping_rebates():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Query to find overlapping rebates
    query = """
    SELECT 
        r1.roll_no,
        r1.start_date as start1,
        r1.end_date as end1,
        r2.start_date as start2,
        r2.end_date as end2
    FROM 
        rebates r1
    JOIN 
        rebates r2 ON r1.roll_no = r2.roll_no
    WHERE 
        r1.start_date < r2.start_date
        AND (
            (r1.start_date <= r2.end_date AND r1.end_date >= r2.start_date)
        )
    ORDER BY 
        r1.roll_no, r1.start_date
    """
    
    cursor.execute(query)
    overlapping_rebates = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return overlapping_rebates

def display_conflicts(conflicts):
    if not conflicts:
        print("\nNo overlapping rebate entries found!")
        return
    
    print(f"\nFound {len(conflicts)} pairs of overlapping rebate entries:")
    print("-" * 100)
    
    for conflict in conflicts:
        print(f"\nRoll No: {conflict['roll_no']}")
        print(f"Conflict 1:")
        print(f"  Period: {conflict['start1']} to {conflict['end1']}")
        print(f"Conflict 2:")
        print(f"  Period: {conflict['start2']} to {conflict['end2']}")
        print("-" * 100)

def delete_conflicts(conflicts):
    if not conflicts:
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Delete the rebates using the composite primary key
    for conflict in conflicts:
        # Delete both overlapping entries
        delete_query = """
        DELETE FROM rebates 
        WHERE (roll_no = %s AND start_date = %s)
           OR (roll_no = %s AND start_date = %s)
        """
        cursor.execute(delete_query, (
            conflict['roll_no'], conflict['start1'],
            conflict['roll_no'], conflict['start2']
        ))
    
    rows_deleted = cursor.rowcount
    conn.commit()
    
    cursor.close()
    conn.close()
    
    return rows_deleted

def main():
    print("Checking for overlapping rebate entries...")
    conflicts = find_overlapping_rebates()
    
    display_conflicts(conflicts)
    
    if conflicts:
        while True:
            response = input("\nDo you want to delete these overlapping entries? (yes/no): ").lower()
            if response in ['yes', 'no']:
                break
            print("Please enter 'yes' or 'no'")
        
        if response == 'yes':
            rows_deleted = delete_conflicts(conflicts)
            print(f"\nSuccessfully deleted {rows_deleted} overlapping rebate entries!")
        else:
            print("\nNo entries were deleted.")

if __name__ == "__main__":
    main() 