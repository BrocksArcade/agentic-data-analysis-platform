#!/usr/bin/env node

const fs = require('fs');

const NUM_ROWS = 40000;
const OUTPUT_FILE = 'sample_data.csv';

const CATEGORIES = ['Mobile Phones', 'Electronics', 'Groceries', 'Household', 'Apparel', 'Home & Kitchen'];
const PRODUCTS = {
  'Mobile Phones': ['iPhone 15', 'Samsung S24', 'Pixel 8', 'OnePlus 12', 'Xiaomi 14'],
  'Electronics': ['Laptop', 'Tablet', 'Smartwatch', 'Earbuds', 'Speaker'],
  'Groceries': ['Rice', 'Wheat', 'Dal', 'Oil', 'Sugar', 'Salt', 'Tea', 'Coffee'],
  'Household': ['Detergent', 'Soap', 'Shampoo', 'Toothpaste', 'Tissue'],
  'Apparel': ['T-Shirt', 'Jeans', 'Shirt', 'Dress', 'Jacket'],
  'Home & Kitchen': ['Plate', 'Glass', 'Utensil Set', 'Bed Sheet', 'Pillow']
};
const STORES = ['Store_Mumbai_01', 'Store_Delhi_02', 'Store_Bangalore_03', 'Store_Chennai_04'];
const PAYMENT = ['Cash', 'Card', 'UPI', 'Net Banking'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomDate() {
  const start = new Date(2022, 0, 1).getTime();
  const end = new Date(2024, 5, 14).getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  return date.toISOString().split('T')[0];
}

function randomTime() {
  const h = randomInt(9, 21);
  const m = randomInt(0, 59);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function getRandomElement(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function generateRow(id) {
  const category = getRandomElement(CATEGORIES);
  const product = getRandomElement(PRODUCTS[category]);
  const basePrice = randomFloat(100, 150000);
  const discount = randomInt(0, 20);
  const sellingPrice = (basePrice * (1 - discount / 100)).toFixed(2);
  const quantity = randomInt(1, 20);
  const revenue = (sellingPrice * quantity).toFixed(2);
  const margin = randomInt(5, 40);
  const profit = (revenue * margin / 100).toFixed(2);

  return [
    `TXN${String(id).padStart(8, '0')}`,
    randomDate(),
    randomTime(),
    getRandomElement(STORES),
    category,
    product,
    basePrice,
    sellingPrice,
    discount,
    quantity,
    getRandomElement(['Unit', 'Box', 'Pack', 'Kg']),
    revenue,
    margin,
    profit,
    getRandomElement(PAYMENT),
    getRandomElement(['Regular', 'Premium', 'Guest']),
    getRandomElement(['Low', 'Medium', 'High'])
  ].join(',');
}

console.log(`Generating ${NUM_ROWS.toLocaleString()} rows of sample data...`);

const headers = [
  'Transaction_ID',
  'Date',
  'Time',
  'Store',
  'Category',
  'Product',
  'Base_Price',
  'Selling_Price',
  'Discount_Percent',
  'Quantity',
  'Unit',
  'Revenue',
  'Profit_Margin_Percent',
  'Profit',
  'Payment_Method',
  'Customer_Type',
  'Stock_Level'
].join(',');

const stream = fs.createWriteStream(OUTPUT_FILE);
stream.write(headers + '\n');

for (let i = 1; i <= NUM_ROWS; i++) {
  stream.write(generateRow(i) + '\n');
  if (i % 5000 === 0) {
    console.log(`  Generated ${i.toLocaleString()} rows...`);
  }
}

stream.end();

stream.on('finish', () => {
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`\n✅ Dataset created: ${OUTPUT_FILE}`);
  console.log(`   Rows: ${NUM_ROWS.toLocaleString()}`);
  console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Columns: 17`);
  console.log(`\n📤 Ready to upload to the dashboard!`);
});

stream.on('error', (err) => {
  console.error('Error writing file:', err);
  process.exit(1);
});
