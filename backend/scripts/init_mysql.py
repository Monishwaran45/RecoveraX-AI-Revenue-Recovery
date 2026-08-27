import sys
import os
import pymysql

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def init_mysql_database(host="localhost", user="root", password="root", port=3306, db_name="recovery_db"):
    print(f"Connecting to MySQL server at {host}:{port} as user '{user}'...")
    try:
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            port=port
        )
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            print(f"[SUCCESS] MySQL Database '{db_name}' created / verified successfully!")
        connection.close()
    except Exception as e:
        print(f"[ERROR] Could not connect directly to MySQL server: {e}")
        print("Ensure MySQL server is running and user/password are correct.")
        return False

    # Now run SQLAlchemy table creation & seeding
    mysql_url = f"mysql+aiomysql://{user}:{password}@{host}:{port}/{db_name}"
    print(f"Updating DATABASE_URL to: {mysql_url}")
    os.environ["DATABASE_URL"] = mysql_url

    from app.data.seed import seed_database_if_empty
    seed_database_if_empty()
    print(f"[SUCCESS] All tables created and 1,000 synthetic cases seeded in MySQL database '{db_name}'!")
    return True

if __name__ == "__main__":
    mysql_user = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else "root"
    mysql_pass = sys.argv[2] if len(sys.argv) > 2 else "root"
    mysql_host = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "localhost"
    mysql_port = 3306
    if len(sys.argv) > 4:
        try:
            mysql_port = int(sys.argv[4])
        except ValueError:
            mysql_port = 3306
    mysql_db = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else "recovery_db"

    init_mysql_database(host=mysql_host, user=mysql_user, password=mysql_pass, port=mysql_port, db_name=mysql_db)
