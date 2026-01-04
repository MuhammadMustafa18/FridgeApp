import { getItems, Item } from "@/services/db";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [items, setItems] = useState<Item[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    const data = await getItems();
    setItems(data);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.appTitle}>FridgeScan 🧊</Text>

      {/* Scan Section */}
      <View style={styles.cardPrimary}>
        <Text style={styles.cardTitle}>Scan</Text>
        <Text style={styles.cardSubtitle}>
          Take a photo of your fridge or food
        </Text>
      </View>

      {/* Items Section */}
      <View>
        <Text style={styles.sectionTitle}>My Fridge ({items.length})</Text>
        <View style={styles.itemsGrid}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={{ uri: item.image_url || "https://via.placeholder.com/150" }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
              </View>
            </View>
          ))}
          {items.length === 0 && (
            <Text style={styles.emptyText}>No items yet. Scan some food!</Text>
          )}
        </View>
      </View>

      {/* Recipes Section */}
      <View style={[styles.card, { marginTop: 20 }]}>
        <Text style={styles.cardTitle}>Recipes</Text>
        <Text style={styles.cardSubtitle}>Get meal ideas from your items</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#111",
    marginBottom: 24,
    marginTop: 20,
  },
  cardPrimary: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#444", // Darker for better readibility on white/green
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemCard: {
    width: "48%", // Roughly 2 columns
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 4,
  },
  itemImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  itemInfo: {
    padding: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    color: "#888",
    fontStyle: "italic",
    width: "100%",
    textAlign: "center",
    marginTop: 20,
  },
});
