import pandas as pd

# Define the mock dataset
data = {
    "Date": ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05", "2026-01-06", "2026-01-07"],
    "Product": ["Manga Sketchbook", "Cyberpunk Keyboard", "Gamer Fuel Energy", "Manga Sketchbook", "Cyberpunk Keyboard", "Gamer Fuel Energy", "Neon Desk Mat"],
    "Category": ["Stationery", "Electronics", "Groceries", "Stationery", "Electronics", "Groceries", "Electronics"],
    "UnitsSold": [50, 10, 100, 35, 15, 120, 45],
    "UnitPrice": [15, 120, 4, 15, 120, 4, 30],
    "Revenue": [750, 1200, 400, 525, 1800, 480, 1350],
    "Region": ["North", "West", "East", "South", "North", "West", "East"]
}

# Turn it into a DataFrame and save it as a CSV file
df = pd.DataFrame(data)
df.to_csv("mock_sales.csv", index=False)

print("🚀 'mock_sales.csv' has been generated successfully in your current directory!")