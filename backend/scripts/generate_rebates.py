import mysql.connector
import random
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

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

def generate_rebate_entries():
    students_by_batch = get_students()

    # Define date ranges for each batch
    date_ranges = {
        2022: {
            'start': datetime(2022, 12, 1),
            'end': datetime(2025, 4, 1)
        },
        2023: {
            'start': datetime(2023, 11, 1),
            'end': datetime(2025, 4, 1)
        }
    }

    total_students = sum(len(students) for students in students_by_batch.values())
    students_without_entries_count = int(total_students * 0.1)

    all_students = [roll_no for batch in students_by_batch.values() for roll_no in batch]
    students_without_entries = random.sample(all_students, students_without_entries_count)

    rebate_entries = []
    total_entries = 0
    seen_entries = set()  # Track (roll_no, start_date) pairs

    # Create a list of eligible students (those who should have entries)
    eligible_students = [roll_no for roll_no in all_students if roll_no not in students_without_entries]
    
    # Shuffle the eligible students to ensure random distribution
    random.shuffle(eligible_students)
    
    # Calculate target entries per student (4000 total entries)
    target_entries = 4000
    entries_per_student = target_entries // len(eligible_students)
    remaining_entries = target_entries % len(eligible_students)

    # Distribute entries among eligible students
    for roll_no in eligible_students:
        if total_entries >= target_entries:
            break

        # Calculate number of entries for this student
        num_entries = entries_per_student
        if remaining_entries > 0:
            num_entries += 1
            remaining_entries -= 1

        # Get student's batch
        batch = next(b for b, students in students_by_batch.items() if roll_no in students)

        for _ in range(num_entries):
            if total_entries >= target_entries:
                break

            start_date = generate_random_date(
                date_ranges[batch]['start'],
                date_ranges[batch]['end'] - timedelta(days=1)
            )

            end_date = start_date + timedelta(days=random.randint(1, 15))
            rebate_days = (end_date - start_date).days + 1

            key = (roll_no, start_date.date())

            if key in seen_entries:
                continue

            if not has_overlapping_rebate(roll_no, start_date, end_date):
                seen_entries.add(key)
                rebate_entries.append({
                    'roll_no': roll_no,
                    'start_date': start_date,
                    'end_date': end_date,
                    'rebate_days': rebate_days
                })
                total_entries += 1

    return rebate_entries

def insert_rebate_entries(entries):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing rebate entries
    cursor.execute("TRUNCATE TABLE rebates")

    # Use INSERT IGNORE to skip duplicates
    insert_query = """
    INSERT IGNORE INTO rebates (roll_no, start_date, end_date, rebate_days)
    VALUES (%s, %s, %s, %s)
    """

    for entry in entries:
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
    print("Generating rebate entries...")
    entries = generate_rebate_entries()
    print(f"Generated {len(entries)} rebate entries")

    print("Inserting entries into database...")
    insert_rebate_entries(entries)
    print("Done!")

if __name__ == "__main__":
    main()
