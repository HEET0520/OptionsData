import pandas as pd

# Load CSVs
df = pd.read_csv("stock.csv")
mapping = pd.read_csv("icici_mappings.csv")  # columns: ShortName, ExchangeCode

# Extract ExchangeCode from Script
df['icici_symbol'] = df['Script'].str.extract(r'^([A-Z&]+)')

# Map to ShortName
df = df.merge(mapping, left_on='icici_symbol', right_on='ExchangeCode', how='left')
df['icici_symbol'] = df['ShortName']  # now icici_symbol contains ShortName
df.drop(['ShortName', 'ExchangeCode'], axis=1, inplace=True)

# Extract strike price (handles decimals)
df['strike_price'] = df['Script'].str.extract(r'_(\d+\.?\d*)(CE|PE)$')[0]

# Convert strike to string, keeping integers clean
df['strike_price'] = df['strike_price'].astype(float).apply(lambda x: str(int(x)) if x.is_integer() else str(x))

# Extract right (Call/Put)
df['right'] = df['Script'].str.extract(r'(CE|PE)$')[0].map({'CE':'Call','PE':'Put'})

# Fixed expiry values
df['Expiry Day'] = 30
df['Expiry Month'] = '09'
df['Expiry Year'] = 2025
df['expiry'] = df['Expiry Year'].astype(str) + '-' + df['Expiry Month'] + '-' + df['Expiry Day'].astype(str)

# Save final CSV
df.to_csv("parsed_stocks_mapped.csv", index=False)

print(df.head())
