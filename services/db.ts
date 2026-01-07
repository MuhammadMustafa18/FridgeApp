import { Item, Recipe, RecipeTemp } from "@/types";
import * as SQLite from "expo-sqlite";


export const db = SQLite.openDatabaseSync("kitchen.db");

export const initDB = async () => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        image_url TEXT,
        quantity INTEGER,
        status TEXT DEFAULT 'draft'
      );
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        image_url TEXT,
        ingredients TEXT,
        how_to_cook TEXT,
        time TEXT,
        difficulty TEXT,
        servings TEXT
      );
    `);
    // Migration support for existing tables without status
    try {
      await db.execAsync("ALTER TABLE items ADD COLUMN status TEXT DEFAULT 'draft'");
    } catch (e) {
      // Include a comment or log for ignored error
      console.log("Column 'status' likely exists or error adding it:", e);
    }

    try {
      await db.execAsync("ALTER TABLE recipes ADD COLUMN time TEXT");
      await db.execAsync("ALTER TABLE recipes ADD COLUMN difficulty TEXT");
      await db.execAsync("ALTER TABLE recipes ADD COLUMN servings TEXT");
    } catch (e) {
      console.log("Columns likely exist:", e);
    }

    console.log("DB initialized");
  } catch (error) {
    console.log("DB init error", error);
    throw error;
  }
};
// services/db.ts
export const saveRecipe = (recipe: RecipeTemp) => {
  const ingredientsStr = recipe.ingredients.join(", ");
  try {
    db.runAsync(
      `INSERT INTO recipes (name, image_url, ingredients, how_to_cook, time, difficulty, servings) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        recipe.name,
        recipe.image_url || "",
        ingredientsStr,
        recipe.how_to_cook || "",
        recipe.time || "",
        recipe.difficulty || "",
        recipe.servings || "",
      ]
    );
    console.log("Recipe saved:", recipe.name);
  } catch (error) {
    console.error("Error saving recipe:", error);
  }
};
export const getRecipes = async (
): Promise<Recipe[]> => {
  try {
    const result = await db.getAllAsync<Recipe>(
      "SELECT * FROM recipes"
    );
    return result;
  } catch (error) {
    console.error("Error getting recipes:", error);
    return [];
  }
};


export const addItem = async (name: string, quantity: number, image_url: string = "") => {
  try {
    await db.runAsync(
      "INSERT INTO items (name, quantity, image_url, status) VALUES (?, ?, ?, 'draft')",
      [name, quantity, image_url]
    );
    console.log(`Added item: ${name}`);
  } catch (error) {
    console.error("Error adding item:", error);
    throw error;
  }
};

export const getItems = async (status: 'draft' | 'confirmed'): Promise<Item[]> => {
  try {
    const result = await db.getAllAsync<Item>("SELECT * FROM items WHERE status = ?", [status]);
    return result;
  } catch (error) {
    console.error("Error getting items:", error);
    return [];
  }
};

export const updateItemStatus = async (id: number, status: 'draft' | 'confirmed') => {
  try {
    // 1. Get the details of the item we are about to confirm
    const draftItem = await db.getFirstAsync<{
      name: string;
      quantity: number;
    }>("SELECT name, quantity FROM items WHERE id = ?", [id]);

    // not confirmed hi sahi, lekin hoga zaroor
    if (!draftItem) return;

    // 2. Check if a 'confirmed' item with the same name already exists
    const existingItem = await db.getFirstAsync<{
      id: number;
      quantity: number;
    }>(
      "SELECT id, quantity FROM items WHERE LOWER(name) = LOWER(?) AND status = 'confirmed' LIMIT 1",
      [draftItem.name]
    );

    if (existingItem) {
      // 3. COLLAPSE: Update the existing item's quantity and delete the draft
      await db.runAsync(
        "UPDATE items SET quantity = quantity + ? WHERE id = ?",
        [draftItem.quantity, existingItem.id]
      );
      await db.runAsync("DELETE FROM items WHERE id = ?", [id]);
      console.log(`Merged ${draftItem.name} into existing entry.`);
    } else {
      // 4. NO MATCH: Just confirm it normally
      await db.runAsync(
        "UPDATE items SET status = 'confirmed' WHERE id = ?",
        [id]
      );
      console.log(`Added ${draftItem.name} into inventory, new entry.`);
    }

  } catch (error) {
    console.error("Error updating status:", error);
    throw error;
  }
};
export const updateItemQuantity = async (
  id: number,
  quantity: number
) => {
  try {
    await db.runAsync("UPDATE items SET quantity = ? WHERE id = ?", [
      quantity,
      id,
    ]);
  } catch (error) {
    console.error("Error updating quantity:", error);
    throw error;
  }
};

export const updateItemName = async (id: number, name: string) => {
  try {
    await db.runAsync("UPDATE items SET name = ? WHERE id = ?", [
      name,
      id,
    ]);
  } catch (error) {
    console.error("Error updating name:", error);
    throw error;
  }
};
export const confirmAllItems = async () => {
  try {
    await db.runAsync("UPDATE items SET status = 'confirmed' WHERE status = 'draft'");
  } catch (error) {
    console.error("Error confirming all items:", error);
    throw error;
  }
};

export const deleteItem = async (id: number) => {
  try {
    await db.runAsync("DELETE FROM items WHERE id = ?", [id]);
    console.log(`Deleted item id: ${id}`);
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};

export const deleteRecipe = async (id: number) => {
  try {
    await db.runAsync("DELETE FROM recipes WHERE id = ?", [id]);
    console.log(`Deleted recipe id: ${id}`);
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

export const deleteRecipeByName = async (name: string) => {
  try {
    await db.runAsync("DELETE FROM recipes WHERE name = ?", [name]);
    console.log(`Deleted recipe key: ${name}`);
  } catch (error) {
    console.error("Error deleting recipe:", error);
    throw error;
  }
};

export const updateRecipeMetadata = async (
  id: number,
  time: string,
  difficulty: string,
  servings: string
) => {
  try {
    await db.runAsync(
      "UPDATE recipes SET time = ?, difficulty = ?, servings = ? WHERE id = ?",
      [time, difficulty, servings, id]
    );
  } catch (error) {
    console.error("Error updating recipe metadata:", error);
    throw error;
  }
};

