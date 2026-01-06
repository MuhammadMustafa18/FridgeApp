import { useImagePreview } from "@/context/ImagePreviewContext";
import {
  addItem,
  confirmAllItems,
  deleteItem,
  getItems,
  saveRecipe,
  updateItemStatus,
} from "@/services/db";
import { Item, RecipeTemp } from "@/types";

import { suggestRecipesFromGroq } from "@/services/getRecipes";
import { searchItemImage } from "@/services/imageSearch";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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



export default function HomeScreen() {
  const { previewImage, setPreviewImage } = useImagePreview();
  const [items, setItems] = useState<Item[]>([]);
  const [wholeInventory, setWholeInventory] = useState<Item[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [adding, setAdding] = useState(false);
  const [isOn, setIsOn] = useState(false);
  const [suggestedMeals, setSuggestedMeals] = useState<RecipeTemp[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      loadConfirmedInventory();
    }, [])
  );
  useEffect(() => {
    const sourceItems = isOn ? wholeInventory : items;
    if (sourceItems.length === 0) {
      setSuggestedMeals([]); // Clear suggestions if source is empty
      return;
    }

    const run = async () => {
      
      const ingredientNames = sourceItems.map((i) =>
        i.name.trim().toLowerCase()
      );
      const recipes = await suggestRecipesFromGroq(ingredientNames);
      console.log("recipes");
      console.log(recipes);
      setSuggestedMeals(recipes);
      const recipesWithImages = await attachImages(recipes);
      setSuggestedMeals(recipesWithImages);
      console.log(recipesWithImages);
    };

    run();
  }, [items, isOn]);

  const loadItems = async () => {
    const data = await getItems("draft");
    setItems(data);
  };
  const loadConfirmedInventory = async () => {
    const data = await getItems("confirmed");
    setWholeInventory(data);
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


  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert("Required", "Please enter an item name");
      return;
    }

    try {
      setAdding(true);
      // 1. Get Image
      const image_url = await searchItemImage(newItemName);

      // 2. Add to DB
      const qty = parseInt(newItemQuantity) || 1;
      await addItem(newItemName, qty, image_url);

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
    console.log("Items changed, detected by recipe");
    console.log(items);
    if (items.length > 0) {
      (async () => {
        const recipesWithImages = await suggestRandomRecipe(items);
        setSuggestedMeals(recipesWithImages);
      })();
    }
  }, [items]);
  const attachImages = async (recipes: RecipeTemp[]): Promise<RecipeTemp[]> => {
    if (recipes.length == 0) return [];
    const recipesWithImages = await Promise.all(
      recipes.map(async (recipe) => {
        const image_url = await searchItemImage(recipe.name);
        return { ...recipe, image_url: image_url };
      })
    );
    return recipesWithImages;
  };

  const suggestRandomRecipe = async (items: Item[]): Promise<RecipeTemp[]> => {
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
        const image_url = await searchItemImage(recipe.name);
        return { ...recipe, image_url: image_url };
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
        <View style={[styles.headercard, { marginTop: 20 }]}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Recipes</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                {isOn ? "Whole Pantry" : "New Items Only"}
              </Text>
              <Switch
                value={isOn}
                onValueChange={setIsOn}
                trackColor={{ true: "#2196F3", false: "#ccc" }} // Blue is usually better for "On" than Red
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={styles.cardSubtitle}>
            {isOn
              ? "AI is using your entire inventory to find meals."
              : "AI is only looking at the items you just added."}
          </Text>
        </View>
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <View>
            {suggestedMeals.map((item, i) => (
              <View style={styles.card} key={i}>
                {/* Image with a better aspect ratio */}
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.image}
                  />
                ) : (
                  <View style={[styles.image, styles.placeholder]}>
                    <Ionicons name="fast-food-outline" size={32} color="#ccc" />
                  </View>
                )}

                <View style={styles.content}>
                  <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {/* Heart icon for saving is more intuitive than a bulky button */}
                    <TouchableOpacity
                      onPress={() => saveRecipe(item)}
                      style={styles.saveIcon}
                    >
                      <Ionicons
                        name="bookmark-outline"
                        size={22}
                        color="#ff6347"
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>INGREDIENTS</Text>
                  <Text style={styles.ingredients} numberOfLines={2}>
                    {item.ingredients.join(" • ")}
                  </Text>

                  <View style={styles.footer}>
                    <Text style={styles.matchText}>
                      ✨ Matches your inventory
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
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
  card: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden", // Clips image to border radius
    borderWidth: 1,
    borderColor: "#F0F0F0",
    // Clean shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: 110,
    height: 110, // Square images usually look better in rows
  },
  placeholder: {
    backgroundColor: "#F9F9F9",
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  saveIcon: {
    marginTop: -2,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#A0A0A0",
    letterSpacing: 0.5,
    marginTop: 4,
  },
  ingredients: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginTop: 2,
  },
  footer: {
    marginTop: 8,
  },
  matchText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "600",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#111",
    marginBottom: 24,
    marginTop: 20,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textTransform: "uppercase",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF", // Light blue background to make it stand out
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  cardPrimary: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  headercard: {
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
  headerlabel: {
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
