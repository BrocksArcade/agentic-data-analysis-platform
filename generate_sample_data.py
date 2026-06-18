#!/usr/bin/env python3
"""
Generate a large retail dataset for testing the agentic data analysis platform.
Mimics D-Mart style multi-category retail data with 40k+ rows.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import string

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Configuration
NUM_ROWS = 40000
OUTPUT_FILE = 'sample_data.csv'

# Define categories and sub-products
CATEGORIES = {
    'Mobile Phones': {
        'products': ['iPhone 15', 'Samsung S24', 'Pixel 8', 'OnePlus 12', 'Xiaomi 14', 'Realme 12', 'iQOO 12', 'Vivo X100'],
        'price_range': (15000, 150000),
        'base_quantity': 1
    },
    'Electronics': {
        'products': ['Laptop', 'Tablet', 'Smartwatch', 'Earbuds', 'Speaker', 'Camera', 'Monitor', 'Router'],
        'price_range': (5000, 200000),
        'base_quantity': 1
    },
    'Groceries': {
        'products': ['Rice', 'Wheat', 'Dal', 'Oil', 'Sugar', 'Salt', 'Tea', 'Coffee', 'Spices', 'Flour', 'Milk', 'Butter'],
        'price_range': (50, 500),
        'base_quantity': lambda: np.random.randint(1, 20)
    },
    'Household': {
        'products': ['Detergent', 'Soap', 'Shampoo', 'Toothpaste', 'Tissue', 'Bin Bag', 'Dish Soap', 'Bleach'],
        'price_range': (30, 300),
        'base_quantity': lambda: np.random.randint(1, 10)
    },
    'Apparel': {
        'products': ['T-Shirt', 'Jeans', 'Shirt', 'Dress', 'Jacket', 'Shoes', 'Socks', 'Underwear'],
        'price_range': (200, 5000),
        'base_quantity': lambda: np.random.randint(1, 5)
    },
    'Home & Kitchen': {
        'products': ['Plate', 'Glass', 'Utensil Set', 'Bed Sheet', 'Pillow', 'Towel', 'Mat', 'Curtain'],
        'price_range': (100, 3000),
        'base_quantity': lambda: np.random.randint(1, 5)
    }
}

STORES = ['Store_Mumbai_01', 'Store_Delhi_02', 'Store_Bangalore_03', 'Store_Chennai_04', 'Store_Pune_05']
PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Net Banking', 'Wallet']

def generate_date():
    """Generate random date in last 2 years"""
    start = datetime(2022, 1, 1)
    end = datetime(2024, 6, 14)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return start + timedelta(days=random_days)

def apply_seasonality(base_price, date, category):
    """Apply seasonal variations to price"""
    month = date.month

    if category == 'Groceries':
        # Higher prices during festivals (Oct-Nov, Dec-Jan)
        if month in [10, 11, 12, 1]:
            return base_price * np.random.uniform(1.05, 1.15)
    elif category == 'Apparel':
        # Higher during seasons change
        if month in [3, 4, 9, 10]:
            return base_price * np.random.uniform(0.85, 1.0)
        else:
            return base_price * np.random.uniform(0.95, 1.1)
    elif category == 'Mobile Phones':
        # Price drops after new launches
        if month in [2, 8]:  # Post-launch months
            return base_price * np.random.uniform(0.95, 1.05)

    return base_price * np.random.uniform(0.98, 1.05)

def apply_discount(price, date, category):
    """Apply discounts based on day of week and category"""
    weekday = date.weekday()

    # Weekend and festival sales
    discount = 0
    if weekday >= 4:  # Weekend (Fri-Sun)
        discount = np.random.uniform(0, 0.05)

    if date.day in [1, 15]:  # Monthly sale
        discount += np.random.uniform(0, 0.08)

    if category == 'Electronics' and random.random() > 0.7:
        discount += np.random.uniform(0, 0.1)

    return max(0, price * (1 - discount))

def generate_dataset(num_rows):
    """Generate the main dataset"""
    data = []

    for i in range(num_rows):
        # Random category and product
        category = random.choice(list(CATEGORIES.keys()))
        cat_info = CATEGORIES[category]
        product = random.choice(cat_info['products'])

        # Base price
        base_price = random.uniform(*cat_info['price_range'])

        # Date
        date = generate_date()

        # Apply seasonality
        final_price = apply_seasonality(base_price, date, category)

        # Apply discounts
        final_price = apply_discount(final_price, date, category)

        # Quantity
        if callable(cat_info['base_quantity']):
            quantity = cat_info['base_quantity']()
        else:
            quantity = cat_info['base_quantity']

        # Quantity variation (bulk purchases)
        if random.random() > 0.85:
            quantity *= random.randint(2, 5)

        # Store
        store = random.choice(STORES)

        # Payment method
        payment = random.choice(PAYMENT_METHODS)

        # Customer type
        customer_type = random.choice(['Regular', 'Premium', 'Guest'])

        # Revenue
        revenue = final_price * quantity

        # Profit margin (varies by category)
        if category == 'Mobile Phones':
            margin = np.random.uniform(0.05, 0.15)
        elif category == 'Electronics':
            margin = np.random.uniform(0.10, 0.20)
        elif category == 'Groceries':
            margin = np.random.uniform(0.10, 0.25)
        else:
            margin = np.random.uniform(0.20, 0.40)

        profit = revenue * margin

        # Stock status
        stock_level = random.choice(['Low', 'Medium', 'High'])

        data.append({
            'Transaction_ID': f'TXN{str(i+1).zfill(8)}',
            'Date': date.strftime('%Y-%m-%d'),
            'Time': f'{random.randint(9, 21)}:{random.randint(0, 59):02d}',
            'Store': store,
            'Category': category,
            'Product': product,
            'Base_Price': round(base_price, 2),
            'Selling_Price': round(final_price, 2),
            'Discount_Percent': round((1 - final_price/base_price) * 100, 2),
            'Quantity': quantity,
            'Unit': random.choice(['Unit', 'Box', 'Pack', 'Kg', 'Liter']),
            'Revenue': round(revenue, 2),
            'Profit_Margin_Percent': round(margin * 100, 2),
            'Profit': round(profit, 2),
            'Payment_Method': payment,
            'Customer_Type': customer_type,
            'Stock_Level': stock_level,
            'Day_of_Week': date.strftime('%A'),
            'Month': date.strftime('%B'),
            'Season': ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter'][date.month - 1],
        })

    return pd.DataFrame(data)

def main():
    print(f"Generating {NUM_ROWS:,} rows of sample retail data...")
    df = generate_dataset(NUM_ROWS)

    # Save to CSV
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"\n✅ Dataset saved to: {OUTPUT_FILE}")
    print(f"\nDataset Summary:")
    print(f"  Total Rows: {len(df):,}")
    print(f"  Total Columns: {len(df.columns)}")
    print(f"  Date Range: {df['Date'].min()} to {df['Date'].max()}")
    print(f"\nCategories:")
    print(df['Category'].value_counts())
    print(f"\nRevenue Statistics:")
    print(f"  Total Revenue: ₹{df['Revenue'].sum():,.2f}")
    print(f"  Total Profit: ₹{df['Profit'].sum():,.2f}")
    print(f"  Avg Transaction: ₹{df['Revenue'].mean():,.2f}")
    print(f"  Max Transaction: ₹{df['Revenue'].max():,.2f}")
    print(f"\nStores:")
    print(df['Store'].value_counts())
    print(f"\nPayment Methods:")
    print(df['Payment_Method'].value_counts())
    print(f"\nFirst few rows:")
    print(df.head(10))

if __name__ == '__main__':
    main()
