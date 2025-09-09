import pandas as pd
from datetime import datetime
import random

# Load the scraped props CSV file
def load_props(csv_path='underdog_props.csv'):
    try:
        df = pd.read_csv(csv_path)
        return df
    except FileNotFoundError:
        print(f"File {csv_path} not found. Please run the scraper first.")
        return None

def find_player_props(df, player_name):
    # Case-insensitive search for player name
    matches = df[df['full_name'].fillna('').str.lower().str.contains(player_name.lower())]
    return matches

# standard underdog powerplay calculation
def powerplay_payout(n):
    if n == 1:
        return 1.5
    elif n == 2:
        return 3
    elif n == 3:
        return 6
    elif n == 4:
        return 10
    elif n == 5:
        return 20
    elif n == 6:
        return 35
    elif n == 7:
        return 65
    elif n == 8:
        return 120
    else:
        return 0
    
# standard underdog flex calculation
def flex_payout(n, losses):
    if losses == 0:
        if n == 8:
            return 80
        elif n == 7:
            return 40
        elif n == 6:
            return 25
        elif n == 5:
            return 10
        elif n == 4: 
            return 6
        elif n == 3:
            return 3
    elif losses == 1:
        if n == 8:
            return 3
        elif n == 7:
            return 2.75
        elif n == 6:
            return 2.6
        elif n == 5:
            return 2.5
        elif n == 4: 
            return 1.5
        elif n == 3:
            return 1
    elif losses == 2:
        if n == 8:
            return 1
        elif n == 7:
            return 0.5
        elif n == 6:
            return 0.25
    return 0

