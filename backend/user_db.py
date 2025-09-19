import os
import json
import time
from werkzeug.security import generate_password_hash, check_password_hash
import threading

# Database file path
DB_FILE = os.path.join(os.path.dirname(__file__), "users_db.json")
# Lock for thread safety
db_lock = threading.Lock()

# Initialize database with default structure if it doesn't exist
def init_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, 'w') as f:
            json.dump({"users": {}}, f)
        print(f"Created new user database at {DB_FILE}")

# Load database
def load_db():
    try:
        with db_lock:
            with open(DB_FILE, 'r') as f:
                return json.load(f)
    except FileNotFoundError:
        init_db()
        return {"users": {}}
    except json.JSONDecodeError:
        print("Error: Database file is corrupted. Creating new database.")
        init_db()
        return {"users": {}}

# Save database
def save_db(db_data):
    with db_lock:
        with open(DB_FILE, 'w') as f:
            json.dump(db_data, f, indent=2)

# User management functions
def register_user(username, password, email=''):
    """Register a new user and return the user data"""
    db_data = load_db()
    
    # Check if username already exists
    if username.lower() in [u.lower() for u in db_data["users"]]:
        return {"success": False, "error": "Username already exists"}
    
    # Create new user
    user_data = {
        "username": username,
        "password_hash": generate_password_hash(password),
        "email": email,
        "balance": 1000.0,  # Default starting balance
        "created_at": int(time.time()),
        "picks_history": []
    }
    
    # Add to database
    db_data["users"][username] = user_data
    save_db(db_data)
    
    # Return sanitized user data (no password hash)
    return {
        "success": True,
        "username": username,
        "email": email,
        "balance": 1000.0,
        "created_at": user_data["created_at"]
    }

def authenticate_user(username, password):
    """Authenticate a user and return user data if successful"""
    db_data = load_db()
    
    # Case-insensitive username lookup
    user_entry = None
    for user_key in db_data["users"]:
        if user_key.lower() == username.lower():
            user_entry = db_data["users"][user_key]
            username = user_key  # Use correct case
            break
    
    # Check if user exists and password is correct
    if user_entry and check_password_hash(user_entry["password_hash"], password):
        return {
            "success": True,
            "username": username,
            "email": user_entry.get("email", ""),
            "balance": user_entry.get("balance", 1000.0),
            "created_at": user_entry.get("created_at", int(time.time()))
        }
    
    return {"success": False, "error": "Invalid username or password"}

def get_user(username):
    """Get user data by username"""
    db_data = load_db()
    
    # Case-insensitive username lookup
    for user_key in db_data["users"]:
        if user_key.lower() == username.lower():
            user_data = db_data["users"][user_key]
            return {
                "success": True,
                "username": user_key,
                "email": user_data.get("email", ""),
                "balance": user_data.get("balance", 1000.0),
                "created_at": user_data.get("created_at", 0)
            }
    
    return {"success": False, "error": "User not found"}

def update_user_balance(username, new_balance):
    """Update a user's balance"""
    db_data = load_db()
    
    # Case-insensitive username lookup
    for user_key in db_data["users"]:
        if user_key.lower() == username.lower():
            db_data["users"][user_key]["balance"] = new_balance
            save_db(db_data)
            return True
    
    return False

def add_pick_to_history(username, pick_data):
    """Add a pick to user's history"""
    db_data = load_db()
    
    # Case-insensitive username lookup
    for user_key in db_data["users"]:
        if user_key.lower() == username.lower():
            # Initialize picks_history if it doesn't exist
            if "picks_history" not in db_data["users"][user_key]:
                db_data["users"][user_key]["picks_history"] = []
            
            # Add pick to history
            db_data["users"][user_key]["picks_history"].append(pick_data)
            save_db(db_data)
            return True
    
    return False

def get_user_picks_history(username):
    """Get a user's pick history"""
    db_data = load_db()
    
    # Case-insensitive username lookup
    for user_key in db_data["users"]:
        if user_key.lower() == username.lower():
            return db_data["users"][user_key].get("picks_history", [])
    
    return []

# Initialize the database at import time
init_db()