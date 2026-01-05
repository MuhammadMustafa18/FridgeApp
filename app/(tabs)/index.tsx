import { useImagePreview } from "@/context/ImagePreviewContext";
import {
  addItem,
  confirmAllItems,
  deleteItem,
  getItems,
  Item,
  updateItemStatus,
} from "@/services/db";
import { searchItemImage } from "@/services/imageSearch";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import "../../global.css";

type Recipe = {
  name: string;
  ingredients: string[];
  image?: string; // optional, will fetch from Pexels
};

export default function HomeScreen() {
  const { previewImage, setPreviewImage } = useImagePreview();
  const [items, setItems] = useState<Item[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    const data = await getItems("draft");
    setItems(data);
  };

  const handleConfirmItem = async (id: number) => {
    try {
      await updateItemStatus(id, "confirmed");
      await loadItems();
    } catch (e) {
      Alert.alert("Error", "Failed to confirm item");
    }
  };

  const handleConfirmAll = async () => {
    try {
      await confirmAllItems();
      Alert.alert("Success", "All items added to inventory!");
      await loadItems();
    } catch (e) {
      Alert.alert("Error", "Failed to confirm all items");
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteItem(id);
      await loadItems(); // Refresh to show item is gone
    } catch (e) {
      Alert.alert("Error", "Failed to delete item");
    }
  };

  // ... (Manual Add State logic remains same, ensure handleAddItem calls loadItems at end)

  // Manual Add State
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [adding, setAdding] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [suggestedMeals, setSuggestedMeals] = useState<Recipe[]>([]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Required", "Please enter an item name");
      return;
    }

    try {
      setAdding(true);
      // 1. Get Image
      const imageUrl = await searchItemImage(newItemName);

      // 2. Add to DB
      const qty = parseInt(newItemQuantity) || 1;
      await addItem(newItemName, qty, imageUrl);
      
      // 3. Cleanup
      setNewItemName("");
      setNewItemQuantity("1");
      setModalVisible(false);

      // 5. append to local manually

      // 4. Refresh List
      await loadItems();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not add item");
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    console.log("Items changed, detected by recipe")
    console.log(items)
    if (items.length > 0) {
      (async () => {
        const recipesWithImages = await suggestRandomRecipe(items);
        setSuggestedMeals(recipesWithImages);
      })();
    }
  }, [items]);

  const suggestRandomRecipe = async (items: Item[]): Promise<Recipe[]> => {
    const availableNames = items.map((i) => i.name.toLowerCase());
    // Example simple recipe pool
    const recipes = [
      { name: "Omelette", ingredients: ["eggs", "milk", "cheese"] },
      { name: "Tomato Soup", ingredients: ["tomato", "water", "salt"] },
      { name: "Pancakes", ingredients: ["milk", "flour", "egg"] },
      { name: "Salad", ingredients: ["tomato", "lettuce", "cucumber"] },
      { name: "Fries", ingredients: ["potatoes"] },
      { name: "Pie", ingredients: ["blueberries"] },
    ];

    // Filter recipes that have at least one ingredient from available items
    const possibleRecipes = recipes.filter((recipe) =>
      recipe.ingredients.some((ing) => availableNames.includes(ing))
    );
    if (possibleRecipes.length === 0) return [];

    const recipesWithImages = await Promise.all(
      possibleRecipes.map(async (recipe) => {
        const imageUrl = await searchItemImage(recipe.name);
        return { ...recipe, image: imageUrl };
      })
    );
    return recipesWithImages;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <Text style={styles.appTitle}>FridgeScan 🧊</Text>

        {/* Recent Scan Preview */}
        {previewImage && (
          <View style={styles.cardPrimary}>
            <Text style={styles.cardTitle}>Recent Scan</Text>
            <Image
              source={{ uri: previewImage }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 10,
                marginTop: 10,
                resizeMode: "contain",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            />
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              style={{
                marginTop: 10,
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: 10,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Clear Preview
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan Section */}
        <View style={styles.cardPrimary}>
          <Text style={styles.cardTitle}>Scan</Text>
          <Text style={styles.cardSubtitle}>
            Take a photo of your fridge or food
          </Text>
        </View>

        {/* Items Section */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={styles.sectionTitle}>
              Staging Area ({items.length})
            </Text>
            {items.length > 0 && (
              <TouchableOpacity
                onPress={handleConfirmAll}
                style={{
                  backgroundColor: "#2196F3",
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Add All
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.itemsGrid}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Image
                  source={{
                    uri: item.image_url || "https://via.placeholder.com/150",
                  }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>

                  <View
                    style={{ flexDirection: "row", marginTop: 10, gap: 10 }}
                  >
                    <TouchableOpacity
                      onPress={() => handleConfirmItem(item.id)}
                      style={{
                        flex: 1,
                        backgroundColor: "#E8F5E9",
                        padding: 8,
                        borderRadius: 5,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="checkmark" size={20} color="green" />
                    </TouchableOpacity>
                    {/* Placeholder for delete/edit */}
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      style={{
                        flex: 1,
                        backgroundColor: "#FFEBEE",
                        padding: 8,
                        borderRadius: 5,
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            {items.length === 0 && (
              <Text style={styles.emptyText}>
                No new items in staging. Scan to add!
              </Text>
            )}
          </View>
        </View>

        {/* Recipes Section */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "blue" }}>
              Recipes
            </Text>
            <Switch
              value={isOn}
              onValueChange={setIsOn}
              trackColor={{ true: "#ff0000", false: "#ccc" }}
              thumbColor={isOn ? "#fff" : "#f4f3f4"}
            />
          </View>
          <Text style={styles.cardSubtitle}>
            Get meal ideas from your items
          </Text>
        </View>
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "red" }}>
            Recipes
          </Text>
          <FlatList
            data={suggestedMeals}
            keyExtractor={(item, index) => index.toString()}
            numColumns={2} // This makes it 2-column
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 16,
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  flex: 1, // Important: lets it take half the width
                  marginHorizontal: 4,
                  alignItems: "center",
                  backgroundColor: "#fff",
                  padding: 8,
                  borderRadius: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  {item.name}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 14 }}>
                  Ingredients: {item.ingredients.join(", ")}
                </Text>
                {item.image && (
                  <Image
                    source={{ uri: item.image }}
                    style={{
                      width: "100%",
                      height: 100,
                      borderRadius: 8,
                      marginTop: 8,
                    }}
                    resizeMode="cover"
                  />
                )}
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Manual Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Item</Text>

            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Milk"
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonAdd]}
                onPress={handleAddItem}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonTextAdd}>Add Item</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#f0f0f0",
  },
  buttonAdd: {
    backgroundColor: "#4CAF50",
  },
  buttonTextCancel: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonTextAdd: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
