# Fantasy Pick'em Simulator - Account System

This document explains how to use the new user account system in the Fantasy Pick'em Simulator.

## Features

- **User Registration & Login**: Create your own account to track your picks and balance
- **Persistent Balance**: Your virtual balance is saved between sessions
- **Pick History**: All your past picks are saved to your account
- **Multiple Users**: Different users can have their own picks and balances

## Setup Instructions

1. Make sure both the backend and frontend are running:
   - Backend: Navigate to the `backend` folder and run `python api.py`
   - Frontend: Open `index.html` in your browser

2. Database Setup:
   - The user database will be created automatically on first run
   - User data is stored in a SQLite database file (`users.db`) in the backend directory

## How to Use

### Registration

1. Click "Register" button in the top-right corner
2. Enter your desired username and password
3. Email is optional but recommended
4. Click "Register" to create your account
5. You'll be logged in automatically with a starting balance of $1,000

### Login

1. Click "Login" button in the top-right corner
2. Enter your username and password
3. Click "Login" to access your account

### Making Picks

1. Browse available player props in the "Props" tab
2. Select props and click OVER or UNDER to add to your picks
3. Switch to "My Picks" tab to see your selections
4. Toggle between OVER and UNDER by clicking on the pick type button
5. Enter your bet amount
6. Click "Save Picks" to place your bet
7. Your balance will update based on the outcome

### Viewing Past Picks

1. Go to the "My Picks" tab
2. Click "Load Past Picks" to see your pick history
3. Your past picks will be displayed with dates, outcomes, and payouts

### Logout

1. Click "Logout" in the top-right corner when you're done
2. Your balance and picks will be saved for your next login

## Technical Notes

- User passwords are securely hashed and not stored in plain text
- The session stays active for 7 days before requiring re-login
- Each user has their own independent balance and pick history

## Troubleshooting

- If you encounter login issues, try clearing your browser cookies
- Make sure both the backend server and database are running
- Check the browser console for any error messages