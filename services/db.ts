import * as SQLite from "expo-sqlite";


export interface Item {
    id: number;
    name: string;
    image_url: string;
    quantity: number;
}

export const db = SQLite.openDatabaseSync("kitchen.db");

export const initDB = async () => {
    try {
        await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        image_url TEXT,
        quantity INTEGER
      );
      CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        image_url TEXT,
        ingredients TEXT,
        how_to_cook TEXT
      );
    `);
        console.log("DB initialized");
    } catch (error) {
        console.log("DB init error", error);
        throw error;
    }
};

export const addItem = async (name: string, quantity: number, image_url: string = "") => {
    try {
        await db.runAsync(
            "INSERT INTO items (name, quantity, image_url) VALUES (?, ?, ?)",
            [name, quantity, image_url]
        );
        console.log(`Added item: ${name}`);
    } catch (error) {
        console.error("Error adding item:", error);
        throw error;
    }
};

export const getItems = async (): Promise<Item[]> => {
    try {
        const result = await db.getAllAsync<Item>("SELECT * FROM items");
        return result;
    } catch (error) {
        console.error("Error getting items:", error);
        return [];
    }
};
