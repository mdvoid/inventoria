import React, { createContext, useContext, useState } from 'react';
import { InventoryItem, Warehouse } from '../types';
import { inventory as initialInventory, warehouses as initialWarehouses } from '../data/mockData';

interface InventoryContextType {
  inventory: InventoryItem[];
  warehouses: Warehouse[];
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  updateWarehouse: (id: string, warehouse: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;
  transferItem: (itemId: string, targetWarehouseId: string, quantity: number) => void;
  getLowStockItems: () => InventoryItem[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);

  const addItem = (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setInventory([...inventory, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(inventory.map(item => 
      item.id === id 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    ));
  };

  const deleteItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  const addWarehouse = (warehouse: Omit<Warehouse, 'id'>) => {
    const newWarehouse: Warehouse = {
      ...warehouse,
      id: Date.now().toString(),
    };
    setWarehouses([...warehouses, newWarehouse]);
  };

  const updateWarehouse = (id: string, updates: Partial<Warehouse>) => {
    setWarehouses(warehouses.map(warehouse => 
      warehouse.id === id ? { ...warehouse, ...updates } : warehouse
    ));
  };

  const deleteWarehouse = (id: string) => {
    setWarehouses(warehouses.filter(warehouse => warehouse.id !== id));
  };

  const transferItem = (itemId: string, targetWarehouseId: string, quantity: number) => {
    const sourceItem = inventory.find(item => item.id === itemId);
    if (!sourceItem || sourceItem.quantity < quantity) return;

    // Create or update item in target warehouse
    const existingTargetItem = inventory.find(
      item => item.name === sourceItem.name && item.warehouseId === targetWarehouseId
    );

    if (existingTargetItem) {
      updateItem(existingTargetItem.id, {
        quantity: existingTargetItem.quantity + quantity
      });
    } else {
      addItem({
        ...sourceItem,
        quantity,
        warehouseId: targetWarehouseId,
      });
    }

    // Update source item quantity
    updateItem(itemId, {
      quantity: sourceItem.quantity - quantity
    });
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= item.threshold);
  };

  return (
    <InventoryContext.Provider value={{
      inventory,
      warehouses,
      addItem,
      updateItem,
      deleteItem,
      addWarehouse,
      updateWarehouse,
      deleteWarehouse,
      transferItem,
      getLowStockItems,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};