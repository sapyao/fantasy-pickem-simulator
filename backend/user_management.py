import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize database
def init_db():
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE,
        balance REAL DEFAULT 1000.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create picks table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS picks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pick_data TEXT NOT NULL,  -- JSON string of pick data
        bet_amount REAL NOT NULL,
        mode TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        result TEXT,  -- 'win' or 'loss'
        payout REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized")

# User management functions
def create_user(username, password, email=None):
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
            (username, password_hash, email)
        )
        conn.commit()
        user_id = cursor.lastrowid
        return {"success": True, "user_id": user_id}
    except sqlite3.IntegrityError as e:
        if "UNIQUE constraint failed: users.username" in str(e):
            return {"success": False, "error": "Username already exists"}
        elif "UNIQUE constraint failed: users.email" in str(e):
            return {"success": False, "error": "Email already in use"}
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def verify_user(username, password):
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user and check_password_hash(user["password_hash"], password):
        return {
            "success": True, 
            "user_id": user["id"], 
            "username": user["username"], 
            "balance": user["balance"]
        }
    return {"success": False, "error": "Invalid username or password"}

def get_user_data(user_id):
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, username, email, balance FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return {
            "user_id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "balance": user["balance"]
        }
    return None

def update_user_balance(user_id, new_balance):
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE users SET balance = ? WHERE id = ?",
            (new_balance, user_id)
        )
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

# Pick management functions
def save_user_pick(user_id, pick_data, bet_amount, mode):
    import json
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Convert pick data to JSON string
        pick_json = json.dumps(pick_data)
        
        cursor.execute(
            "INSERT INTO picks (user_id, pick_data, bet_amount, mode) VALUES (?, ?, ?, ?)",
            (user_id, pick_json, bet_amount, mode)
        )
        conn.commit()
        pick_id = cursor.lastrowid
        return {"success": True, "pick_id": pick_id}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def complete_pick(pick_id, result, payout):
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE picks SET is_completed = 1, result = ?, payout = ? WHERE id = ?",
            (result, payout, pick_id)
        )
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

def get_user_picks(user_id):
    import json
    db_path = os.path.join(os.path.dirname(__file__), "users.db")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM picks WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    )
    picks = cursor.fetchall()
    conn.close()
    
    result = []
    for pick in picks:
        pick_data = json.loads(pick["pick_data"])
        result.append({
            "id": pick["id"],
            "pick_data": pick_data,
            "bet_amount": pick["bet_amount"],
            "mode": pick["mode"],
            "is_completed": pick["is_completed"],
            "result": pick["result"],
            "payout": pick["payout"],
            "created_at": pick["created_at"]
        })
    
    return result

# Initialize database when module is imported
if __name__ == "__main__":
    init_db()