"""
Test script to verify user_db functionality
"""
import user_db

def test_user_registration():
    print("Testing user registration...")
    result = user_db.register_user("testuser", "password123", "test@example.com")
    print(f"Registration result: {result}")
    
    # Try registering again with same username
    result2 = user_db.register_user("testuser", "different", "other@example.com")
    print(f"Duplicate registration result: {result2}")
    
def test_user_authentication():
    print("\nTesting user authentication...")
    result = user_db.authenticate_user("testuser", "password123")
    print(f"Correct credentials: {result}")
    
    result = user_db.authenticate_user("testuser", "wrongpass")
    print(f"Incorrect password: {result}")
    
    result = user_db.authenticate_user("nonexistent", "anypass")
    print(f"Nonexistent user: {result}")

def test_balance_update():
    print("\nTesting balance update...")
    original = user_db.get_user("testuser")
    print(f"Original balance: ${original['balance']}")
    
    user_db.update_user_balance("testuser", 2000)
    updated = user_db.get_user("testuser")
    print(f"Updated balance: ${updated['balance']}")
    
def test_picks_history():
    print("\nTesting picks history...")
    pick_data = {
        "created_at": 1632150000,
        "picks": [{"player": "Test Player", "stat": "pts", "value": "25.5", "pick": "OVER"}],
        "bet_amount": 50,
        "mode": "PowerPlay",
        "result": "win",
        "payout": 100,
        "is_completed": True
    }
    
    user_db.add_pick_to_history("testuser", pick_data)
    history = user_db.get_user_picks_history("testuser")
    print(f"User now has {len(history)} picks in history")
    
if __name__ == "__main__":
    test_user_registration()
    test_user_authentication()
    test_balance_update()
    test_picks_history()
    print("\nAll tests completed!")