"use client";

import { useState } from 'react';

// Sample data for the table
const initialData = [
  { id: 1, product: 'Widget A', category: 'Electronics', price: 299, stock: 24, sales: 852 },
  { id: 2, product: 'Gadget B', category: 'Electronics', price: 199, stock: 18, sales: 753 },
  { id: 3, product: 'Tool C', category: 'Hardware', price: 49.99, stock: 56, sales: 419 },
  { id: 4, product: 'Accessory D', category: 'Apparel', price: 29.99, stock: 120, sales: 327 },
  { id: 5, product: 'Product E', category: 'Home Goods', price: 79.99, stock: 37, sales: 298 },
  { id: 6, product: 'Item F', category: 'Electronics', price: 599, stock: 12, sales: 176 },
  { id: 7, product: 'Component G', category: 'Hardware', price: 159.99, stock: 28, sales: 321 },
  { id: 8, product: 'Solution H', category: 'Software', price: 99.99, stock: null, sales: 492 },
];

interface DataTableProps {
  title?: string;
}

export default function DataTable({ title = "Product Data" }: DataTableProps) {
  const [data] = useState(initialData);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];
    
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  return (
    <div className="w-full overflow-hidden rounded-xl bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-xl font-semibold text-white">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full table-auto">
          <thead>
            <tr className="border-b border-gray-700">
              <th 
                className="cursor-pointer px-4 py-2 text-left font-medium text-gray-300 hover:text-white"
                onClick={() => handleSort('product')}
              >
                Product
                {sortColumn === 'product' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="cursor-pointer px-4 py-2 text-left font-medium text-gray-300 hover:text-white"
                onClick={() => handleSort('category')}
              >
                Category
                {sortColumn === 'category' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="cursor-pointer px-4 py-2 text-left font-medium text-gray-300 hover:text-white"
                onClick={() => handleSort('price')}
              >
                Price
                {sortColumn === 'price' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="cursor-pointer px-4 py-2 text-left font-medium text-gray-300 hover:text-white"
                onClick={() => handleSort('stock')}
              >
                Stock
                {sortColumn === 'stock' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="cursor-pointer px-4 py-2 text-left font-medium text-gray-300 hover:text-white"
                onClick={() => handleSort('sales')}
              >
                Sales
                {sortColumn === 'sales' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr 
                key={row.id} 
                className="border-b border-gray-800 hover:bg-white/5"
              >
                <td className="px-4 py-3 text-white">{row.product}</td>
                <td className="px-4 py-3 text-gray-300">{row.category}</td>
                <td className="px-4 py-3 text-gray-300">${row.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-300">
                  {row.stock === null ? (
                    <span className="text-amber-500">Out of stock</span>
                  ) : (
                    row.stock
                  )}
                </td>
                <td className="px-4 py-3 text-gray-300">{row.sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 