def main():
    df = load_props()
    if df is None:
        return
    # List all unique players
    unique_players = df['full_name'].dropna().unique()
    unique_players = sorted(unique_players)
    picks = []
    balance = 1000.0  # Starting fake balance
    flex_mode = False
    menu = ("\nMenu:\n"
            "1. View picks\n"
            "2. Show balance\n"
            "3. Show player list\n"
            "4. Toggle Flex Mode\n"
            "5. Remove a pick\n"
            "6. Save picks\n"
            "7. Exit\n")
    
    print(f"\nCurrent balance: ${balance:.2f}")

    while True:
        print(menu)
        player_choice = input("Enter a number (1-7) or type a player name/number: ").strip()
        
        # 1. View picks
        if player_choice == '1' or player_choice.lower() == 'picks':
            if not picks:
                print("\nYou have not made any picks yet.")
            else:
                print("\nYour Picks:")
                for pick in picks:
                    print(f"- {pick['player']} | {pick['stat']} (Line: {pick['line']}): {pick['pick']}")
                n = len(picks)
                
                if flex_mode:
                    print(f"\nFlex payout for {n} picks: {flex_payout(n, 0)}x")
                    print(f"- If 1 loss: {flex_payout(n, 1)}x")
                    if n >= 6:
                        print(f"- If 2 losses: {flex_payout(n, 2)}x")
                else:
                    print(f"\nPowerPlay payout for {n} picks: {powerplay_payout(n)}x.")
            continue

        # 2. Show balance
        if player_choice == '2' or player_choice.lower() == 'bal':
            print(f"\nYour current balance is: ${balance:.2f}")
            continue

        # 3. Show player list    
        if player_choice == '3' or player_choice.lower() == 'list':
            print("\nAvailable Players:")
            for i, pname in enumerate(unique_players, 1):
                print(f"{i}. {pname}")
            continue

        # 4. Toggle Flex Mode
        if player_choice == '4' or player_choice.lower() == 'flex':
            if len(picks) < 3:
                print("\nYou need at least 3 picks to enable Flex mode.")
            else:
                flex_mode = not flex_mode
                print(f"\nFlex mode is now {'ON' if flex_mode else 'OFF'}.")
            continue

        # 5. Remove a pick
        if player_choice == '5' or player_choice.lower() == 'remove':
            if not picks:
                print("\nYou have no picks to remove.")
                continue
            print("\nYour Picks:")
            for i, pick in enumerate(picks, 1):
                print(f"{i}. {pick['player']} | {pick['stat']} (Line: {pick['line']}): {pick['pick']}")
            to_remove = input("Enter the number of the pick to remove (or 'back' to cancel): ").strip()
            if to_remove.lower() == 'back':
                continue
            if not to_remove.isdigit() or int(to_remove) < 1 or int(to_remove) > len(picks):
                print("Invalid selection.")
                continue
            removed = picks.pop(int(to_remove)-1)
            print(f"Removed: {removed['player']} | {removed['stat']} (Line: {removed['line']}): {removed['pick']}")
            continue

        # 6. Save picks
        if player_choice == '6' or player_choice.lower() == 'save':
            if not picks:
                print("\nNo picks to save.")
            else:
                picks_df = pd.DataFrame(picks)
                now = datetime.now().strftime('%Y-%m-%d_%H%M')
                filename = f"Data/my_picks_{now}.csv"
                picks_df.to_csv(filename, index=False)
                n = len(picks)
                multiplier = flex_payout(n, 0) if flex_mode else powerplay_payout(n)
                flex_payouts = ''
                if flex_mode:
                    flex_payouts = '\n'.join([
                        f"If 1 loss: {flex_payout(n, 1)}x",
                        f"If 2 losses: {flex_payout(n, 2)}x" if n >= 6 else ''
                    ])
                while True:
                    try:
                        bet = float(input(f"Enter bet amount (balance: ${balance:.2f}): "))
                        if bet <= 0 or bet > balance:
                            print("Invalid bet amount.")
                        else:
                            break
                    except ValueError:
                        print("Please enter a valid number.")
                potential_winnings = bet * multiplier
                with open(filename, 'a') as f:
                    f.write(f"\nBet: ${bet}\n")
                    f.write(f"Multiplier: {multiplier}x\n")
                    if flex_mode:
                        f.write(f"Flexed Payout: ${potential_winnings:.2f}\n{flex_payouts}\n")
                    else:
                        f.write(f"PowerPlay Payout: ${potential_winnings:.2f}\n")

                # random for now
                win = random.choice([True, False])
                if win:
                    balance += potential_winnings - bet
                    print(f"You WON! You receive ${potential_winnings:.2f} (profit: ${potential_winnings-bet:.2f})")
                else:
                    balance -= bet
                    print(f"You LOST! You lose your bet of ${bet:.2f}")
                print(f"New balance: ${balance:.2f}")
                if balance <= 0:
                    print("You are out of money!")
                    break
                play_again = input("Do you want to keep playing? (y/n): ").strip().lower()
                if play_again != 'y':
                    break
            break

        # 7. Exit
        if player_choice == '7' or player_choice.lower() == 'exit':
            break
        
        
        
        # Try number selection first
        player_name = None
        if player_choice.isdigit() and 1 <= int(player_choice) <= len(unique_players):
            player_name = unique_players[int(player_choice)-1]
        else:
            matches_by_name = [p for p in unique_players if player_choice.lower() in p.lower()]
            if len(matches_by_name) == 1:
                player_name = matches_by_name[0]
            elif len(matches_by_name) > 1:
                print("Multiple players matched. Please be more specific or use the number:")
                for p in matches_by_name:
                    print(f"- {p}")
                continue
            else:
                print("No player matched that name. Try again.")
                continue
        matches = find_player_props(df, player_name)
        if matches.empty:
            print(f"No props found for '{player_name}'. Try again.")
            continue
        print(f"\nProps for {player_name}:")
        prop_list = []
        for idx, row in matches.iterrows():
            stat = row.get('stat_name', 'Stat')
            line = row.get('stat_value')
            if pd.isna(line):
                line = row.get('line')
            if pd.isna(line):
                line = row.get('value', 'N/A')
            prop_list.append((idx, stat, line))
            print(f"{len(prop_list)}. {stat} (Line: {line})")
        print("Type the number of the prop to pick, or 'back' to return to player selection.")
        choice = input("Your choice: ").strip().lower()
        if choice == 'back':
            continue
        if not choice.isdigit() or int(choice) < 1 or int(choice) > len(prop_list):
            print("Invalid choice. Returning to player selection.")
            continue
        prop_idx, stat, line = prop_list[int(choice)-1]
        for existing in picks:
            if existing['player'] == player_name and existing['stat'] == stat and existing['line'] == line:
                print(f"You already picked this prop for {player_name} - {stat} (Line: {line}).")
                break
        else:
            # Enforce max 8 picks
            if len(picks) >= 8:
                print("You have reached the maximum of 8 picks per slip. Save or remove a pick before adding more.")
                continue
            while True:
                pick = input(f"Pick 'over' or 'under' for {player_name} {stat} (Line: {line}): ").strip().lower()
                if pick in ['over', 'under']:
                    if any(p['player'] == player_name and p['stat'] == stat and p['line'] == line and p['pick'] != pick for p in picks):
                        print(f"You already picked the opposite for this prop. Remove it first if you want to change.")
                        break
                    print(f"You picked {pick} for {player_name} - {stat} (Line: {line})\n")
                    picks.append({'player': player_name, 'stat': stat, 'line': line, 'pick': pick})
                    break
                else:
                    print("Invalid input. Please type 'over' or 'under'.")
        # After picking, return to player selection

if __name__ == "__main__":
    main()
