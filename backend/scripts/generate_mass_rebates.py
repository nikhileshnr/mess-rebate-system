import mysql.connector
import random
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from tqdm import tqdm
import numpy as np

# Load environment variables properly
load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=3306,
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME")
    )

def get_students():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get all students grouped by batch
    cursor.execute("SELECT roll_no, batch FROM students ORDER BY batch, roll_no")
    students = cursor.fetchall()

    cursor.close()
    conn.close()

    # Group students by batch
    students_by_batch = {}
    for student in students:
        batch = student['batch']
        if batch not in students_by_batch:
            students_by_batch[batch] = []
        students_by_batch[batch].append(student['roll_no'])

    return students_by_batch

def generate_random_date(start_date, end_date):
    """Generate a random date between start_date and end_date"""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)

def has_overlapping_rebate(roll_no, start_date, end_date):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check for overlapping rebates
    query = """
    SELECT COUNT(*) FROM rebates 
    WHERE roll_no = %s 
    AND (
        (start_date <= %s AND end_date >= %s) OR
        (start_date <= %s AND end_date >= %s) OR
        (start_date >= %s AND end_date <= %s)
    )
    """
    cursor.execute(query, (roll_no, start_date, start_date, end_date, end_date, start_date, end_date))
    count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return count > 0

def generate_rebate_entries(target_entries=10000):
    students_by_batch = get_students()
    
    # Define date ranges for each batch
    date_ranges = {
        2022: {
            'start': datetime(2022, 12, 1),  # December 2022 for 2022 batch
            'end': datetime(2025, 12, 31)
        },
        2023: {
            'start': datetime(2023, 11, 1),  # November 2023 for 2023 batch
            'end': datetime(2025, 12, 31)
        },
        2024: {
            'start': datetime(2024, 11, 1),  # November 2024 for 2024 batch
            'end': datetime(2025, 12, 31)
        }
    }

    # Get all students
    all_students = [roll_no for batch in students_by_batch.values() for roll_no in batch]
    total_students = len(all_students)
    
    # Create a realistic distribution of rebate frequencies
    # Using a power law distribution (Pareto distribution) to model rebate frequency
    # This will create a few students with many rebates and many students with few rebates
    alpha = 2.5  # Shape parameter - higher means more extreme distribution
    min_entries = 0
    max_entries = 200  # Maximum entries per student
    
    # Generate rebate frequencies for each student
    frequencies = np.random.pareto(alpha, total_students)
    # Scale frequencies to desired range
    frequencies = frequencies / frequencies.max() * (max_entries - min_entries) + min_entries
    frequencies = frequencies.astype(int)
    
    # Sort students by frequency (descending)
    student_frequencies = list(zip(all_students, frequencies))
    student_frequencies.sort(key=lambda x: x[1], reverse=True)
    
    rebate_entries = []
    seen_entries = set()  # Track (roll_no, start_date) pairs
    
    print(f"Generating rebate entries for {total_students} students...")
    print("Distribution: Some students will have many rebates, others few or none")
    
    # Progress bar for students
    for roll_no, target_entries in tqdm(student_frequencies, desc="Processing students"):
        # Get student's batch
        batch = next(b for b, students in students_by_batch.items() if roll_no in students)
        
        # Generate entries for this student
        entries_generated = 0
        max_attempts = target_entries * 3  # Limit attempts to avoid infinite loops
        
        for attempt in range(max_attempts):
            if entries_generated >= target_entries:
                break
                
            # Generate random dates
            start_date = generate_random_date(
                date_ranges[batch]['start'],
                date_ranges[batch]['end'] - timedelta(days=1)
            )
            
            # Random duration between 1 and 30 days
            duration = random.randint(1, 30)
            end_date = start_date + timedelta(days=duration)
            
            # Ensure end_date doesn't exceed batch end date
            if end_date > date_ranges[batch]['end']:
                end_date = date_ranges[batch]['end']
            
            key = (roll_no, start_date.date())
            
            if key in seen_entries:
                continue
                
            if not has_overlapping_rebate(roll_no, start_date, end_date):
                seen_entries.add(key)
                rebate_entries.append({
                    'roll_no': roll_no,
                    'start_date': start_date,
                    'end_date': end_date,
                    'rebate_days': (end_date - start_date).days + 1
                })
                entries_generated += 1
    
    return rebate_entries

def insert_rebate_entries(entries):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Use INSERT IGNORE to skip duplicates
    insert_query = """
    INSERT IGNORE INTO rebates (roll_no, start_date, end_date, rebate_days)
    VALUES (%s, %s, %s, %s)
    """

    # Insert entries in batches of 1000
    batch_size = 1000
    for i in tqdm(range(0, len(entries), batch_size), desc="Inserting entries"):
        batch = entries[i:i + batch_size]
        for entry in batch:
            cursor.execute(insert_query, (
                entry['roll_no'],
                entry['start_date'],
                entry['end_date'],
                entry['rebate_days']
            ))
        conn.commit()

    cursor.close()
    conn.close()

def main():
    print("Starting rebate generation...")
    
    # Generate entries
    entries = generate_rebate_entries()
    print(f"\nGenerated {len(entries)} rebate entries")
    
    # Insert entries
    print("\nInserting entries into database...")
    insert_rebate_entries(entries)
    print("\nDone!")

if __name__ == "__main__":
    main() 